/**
 * Test de l'intégration Master ↔ RAG-OpenAI
 * Valide que le routage direct vers rag-openai fonctionne correctement
 */

const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

// Tests avec différents types de requêtes
const testCases = [
  {
    name: "Requête RAG idéale",
    message: "Je cherche un t-shirt rouge en taille M",
    expectedAI: "rag-openai",
    description: "Article spécifique avec critères précis → doit router vers RAG-OpenAI"
  },
  {
    name: "Requête avec taille et couleur",
    message: "pull noir L",
    expectedAI: "rag-openai", 
    description: "Critères couleur + taille → doit router vers RAG-OpenAI"
  },
  {
    name: "Requête avec budget",
    message: "chaussures bleues 42 moins de 80€",
    expectedAI: "rag-openai",
    description: "Critères multiples → doit router vers RAG-OpenAI"
  },
  {
    name: "Requête FAQ",
    message: "Comment retourner un article ?",
    expectedAI: "faq",
    description: "Question avec ? → doit router vers FAQ (fallback)"
  },
  {
    name: "Requête outfit",
    message: "tenue pour aller au travail",
    expectedAI: "outfits",
    description: "Demande de tenue complète → doit router vers Outfits (fallback)"
  },
  {
    name: "Requête article générale",
    message: "chemise",
    expectedAI: ["articles", "rag-openai"],
    description: "Article sans critères → peut router vers Articles ou RAG-OpenAI"
  },
  {
    name: "Requête sans critères spécifiques",
    message: "vêtements",
    expectedAI: "articles",
    description: "Très général → doit fallback vers Articles"
  }
]

async function testMasterRAGIntegration() {
  console.log('\n🧪 TEST DE L\'INTÉGRATION MASTER ↔ RAG-OPENAI')
  console.log('=' .repeat(70))
  
  let passedTests = 0
  let totalTests = testCases.length
  
  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`)
    console.log(`💬 Message: "${testCase.message}"`)
    console.log(`🎯 AI attendue: ${Array.isArray(testCase.expectedAI) ? testCase.expectedAI.join(' ou ') : testCase.expectedAI}`)
    console.log(`📋 Description: ${testCase.description}`)
    
    try {
      // Appel de l'API Master
      const response = await fetch(`${baseUrl}/api/ai/master`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testCase.message,
          chatbotId: 'test-integration'
        })
      })
      
      if (!response.ok) {
        console.log(`❌ Erreur HTTP: ${response.status}`)
        continue
      }
      
      const data = await response.json()
      
      if (data.success && data.response) {
        const routedTo = data.response.metadata?.routedTo
        const aiType = data.response.metadata?.aiType
        const confidence = data.response.metadata?.confidence
        
        console.log(`🤖 AI utilisée: ${routedTo || aiType}`)
        console.log(`📊 Confiance: ${confidence ? (confidence * 100).toFixed(1) + '%' : 'N/A'}`)
        
        // Informations spécifiques RAG-OpenAI
        if ((routedTo || aiType) === 'rag-openai') {
          const ragData = data.response.metadata?.ragData
          if (ragData) {
            console.log(`🔍 Résultats RAG: ${ragData.ragResults} produits`)
            console.log(`⏱️ Temps recherche: ${ragData.searchTime}ms`)
            console.log(`🎯 Critères extraits: ${JSON.stringify(ragData.extractedCriteria)}`)
            console.log(`💭 Raisonnement: ${ragData.reasoning}`)
          }
        }
        
        console.log(`💡 Réponse: "${data.response.content.substring(0, 150)}..."`)
        
        // Vérification du routage
        const actualAI = routedTo || aiType
        const expectedAIs = Array.isArray(testCase.expectedAI) ? testCase.expectedAI : [testCase.expectedAI]
        
        if (expectedAIs.includes(actualAI)) {
          console.log(`✅ SUCCÈS: Routé vers ${actualAI} comme attendu`)
          passedTests++
        } else {
          console.log(`❌ ÉCHEC: Routé vers ${actualAI}, attendu ${expectedAIs.join(' ou ')}`)
        }
        
      } else {
        console.log(`❌ Réponse invalide: ${data.error || 'Données manquantes'}`)
      }
      
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`)
    }
    
    console.log('-'.repeat(50))
  }
  
  // Résumé des tests
  console.log(`\n📊 RÉSULTATS DES TESTS:`)
  console.log(`✅ Tests réussis: ${passedTests}/${totalTests}`)
  console.log(`📈 Taux de réussite: ${((passedTests / totalTests) * 100).toFixed(1)}%`)
  
  if (passedTests === totalTests) {
    console.log(`\n🎉 TOUS LES TESTS SONT PASSÉS !`)
    console.log(`🔗 L'intégration Master ↔ RAG-OpenAI fonctionne parfaitement`)
  } else {
    console.log(`\n⚠️ ${totalTests - passedTests} tests ont échoué`)
    console.log(`🔧 Vérifiez la configuration du routage`)
  }
}

// Test spécifique de l'API RAG-OpenAI directement
async function testRAGOpenAIDirectly() {
  console.log('\n🔬 TEST DIRECT DE L\'API RAG-OPENAI')
  console.log('=' .repeat(50))
  
  const ragTests = [
    {
      query: "t-shirt noir M",
      expectSuccess: true,
      description: "Critères parfaits pour RAG"
    },
    {
      query: "chaussures rouges 42", 
      expectSuccess: true,
      description: "Article avec couleur et taille"
    },
    {
      query: "pull vert L moins de 50€",
      expectSuccess: true,
      description: "Article avec budget"
    },
    {
      query: "vêtements",
      expectSuccess: true,
      description: "Requête générale (peut réussir)"
    }
  ]
  
  for (const test of ragTests) {
    console.log(`\n💬 Test: "${test.query}"`)
    console.log(`📋 ${test.description}`)
    
    try {
      const response = await fetch(`${baseUrl}/api/rag-openai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: test.query,
          k: 5,
          searchType: 'hybrid'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        const results = data.data?.results || []
        console.log(`✅ RAG-OpenAI réussi`)
        console.log(`📊 ${results.length} résultats trouvés`)
        console.log(`⏱️ Temps: ${data.data?.searchTime || 0}ms`)
        console.log(`🔍 Type: ${data.data?.searchType || 'N/A'}`)
        
        // Afficher un échantillon de résultats
        if (results.length > 0) {
          const firstResult = results[0]
          if (firstResult.searchType === 'clarification') {
            console.log(`💬 Clarification: "${firstResult.document.content.substring(0, 100)}..."`)
          } else {
            console.log(`👕 Produit exemple: "${firstResult.document.metadata.title}"`)
            console.log(`💰 Prix: ${firstResult.document.metadata.price}€`)
          }
        }
        
      } else {
        console.log(`❌ RAG-OpenAI échoué: ${data.error}`)
      }
      
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`)
    }
  }
}

// Test de performance comparative
async function testPerformanceComparison() {
  console.log('\n⚡ TEST DE PERFORMANCE COMPARATIVE')
  console.log('=' .repeat(50))
  
  const testQuery = "jean bleu M"
  const iterations = 3
  
  console.log(`🎯 Requête test: "${testQuery}"`)
  console.log(`🔄 Nombre d'itérations: ${iterations}`)
  
  // Test Master → RAG-OpenAI
  let masterTimes = []
  console.log(`\n📊 Test via Master:`)
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now()
    try {
      const response = await fetch(`${baseUrl}/api/ai/master`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testQuery,
          chatbotId: 'test-perf'
        })
      })
      const data = await response.json()
      const time = Date.now() - start
      masterTimes.push(time)
      console.log(`  Itération ${i + 1}: ${time}ms (${data.success ? 'succès' : 'échec'})`)
    } catch (error) {
      console.log(`  Itération ${i + 1}: Erreur - ${error.message}`)
    }
  }
  
  // Test RAG-OpenAI direct
  let ragTimes = []
  console.log(`\n📊 Test RAG-OpenAI direct:`)
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now()
    try {
      const response = await fetch(`${baseUrl}/api/rag-openai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: testQuery,
          k: 5,
          searchType: 'hybrid'
        })
      })
      const data = await response.json()
      const time = Date.now() - start
      ragTimes.push(time)
      console.log(`  Itération ${i + 1}: ${time}ms (${data.success ? 'succès' : 'échec'})`)
    } catch (error) {
      console.log(`  Itération ${i + 1}: Erreur - ${error.message}`)
    }
  }
  
  // Statistiques
  if (masterTimes.length > 0 && ragTimes.length > 0) {
    const avgMaster = masterTimes.reduce((a, b) => a + b, 0) / masterTimes.length
    const avgRAG = ragTimes.reduce((a, b) => a + b, 0) / ragTimes.length
    const overhead = avgMaster - avgRAG
    
    console.log(`\n📈 STATISTIQUES:`)
    console.log(`⏱️ Temps moyen Master: ${avgMaster.toFixed(1)}ms`)
    console.log(`⏱️ Temps moyen RAG direct: ${avgRAG.toFixed(1)}ms`)
    console.log(`📊 Surcharge Master: ${overhead.toFixed(1)}ms (${((overhead / avgRAG) * 100).toFixed(1)}%)`)
  }
}

// Exécution des tests
async function runAllTests() {
  console.log('🚀 LANCEMENT DES TESTS D\'INTÉGRATION MASTER ↔ RAG-OPENAI')
  console.log('🕐 Démarrage...\n')
  
  try {
    await testMasterRAGIntegration()
    await testRAGOpenAIDirectly()
    await testPerformanceComparison()
    
    console.log('\n🏁 TOUS LES TESTS TERMINÉS')
    console.log('=' .repeat(70))
    
  } catch (error) {
    console.error('💥 Erreur globale:', error)
  }
}

// Lancement si exécuté directement
if (require.main === module) {
  runAllTests()
}

module.exports = {
  testMasterRAGIntegration,
  testRAGOpenAIDirectly,
  testPerformanceComparison,
  runAllTests
}
