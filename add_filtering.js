
// Script pour ajouter le filtrage par categories dans parseCSV
const fs = require('fs');
let content = fs.readFileSync('pages/api/rag-openai.ts', 'utf8');

// Ajouter filteredByReferential manquant
content = content.replace(
  'availableForSale: false,',
  'availableForSale: false,\n            filteredByReferential: false,'
);

// Ajouter le filtrage par categories dans parseCSV
const filteringCode = \
                // ✅ FILTRAGE PAR CATÉGORIE DU RÉFÉRENTIEL
                if (relevantCategories && relevantCategories.length > 0) {
                  const hasMatchingCategory = relevantCategories.some(relevantCat => {
                    const catLower = category.toLowerCase()
                    const refLower = relevantCat.toLowerCase()
                    
                    // Correspondance bidirectionnelle pour flexibilité
                    return catLower.includes(refLower) || refLower.includes(catLower)
                  })
                  
                  if (!hasMatchingCategory) {
                    console.log(\\\🚫 Produit filtré: \\\
\\\\\\ (catégorie: \\\\\\\\\)\\\)
                    return null // Exclure ce produit
                  }
                }
                \;

content = content.replace(
  'const category = row.type_produit_classifié || \\'Non classifié\\'',
  'const category = row.type_produit_classifié || \\'Non classifié\\'\n' + filteringCode
);

fs.writeFileSync('pages/api/rag-openai.ts', content);
console.log('Filtrage par categories ajoute dans parseCSV');

