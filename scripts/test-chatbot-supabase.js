/**
 * Test simple des configurations chatbot depuis Supabase
 */

async function testChatbotConfig() {
  const baseUrl = 'http://localhost:3001'
  
  console.log('🧪 Test des configurations chatbot...\n')

  const tests = [
    {
      name: 'IA Master avec chatbotId par défaut',
      endpoint: '/api/ai/master',
      payload: {
        message: 'Bonjour',
        chatbotId: 'default'
      }
    },
    {
      name: 'IA Master sans chatbotId',
      endpoint: '/api/ai/master', 
      payload: {
        message: 'Comment ça va ?'
      }
    },
    {
      name: 'IA FAQ avec configuration',
      endpoint: '/api/ai/faq',
      payload: {
        message: 'Quels sont vos délais de livraison ?',
        chatbotId: 'professional-support'
      }
    },
    {
      name: 'API Chat avec chatbotId',
      endpoint: '/api/chat',
      payload: {
        message: 'Je cherche une robe',
        chatbotId: 'friendly-casual'
      }
    }
  ]

  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}...`)
      
      const response = await fetch(`${baseUrl}${test.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.payload)
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.response) {
          const metadata = data.response.metadata || {}
          console.log(`   ✅ Succès`)
          console.log(`   📝 Config: ${metadata.chatbotName || 'N/A'}`)
          console.log(`   📊 Source: ${metadata.configSource || 'N/A'}`)
          console.log(`   🎭 IA: ${metadata.aiType || metadata.routedTo || 'N/A'}`)
          console.log(`   🎯 Confiance: ${metadata.confidence || 'N/A'}`)
        } else {
          console.log(`   ⚠️ Réponse sans succès: ${data.message || 'Erreur inconnue'}`)
        }
      } else {
        console.log(`   ❌ Erreur HTTP: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`)
    }
    
    console.log('')
  }

  console.log('🎯 Test terminé !')
}

// Test si le serveur est accessible
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'test' })
    })
    return true
  } catch (error) {
    console.log('❌ Serveur non accessible sur localhost:3001')
    console.log('   Assurez-vous que le serveur Next.js est démarré avec: npm run dev')
    return false
  }
}

async function main() {
  const serverRunning = await checkServer()
  if (serverRunning) {
    await testChatbotConfig()
  }
}

main().catch(console.error) 