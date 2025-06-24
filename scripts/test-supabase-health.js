#!/usr/bin/env node

/**
 * Script de diagnostic pour tester la santé de Supabase et les fallbacks
 * 
 * Usage: node scripts/test-supabase-health.js
 */

console.log('🔍 Diagnostic Supabase & Fallbacks\n')

/**
 * Teste l'état de Supabase et le système de fallback
 */
async function testSupabaseHealth() {
  console.log('📋 Test de l\'état de Supabase...\n')
  
  try {
    const response = await fetch('http://localhost:3000/api/health-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service: 'supabase'
      }),
    })

    if (!response.ok) {
      console.log('⚠️  API de health-check non disponible')
      console.log('🔧 Créons cette API pour diagnostiquer Supabase...')
      return false
    }

    const data = await response.json()
    console.log('✅ Résultats du diagnostic Supabase:')
    console.log(`   📱 Supabase configuré: ${data.supabaseConfigured ? '✅' : '❌'}`)
    console.log(`   🌐 Supabase connecté: ${data.supabaseConnected ? '✅' : '❌'}`)
    console.log(`   📄 Utilise données mock: ${data.usingMockData ? '✅' : '❌'}`)
    console.log(`   💬 Message: ${data.message}`)
    
    return data.supabaseConnected

  } catch (error) {
    console.log('❌ Erreur lors du test Supabase:', error.message)
    return false
  }
}

/**
 * Teste les services avec ChatbotService
 */
async function testChatbotServices() {
  console.log('\n🤖 Test des services de Chatbot...\n')
  
  const tests = [
    {
      name: 'Récupération de tous les chatbots',
      endpoint: '/api/chatbots',
      method: 'GET'
    },
    {
      name: 'Récupération d\'un chatbot spécifique',
      endpoint: '/api/chatbots/1',
      method: 'GET'
    }
  ]

  let passedTests = 0
  
  for (const test of tests) {
    try {
      console.log(`📝 ${test.name}...`)
      
      const response = await fetch(`http://localhost:3000${test.endpoint}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`   ✅ Succès - ${data.data?.length || 1} chatbot(s) trouvé(s)`)
        if (data.source) {
          console.log(`   📊 Source: ${data.source}`)
        }
        passedTests++
      } else {
        console.log(`   ❌ Erreur HTTP ${response.status}: ${response.statusText}`)
      }
      
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`)
    }
  }
  
  console.log(`\n📊 Résultats: ${passedTests}/${tests.length} tests réussis`)
  return passedTests === tests.length
}

/**
 * Teste les variables d'environnement
 */
async function testEnvironment() {
  console.log('\n🔧 Test des variables d\'environnement...\n')
  
  try {
    const response = await fetch('http://localhost:3000/api/env-check')
    
    if (response.ok) {
      const data = await response.json()
      console.log('📋 État des variables d\'environnement:')
      
      Object.entries(data).forEach(([key, value]) => {
        const status = value ? '✅' : '❌'
        const display = value ? (typeof value === 'string' && value.length > 20 ? `${value.substring(0, 20)}...` : value) : 'Non définie'
        console.log(`   ${status} ${key}: ${display}`)
      })
      
    } else {
      console.log('⚠️  API env-check non disponible')
    }
    
  } catch (error) {
    console.log('❌ Erreur lors du test d\'environnement:', error.message)
  }
}

/**
 * Affiche les recommandations
 */
function displayRecommendations(supabaseWorking, servicesWorking) {
  console.log('\n💡 RECOMMANDATIONS:\n')
  
  if (!supabaseWorking) {
    console.log('🔧 CONFIGURATION SUPABASE:')
    console.log('   1. Créez un projet sur https://supabase.com')
    console.log('   2. Ajoutez ces variables à votre .env.local:')
    console.log('      NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co')
    console.log('      NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key')
    console.log('   3. Créez la table "chatbots" avec le schema approprié')
    console.log('   4. Configurez les RLS (Row Level Security) si nécessaire\n')
  }
  
  if (supabaseWorking) {
    console.log('✅ SUPABASE OPÉRATIONNEL:')
    console.log('   • Données stockées en base de données')
    console.log('   • Synchronisation en temps réel')
    console.log('   • Persistance des données\n')
  } else {
    console.log('📱 MODE DÉVELOPPEMENT (Données Mock):')
    console.log('   • Fonctionnalités complètes disponibles')
    console.log('   • Données temporaires en mémoire')
    console.log('   • Parfait pour développement et tests')
    console.log('   • Migration automatique vers Supabase une fois configuré\n')
  }
  
  if (servicesWorking) {
    console.log('🎯 SYSTÈME OPÉRATIONNEL:')
    console.log('   • Services de chatbot fonctionnels')
    console.log('   • API IA Master active')
    console.log('   • Interface utilisateur disponible\n')
  }
  
  console.log('🚀 PROCHAINES ÉTAPES:')
  console.log('   1. Testez l\'interface: http://localhost:3000/bots')
  console.log('   2. Créez votre premier chatbot')
  console.log('   3. Testez l\'IA Master: http://localhost:3000/bots/1/test')
  console.log('   4. Configurez Supabase pour la persistance des données')
}

/**
 * Fonction principale
 */
async function main() {
  try {
    // Vérifier que le serveur est accessible
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
    
    // Tests principaux
    const supabaseWorking = await testSupabaseHealth()
    const servicesWorking = await testChatbotServices()
    await testEnvironment()
    
    // Affichage des recommandations
    displayRecommendations(supabaseWorking, servicesWorking)
    
    // Résumé final
    console.log('🏁 DIAGNOSTIC TERMINÉ')
    console.log(`📊 Statut: ${supabaseWorking ? 'Production Ready' : 'Mode Développement'}`)
    console.log(`🎯 Services: ${servicesWorking ? 'Opérationnels' : 'À vérifier'}`)
    
    if (!supabaseWorking && servicesWorking) {
      console.log('\n🎉 Votre application fonctionne parfaitement en mode développement !')
      console.log('💡 Configurez Supabase quand vous serez prêt pour la production.')
    }
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message)
    console.error('\n💡 Assurez-vous que :')
    console.error('  • Next.js est démarré (npm run dev)')
    console.error('  • Le port 3000 est disponible')
    console.error('  • Aucun pare-feu ne bloque localhost:3000')
    process.exit(1)
  }
}

// Exécution du script si appelé directement
if (require.main === module) {
  main()
}

module.exports = { testSupabaseHealth, testChatbotServices } 