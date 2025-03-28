require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs').promises;
const path = require('path');
const { OpenAI } = require('openai');

// Inicialização do Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Inicialização do OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function importTranscripts() {
  try {
    const transcriptsDir = path.join(__dirname, '../transcripts');
    const files = await fs.readdir(transcriptsDir);
    
    for (const file of files) {
      if (file.endsWith('_transcript.txt')) {
        const researchId = file.replace('_transcript.txt', '');
        const filePath = path.join(transcriptsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Gerar embedding
        const embedding = await generateEmbedding(content);
        
        // Salvar no Firestore
        await db.collection('researches').doc(researchId).set({
          texto: content,
          embedding: embedding,
          dataImportacao: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ Importado: ${researchId}`);
      }
    }
    
    console.log('🎉 Importação concluída!');
  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
  }
}

async function generateEmbedding(texto) {
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

importTranscripts(); 