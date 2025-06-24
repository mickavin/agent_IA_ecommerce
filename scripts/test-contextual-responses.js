#!/usr/bin/env node

/**
 * Script de test pour les réponses contextuelles de la nouvelle architecture IA
 * Teste l'IA Master et les IAs spécialisées
 */

// Utilisation du fetch natif de Node.js 20+
// const fetch = require('node-fetch') // Remplacé par fetch natif

// Configuration
const API_ENDPOINT = 'http://localhost:3000/api/ai/master'
const COMPATIBILITY_ENDPOINT = 'http://localhost:3000/api/chat'

// Messages de test avec contexte et personnalités variées
const testScenarios = [
  {
    name: 'Salutation Simple',
    messages: [
      {
        text: 'Bonjour',
        personality: { tone: 'Amical', formality: 'Tutoiement' }
      }
    ],
    expectedAI: 'faq'
  },
  {
    name: 'Question FAQ Livraison',
    messages: [
      {
        text: 'Quels sont vos délais de livraison ?',
        personality: { tone: 'Professionnel', formality: 'Vouvoiement' }
      }
    ],
    expectedAI: 'faq'
  },
  {
    name: 'Recherche Article Spécifique',
    messages: [
      {
        text: 'Je cherche un t-shirt noir en taille M',
        personality: { tone: 'Décontracté', formality: 'Tutoiement' }
      }
    ],
    expectedAI: 'articles'
  },
  {
    name: 'Demande Outfit Complet',
    messages: [
      {
        text: 'Je veux une tenue élégante pour une soirée',
        personality: { tone: 'Expert', formality: 'Vouvoiement' }
      }
    ],
    expectedAI: 'outfits'
  },
  {
    name: 'Conversation Contextualisée',
    messages: [
      {
        text: 'Bonjour, je cherche des vêtements',
        personality: { tone: 'Amical', formality: 'Tutoiement' }
      },
      {
        text: 'Plutôt pour l\'été',
        personality: { tone: 'Amical', formality: 'Tutoiement' }
      },
      {
        text: 'Des t-shirts colorés',
        personality: { tone: 'Amical', formality: 'Tutoiement' }
      }
    ],
    expectedAI: 'articles'
  },
  {
    name: 'Test Personnalité Humoristique',
    messages: [
      {
        text: 'Aide-moi à choisir une tenue',
        personality: { 
          tone: 'Humoristique', 
          formality: 'Tutoiement',
          empathy: 'Élevée',
          proactivity: 'Très proactif'
        }
      }
    ],
    expectedAI: 'outfits'
  }
]

// Statistiques globales
let totalTests = 0
let successfulTests = 0
let testResults = []

async function testMessage(message, personality = {}, conversationHistory = []) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context: {
          conversationHistory,
          userPreferences: {},
          userId: `test-${Date.now()}`
        },
        chatbotConfig: {
          personality: {
            tone: 'Amical',
            formality: 'Tutoiement',
            verbosity: 'Détaillé',
            empathy: 'Élevée',
            proactivity: 'Proactif',
            ...personality
          }
        }
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      success: data.success,
      response: data.response,
      error: data.error
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

async function testCompatibilityAPI() {
  console.log('\n🔗 Test de l\'API de compatibilité...')
  
  try {
    const response = await fetch(COMPATIBILITY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Test de compatibilité',
        chatbotConfig: {
          personality: {
            tone: 'Professionnel',
            formality: 'Vouvoiement'
          }
        }
      })
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ API de compatibilité fonctionne')
      console.log(`   🤖 Modèle: ${data.response?.metadata?.model}`)
      console.log(`   🎯 Routé vers: ${data.response?.metadata?.routedTo}`)
      return true
    } else {
      console.log('❌ API de compatibilité échoue')
      return false
    }
  } catch (error) {
    console.log(`❌ Erreur API compatibilité: ${error.message}`)
    return false
  }
}

async function runScenario(scenario) {
  console.log(`\n📝 Scénario: ${scenario.name}`)
  console.log('=' * 50)
  
  let conversationHistory = []
  let scenarioSuccess = true
  
  for (let i = 0; i < scenario.messages.length; i++) {
    const msgData = scenario.messages[i]
    console.log(`\n${i + 1}. 💬 Message: "${msgData.text}"`)
    console.log(`   🎭 Personnalité: ${JSON.stringify(msgData.personality)}`)
    
    totalTests++
    const result = await testMessage(msgData.text, msgData.personality, conversationHistory)
    
    if (result.success && result.response) {
      successfulTests++
      
      const routedTo = result.response.metadata?.routedTo
      const confidence = result.response.metadata?.confidence || 0
      const personalityApplied = result.response.metadata?.personalityApplied
      
      console.log(`   ✅ Succès`)
      console.log(`   🎯 IA utilisée: ${routedTo}`)
      console.log(`   📊 Confiance: ${Math.round(confidence * 100)}%`)
      console.log(`   🎭 Personnalité appliquée: ${personalityApplied ? 'Oui' : 'Non'}`)
      console.log(`   💬 Réponse (100 chars): ${result.response.content.substring(0, 100)}...`)
      
      // Vérification de l'IA attendue
      if (scenario.expectedAI && routedTo === scenario.expectedAI) {
        console.log(`   🎯 ✅ IA correcte (attendue: ${scenario.expectedAI})`)
      } else if (scenario.expectedAI) {
        console.log(`   🎯 ⚠️ IA différente (attendue: ${scenario.expectedAI}, obtenue: ${routedTo})`)
      }
      
      // Vérification de la personnalité
      if (personalityApplied && msgData.personality.tone) {
        const appliedTone = personalityApplied.tone
        if (appliedTone === msgData.personality.tone) {
          console.log(`   🎭 ✅ Ton correct (${appliedTone})`)
        } else {
          console.log(`   🎭 ⚠️ Ton différent (attendu: ${msgData.personality.tone}, appliqué: ${appliedTone})`)
        }
      }
      
      // Ajouter à l'historique pour le contexte
      conversationHistory.push(
        { type: 'user', content: msgData.text },
        { type: 'bot', content: result.response.content }
      )
      
    } else {
      scenarioSuccess = false
      console.log(`   ❌ Échec: ${result.error}`)
    }
    
    // Pause entre les messages
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  testResults.push({
    name: scenario.name,
    success: scenarioSuccess,
    messageCount: scenario.messages.length
  })
  
  console.log(`\n📊 Résultat scénario: ${scenarioSuccess ? '✅ Succès' : '❌ Échec'}`)
}

async function runHealthCheck() {
  console.log('🏥 Vérification de santé de l\'API...')
  
  try {
    const response = await fetch(API_ENDPOINT.replace('/api/ai/master', '/api/health-check'))
    
    if (response.ok) {
      console.log('✅ API en ligne')
      return true
    } else {
      console.log('❌ API hors ligne ou problème de santé')
      return false
    }
  } catch (error) {
    console.log('❌ API non accessible')
    console.error('  • Vérifiez que le serveur Next.js est démarré')
    console.error('  • L\'API /api/ai/master est accessible')
    console.error(`  • Erreur: ${error.message}`)
    return false
  }
}

async function generateReport() {
  console.log('\n\n📊 RAPPORT DE TEST')
  console.log('=' * 60)
  
  console.log(`📈 Tests globaux:`)
  console.log(`   • Total: ${totalTests}`)
  console.log(`   • Réussis: ${successfulTests}`)
  console.log(`   • Échoués: ${totalTests - successfulTests}`)
  console.log(`   • Taux de réussite: ${Math.round(successfulTests / totalTests * 100)}%`)
  
  console.log(`\n🎭 Scénarios:`)
  testResults.forEach(result => {
    const status = result.success ? '✅' : '❌'
    console.log(`   ${status} ${result.name} (${result.messageCount} messages)`)
  })
  
  const successfulScenarios = testResults.filter(r => r.success).length
  console.log(`\n📋 Scénarios réussis: ${successfulScenarios}/${testResults.length}`)
  
  if (successfulScenarios === testResults.length) {
    console.log('\n🎉 Tous les tests sont passés ! La nouvelle architecture IA fonctionne correctement.')
  } else {
    console.log('\n⚠️ Certains tests ont échoué. Vérifiez les logs ci-dessus.')
  }
}

async function main() {
  console.log('🚀 Tests de réponses contextuelles - Nouvelle Architecture IA')
  console.log('================================================================')
  
  // Vérification de santé
  const isHealthy = await runHealthCheck()
  if (!isHealthy) {
    process.exit(1)
  }
  
  // Test de compatibilité
  await testCompatibilityAPI()
  
  // Exécution des scénarios
  for (const scenario of testScenarios) {
    await runScenario(scenario)
  }
  
  // Rapport final
  await generateReport()
}

// Exécution
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { testMessage, runScenario } 