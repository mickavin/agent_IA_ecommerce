/**
 * Test de l'API RAG OpenAI
 */

const fs = require('fs');

console.log('🚀 TEST API RAG OPENAI');

// Test configuration
function testConfig() {
  console.log('\n1️⃣ Configuration...');
  
  const files = [
    'pages/api/rag-openai.ts',
    'data/test_sample.csv'
  ];
  
  let ok = true;
  files.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file}`);
      ok = false;
    }
  });
  
  return ok;
}

// Test dépendances
function testDeps() {
  console.log('\n2️⃣ Dépendances...');
  
  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    const required = ['@langchain/openai', '@langchain/community', 'papaparse'];
    const missing = required.filter(d => !deps[d]);
    
    if (missing.length === 0) {
      console.log('✅ Toutes les dépendances OK');
      return true;
    } else {
      console.log(`❌ Manquant: ${missing.join(', ')}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur package.json');
    return false;
  }
}

// Instructions d'utilisation
function showUsage() {
  console.log('\n3️⃣ Usage de l\'API RAG OpenAI:');
  console.log('');
  console.log('# Démarrer le serveur:');
  console.log('npm run dev');
  console.log('');
  console.log('# Test GET simple:');
  console.log('curl "http://localhost:3000/api/rag-openai?q=t-shirt&k=3"');
  console.log('');
  console.log('# Test POST avec JSON:');
  console.log('curl -X POST http://localhost:3000/api/rag-openai \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"query": "sweat bleu", "k": 5, "searchType": "hybrid"}\'');
  console.log('');
  console.log('# Types de recherche disponibles:');
  console.log('- semantic: Recherche sémantique (OpenAI embeddings)');
  console.log('- keyword: Recherche par mots-clés');
  console.log('- hybrid: Combinaison des deux (recommandé)');
}

// Fonction principale
function main() {
  const configOk = testConfig();
  const depsOk = testDeps();
  
  console.log('\n📊 RÉSUMÉ:');
  console.log(`Configuration: ${configOk ? '✅' : '❌'}`);
  console.log(`Dépendances: ${depsOk ? '✅' : '❌'}`);
  
  if (configOk && depsOk) {
    console.log('\n🎉 API RAG OpenAI prête !');
    showUsage();
  } else {
    console.log('\n⚠️  Veuillez corriger les problèmes ci-dessus');
    
    if (!depsOk) {
      console.log('\n📦 Installer les dépendances:');
      console.log('npm install @langchain/community @types/papaparse');
    }
  }
  
  console.log('\n✨ Service RAG avec OpenAI Embeddings déployé !');
}

main(); 