// ✅ Test simple du système de catégorisation hiérarchique
// Via l'API RAG existante

async function testHierarchicalCategorization() {
  console.log('🧪 TEST SYSTÈME CATÉGORISATION HIÉRARCHIQUE')
  console.log('=' .repeat(60))
  
  const testQueries = [
    'pull femme',
    'chemise homme', 
    'robe été',
    'pantalon jean',
    'tshirt coton',
    'chaussure sport',
    'sac main',
    'veste cuir'
  ]
  
  console.log('\n🔍 Test des requêtes via API RAG...')
  
  for (const query of testQueries) {
    console.log(`\n📝 Test: "${query}"`)
    console.log('-'.repeat(40))
    
    try {
      const response = await fetch('http://localhost:3000/api/rag-openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          context: 'Je cherche des informations sur ce produit',
          max_results: 5
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      console.log(`✅ Réponse reçue:`)
      if (result.categorization) {
        console.log(`   🎯 Catégorie: "${result.categorization.detectedCategory}"`)
        console.log(`   📈 Confiance: ${(result.categorization.confidence * 100).toFixed(1)}%`)
        if (result.categorization.subCategories?.length > 0) {
          console.log(`   📋 Alternatives: ${result.categorization.subCategories.slice(0, 3).join(', ')}`)
        }
      }
      
      if (result.products?.length > 0) {
        console.log(`   📦 Produits trouvés: ${result.products.length}`)
        result.products.slice(0, 3).forEach((product, index) => {
          console.log(`      ${index + 1}. ${product.title || product.name || 'Produit'} (Score: ${product.score?.toFixed(2) || 'N/A'})`)
        })
      } else {
        console.log(`   ⚠️ Aucun produit trouvé`)
      }
      
    } catch (error) {
      console.error(`❌ Erreur pour "${query}":`, error.message)
    }
    
    // Petite pause entre les requêtes
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('\n✅ Tests terminés!')
}

// ✅ Test des colonnes spécifiques via inspection directe
function testColumnExtraction() {
  console.log('\n🔍 Test extraction colonnes spécifiques...')
  
  // Simuler les noms de colonnes qu'on peut trouver
  const mockRowData = {
    'ID Niveau 3': 'PULL_FEMME_001',
    'Libellé Niveau 3': 'Pull Femme Coton',
    'Autres colonnes': 'données ignorées',
    'Encore autre': 'aussi ignoré'
  }
  
  // Test des variantes de noms de colonnes
  const testVariants = [
    { 'ID Niveau 3': 'TEST_001', 'Libellé Niveau 3': 'Test Produit' },
    { 'id_niveau_3': 'TEST_002', 'libelle_niveau_3_type_produit': 'Test Produit 2' },
    { 'ID_NIVEAU_3': 'TEST_003', 'LIBELLE_NIVEAU_3_TYPE_PRODUIT': 'Test Produit 3' },
    { 'idNiveau3': 'TEST_004', 'Libellé Niveau 3': 'Test Produit 4' }
  ]
  
  console.log('📋 Test des variantes de noms de colonnes:')
  testVariants.forEach((variant, index) => {
    const idNiveau3 = variant['ID Niveau 3'] || variant['id_niveau_3'] || variant['ID_NIVEAU_3'] || variant['idNiveau3']
    const libelleNiveau3 = variant['Libellé Niveau 3'] || 
                           variant['libelle_niveau_3_type_produit'] || 
                           variant['LIBELLE_NIVEAU_3_TYPE_PRODUIT'] || 
                           variant['Libellé Niveau 3']
    
    console.log(`   ${index + 1}. ID: "${idNiveau3}" | Libellé: "${libelleNiveau3}"`)
    
    if (idNiveau3 && libelleNiveau3) {
      console.log(`      ✅ Extraction réussie`)
    } else {
      console.log(`      ❌ Extraction échouée`)
    }
  })
}

// ✅ Lancement des tests
async function runAllTests() {
  try {
    // Test d'extraction locale
    testColumnExtraction()
    
    // Test via API (nécessite le serveur en cours)
    console.log('\n' + '='.repeat(60))
    await testHierarchicalCategorization()
    
  } catch (error) {
    console.error('💥 Erreur globale:', error)
  }
}

// Lancer les tests
runAllTests()
  .then(() => console.log('\n🎉 Tous les tests terminés!'))
  .catch(error => console.error('\n�� Échec:', error)) 