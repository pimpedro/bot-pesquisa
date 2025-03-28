require('dotenv').config();
const { App } = require('@slack/bolt');
const { OpenAI } = require('openai');
const admin = require('firebase-admin');

// Debug: Verifica se as variáveis de ambiente estão definidas
console.log('Inicializando bot com as variáveis de ambiente:');
console.log('SLACK_BOT_TOKEN:', process.env.SLACK_BOT_TOKEN ? 'OK' : 'FALTANDO');
console.log('SLACK_SIGNING_SECRET:', process.env.SLACK_SIGNING_SECRET ? 'OK' : 'FALTANDO');
console.log('FIREBASE_CREDENTIALS:', process.env.FIREBASE_CREDENTIALS ? 'OK' : 'FALTANDO');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'OK' : 'FALTANDO');

// Inicialização do Firebase
let firebaseAdmin;
try {
  let serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
  
  // Corrigir formato da chave privada se necessário
  if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
    // Garantir que a chave privada tenha quebras de linha corretas
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
  
  firebaseAdmin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
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

// Iniciar o bot
(async () => {
  try {
    await app.start(process.env.PORT || 3000);
    console.log('⚡️ Bot está rodando!');
  } catch (error) {
    console.error('Erro ao iniciar o bot:', error);
    process.exit(1);
  }
})();
