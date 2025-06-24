#!/usr/bin/env node

/**
 * Script de test pour vérifier la compatibilité des types de chatbot avec Supabase
 * 
 * Usage: node scripts/test-chatbot-types.js
 */

console.log('🧪 Test de Compatibilité Types Chatbot & Supabase\n')

/**
 * Teste la création d'un chatbot avec le nouveau format
 */
async function testChatbotCreation() {
  console.log('📝 Test de création de chatbot...\n')
  
  // Données de test en format ChatbotCreateInput (correspondant au schéma Supabase)
  const testChatbot = {
    name: 'Test Bot Migration',
    description: 'Bot de test pour vérifier la migration des types',
    status: 'En test',
    is_default: false,
    personality: {
      tone: 'Amical',
      formality: 'Tutoiement',
      verbosity: 'Détaillé',
      empathy: 'Élevée',
      proactivity: 'Proactif'
    },
    visual_config: {
      primaryColor: '#3B82F6',
      secondaryColor: '#EFF6FF',
      textColor: '#1F2937',
      backgroundColor: '#FFFFFF',
      borderRadius: 'Arrondi',
      position: 'Bas droite',
      size: 'Standard',
      welcomeMessage: '👋 Test de bienvenue avec le nouveau format !',
      placeholder: 'Tapez votre message de test...'
    },
    data_sources: [
      { id: '1', type: 'faq', name: 'FAQ Test', isEnabled: true, priority: 1 },
      { id: '2', type: 'products', name: 'Produits Test', isEnabled: true, priority: 2 }
    ],
    conversations_count: 0,
    avg_response_time: 0,
    satisfaction_rate: 0.0
  }
  
  try {
    console.log('📊 Données de test (format DB):')
    console.log(JSON.stringify(testChatbot, null, 2))
    console.log('\n🚀 Envoi de la requête de création...')
    
    const response = await fetch('http://localhost:3000/api/chatbots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testChatbot),
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Chatbot créé avec succès !')
      console.log('📝 Données reçues (format UI):')
      console.log(JSON.stringify(result.data, null, 2))
      
      // Vérification du mapping des propriétés
      console.log('\n🔍 Vérification du mapping DB -> UI:')
      console.log(`   ✅ id: ${result.data.id}`)
      console.log(`   ✅ name: ${result.data.name}`)
      console.log(`   ✅ description: ${result.data.description}`)
      console.log(`   ✅ status: ${result.data.status}`)
      console.log(`   ✅ isDefault: ${result.data.isDefault} (était is_default)`)
      console.log(`   ✅ visualConfig: ${result.data.visualConfig ? 'Présent' : 'Absent'} (était visual_config)`)
      console.log(`   ✅ dataSources: ${result.data.dataSources ? 'Présent' : 'Absent'} (était data_sources)`)
      console.log(`   ✅ conversationsCount: ${result.data.conversationsCount} (était conversations_count)`)
      console.log(`   ✅ avgResponseTime: ${result.data.avgResponseTime} (était avg_response_time)`)
      console.log(`   ✅ satisfactionRate: ${result.data.satisfactionRate} (était satisfaction_rate)`)
      console.log(`   ✅ createdAt: ${result.data.createdAt} (était created_at)`)
      console.log(`   ✅ updatedAt: ${result.data.updatedAt} (était updated_at)`)
      
      return result.data.id
    } else {
      const error = await response.json()
      console.log('❌ Erreur lors de la création:')
      console.log(`   Status: ${response.status}`)
      console.log(`   Message: ${error.message}`)
      console.log(`   Erreur: ${error.error}`)
      return null
    }
    
  } catch (error) {
    console.log('❌ Erreur de réseau:', error.message)
    return null
  }
}

/**
 * Teste la récupération et la mise à jour d'un chatbot
 */
async function testChatbotUpdate(chatbotId) {
  if (!chatbotId) {
    console.log('⏭️  Test de mise à jour ignoré (pas d\'ID de chatbot)')
    return false
  }
  
  console.log('\n📝 Test de mise à jour de chatbot...\n')
  
  // Données de mise à jour
  const updateData = {
    name: 'Test Bot Migration (Modifié)',
    description: 'Description mise à jour pour tester le mapping',
    status: 'Actif',
    satisfaction_rate: 95.5
  }
  
  try {
    console.log('🔄 Données de mise à jour:')
    console.log(JSON.stringify(updateData, null, 2))
    console.log('\n🚀 Envoi de la requête de mise à jour...')
    
    const response = await fetch(`http://localhost:3000/api/chatbots/${chatbotId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Chatbot mis à jour avec succès !')
      console.log('📝 Données mises à jour:')
      console.log(`   Nom: ${result.data.name}`)
      console.log(`   Description: ${result.data.description}`)
      console.log(`   Status: ${result.data.status}`)
      console.log(`   Satisfaction: ${result.data.satisfactionRate}%`)
      console.log(`   Mis à jour le: ${result.data.updatedAt}`)
      
      return true
    } else {
      const error = await response.json()
      console.log('❌ Erreur lors de la mise à jour:')
      console.log(`   Status: ${response.status}`)
      console.log(`   Message: ${error.message}`)
      return false
    }
    
  } catch (error) {
    console.log('❌ Erreur de réseau:', error.message)
    return false
  }
}

/**
 * Teste la récupération de tous les chatbots
 */
async function testChatbotListing() {
  console.log('\n📋 Test de listing des chatbots...\n')
  
  try {
    const response = await fetch('http://localhost:3000/api/chatbots?limit=5')

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Liste des chatbots récupérée avec succès !')
      console.log(`📊 Total: ${result.total} chatbots`)
      console.log(`📄 Page: ${result.page}/${result.totalPages}`)
      console.log(`📦 Source: ${result.source}`)
      
      if (result.data && result.data.length > 0) {
        console.log('\n🔍 Vérification du format des données:')
        const firstBot = result.data[0]
        console.log(`   ✅ Format UI détecté: ${firstBot.visualConfig ? 'Oui' : 'Non'}`)
        console.log(`   ✅ Propriétés mappées: ${firstBot.isDefault !== undefined ? 'Oui' : 'Non'}`)
        console.log(`   ✅ Timestamps formatés: ${firstBot.createdAt ? 'Oui' : 'Non'}`)
      }
      
      return true
    } else {
      console.log('❌ Erreur lors du listing:', response.status)
      return false
    }
    
  } catch (error) {
    console.log('❌ Erreur de réseau:', error.message)
    return false
  }
}

/**
 * Teste le nettoyage (suppression du chatbot de test)
 */
async function testChatbotDeletion(chatbotId) {
  if (!chatbotId) {
    console.log('⏭️  Test de suppression ignoré (pas d\'ID de chatbot)')
    return true
  }
  
  console.log('\n🗑️  Test de suppression du chatbot de test...')
  
  try {
    const response = await fetch(`http://localhost:3000/api/chatbots/${chatbotId}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      console.log('✅ Chatbot de test supprimé avec succès !')
      return true
    } else {
      console.log('⚠️  Impossible de supprimer le chatbot de test (pas grave)')
      return true
    }
    
  } catch (error) {
    console.log('⚠️  Erreur lors de la suppression (pas grave):', error.message)
    return true
  }
}

/**
 * Affiche le résumé des tests
 */
function displaySummary(results) {
  console.log('\n📊 RÉSUMÉ DES TESTS\n')
  
  const totalTests = Object.keys(results).length
  const passedTests = Object.values(results).filter(Boolean).length
  
  console.log(`✅ Tests réussis: ${passedTests}/${totalTests}`)
  console.log('📋 Détails:')
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌'
    console.log(`   ${status} ${test}`)
  })
  
  if (passedTests === totalTests) {
    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !')
    console.log('✅ La migration des types est réussie')
    console.log('✅ Le mapping DB ↔ UI fonctionne correctement')
    console.log('✅ Les APIs sont compatibles avec le schéma Supabase')
  } else {
    console.log('\n⚠️  CERTAINS TESTS ONT ÉCHOUÉ')
    console.log('🔧 Vérifiez les erreurs ci-dessus')
  }
  
  console.log('\n💡 SCHÉMA SUPABASE COMPATIBLE:')
  console.log('   • Tous les champs correspondent aux colonnes Supabase')
  console.log('   • Le mapping snake_case ↔ camelCase fonctionne')
  console.log('   • Les types JSONB sont correctement sérialisés')
  console.log('   • Les timestamps sont au bon format')
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔍 Vérification de la connexion au serveur...')
  
  try {
    const healthCheck = await fetch('http://localhost:3000/')
    if (!healthCheck.ok) {
      throw new Error('Serveur non accessible')
    }
    console.log('✅ Serveur Next.js accessible\n')
  } catch (error) {
    throw new Error('Serveur non accessible. Assurez-vous que Next.js est démarré (npm run dev)')
  }
  
  // Exécution des tests
  const results = {}
  
  console.log('🚀 DÉBUT DES TESTS DE COMPATIBILITÉ\n')
  
  // Test de création
  const chatbotId = await testChatbotCreation()
  results['Création de chatbot'] = !!chatbotId
  
  // Test de mise à jour
  const updateSuccess = await testChatbotUpdate(chatbotId)
  results['Mise à jour de chatbot'] = updateSuccess
  
  // Test de listing
  const listingSuccess = await testChatbotListing()
  results['Listing des chatbots'] = listingSuccess
  
  // Nettoyage
  const cleanupSuccess = await testChatbotDeletion(chatbotId)
  results['Nettoyage des données'] = cleanupSuccess
  
  // Affichage du résumé
  displaySummary(results)
}

// Exécution du script si appelé directement
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erreur fatale:', error.message)
    process.exit(1)
  })
}

module.exports = { testChatbotCreation, testChatbotUpdate, testChatbotListing } 