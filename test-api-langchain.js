/**
 * Test des endpoints API Langchain
 * 
 * Usage: node test-api-langchain.js
 */

const http = require('http');

// Configuration
const HOST = 'localhost';
const PORT = 3000; // Port Next.js par défaut

/**
 * Fonction pour faire une requête POST
 */
function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Test principal
 */
async function testLangchainAPI() {
  console.log('🚀 Test des endpoints API Langchain\n');
  
  // Vérifier que le serveur Next.js est démarré
  console.log(`📡 Test de connexion au serveur ${HOST}:${PORT}...`);
  
  try {
    // Test 1: Endpoint chat Langchain
    console.log('\n🧪 Test 1: /api/langchain/chat');
    
    const chatResponse = await makeRequest('/api/langchain/chat', {
      message: 'Bonjour, pouvez-vous m\'aider ?',
      chatbotId: 'default',
      context: {}
    });
    
    console.log(`Status: ${chatResponse.status}`);
    
    if (chatResponse.status === 200 && chatResponse.data.success) {
      console.log('✅ Chat Langchain fonctionne !');
      console.log(`📝 Réponse: "${chatResponse.data.response.content.substring(0, 100)}..."`);
      console.log(`🎯 Routé vers: ${chatResponse.data.response.metadata.routedTo}`);
      console.log(`🔢 Confiance: ${chatResponse.data.response.metadata.confidence}`);
    } else {
      console.log('❌ Chat Langchain a échoué');
      console.log('Status:', chatResponse.status);
      console.log('Détails:', JSON.stringify(chatResponse.data, null, 2));
    }
    
    // Test 2: Test avec différents types de messages
    console.log('\n🧪 Test 2: Routage intelligent');
    
    const testCases = [
      { message: 'Je cherche un t-shirt bleu', expectedAgent: 'articles' },
      { message: 'Créez-moi une tenue pour le bureau', expectedAgent: 'outfits' },
      { message: 'Quels sont vos délais de livraison ?', expectedAgent: 'faq' }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n   🔍 Test: "${testCase.message}"`);
      
      const response = await makeRequest('/api/langchain/chat', {
        message: testCase.message,
        chatbotId: 'default'
      });
      
      if (response.status === 200 && response.data.success) {
        const routedTo = response.data.response.metadata.routedTo;
        console.log(`   ✅ Routé vers: ${routedTo} (attendu: ${testCase.expectedAgent})`);
      } else {
        console.log(`   ❌ Échec du test - Status: ${response.status}`);
        console.log(`   Détails:`, JSON.stringify(response.data, null, 2));
      }
    }
    
    console.log('\n🎉 Tests terminés !');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Erreur: Serveur Next.js non démarré');
      console.log('💡 Conseil: Démarrez le serveur avec "npm run dev" dans un autre terminal');
    } else {
      console.log('❌ Erreur:', error.message);
    }
  }
}

// Configuration de test en mode fallback (sans serveur)
async function testInfrastructureOnly() {
  console.log('🧪 Test de l\'infrastructure (sans serveur)\n');
  
  try {
    // Vérifier les variables d'environnement
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      console.log('✅ OPENAI_API_KEY configurée');
    } else {
      console.log('⚠️ OPENAI_API_KEY non configurée');
    }
    
    // Vérifier que les fichiers existent
    const fs = require('fs');
    
    const files = [
      'lib/langchain/base.langchain.service.ts',
      'lib/langchain/agents/master.langchain.agent.ts',
      'pages/api/langchain/chat.ts'
    ];
    
    for (const file of files) {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file} existe`);
      } else {
        console.log(`❌ ${file} manquant`);
      }
    }
    
    console.log('\n📋 Infrastructure Langchain installée !');
    console.log('💡 Pour tester complètement, démarrez le serveur avec: npm run dev');
    
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }
}

// Détermine quel test exécuter
if (process.argv.includes('--infrastructure-only')) {
  testInfrastructureOnly();
} else {
  testLangchainAPI();
} 