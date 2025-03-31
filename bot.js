require('dotenv').config();
const { App } = require('@slack/bolt');
const { OpenAI } = require('openai');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const express = require('express');

// Debug: Verifica se as variáveis de ambiente estão definidas
console.log('Inicializando bot com as variáveis de ambiente:');
console.log('SLACK_BOT_TOKEN:', process.env.SLACK_BOT_TOKEN ? 'OK' : 'FALTANDO');
console.log('SLACK_SIGNING_SECRET:', process.env.SLACK_SIGNING_SECRET ? 'OK' : 'FALTANDO');
console.log('FIREBASE_CREDENTIALS:', process.env.FIREBASE_CREDENTIALS ? 'OK' : 'FALTANDO');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'OK' : 'FALTANDO');

// Função para obter as credenciais do Firebase
function getFirebaseCredentials() {
  // Primeira opção: Verificar se existe o arquivo de credenciais
  const credentialPaths = [
    path.join(__dirname, 'firebase-credentials.json'),
    path.join(__dirname, 'config', 'firebase-credentials.json')
  ];
  
  for (const credPath of credentialPaths) {
    try {
      if (fs.existsSync(credPath)) {
        console.log(`Usando credenciais do arquivo: ${credPath}`);
        return JSON.parse(fs.readFileSync(credPath, 'utf8'));
      }
    } catch (err) {
      console.log(`Erro ao ler ${credPath}: ${err.message}`);
    }
  }
  
  // Segunda opção: Usar a variável de ambiente
  if (process.env.FIREBASE_CREDENTIALS) {
    try {
      console.log('Usando credenciais da variável de ambiente FIREBASE_CREDENTIALS');
      return JSON.parse(process.env.FIREBASE_CREDENTIALS);
    } catch (err) {
      console.log(`Erro ao parsear FIREBASE_CREDENTIALS: ${err.message}`);
    }
  }
  
  throw new Error('Nenhuma credencial válida do Firebase encontrada');
}

// Decodifica as credenciais do Firebase de base64
const firebaseCredentialsBase64 = process.env.FIREBASE_CREDENTIALS;
const firebaseCredentials = JSON.parse(
  Buffer.from(firebaseCredentialsBase64, 'base64').toString()
);

console.log('Credenciais decodificadas:', JSON.stringify(firebaseCredentials, null, 2));

// Inicialização do Firebase
let firebaseAdmin;
try {
  firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(firebaseCredentials)
  });
  console.log('✅ Firebase inicializado com sucesso');
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error);
  process.exit(1);
}
const db = firebaseAdmin.firestore();

// Inicialização do OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Inicialização do Slack Bot
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// Adicionar express se ainda não tiver
const expressApp = express();

// Rota de health check
expressApp.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Função para buscar pesquisas relevantes
async function buscarPesquisas(query) {
  try {
    const snapshot = await db.collection('researches').get();
    const pesquisas = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.embedding) {
        const similarity = cosineSimilarity(query, data.embedding);
        pesquisas.push({ ...data, similarity, id: doc.id });
      }
    }
    
    return pesquisas.sort((a, b) => b.similarity - a.similarity);
  } catch (error) {
    console.error('Erro ao buscar pesquisas:', error);
    return [];
  }
}

// Função para calcular similaridade do cosseno
function cosineSimilarity(vec1, vec2) {
  const dotProduct = vec1.reduce((sum, a, i) => sum + a * vec2[i], 0);
  const norm1 = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0));
  const norm2 = Math.sqrt(vec2.reduce((sum, a) => sum + a * a, 0));
  return dotProduct / (norm1 * norm2);
}

// Função para gerar embedding
async function gerarEmbedding(texto) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: texto
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Erro ao gerar embedding:', error);
    return null;
  }
}

// Função para analisar pesquisas
async function analisarPesquisas(pesquisas, query) {
  try {
    const prompt = `Com base nas seguintes pesquisas, responda à pergunta: "${query}"\n\n`;
    const context = pesquisas.slice(0, 10).map(p => `Pesquisa ${p.id}:\n${p.texto}`).join('\n\n');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Você é um assistente especializado em analisar pesquisas e fornecer respostas precisas e concisas." },
        { role: "user", content: prompt + context }
      ],
      max_tokens: 500
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Erro ao analisar pesquisas:', error);
    return "Desculpe, ocorreu um erro ao analisar as pesquisas.";
  }
}

// Evento de menção ao bot
app.event('app_mention', async ({ event, say }) => {
  try {
    const query = event.text.replace(/<@[^>]+>/, '').trim();
    
    if (!query) {
      await say("Olá! Como posso ajudar você hoje?");
      return;
    }
    
    await say("Analisando sua pergunta...");
    
    const queryEmbedding = await gerarEmbedding(query);
    if (!queryEmbedding) {
      await say("Desculpe, não consegui processar sua pergunta. Tente novamente.");
      return;
    }
    
    const pesquisas = await buscarPesquisas(queryEmbedding);
    if (pesquisas.length === 0) {
      await say("Não encontrei pesquisas relevantes para sua pergunta.");
      return;
    }
    
    const resposta = await analisarPesquisas(pesquisas, query);
    await say(resposta);
  } catch (error) {
    console.error('Erro ao processar menção:', error);
    await say("Desculpe, ocorreu um erro ao processar sua pergunta.");
  }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
expressApp.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
