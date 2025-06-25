/**
 * Exemple d'utilisation de l'API RAG OpenAI
 * Fichier: examples/rag-openai-usage.js
 */

// Test 1: Recherche sémantique simple
async function testSemanticSearch() {
  const response = await fetch('http://localhost:3000/api/rag-openai?q=t-shirt%20violet&k=5&type=semantic');
  const data = await response.json();
  
  console.log('🔍 Recherche sémantique:', data);
  return data;
}

// Test 2: Recherche hybride avec POST
async function testHybridSearch() {
  const response = await fetch('http://localhost:3000/api/rag-openai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: 'sweat bleu confortable',
      k: 3,
      searchType: 'hybrid'
    })
  });
  
  const data = await response.json();
  console.log('🔍 Recherche hybride:', data);
  return data;
}

// Test 3: Recherche avec filtres
async function testSearchWithFilters() {
  const response = await fetch('http://localhost:3000/api/rag-openai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: 'vêtement',
      k: 10,
      searchType: 'semantic',
      filters: {
        maxPrice: 80,
        availableOnly: true
      }
    })
  });
  
  const data = await response.json();
  console.log('🔍 Recherche avec filtres:', data);
  return data;
}

// Test 4: Gestion des erreurs
async function testErrorHandling() {
  try {
    const response = await fetch('http://localhost:3000/api/rag-openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: '',
        k: -1,
        searchType: 'invalid'
      })
    });
    
    const data = await response.json();
    console.log('🔍 Test gestion erreurs:', data);
    return data;
  } catch (error) {
    console.log('❌ Erreur attendue:', error.message);
  }
}

// Exécution des tests
async function runAllTests() {
  console.log('🧪 TESTS API RAG OPENAI');
  console.log('========================');
  
  await testSemanticSearch();
  await testHybridSearch();
  await testSearchWithFilters();
  await testErrorHandling();
  
  console.log('✅ Tests terminés');
}

// Pour Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testSemanticSearch,
    testHybridSearch,
    testSearchWithFilters,
    testErrorHandling,
    runAllTests
  };
}

// Pour le navigateur
if (typeof window !== 'undefined') {
  window.RAGTests = {
    testSemanticSearch,
    testHybridSearch,
    testSearchWithFilters,
    testErrorHandling,
    runAllTests
  };
}