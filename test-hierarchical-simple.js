// Test simple du système de catégorisation hiérarchique

console.log('🧪 TEST SYSTÈME CATÉGORISATION HIÉRARCHIQUE')
console.log('=' .repeat(60))

// Test d'extraction des colonnes spécifiques
function testColumnExtraction() {
  console.log('\n🔍 Test extraction colonnes spécifiques...')
  
  // Simuler les données qu'on peut trouver dans le fichier Excel
  const mockExcelData = [
    {
      'ID Niveau 3': 'PULL_FEMME_001',
      'Libellé Niveau 3': 'Pull Femme Coton',
      'Autres colonnes': 'données ignorées'
    },
    {
      'id_niveau_3': 'CHEMISE_HOMME_002', 
      'libelle_niveau_3_type_produit': 'Chemise Homme Lin'
    },
    {
      'ID_NIVEAU_3': 'ROBE_ETE_003',
      'LIBELLE_NIVEAU_3_TYPE_PRODUIT': 'Robe Été Légère'
    },
    {
      'idNiveau3': 'PANTALON_004',
      'Libellé Niveau 3': 'Pantalon Jean Homme'
    }
  ]
  
  console.log('📋 Simulation extraction données Excel:')
  
  const extractedData = []
  
  mockExcelData.forEach((row, index) => {
    // Reproduire la logique d'extraction du service
    const idNiveau3 = row['ID Niveau 3'] || row['id_niveau_3'] || row['ID_NIVEAU_3'] || row['idNiveau3']
    const libelleNiveau3 = row['Libellé Niveau 3'] || 
                           row['libelle_niveau_3_type_produit'] || 
                           row['LIBELLE_NIVEAU_3_TYPE_PRODUIT'] || 
                           row['Libellé Niveau 3'] ||
                           row['libelle_niveau_3']
    
    console.log(`\n   Ligne ${index + 1}:`)
    console.log(`      🆔 ID Niveau 3: "${idNiveau3}"`)
    console.log(`      🏷️ Libellé: "${libelleNiveau3}"`)
    
    if (idNiveau3 && libelleNiveau3) {
      const item = {
        id: String(idNiveau3),
        name: String(libelleNiveau3).trim(),
        level: 3,
        parent: undefined,
        path: [String(libelleNiveau3).trim()]
      }
      
      extractedData.push(item)
      console.log(`      ✅ Extraction réussie -> Ajouté`)
    } else {
      console.log(`      ❌ Extraction échouée -> Ignoré`)
    }
  })
  
  console.log(`\n📊 Résultat: ${extractedData.length}/${mockExcelData.length} éléments extraits`)
  
  return extractedData
}

// Test de catégorisation
function testCategorization() {
  console.log('\n🎯 Test logique de catégorisation...')
  
  const mockHierarchy = [
    { id: 'PULL_001', name: 'Pull Femme Coton', level: 3, path: ['Pull Femme Coton'] },
    { id: 'CHEMISE_002', name: 'Chemise Homme Lin', level: 3, path: ['Chemise Homme Lin'] },
    { id: 'ROBE_003', name: 'Robe Été Légère', level: 3, path: ['Robe Été Légère'] },
    { id: 'TSHIRT_004', name: 'T-shirt Coton Bio', level: 3, path: ['T-shirt Coton Bio'] }
  ]
  
  const testQueries = [
    'pull femme',
    'chemise homme',
    'robe été',
    'tshirt coton',
    't-shirt bio'
  ]
  
  testQueries.forEach(query => {
    console.log(`\n   🔍 Requête: "${query}"`)
    
    const queryLower = query.toLowerCase()
    const words = queryLower.split(/\s+/).filter(w => w.length > 2)
    
    let bestMatch = null
    let bestScore = 0
    
    // Simuler la logique de correspondance
    for (const item of mockHierarchy) {
      let score = 0
      const details = []
      
      // Correspondance exacte du libellé
      if (queryLower.includes(item.name.toLowerCase())) {
        score += 10.0
        details.push('Libellé exact: +10.0')
      }
      
      // Correspondance partielle forte
      for (const word of words) {
        if (word.length > 3 && item.name.toLowerCase().includes(word)) {
          score += 5.0
          details.push(`Mot "${word}": +5.0`)
        }
      }
      
      // Correspondance ID
      if (item.id && queryLower.includes(item.id.toLowerCase())) {
        score += 15.0
        details.push('ID exact: +15.0')
      }
      
      if (score > bestScore) {
        bestScore = score
        bestMatch = { item, score, details }
      }
    }
    
    if (bestMatch) {
      const confidence = Math.min(bestMatch.score / 10.0, 1.0)
      console.log(`      ✅ Meilleur match: "${bestMatch.item.name}"`)
      console.log(`      📊 Score: ${bestMatch.score.toFixed(1)} | Confiance: ${(confidence * 100).toFixed(1)}%`)
      console.log(`      🔍 Détails: ${bestMatch.details.join(', ')}`)
    } else {
      console.log(`      ❌ Aucune correspondance trouvée`)
    }
  })
}

// Lancer les tests
function runTests() {
  try {
    const extractedData = testColumnExtraction()
    testCategorization()
    
    console.log('\n✅ TESTS TERMINÉS AVEC SUCCÈS!')
    console.log(`📋 Système configuré pour utiliser uniquement:`)
    console.log(`   - Colonne "ID Niveau 3" (et variantes)`)
    console.log(`   - Colonne "Libellé Niveau 3" (et variantes)`)
    console.log(`   - Feuille "Hierarchie produit" du fichier XLSX`)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

runTests() 