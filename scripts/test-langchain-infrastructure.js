/**
 * Script de test pour l'infrastructure Langchain
 * 
 * Usage: node scripts/test-langchain-infrastructure.js
 */

const { MasterLangchainAgent } = require('../lib/langchain/agents/master.langchain.agent')
const { FAQLangchainAgent } = require('../lib/langchain/agents/faq.langchain.agent')
const { ArticlesLangchainAgent } = require('../lib/langchain/agents/articles.langchain.agent')
const { OutfitsLangchainAgent } = require('../lib/langchain/agents/outfits.langchain.agent')

// Configuration des tests
const TEST_CONFIG = {
  timeout: 30000, // 30 secondes par test
  verbose: true,
  skipSlowTests: false
}

// Cas de test
const TEST_CASES = {
  faq: [
    { input: 'Bonjour, pouvez-vous m\'aider ?', expected: 'greeting' },
    { input: 'Quels sont vos délais de livraison ?', expected: 'delivery' },
    { input: 'Comment faire un retour ?', expected: 'return' },
    { input: 'Quels moyens de paiement acceptez-vous ?', expected: 'payment' }
  ],
  articles: [
    { input: 'Je cherche un t-shirt bleu pour l\'été', expected: 'product_recommendation' },
    { input: 'Avez-vous des jeans pour homme ?', expected: 'product_recommendation' },
    { input: 'Je veux une robe élégante pour un mariage', expected: 'product_recommendation' }
  ],
  outfits: [
    { input: 'J\'ai besoin d\'une tenue pour un entretien d\'embauche', expected: 'outfit_creation' },
    { input: 'Comment m\'habiller pour une soirée ?', expected: 'outfit_creation' },
    { input: 'Créez-moi un look décontracté pour le week-end', expected: 'outfit_creation' }
  ]
}

class LangchainTester {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    }
  }

  /**
   * Formate et affiche les résultats
   */
  log(level, message, data = null) {
    const timestamp = new Date().toLocaleTimeString()
    const prefix = {
      'info': '💡',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'test': '🧪'
    }[level] || 'ℹ️'

    console.log(`${prefix} [${timestamp}] ${message}`)
    
    if (data && TEST_CONFIG.verbose) {
      console.log('   Data:', JSON.stringify(data, null, 2))
    }
  }

  /**
   * Test de l'agent FAQ
   */
  async testFAQAgent() {
    this.log('test', 'Test de l\'agent FAQ Langchain')
    
    try {
      const agent = new FAQLangchainAgent()
      
      // Test de connexion
      const connectionTest = await agent.testConnection()
      if (!connectionTest.success) {
        throw new Error(`Connexion FAQ: ${connectionTest.error}`)
      }
      this.log('success', 'Connexion FAQ réussie')

      // Tests des cas FAQ
      for (const testCase of TEST_CASES.faq) {
        this.results.total++
        
        try {
          const result = await agent.processQuery(
            testCase.input,
            { tone: 'Amical', formality: 'Tutoiement' }
          )

          if (result.success && result.canHandle && result.confidence > 0.3) {
            this.results.passed++
            this.log('success', `FAQ: "${testCase.input}" → OK (confidence: ${result.confidence})`)
          } else {
            this.results.failed++
            this.log('error', `FAQ: "${testCase.input}" → FAIL`, result)
            this.results.errors.push(`FAQ: ${testCase.input} - ${result.error || 'Faible confiance'}`)
          }
        } catch (error) {
          this.results.failed++
          this.log('error', `FAQ: "${testCase.input}" → ERROR: ${error.message}`)
          this.results.errors.push(`FAQ: ${testCase.input} - ${error.message}`)
        }
      }

    } catch (error) {
      this.log('error', `Erreur agent FAQ: ${error.message}`)
      this.results.errors.push(`FAQ Agent: ${error.message}`)
    }
  }

  /**
   * Test de l'agent Articles
   */
  async testArticlesAgent() {
    this.log('test', 'Test de l\'agent Articles Langchain')
    
    try {
      const agent = new ArticlesLangchainAgent()
      
      // Test de connexion
      const connectionTest = await agent.testConnection()
      if (!connectionTest.success) {
        throw new Error(`Connexion Articles: ${connectionTest.error}`)
      }
      this.log('success', 'Connexion Articles réussie')

      // Tests des cas Articles
      for (const testCase of TEST_CASES.articles) {
        this.results.total++
        
        try {
          const result = await agent.processQuery(
            testCase.input,
            { tone: 'Expert', formality: 'Vouvoiement' }
          )

          if (result.success && result.canHandle && result.confidence > 0.4) {
            this.results.passed++
            this.log('success', `Articles: "${testCase.input}" → OK (confidence: ${result.confidence})`)
          } else {
            this.results.failed++
            this.log('error', `Articles: "${testCase.input}" → FAIL`, result)
            this.results.errors.push(`Articles: ${testCase.input} - ${result.error || 'Faible confiance'}`)
          }
        } catch (error) {
          this.results.failed++
          this.log('error', `Articles: "${testCase.input}" → ERROR: ${error.message}`)
          this.results.errors.push(`Articles: ${testCase.input} - ${error.message}`)
        }
      }

    } catch (error) {
      this.log('error', `Erreur agent Articles: ${error.message}`)
      this.results.errors.push(`Articles Agent: ${error.message}`)
    }
  }

  /**
   * Test de l'agent Outfits
   */
  async testOutfitsAgent() {
    this.log('test', 'Test de l\'agent Outfits Langchain')
    
    try {
      const agent = new OutfitsLangchainAgent()
      
      // Test de connexion
      const connectionTest = await agent.testConnection()
      if (!connectionTest.success) {
        throw new Error(`Connexion Outfits: ${connectionTest.error}`)
      }
      this.log('success', 'Connexion Outfits réussie')

      // Tests des cas Outfits
      for (const testCase of TEST_CASES.outfits) {
        this.results.total++
        
        try {
          const result = await agent.processQuery(
            testCase.input,
            { tone: 'Professionnel', formality: 'Vouvoiement' }
          )

          if (result.success && result.canHandle && result.confidence > 0.4) {
            this.results.passed++
            this.log('success', `Outfits: "${testCase.input}" → OK (confidence: ${result.confidence})`)
          } else {
            this.results.failed++
            this.log('error', `Outfits: "${testCase.input}" → FAIL`, result)
            this.results.errors.push(`Outfits: ${testCase.input} - ${result.error || 'Faible confiance'}`)
          }
        } catch (error) {
          this.results.failed++
          this.log('error', `Outfits: "${testCase.input}" → ERROR: ${error.message}`)
          this.results.errors.push(`Outfits: ${testCase.input} - ${error.message}`)
        }
      }

    } catch (error) {
      this.log('error', `Erreur agent Outfits: ${error.message}`)
      this.results.errors.push(`Outfits Agent: ${error.message}`)
    }
  }

  /**
   * Test de l'agent Master
   */
  async testMasterAgent() {
    this.log('test', 'Test de l\'agent Master Langchain')
    
    try {
      const agent = new MasterLangchainAgent()
      
      // Test de connexion
      const connectionTest = await agent.testConnection()
      if (!connectionTest.success) {
        throw new Error(`Connexion Master: ${connectionTest.error}`)
      }
      this.log('success', 'Connexion Master réussie')

      // Tests de routage
      const routingTests = [
        { input: 'Bonjour', expectedAgent: 'faq' },
        { input: 'Je veux un jean noir', expectedAgent: 'articles' },
        { input: 'Créez-moi une tenue pour le travail', expectedAgent: 'outfits' }
      ]

      for (const test of routingTests) {
        this.results.total++
        
        try {
          const result = await agent.processQuery(test.input, 'default')

          if (result.success && result.metadata?.routedTo) {
            this.results.passed++
            this.log('success', `Master: "${test.input}" → ${result.metadata.routedTo} (confidence: ${result.metadata.routingConfidence})`)
          } else {
            this.results.failed++
            this.log('error', `Master: "${test.input}" → FAIL`, result)
            this.results.errors.push(`Master: ${test.input} - ${result.error || 'Routage échoué'}`)
          }
        } catch (error) {
          this.results.failed++
          this.log('error', `Master: "${test.input}" → ERROR: ${error.message}`)
          this.results.errors.push(`Master: ${test.input} - ${error.message}`)
        }
      }

    } catch (error) {
      this.log('error', `Erreur agent Master: ${error.message}`)
      this.results.errors.push(`Master Agent: ${error.message}`)
    }
  }

  /**
   * Test de performance
   */
  async testPerformance() {
    if (TEST_CONFIG.skipSlowTests) {
      this.log('warning', 'Tests de performance ignorés')
      return
    }

    this.log('test', 'Test de performance Langchain')
    
    try {
      const agent = new MasterLangchainAgent()
      const testMessage = 'Bonjour, je cherche une chemise blanche pour le bureau'
      
      // Test de latence
      const iterations = 5
      const times = []

      for (let i = 0; i < iterations; i++) {
        const start = Date.now()
        const result = await agent.processQuery(testMessage, 'default')
        const end = Date.now()
        
        if (result.success) {
          times.push(end - start)
        }
      }

      if (times.length > 0) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length
        const minTime = Math.min(...times)
        const maxTime = Math.max(...times)

        this.log('info', `Performance: Moy=${avgTime}ms, Min=${minTime}ms, Max=${maxTime}ms`)
        
        if (avgTime < 5000) { // Moins de 5 secondes en moyenne
          this.log('success', 'Performance acceptable')
        } else {
          this.log('warning', 'Performance lente (>5s en moyenne)')
        }
      }

    } catch (error) {
      this.log('error', `Erreur test performance: ${error.message}`)
    }
  }

  /**
   * Exécute tous les tests
   */
  async runAllTests() {
    console.log('🚀 Démarrage des tests de l\'infrastructure Langchain\n')
    
    const startTime = Date.now()

    try {
      await this.testFAQAgent()
      console.log()
      
      await this.testArticlesAgent()
      console.log()
      
      await this.testOutfitsAgent()
      console.log()
      
      await this.testMasterAgent()
      console.log()
      
      await this.testPerformance()
      console.log()

    } catch (error) {
      this.log('error', `Erreur globale: ${error.message}`)
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    // Rapport final
    console.log('📊 RAPPORT FINAL')
    console.log('================')
    console.log(`Tests exécutés: ${this.results.total}`)
    console.log(`✅ Réussis: ${this.results.passed}`)
    console.log(`❌ Échoués: ${this.results.failed}`)
    console.log(`⏱️ Durée: ${duration}ms`)
    console.log(`📈 Taux de réussite: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`)

    if (this.results.errors.length > 0) {
      console.log('\n🚨 ERREURS:')
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`)
      })
    }

    console.log('\n' + (this.results.failed === 0 ? '🎉 Tous les tests sont passés !' : '⚠️ Certains tests ont échoué'))
  }
}

// Exécution du script
async function main() {
  const tester = new LangchainTester()
  
  try {
    await tester.runAllTests()
    process.exit(tester.results.failed === 0 ? 0 : 1)
  } catch (error) {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  }
}

// Exécution seulement si appelé directement
if (require.main === module) {
  main()
}

module.exports = { LangchainTester, TEST_CASES } 