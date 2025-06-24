/**
 * Script de test pour vérifier la récupération des configurations chatbot depuis Supabase
 * Teste le nouveau service ChatbotConfigService
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
}

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`)
}

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function testSupabaseConnection() {
  log('\n🔗 Test de connexion Supabase...', 'blue')
  
  if (!supabaseUrl || !supabaseKey) {
    log('❌ Variables Supabase manquantes:', 'red')
    log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓' : '❌'}`)
    log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? '✓' : '❌'}`)
    return false
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase
      .from('chatbots')
      .select('id, name')
      .limit(1)

    if (error) {
      log(`❌ Erreur connexion: ${error.message}`, 'red')
      return false
    }

    log('✅ Connexion Supabase réussie', 'green')
    return true
  } catch (error) {
    log(`❌ Erreur connexion: ${error.message}`, 'red')
    return false
  }
}

async function testChatbotRetrieval() {
  log('\n🤖 Test de récupération des chatbots...', 'blue')
  
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Test 1: Récupérer tous les chatbots
    const { data: allBots, error: allError } = await supabase
      .from('chatbots')
      .select('id, name, status, is_default, personality, visual_config')

    if (allError) {
      log(`❌ Erreur récupération: ${allError.message}`, 'red')
      return false
    }

    log(`✅ ${allBots?.length || 0} chatbots trouvés`, 'green')
    
    if (allBots && allBots.length > 0) {
      allBots.forEach(bot => {
        log(`   📝 ${bot.name} (${bot.id}) - ${bot.status}${bot.is_default ? ' [DEFAULT]' : ''}`, 'cyan')
      })

      // Test 2: Récupérer le chatbot par défaut
      const { data: defaultBot, error: defaultError } = await supabase
        .from('chatbots')
        .select('id, name, personality, visual_config')
        .eq('is_default', true)
        .eq('status', 'Actif')
        .single()

      if (defaultError) {
        log(`⚠️ Pas de chatbot par défaut: ${defaultError.message}`, 'yellow')
      } else {
        log(`✅ Chatbot par défaut: ${defaultBot.name}`, 'green')
        
        // Vérifier la structure des données
        if (defaultBot.personality) {
          log(`   🎭 Personnalité: ${JSON.stringify(defaultBot.personality, null, 2)}`, 'cyan')
        }
        
        if (defaultBot.visual_config) {
          log(`   🎨 Config visuelle: ${JSON.stringify(defaultBot.visual_config, null, 2)}`, 'cyan')
        }
      }

      // Test 3: Tester la récupération par ID
      const testId = allBots[0].id
      const { data: botById, error: byIdError } = await supabase
        .from('chatbots')
        .select('id, name, personality, visual_config')
        .eq('id', testId)
        .single()

      if (byIdError) {
        log(`❌ Erreur récupération par ID: ${byIdError.message}`, 'red')
      } else {
        log(`✅ Récupération par ID réussie: ${botById.name}`, 'green')
      }
    }

    return true
  } catch (error) {
    log(`❌ Erreur test chatbots: ${error.message}`, 'red')
    return false
  }
}

async function testAPIEndpoints() {
  log('\n🔌 Test des APIs avec récupération config...', 'blue')
  
  const baseUrl = 'http://localhost:3001'
  const testMessage = 'Bonjour'

  // Test des APIs individuelles
  const apis = [
    { name: 'IA Master', endpoint: '/api/ai/master' },
    { name: 'IA FAQ', endpoint: '/api/ai/faq' },
    { name: 'IA Articles', endpoint: '/api/ai/articles' },
    { name: 'IA Outfits', endpoint: '/api/ai/outfits' }
  ]

  for (const api of apis) {
    try {
      log(`   Testing ${api.name}...`, 'cyan')
      
      const response = await fetch(`${baseUrl}${api.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage,
          chatbotId: 'default', // Test avec ID par défaut
          context: {}
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          log(`   ✅ ${api.name}: ${data.response.metadata?.configSource || 'OK'}`, 'green')
          
          if (data.response.metadata?.chatbotName) {
            log(`      📝 Config: ${data.response.metadata.chatbotName}`, 'cyan')
          }
        } else {
          log(`   ⚠️ ${api.name}: ${data.message || 'Pas de succès'}`, 'yellow')
        }
      } else {
        log(`   ❌ ${api.name}: ${response.status} ${response.statusText}`, 'red')
      }
    } catch (error) {
      log(`   ❌ ${api.name}: ${error.message}`, 'red')
    }
  }
}

async function testChatbotConfigService() {
  log('\n⚙️ Test du service ChatbotConfigService...', 'blue')
  
  try {
    // Import dynamique du service (Next.js)
    const { ChatbotConfigService } = await import('../lib/services/chatbot-config.service.js')
    
    // Test 1: Configuration par défaut
    log('   Test config par défaut...', 'cyan')
    const defaultResult = await ChatbotConfigService.getDefaultConfig()
    
    if (defaultResult.success) {
      log(`   ✅ Config par défaut: ${defaultResult.config.name} (${defaultResult.source})`, 'green')
    } else {
      log(`   ❌ Erreur config par défaut: ${defaultResult.error}`, 'red')
    }

    // Test 2: Résolution avec ID
    log('   Test résolution avec chatbotId...', 'cyan')
    const resolveResult = await ChatbotConfigService.resolveConfig('default-younzee')
    
    if (resolveResult.success) {
      log(`   ✅ Résolution: ${resolveResult.config.name} (${resolveResult.source})`, 'green')
    } else {
      log(`   ❌ Erreur résolution: ${resolveResult.error}`, 'red')
    }

    return true
  } catch (error) {
    log(`   ❌ Erreur import service: ${error.message}`, 'red')
    return false
  }
}

async function runTests() {
  log('🧪 Test de récupération des configurations chatbot depuis Supabase', 'blue')
  log('=' * 70, 'blue')

  const results = {
    connection: false,
    chatbots: false,
    apis: false,
    service: false
  }

  // Test de connexion
  results.connection = await testSupabaseConnection()
  
  if (results.connection) {
    // Test de récupération des chatbots
    results.chatbots = await testChatbotRetrieval()
    
    // Test des APIs
    results.apis = await testAPIEndpoints()
    
    // Test du service
    results.service = await testChatbotConfigService()
  }

  // Résumé
  log('\n📊 RÉSUMÉ DES TESTS', 'blue')
  log('=' * 70, 'blue')
  
  const testResults = [
    ['Connexion Supabase', results.connection],
    ['Récupération chatbots', results.chatbots],
    ['APIs avec config', results.apis],
    ['Service ChatbotConfig', results.service]
  ]

  testResults.forEach(([name, success]) => {
    const status = success ? '✅ RÉUSSI' : '❌ ÉCHEC'
    const color = success ? 'green' : 'red'
    log(`${name.padEnd(25)} ${status}`, color)
  })

  const successCount = Object.values(results).filter(Boolean).length
  const totalCount = Object.keys(results).length
  
  log(`\n🎯 Score: ${successCount}/${totalCount} tests réussis`, successCount === totalCount ? 'green' : 'yellow')
  
  if (successCount === totalCount) {
    log('\n🎉 Tous les tests sont réussis ! Les configurations chatbot sont bien récupérées depuis Supabase.', 'green')
  } else {
    log('\n⚠️ Certains tests ont échoué. Vérifiez la configuration et les logs ci-dessus.', 'yellow')
  }
}

// Lancer les tests
if (require.main === module) {
  runTests().catch(error => {
    log(`❌ Erreur générale: ${error.message}`, 'red')
    process.exit(1)
  })
}

module.exports = { runTests } 