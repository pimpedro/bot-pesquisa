require('dotenv').config();
const admin = require('firebase-admin');
const { OpenAI } = require('openai');
const { processFirebaseCredentials } = require('../utils');

// Inicialização do Firebase
const rawCredentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
const serviceAccount = processFirebaseCredentials(rawCredentials);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Inicialização do OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateEmbeddings() {
  try {
    const snapshot = await db.collection('researches').get();
    let count = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Pular se já tiver embedding
      if (data.embedding) {
        console.log(`⏭️ Pulando ${doc.id} (já tem embedding)`);
        continue;
      }
      
      // Gerar embedding
      const embedding = await generateEmbedding(data.texto);
      
      if (embedding) {
        // Atualizar documento
        await doc.ref.update({
          embedding: embedding,
          dataAtualizacao: admin.firestore.FieldValue.serverTimestamp()
        });
        
        count++;
        console.log(`✅ Gerado embedding para: ${doc.id}`);
        
        // Esperar um pouco para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`🎉 Processo concluído! ${count} embeddings gerados.`);
  } catch (error) {
    console.error('❌ Erro durante o processo:', error);
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

generateEmbeddings(); 