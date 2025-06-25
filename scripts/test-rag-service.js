/**
 * Script de test pour le service RAG Core
 * Usage: node scripts/test-rag-service.js
 */

const fs = require('fs');
const path = require('path');

// Vérification des dépendances
function checkDependencies() {
  console.log('🔍 Vérification des dépendances RAG...');
  
  const requiredPackages = [
    '@langchain/core',
    '@langchain/openai', 
    '@langchain/community',
    'papaparse'
  ];
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  let missingPackages = [];
  
  for (const pkg of requiredPackages) {
    if (!dependencies[pkg]) {
      missingPackages.push(pkg);
    } else {
      console.log(`✅ ${pkg}: ${dependencies[pkg]}`);
    }
  }
  
  if (missingPackages.length > 0) {
    console.log('\n❌ Packages manquants:');
    missingPackages.forEach(pkg => console.log(`  - ${pkg}`));
    console.log('\n📦 Installation requise:');
    console.log(`npm install ${missingPackages.join(' ')}`);
    return false;
  }
  
  return true;
}

// Vérification des fichiers CSV
function checkCSVFiles() {
  console.log('\n📋 Vérification des fichiers CSV...');
  
  const csvFiles = [
    'files/produits_final.csv',
    'data/set_chatbot.csv',
    'data/test_sample.csv'
  ];
  
  let foundFiles = [];
  
  for (const file of csvFiles) {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`✅ ${file}: ${sizeInMB} MB`);
      foundFiles.push(file);
    } else {
      console.log(`❌ ${file}: Non trouvé`);
    }
  }
  
  return foundFiles;
}

// Vérification de la clé API OpenAI
function checkOpenAIKey() {
  console.log('\n🔑 Vérification de la clé API OpenAI...');
  
  // Charger le fichier .env.local
  const envFiles = ['.env.local', '.env'];
  let hasKey = false;
  
  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');
      if (envContent.includes('OPENAI_API_KEY=')) {
        console.log(`✅ Clé API trouvée dans ${envFile}`);
        hasKey = true;
        break;
      }
    }
  }
  
  if (!hasKey) {
    console.log('❌ Clé API OpenAI non trouvée');
    console.log('💡 Ajoutez OPENAI_API_KEY=your_key_here dans .env.local');
  }
  
  return hasKey;
}

// Création de la structure de test RAG
function createRAGStructure() {
  console.log('\n🏗️  Création de la structure RAG...');
  
  // Créer le dossier services s'il n'existe pas
  const servicesDir = 'lib/langchain/services';
  if (!fs.existsSync(servicesDir)) {
    fs.mkdirSync(servicesDir, { recursive: true });
    console.log(`✅ Dossier créé: ${servicesDir}`);
  }
  
  // Créer le fichier de configuration RAG
  const configPath = path.join(servicesDir, 'rag.config.ts');
  const configContent = `
export interface RAGConfig {
  csvFiles: string[]
  embeddingModel: 'text-embedding-3-small' | 'text-embedding-ada-002'
  chunkSize: number
  overlapSize: number
  confidenceThreshold: number
  cacheEnabled: boolean
  maxResults: number
}

export const defaultRAGConfig: RAGConfig = {
  csvFiles: ['files/produits_final.csv', 'data/set_chatbot.csv'],
  embeddingModel: 'text-embedding-3-small',
  chunkSize: 500,
  overlapSize: 50,
  confidenceThreshold: 0.7,
  cacheEnabled: true,
  maxResults: 10
}
`;
  
  fs.writeFileSync(configPath, configContent);
  console.log(`✅ Configuration RAG créée: ${configPath}`);
}

// Test CSV parsing
function testCSVParsing() {
  console.log('\n🧪 Test de parsing CSV...');
  
  const testFile = 'data/test_sample.csv';
  if (!fs.existsSync(testFile)) {
    console.log('❌ Fichier de test non trouvé');
    return false;
  }
  
  try {
    const Papa = require('papaparse');
    const csvContent = fs.readFileSync(testFile, 'utf8');
    
    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true
    });
    
    console.log(`✅ CSV parsé: ${result.data.length} lignes`);
    console.log(`📊 Colonnes: ${Object.keys(result.data[0] || {}).join(', ')}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Erreur parsing CSV: ${error.message}`);
    return false;
  }
}

// Création d'un service RAG simple pour test
function createSimpleRAGService() {
  console.log('\n🔧 Création du service RAG de test...');
  
  const serviceContent = `
import Papa from 'papaparse'
import * as fs from 'fs'

interface ProductData {
  title: string
  description: string
  price: number
  category: string
  colors: string[]
  sizes: string[]
}

export class SimpleRAGService {
  private products: ProductData[] = []
  
  async loadCSV(filePath: string): Promise<void> {
    try {
      const csvContent = fs.readFileSync(filePath, 'utf8')
      const result = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true
      })
      
      this.products = result.data.map((row: any) => ({
        title: row.product_title || row.title || 'Sans titre',
        description: row.description || '',
        price: parseFloat(row.price) || 0,
        category: row.type_produit_classifié || 'Non classifié',
        colors: this.extractArray(row.couleur || row.colors),
        sizes: this.extractArray(row.taille || row.sizes)
      }))
      
      console.log(\`✅ \${this.products.length} produits chargés\`)
    } catch (error) {
      console.error('❌ Erreur chargement CSV:', error)
      throw error
    }
  }
  
  private extractArray(value: any): string[] {
    if (!value) return []
    if (Array.isArray(value)) return value
    return String(value).split(/[,;]\\s*/).filter(v => v.trim())
  }
  
  search(query: string, limit: number = 5): ProductData[] {
    const queryLower = query.toLowerCase()
    return this.products
      .filter(product => 
        product.title.toLowerCase().includes(queryLower) ||
        product.description.toLowerCase().includes(queryLower) ||
        product.category.toLowerCase().includes(queryLower)
      )
      .slice(0, limit)
  }
  
  getStats() {
    return {
      totalProducts: this.products.length,
      categories: [...new Set(this.products.map(p => p.category))],
      priceRange: {
        min: Math.min(...this.products.map(p => p.price)),
        max: Math.max(...this.products.map(p => p.price))
      }
    }
  }
}
`;
  
  const servicePath = 'lib/langchain/services/simple-rag.service.ts';
  fs.writeFileSync(servicePath, serviceContent);
  console.log(`✅ Service RAG simple créé: ${servicePath}`);
}

// Fonction principale
async function main() {
  console.log('🚀 Test du Service RAG Core\n');
  
  // Vérifications préliminaires
  const hasDependencies = checkDependencies();
  const csvFiles = checkCSVFiles();
  const hasOpenAIKey = checkOpenAIKey();
  
  // Création de la structure
  createRAGStructure();
  createSimpleRAGService();
  
  // Test CSV parsing
  const csvParsingOK = testCSVParsing();
  
  // Résumé
  console.log('\n📊 RÉSUMÉ DU TEST RAG');
  console.log('='.repeat(40));
  console.log(`Dependencies: ${hasDependencies ? '✅' : '❌'}`);
  console.log(`CSV Files: ${csvFiles.length > 0 ? '✅' : '❌'} (${csvFiles.length} trouvés)`);
  console.log(`OpenAI Key: ${hasOpenAIKey ? '✅' : '❌'}`);
  console.log(`CSV Parsing: ${csvParsingOK ? '✅' : '❌'}`);
  
  // Recommandations
  console.log('\n🎯 PROCHAINES ÉTAPES');
  console.log('-'.repeat(20));
  
  if (!hasDependencies) {
    console.log('1. Installer les dépendances manquantes');
  }
  
  if (!hasOpenAIKey) {
    console.log('2. Configurer la clé API OpenAI');
  }
  
  if (csvFiles.length > 0) {
    console.log('3. Tester le service RAG simple avec:');
    console.log('   node -e "const { SimpleRAGService } = require(\'./lib/langchain/services/simple-rag.service.ts\'); console.log(\'RAG Test\')"');
  }
  
  console.log('4. Implémenter le service RAG complet avec embeddings');
  console.log('5. Intégrer avec les agents LangChain existants');
  
  console.log('\n🎉 Test terminé !');
}

// Exécution
main().catch(console.error); 