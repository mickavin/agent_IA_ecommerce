#!/usr/bin/env node

/**
 * Script de test pour la nouvelle architecture IA
 * Teste les 4 IAs : FAQ, Articles, Outfits et Master
 */

// Utilisation du fetch natif de Node.js 20+
// const fetch = require('node-fetch') // Remplacé par fetch natif

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

// Messages de test pour chaque IA
const testCases = [
  {
    name: 'FAQ - Salutation',
    endpoint: 'faq',
    message: 'bonjour',
    expectedAI: 'faq'
  },
  {
    name: 'FAQ - Question livraison',
    endpoint: 'faq', 
    message: 'Quels sont les délais de livraison ?',
    expectedAI: 'faq'
  },
  {
    name: 'Articles - Recommandation T-shirt',
    endpoint: 'articles',
    message: 'Je cherche un t-shirt noir',
    expectedAI: 'articles'
  },
  {
    name: 'Articles - Recommandation avec budget',
    endpoint: 'articles',
    message: 'Recommande-moi une chemise pour moins de 60€',
    expectedAI: 'articles'
  },
  {
    name: 'Outfits - Tenue travail',
    endpoint: 'outfits',
    message: 'Je veux une tenue pour le travail',
    expectedAI: 'outfits'
  },
  {
    name: 'Outfits - Look soirée',
    endpoint: 'outfits',
    message: 'Quel outfit porter pour une soirée ?',
    expectedAI: 'outfits'
  },
  {
    name: 'Master - FAQ avec personnalité professionnelle',
    endpoint: 'master',
    message: 'Comment retourner un article ?',
    chatbotConfig: {
      personality: {
        tone: 'Professionnel',
        formality: 'Vouvoiement',
        verbosity: 'Concis'
      }
    }
  },
  {
    name: 'Master - Articles avec personnalité décontractée',
    endpoint: 'master',
    message: 'Je veux un jean cool',
    chatbotConfig: {
      personality: {
        tone: 'Décontracté',
        formality: 'Tutoiement',
        verbosity: 'Détaillé'
      }
    }
  },
  {
    name: 'Master - Outfits avec personnalité humoristique',
    endpoint: 'master',
    message: 'Aide-moi à créer un look pour le weekend',
    chatbotConfig: {
      personality: {
        tone: 'Humoristique',
        formality: 'Tutoiement',
        empathy: 'Élevée',
        proactivity: 'Très proactif'
      }
    }
  }
]

async function testAI(testCase) {
  try {
    console.log(`\n🧪 Test: ${testCase.name}`)
    console.log(`📍 Endpoint: /api/ai/${testCase.endpoint}`)
    console.log(`💬 Message: "${testCase.message}"`)
    
    const response = await fetch(`${BASE_URL}/api/ai/${testCase.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: testCase.message,
        context: {},
        chatbotConfig: testCase.chatbotConfig || {}
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.success) {
      console.log(`✅ Succès`)
      console.log(`🤖 Type IA: ${data.response.metadata?.aiType || 'non spécifié'}`)
      console.log(`📊 Confiance: ${Math.round((data.response.metadata?.confidence || 0) * 100)}%`)
      
      if (data.response.metadata?.routedTo) {
        console.log(`🎯 Routé vers: ${data.response.metadata.routedTo}`)
      }
      
      if (data.response.metadata?.personalityApplied) {
        console.log(`🎭 Personnalité: ${JSON.stringify(data.response.metadata.personalityApplied)}`)
      }
      
      console.log(`💭 Réponse: ${data.response.content.substring(0, 200)}${data.response.content.length > 200 ? '...' : ''}`)
      
      return { success: true, data }
    } else {
      console.log(`❌ Échec: ${data.error || 'Erreur inconnue'}`)
      return { success: false, error: data.error }
    }
    
  } catch (error) {
    console.log(`💥 Erreur: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testCompatibilityAPI() {
  console.log(`\n\n🔗 Test de compatibilité avec l'ancienne API`)
  
  try {
    const response = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Je cherche une robe pour une soirée',
        context: {},
        chatbotConfig: {
          personality: {
            tone: 'Amical',
            formality: 'Tutoiement'
          }
        }
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.success) {
      console.log(`✅ API de compatibilité fonctionne`)
      console.log(`🤖 Modèle: ${data.response.metadata?.model}`)
      console.log(`🎯 Routé vers: ${data.response.metadata?.routedTo}`)
      console.log(`💭 Réponse: ${data.response.content.substring(0, 150)}...`)
    } else {
      console.log(`❌ API de compatibilité échoue: ${data.error}`)
    }
    
  } catch (error) {
    console.log(`💥 Erreur API de compatibilité: ${error.message}`)
  }
}

async function runAllTests() {
  console.log('🚀 Démarrage des tests de la nouvelle architecture IA')
  console.log('=' * 60)
  
  let passed = 0
  let failed = 0
  
  // Test de chaque IA
  for (const testCase of testCases) {
    const result = await testAI(testCase)
    if (result.success) {
      passed++
    } else {
      failed++
    }
    
    // Petite pause entre les tests
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // Test de compatibilité
  await testCompatibilityAPI()
  
  // Résumé
  console.log('\n\n📊 RÉSUMÉ DES TESTS')
  console.log('=' * 30)
  console.log(`✅ Tests réussis: ${passed}`)
  console.log(`❌ Tests échoués: ${failed}`)
  console.log(`📈 Taux de réussite: ${Math.round(passed / (passed + failed) * 100)}%`)
  
  if (failed === 0) {
    console.log('\n🎉 Tous les tests sont passés ! L\'architecture IA est fonctionnelle.')
  } else {
    console.log('\n⚠️ Certains tests ont échoué. Vérifiez les logs ci-dessus.')
  }
}

// Démarrage des tests
if (require.main === module) {
  runAllTests().catch(console.error)
}

module.exports = { testAI, runAllTests } 