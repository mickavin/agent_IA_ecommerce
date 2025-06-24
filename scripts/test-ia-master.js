#!/usr/bin/env node
/**
 * Script de test complet pour la nouvelle architecture IA Master
 * Version 2.0 - Architectures IAs spécialisées
 */

const fetch = require('node-fetch')

const API_BASE = process.env.API_BASE || 'http://localhost:3000'

// Messages de test pour chaque IA spécialisée
const testSuite = {
  faq: [
    'Bonjour',
    'Comment ça marche ?', 
    'Quels sont vos délais de livraison ?',
    'Comment retourner un produit ?',
    'Quels moyens de paiement acceptez-vous ?'
  ],
  articles: [
    'Je cherche un t-shirt noir',
    'Recommande-moi une chemise pour moins de 60€',
    'Je veux des sneakers blanches',
    'Trouve-moi une robe d\'été',
    'Conseille-moi un jean slim'
  ],
  outfits: [
    'Je veux une tenue pour le travail',
    'Quel outfit pour une soirée ?',
    'Comment m\'habiller pour un entretien ?',
    'Tenue décontractée pour le weekend',
    'Look élégant pour un mariage'
  ],
  master: [
    'Peux-tu m\'aider ?',
    'Je ne sais pas quoi porter',
    'Conseil mode urgente',
    'Aide shopping'
  ]
}

// Personnalités à tester
const personalities = [
  {
    name: 'Professionnel',
    config: { tone: 'Professionnel', formality: 'Vouvoiement', verbosity: 'Concis' }
  },
  {
    name: 'Amical',
    config: { tone: 'Amical', formality: 'Tutoiement', verbosity: 'Détaillé' }
  },
  {
    name: 'Humoristique',
    config: { tone: 'Humoristique', formality: 'Tutoiement', empathy: 'Élevée', proactivity: 'Très proactif' }
  }
]

let stats = {
  totalTests: 0,
  successTests: 0,
  failedTests: 0,
  routingAccuracy: {},
  personalityTests: 0
}

/**
 * Test d'une IA spécialisée
 */
async function testSpecializedAI(aiType, message) {
  try {
    const response = await fetch(`${API_BASE}/api/ai/${aiType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context: {}
      })
    })

    stats.totalTests++

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    
    if (data.success) {
      stats.successTests++
      return {
        success: true,
        confidence: data.response?.metadata?.confidence || 0,
        content: data.response?.content || '',
        aiType: data.response?.metadata?.aiType || aiType
      }
    } else {
      stats.failedTests++
      return { success: false, error: data.error }
    }
  } catch (error) {
    stats.failedTests++
    return { success: false, error: error.message }
  }
}

/**
 * Test de l'IA Master avec routage
 */
async function testMasterAI(message, personality = {}) {
  try {
    const response = await fetch(`${API_BASE}/api/ai/master`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context: {
          conversationHistory: [],
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

    stats.totalTests++

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    
    if (data.success && data.response) {
      stats.successTests++
      
      const routedTo = data.response.metadata?.routedTo
      if (routedTo) {
        stats.routingAccuracy[routedTo] = (stats.routingAccuracy[routedTo] || 0) + 1
      }
      
      return {
        success: true,
        routedTo,
        confidence: data.response.metadata?.confidence || 0,
        content: data.response.content,
        personalityApplied: data.response.metadata?.personalityApplied
      }
    } else {
      stats.failedTests++
      return { success: false, error: data.error }
    }
  } catch (error) {
    stats.failedTests++
    return { success: false, error: error.message }
  }
}

/**
 * Test des IAs spécialisées individuellement
 */
async function testAllSpecializedAIs() {
  console.log('\n🎯 Tests des IAs spécialisées...')
  console.log('=' * 50)
  
  for (const [aiType, messages] of Object.entries(testSuite)) {
    if (aiType === 'master') continue
    
    console.log(`\n📚 Test IA ${aiType.toUpperCase()}:`)
    
    for (const message of messages) {
      const result = await testSpecializedAI(aiType, message)
      
      if (result.success) {
        console.log(`  ✅ "${message}" → Confiance: ${Math.round(result.confidence * 100)}%`)
      } else {
        console.log(`  ❌ "${message}" → Erreur: ${result.error}`)
      }
      
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
}

/**
 * Test du routage de l'IA Master
 */
async function testMasterRouting() {
  console.log('\n🧠 Tests de routage IA Master...')
  console.log('=' * 50)
  
  for (const [expectedAI, messages] of Object.entries(testSuite)) {
    if (expectedAI === 'master') continue
    
    console.log(`\n🎯 Test routage vers ${expectedAI.toUpperCase()}:`)
    
    for (const message of messages) {
      const result = await testMasterAI(message)
      
      if (result.success) {
        const routedTo = result.routedTo
        const isCorrect = routedTo === expectedAI
        const icon = isCorrect ? '✅' : '⚠️'
        
        console.log(`  ${icon} "${message}"`)
        console.log(`     → Routé vers: ${routedTo} (attendu: ${expectedAI})`)
        console.log(`     → Confiance: ${Math.round(result.confidence * 100)}%`)
      } else {
        console.log(`  ❌ "${message}" → Erreur: ${result.error}`)
      }
      
      await new Promise(resolve => setTimeout(resolve, 300))
    }
  }
}

/**
 * Test des personnalités
 */
async function testPersonalities() {
  console.log('\n🎭 Tests de personnalisation...')
  console.log('=' * 50)
  
  const testMessage = 'Je cherche une tenue pour une soirée'
  
  for (const personality of personalities) {
    console.log(`\n🎨 Test personnalité ${personality.name}:`)
    
    const result = await testMasterAI(testMessage, personality.config)
    
    if (result.success) {
      stats.personalityTests++
      console.log(`  ✅ Message: "${testMessage}"`)
      console.log(`  🎯 Routé vers: ${result.routedTo}`)
      console.log(`  🎭 Personnalité appliquée:`, result.personalityApplied)
      console.log(`  💬 Extrait réponse: ${result.content.substring(0, 100)}...`)
    } else {
      console.log(`  ❌ Erreur: ${result.error}`)
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

/**
 * Test de l'API de compatibilité
 */
async function testCompatibilityAPI() {
  console.log('\n🔗 Test API de compatibilité...')
  console.log('=' * 50)
  
  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
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
      console.log(`   💬 Réponse: ${data.response?.content.substring(0, 100)}...`)
    } else {
      console.log('❌ API de compatibilité échoue')
    }
  } catch (error) {
    console.log(`❌ Erreur API compatibilité: ${error.message}`)
  }
}

/**
 * Affichage des statistiques finales
 */
function displayStats() {
  console.log('\n\n📊 STATISTIQUES FINALES')
  console.log('=' * 60)
  
  console.log(`📈 Tests exécutés:`)
  console.log(`   • Total: ${stats.totalTests}`)
  console.log(`   • Réussis: ${stats.successTests}`)
  console.log(`   • Échoués: ${stats.failedTests}`)
  console.log(`   • Taux de réussite: ${Math.round(stats.successTests / stats.totalTests * 100)}%`)
  
  console.log(`\n🎯 Répartition du routage:`)
  for (const [ai, count] of Object.entries(stats.routingAccuracy)) {
    console.log(`   • ${ai}: ${count} fois`)
  }
  
  console.log(`\n🎭 Tests de personnalité: ${stats.personalityTests}`)
  
  console.log(`\n🏗️ Architecture testée:`)
  console.log(`   • 🧠 IA Master: /api/ai/master`)
  console.log(`   • 📚 IA FAQ: /api/ai/faq`)
  console.log(`   • 👕 IA Articles: /api/ai/articles`)
  console.log(`   • 👗 IA Outfits: /api/ai/outfits`)
  console.log(`   • 🔗 Compatibilité: /api/chat`)
  
  if (stats.failedTests === 0) {
    console.log('\n🎉 Tous les tests sont passés ! L\'architecture IA est opérationnelle.')
  } else {
    console.log('\n⚠️ Certains tests ont échoué. Vérifiez les logs ci-dessus.')
  }
}

/**
 * Vérification de santé préalable
 */
async function healthCheck() {
  console.log('🏥 Vérification de santé...')
  
  try {
    const response = await fetch(`${API_BASE}/api/health-check`)
    
    if (response.ok) {
      console.log('✅ Serveur en ligne')
      return true
    } else {
      console.log('❌ Serveur indisponible')
      return false
    }
  } catch (error) {
    console.log('❌ Impossible de contacter le serveur')
    console.log('   • Vérifiez que le serveur Next.js est démarré')
    console.log('   • URL de base:', API_BASE)
    return false
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 Test Suite - Nouvelle Architecture IA Master')
  console.log('================================================')
  console.log(`🌐 URL de base: ${API_BASE}`)
  console.log(`📅 Démarré le: ${new Date().toLocaleString()}`)
  
  // Vérification de santé
  const isHealthy = await healthCheck()
  if (!isHealthy) {
    process.exit(1)
  }
  
  // Exécution des tests
  await testAllSpecializedAIs()
  await testMasterRouting()
  await testPersonalities()
  await testCompatibilityAPI()
  
  // Statistiques finales
  displayStats()
}

// Exécution si appelé directement
if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  testSpecializedAI,
  testMasterAI,
  testPersonalities
} 