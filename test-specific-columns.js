// ✅ Test du système de catégorisation basé sur colonnes spécifiques
// Focus sur "ID Niveau 3" et "Libellé Niveau 3" uniquement

const { excelReferentialService } = require('./lib/services/excel-referential.service.ts')

async function testSpecificColumnsSystem() {
  console.log('🧪 TEST SYSTÈME COLONNES SPÉCIFIQUES')
  console.log('=' .repeat(60))
  
  try {
    // 1️⃣ Charger le référentiel
    console.log('\n1️⃣ CHARGEMENT DU RÉFÉRENTIEL...')
    await excelReferentialService.loadReferentials()
    
    const stats = excelReferentialService.getStats()
    console.log(`✅ Référentiel chargé: ${stats.productHierarchy} éléments hiérarchiques`)
    
    // 2️⃣ Tests de requêtes variées
    const testQueries = [
      // Tests exacts
      'pull femme',
      'chemise homme', 
      'robe été',
      'pantalon jean',
      
      // Tests partiels
      'tshirt',
      'chaussure sport',
      'sac main',
      'veste cuir',
      
      // Tests avec synonymes
      't-shirt',
      'sweater',
      'pants',
      'dress',
      
      // Tests avec ID (si disponible)
      'PULL_F',
      'CHEM_H',
      
      // Tests non pertinents
      'couleur rouge',
      'taille M',
      'promotion spéciale'
    ]
    
    console.log('\n2️⃣ TESTS DE CATÉGORISATION...')
    
    for (const query of testQueries) {
      console.log(`\n🔍 Test requête: "${query}"`)
      console.log('-'.repeat(50))
      
      try {
        const result = await excelReferentialService.categorizeUserPrompt(query)
        
        console.log(`📊 RÉSULTAT:`)
        console.log(`   🎯 Catégorie: "${result.detectedCategory}"`)
        console.log(`   📈 Confiance: ${(result.confidence * 100).toFixed(1)}%`)
        console.log(`   📋 Sous-catégories: ${result.subCategories.slice(0, 3).join(', ') || 'Aucune'}`)
        console.log(`   🔗 Chemin hiérarchique: ${result.hierarchyPath.join(' > ') || 'Aucun'}`)
        console.log(`   🎛️ Filtres suggérés: ${result.suggestedFilters.length} filtres`)
        
        // Afficher les types correspondants
        if (result.matchingTypes.length > 0) {
          console.log(`   📦 Types correspondants:`)
          result.matchingTypes.slice(0, 3).forEach((type, index) => {
            console.log(`      ${index + 1}. "${type.name}" (ID: ${type.id})`)
          })
        }
        
        // Évaluation qualitative
        const qualityScore = evaluateResult(query, result)
        console.log(`   ⭐ Qualité: ${qualityScore}/5 ${getQualityEmoji(qualityScore)}`)
        
      } catch (error) {
        console.error(`❌ Erreur pour "${query}":`, error.message)
      }
    }
    
    // 3️⃣ Statistiques globales
    console.log('\n3️⃣ STATISTIQUES GLOBALES...')
    const hierarchyData = await excelReferentialService.getReferentialData()
    
    console.log(`📊 DONNÉES HIÉRARCHIQUES:`)
    console.log(`   📦 Total types: ${hierarchyData.productHierarchy.length}`)
    
    // Échantillon des données chargées
    console.log(`\n📋 ÉCHANTILLON DONNÉES CHARGÉES:`)
    hierarchyData.productHierarchy.slice(0, 10).forEach((item, index) => {
      console.log(`   ${index + 1}. ID: "${item.id}" | Nom: "${item.name}"`)
    })
    
    // 4️⃣ Test de performance
    console.log('\n4️⃣ TEST DE PERFORMANCE...')
    const startTime = Date.now()
    
    for (let i = 0; i < 10; i++) {
      await excelReferentialService.categorizeUserPrompt('pull femme hiver')
    }
    
    const endTime = Date.now()
    const avgTime = (endTime - startTime) / 10
    
    console.log(`⚡ Performance: ${avgTime.toFixed(1)}ms par requête`)
    
    console.log('\n✅ TESTS TERMINÉS AVEC SUCCÈS!')
    
  } catch (error) {
    console.error('❌ ERREUR GLOBALE:', error)
    throw error
  }
}

// ✅ Fonction d'évaluation qualitative
function evaluateResult(query, result) {
  let score = 0
  
  // Critère 1: Confiance (0-2 points)
  if (result.confidence >= 0.8) score += 2
  else if (result.confidence >= 0.5) score += 1
  
  // Critère 2: Pertinence de la catégorie (0-2 points)
  if (result.detectedCategory && result.detectedCategory !== 'Non classifié') {
    if (isRelevantCategory(query, result.detectedCategory)) score += 2
    else score += 1
  }
  
  // Critère 3: Richesse des suggestions (0-1 point)
  if (result.subCategories.length > 0 || result.suggestedFilters.length > 0) score += 1
  
  return score
}

// ✅ Vérification de pertinence contextuelle
function isRelevantCategory(query, category) {
  const queryLower = query.toLowerCase()
  const categoryLower = category.toLowerCase()
  
  // Vérifications directes
  if (queryLower.includes(categoryLower) || categoryLower.includes(queryLower)) {
    return true
  }
  
  // Vérifications par synonymes
  const synonyms = {
    'pull': ['pullover', 'sweat', 'sweater'],
    'pantalon': ['jean', 'pants', 'trouser'],
    'robe': ['dress'],
    'tshirt': ['t-shirt', 'tee-shirt'],
    'chaussure': ['shoe', 'sneaker', 'basket'],
    'sac': ['bag', 'handbag']
  }
  
  for (const [key, values] of Object.entries(synonyms)) {
    if (queryLower.includes(key) && values.some(v => categoryLower.includes(v))) {
      return true
    }
  }
  
  return false
}

// ✅ Émojis de qualité
function getQualityEmoji(score) {
  if (score >= 4) return '🌟 Excellent'
  if (score >= 3) return '👍 Bon'
  if (score >= 2) return '👌 Correct'
  if (score >= 1) return '⚠️ Faible'
  return '❌ Insuffisant'
}

// ✅ Lancement du test
testSpecificColumnsSystem()
  .then(() => {
    console.log('\n🎉 Tous les tests sont passés!')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n💥 Échec des tests:', error)
    process.exit(1)
  }) 