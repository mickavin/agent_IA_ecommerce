#!/usr/bin/env node

/**
 * Script de test pour les réponses contextuelles de l'IA Master
 * 
 * Usage: node scripts/test-contextual-responses.js
 */

console.log('🧪 Test des Réponses Contextuelles - IA Master\n')

// Messages de test pour différentes intentions
const testMessages = [
  {
    message: "Bonjour",
    expectedIntent: "greeting",
    description: "Test de salutation simple"
  },
  {
    message: "Salut, comment ça va ?",
    expectedIntent: "greeting", 
    description: "Test de salutation informelle"
  },
  {
    message: "Je veux faire du shopping",
    expectedIntent: "shopping_general",
    description: "Test d'intention shopping générale"
  },
  {
    message: "J'aimerais des conseils de style",
    expectedIntent: "style_advice",
    description: "Test de demande de conseils style"
  },
  {
    message: "Combien ça coûte ?",
    expectedIntent: "price_budget",
    description: "Test de question prix"
  },
  {
    message: "Où puis-je trouver des jeans ?",
    expectedIntent: "product_search",
    description: "Test de recherche produit"
  },
  {
    message: "J'ai un problème avec ma commande",
    expectedIntent: "technical_support",
    description: "Test de support technique"
  },
  {
    message: "Je suis mécontent de mon achat",
    expectedIntent: "complaint",
    description: "Test de plainte"
  },
  {
    message: "Blablabla xyz 123",
    expectedIntent: "unknown",
    description: "Test de message non reconnu"
  }
]

// Configuration de base
const API_ENDPOINT = 'http://localhost:3000/api/ia'

/**
 * Teste l'API IA Master avec différents messages
 */
async function testContextualResponses() {
  console.log(`🎯 Test de ${testMessages.length} messages contextuels...\n`)
  
  let passedTests = 0
  let totalTests = testMessages.length
  
  for (const test of testMessages) {
    console.log(`📝 ${test.description}`)
    console.log(`💬 Message: "${test.message}"`)
    
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: test.message,
          sessionId: `test-${Date.now()}`,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Affichage des résultats
      console.log(`🤖 IA Sélectionnée: ${data.aiType}`)
      console.log(`🎯 Confiance: ${Math.round(data.confidence * 100)}%`)
      
      if (data.metadata?.detectedIntent) {
        console.log(`🧠 Intention détectée: ${data.metadata.detectedIntent}`)
        console.log(`🔍 Mots-clés trouvés: ${data.metadata.keywords?.join(', ') || 'aucun'}`)
      }
      
      // Vérification du résultat
      if (data.aiType === 'contextual' && data.metadata?.detectedIntent === test.expectedIntent) {
        console.log(`✅ Test RÉUSSI - Intention correctement détectée`)
        passedTests++
      } else if (data.aiType !== 'contextual') {
        console.log(`ℹ️  Test PASSÉ À UNE IA ENFANT - ${data.aiType}`)
        passedTests++
      } else {
        console.log(`❌ Test ÉCHOUÉ - Intention attendue: ${test.expectedIntent}, reçue: ${data.metadata?.detectedIntent}`)
      }
      
      console.log(`💭 Réponse (extrait): "${data.content.substring(0, 100)}..."`)
      
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`)
    }
    
    console.log('─'.repeat(80))
  }
  
  // Résumé des tests
  console.log(`\n📊 RÉSULTATS DES TESTS`)
  console.log(`✅ Tests réussis: ${passedTests}/${totalTests}`)
  console.log(`📈 Taux de réussite: ${Math.round((passedTests / totalTests) * 100)}%`)
  
  if (passedTests === totalTests) {
    console.log(`🎉 TOUS LES TESTS SONT PASSÉS !`)
  } else {
    console.log(`⚠️  ${totalTests - passedTests} test(s) à améliorer`)
  }
}

/**
 * Teste le routage sans exécution
 */
async function testRouting() {
  console.log(`\n🧭 Test du Routage (sans exécution)...\n`)
  
  const routingMessages = [
    "Comment retourner un article ?",
    "Je cherche une robe rouge",
    "Trouve-moi une tenue pour un mariage",
    "Random text xyz"
  ]
  
  for (const message of routingMessages) {
    try {
      const response = await fetch(`${API_ENDPOINT}?action=test-routing&message=${encodeURIComponent(message)}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`💬 "${message}"`)
        console.log(`🎯 → ${data.selectedAI} (confiance: ${Math.round(data.confidence * 100)}%)`)
        console.log(`📝 Raison: ${data.reason}`)
        console.log('─'.repeat(60))
      }
    } catch (error) {
      console.log(`❌ Erreur de routage: ${error.message}`)
    }
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    // Vérifier que le serveur est accessible
    console.log('🔍 Vérification de la connexion au serveur...')
    const healthCheck = await fetch(`${API_ENDPOINT}?action=stats`)
    
    if (!healthCheck.ok) {
      throw new Error('Serveur non accessible. Assurez-vous que Next.js est démarré.')
    }
    
    console.log('✅ Serveur accessible\n')
    
    // Exécuter les tests
    await testContextualResponses()
    await testRouting()
    
    console.log('\n🏁 Tests terminés !')
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message)
    console.error('\n💡 Assurez-vous que :')
    console.error('  • Next.js est démarré (npm run dev)')
    console.error('  • L\'API /api/ia est accessible')
    console.error('  • Aucun pare-feu ne bloque localhost:3000')
    process.exit(1)
  }
}

// Exécution du script si appelé directement
if (require.main === module) {
  main()
}

module.exports = { testContextualResponses, testRouting } 