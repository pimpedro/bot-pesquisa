require('dotenv').config();
const admin = require('firebase-admin');
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

async function generateResumos() {
  try {
    const snapshot = await db.collection('researches').get();
    let count = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Pular se já tiver resumo
      if (data.resumo) {
        console.log(`⏭️ Pulando ${doc.id} (já tem resumo)`);
        continue;
      }
      
      // Gerar resumo
      const resumo = await generateResumo(data.texto);
      
      if (resumo) {
        // Atualizar documento
        await doc.ref.update({
          resumo: resumo,
          dataAtualizacao: admin.firestore.FieldValue.serverTimestamp()
        });
        
        count++;
        console.log(`✅ Gerado resumo para: ${doc.id}`);
        
        // Esperar um pouco para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`🎉 Processo concluído! ${count} resumos gerados.`);
  } catch (error) {
    console.error('❌ Erro durante o processo:', error);
  }
}

async function generateResumo(texto) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: "Você é um especialista em criar resumos concisos e informativos de pesquisas. Mantenha o resumo em português e foco nos pontos principais."
        },
        { 
          role: "user", 
          content: `Crie um resumo conciso da seguinte pesquisa:\n\n${texto}`
        }
      ],
      max_tokens: 500
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
    return null;
  }
}

generateResumos(); 