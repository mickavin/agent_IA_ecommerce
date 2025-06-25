/**
 * Script de test pour l'infrastructure Langchain (TypeScript)
 * 
 * Usage: npx ts-node scripts/test-langchain.ts
 */

import { MasterLangchainAgent } from '../lib/langchain/agents/master.langchain.agent'
import { FAQLangchainAgent } from '../lib/langchain/agents/faq.langchain.agent'

async function testLangchainInfrastructure() {
  console.log('🚀 Test rapide de l\'infrastructure Langchain\n')
  
  try {
    // Test 1: Agent FAQ
    console.log('🧪 Test Agent FAQ...')
    const faqAgent = new FAQLangchainAgent()
    
    const faqTest = await faqAgent.processQuery(
      'Bonjour, pouvez-vous m\'aider avec la livraison ?',
      { tone: 'Amical', formality: 'Tutoiement' }
    )
    
    console.log('FAQ Result:', {
      success: faqTest.success,
      canHandle: faqTest.canHandle,
      confidence: faqTest.confidence,
      contentLength: faqTest.content?.length || 0
    })
    
    // Test 2: Agent Master
    console.log('\n🧪 Test Agent Master...')
    const masterAgent = new MasterLangchainAgent()
    
    const masterTest = await masterAgent.processQuery(
      'Je cherche un t-shirt bleu pour l\'été',
      'default'
    )
    
    console.log('Master Result:', {
      success: masterTest.success,
      routedTo: masterTest.metadata?.routedTo,
      confidence: masterTest.metadata?.routingConfidence,
      contentLength: masterTest.content?.length || 0
    })
    
    console.log('\n✅ Tests terminés avec succès !')
    
  } catch (error: any) {
    console.error('❌ Erreur lors des tests:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Exécution
testLangchainInfrastructure() 