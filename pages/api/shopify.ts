import { NextApiRequest, NextApiResponse } from 'next'
import { Readable } from 'stream'
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { supabase } from '@/lib/supabase';

const Shopify = require('shopify-api-node');

// Configuration Shopify avec vérification des variables d'environnement
if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET || !process.env.SHOPIFY_SHOP_NAME) {
  console.error('❌ Variables d\'environnement Shopify manquantes:')
  console.error('- SHOPIFY_API_KEY:', !!process.env.SHOPIFY_API_KEY)
  console.error('- SHOPIFY_API_SECRET:', !!process.env.SHOPIFY_API_SECRET)
  console.error('- SHOPIFY_SHOP_NAME:', !!process.env.SHOPIFY_SHOP_NAME)
}

const shopify = new Shopify({
    shopName: 'younzee-prod',
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN!
});

interface ShopifyProduct {
  id: number
  title: string
  handle: string
  product_type: string
  vendor: string
  tags: string
  status: string
  images: Array<{
    id: number
    src: string
    alt: string
  }>
  variants: Array<{
    id: number
    title: string
    price: string
    sku: string
    inventory_quantity: number
    option1: string
    option2: string
    option3: string
  }>
  options: Array<{
    id: number
    name: string
    values: string[],
    position: number
  }>
  description: string
  body_html: string
}

interface FormattedProduct {
  id: string
  name: string
  product_title: string
  handle: string
  category: string
  vendor: string
  status: string
  price: number
  stock: number
  thumbnail_url: string
  images: string[]
  option1: string
  option2?: string
  option3?: string
  others_options1: string[]
  others_options2: string[]
  others_options3: string[]
  variants: Array<{
    id: string
    title: string
    price: number
    sku: string
    stock: number
    option1?: string
    option2?: string
    option3?: string
  }>
  tags: string[]
  description?: string
  availableForSale: boolean
}

interface FormattedProductS3 {
  titre_extrait: string
  couleur: string
  taille: string
  prix: number
  stock?: number
  url: string
  image: string
  description: string
  genre: string
  type: string
  matiere?: string
  marque?: string
  collection?: string
  categorie?: string
  tags?: string[]
}

/**
 * Formate un produit Shopify pour notre application
 */
function formatShopifyProduct(shopifyProduct: ShopifyProduct & { option1?: string; option2?: string; option3?: string }): FormattedProduct {
  const variants = shopifyProduct.variants || []
  const images = shopifyProduct.images || []
  
  // Extraire les tailles et couleurs des variants
  const options1 = [...new Set(variants.map(v => v.option1).filter(Boolean))]
  const options2 = [...new Set(variants.map(v => v.option2).filter(Boolean))]
  const options3 = [...new Set(variants.map(v => v.option3).filter(Boolean))]
  
  // Calculer le prix moyen ou prendre le premier
  const prices = variants.map(v => parseFloat(v.price)).filter(p => !isNaN(p))
  const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
  
  // Calculer le stock total
  const totalStock = variants.reduce((total, variant) => total + (variant.inventory_quantity || 0), 0)
  
  return {
    id: shopifyProduct.id.toString(),
    name: shopifyProduct.title,
    product_title: shopifyProduct.title,
    handle: shopifyProduct.handle,
    category: shopifyProduct.product_type || 'Non classé',
    vendor: shopifyProduct.vendor || '',
    status: shopifyProduct.status,
    price: averagePrice,
    stock: totalStock,
    thumbnail_url: images[0]?.src || '',
    images: images.map(img => img.src),
    option1: shopifyProduct?.options?.findIndex(option => option?.position === 1) > -1 ? 
                shopifyProduct?.options?.find(option => option?.position === 1)?.name + ' : ' + shopifyProduct?.option1 : '',
    option2: shopifyProduct?.options?.findIndex(option => option?.position === 2) > -1 ? 
                shopifyProduct?.options?.find(option => option?.position === 2)?.name + ' : ' + shopifyProduct?.option2 : '',
    option3: shopifyProduct?.options?.findIndex(option => option?.position === 3) > -1 ? 
                shopifyProduct?.options?.find(option => option?.position === 3)?.name + ' : ' + shopifyProduct?.option3 : '',
    others_options1: options1,
    others_options2: options2,
    others_options3: options3,
    variants: variants.map(variant => ({
      id: variant.id.toString(),
      title: variant.title,
      price: parseFloat(variant.price) || 0,
      sku: variant.sku || '',
      stock: variant.inventory_quantity || 0,
      option1: variant.option1,
      option2: variant.option2,
      option3: variant.option3
    })),
    tags: shopifyProduct.tags ? shopifyProduct.tags.split(',').map(tag => tag.trim()) : [],
    description: shopifyProduct?.description ? shopifyProduct?.description : shopifyProduct?.body_html ? shopifyProduct?.body_html : '', // Shopify body_html peut être ajouté si nécessaire
    availableForSale: shopifyProduct.status === 'active' && totalStock > 0
  }
}

/**
 * Convertit les produits en format CSV
 */
function convertProductsToCSV(products: FormattedProduct[]): string {
  if (products.length === 0) return ''

  // Headers CSV
  const headers = [
    'id',
    'product_title',
    'handle',
    'category',
    'vendor',
    'status',
    'price',
    'stock',
    'thumbnail_url',
    'images',
    'others_options1',
    'others_options2',
    'others_options3',
    'option1',
    'option2',
    'option3',
    'tags',
    //'description',
    'availableForSale',
    'variant_count',
    //'variants_details'
  ]

  // Créer les lignes CSV
  const csvRows = [
    headers.join(','), // Ligne d'en-tête
    ...products.map(product => [
      `"${product.id}"`,
      `"${product.product_title.replace(/"/g, '""')}"`, // Échapper les guillemets
      `"${product.handle}"`,
      `"${product.category}"`,
      `"${product.vendor}"`,
      `"${product.status}"`,
      product.price.toString(),
      product.stock.toString(),
      `"${product.thumbnail_url}"`,
      `"${product.images.join(';')}"`, // Séparer par point-virgule
      `"${product.others_options1.join(';')}"`,
      `"${product.others_options2.join(';')}"`,
      `"${product.others_options3.join(';')}"`,
      `"${product.option1}"`,
      `"${product.option2}"`,
      `"${product.option3}"`,
      `"${product.tags.join(';')}"`,
      //`"${(product.description || '').replace(/"/g, '""')}"`,
      product.availableForSale.toString(),
      product.variants.length.toString(),
      //`"${JSON.stringify(product.variants).replace(/"/g, '""')}"` // Variants en JSON échappé
    ].join(','))
  ]

  return csvRows.join('\n')
}

function convertProductsToCSVFormattedS3(products: FormattedProductS3[]): string {
  if (products.length === 0) return ''

  // Headers CSV
  const headers = [
    'titre_extrait',
    'couleur',
    'taille',
    'prix',
    'stock',
    'url',
    'image',
    'description',
    'genre',
    'type',
    'matiere',
    'marque',
    'collection',
    'categorie',
    'tags',
  ]

  // Créer les lignes CSV
  const csvRows = [
    headers.join(','), // Ligne d'en-tête
    ...products.map(product => [
      `"${product.titre_extrait}"`,
      `"${product.couleur}"`,
      `"${product.taille}"`,
      `"${product.prix}"`,
      `"${product.stock}"`,
      `"${product.url}"`,
      `"${product.image}"`,
      `"${product.description}"`,
      `"${product.genre}"`,
      `"${product.type}"`,
      `"${product.matiere}"`,
      `"${product.marque}"`,
      `"${product.collection}"`,
      `"${product.categorie}"`,
      `"${product.tags?.join(';')}"`,
    ].join(','))
  ]

  return csvRows.join('\n')
}

/**
 * Upload le fichier CSV vers AWS S3
 */
async function uploadCSVToS3(csvContent: string, filename: string): Promise<{success: boolean, url?: string, error?: string}> {
  try {
    // Vérifier les variables d'environnement AWS
    const awsConfig = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      bucketName: process.env.AWS_S3_BUCKET_NAME,
      region: process.env.AWS_REGION || 'eu-west-3'
    }

    console.log(`🔧 Configuration AWS S3: région=${awsConfig.region}, bucket=${awsConfig.bucketName}`)

    if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey || !awsConfig.bucketName) {
      console.warn('⚠️ Configuration AWS S3 incomplète - CSV sera seulement généré localement')
      return {
        success: false,
        error: 'Configuration AWS manquante (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME)'
      }
    }

    // Configurer le client S3
    const s3Client = new S3Client({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      },
      forcePathStyle: false, // Utiliser le style d'URL virtuel
      useAccelerateEndpoint: false, // Désactiver l'accélération pour éviter les conflits de région
      maxAttempts: 3, // Nombre de tentatives en cas d'erreur
    });

    // Préparer la commande d'upload
    const putObjectCommand = new PutObjectCommand({
      Bucket: awsConfig.bucketName,
      Key: filename,
      Body: csvContent,
      ContentType: 'text/csv',
      // Supprimer ACL car cela peut causer des problèmes avec KMS
      // ACL: 'public-read' 
    });

    console.log(`☁️ Upload du fichier ${filename} vers le bucket S3 ${awsConfig.bucketName}...`)
    
    // Envoyer la commande
    await s3Client.send(putObjectCommand);

    // Générer une URL signée pour l'accès temporaire (valable 7 jours)
    const getObjectCommand = new GetObjectCommand({
      Bucket: awsConfig.bucketName,
      Key: filename,
    });

    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, { 
      expiresIn: 7 * 24 * 60 * 60 // 7 jours en secondes
    });
    
    console.log(`✅ Upload S3 réussi. URL signée générée (valable 7 jours)`)
    
    return {
      success: true,
      url: signedUrl,
      error: undefined
    }

  } catch (error: any) {
    console.error('❌ Erreur upload S3:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Sauvegarde les produits en CSV local et/ou S3
 */
async function saveProductsAsCSV(products: FormattedProduct[]): Promise<{
  csvGenerated: boolean,
  s3Upload?: {success: boolean, url?: string, error?: string},
  csvContent?: string,
  filename: string,
  stats: {
    productsCount: number,
    variantsCount: number,
    csvSize: number
  }
}> {
  try {
    // Générer le nom de fichier avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `shopify-products-${timestamp}.csv`
    
    console.log(`📄 Génération du CSV: ${filename}`)
    
    // Convertir en CSV
    const csvContent = convertProductsToCSV(products)
    if (!csvContent) {
      return {
        csvGenerated: false,
        filename,
        stats: { productsCount: 0, variantsCount: 0, csvSize: 0 }
      }
    }

    // Statistiques
    const stats = {
      productsCount: products.length,
      variantsCount: products.reduce((total, p) => total + p.variants.length, 0),
      csvSize: Buffer.byteLength(csvContent, 'utf8')
    }

    console.log('📊 Statistiques CSV:', stats)

    // Tentative d'upload vers S3
    const s3Upload = await uploadCSVToS3(csvContent, filename)
    console.log(s3Upload)
    return {
      csvGenerated: true,
      s3Upload,
      csvContent: csvContent,
      filename,
      stats
    }

  } catch (error: any) {
    console.error('❌ Erreur génération CSV:', error)
    return {
      csvGenerated: false,
      filename: '',
      stats: { productsCount: 0, variantsCount: 0, csvSize: 0 }
    }
  }
}

/**
 * Teste la connexion Shopify
 */
async function testShopifyConnection(): Promise<{success: boolean, error?: string, shopInfo?: any}> {
  try {
    // Test simple avec les informations de la boutique
    const shop = await shopify.shop.get()
    console.log('✅ Connexion Shopify réussie:', shop.name)
    return { 
      success: true, 
      shopInfo: {
        name: shop.name,
        domain: shop.domain,
        email: shop.email,
        plan: shop.plan_name
      }
    }
  } catch (error: any) {
    console.error('❌ Test connexion Shopify échoué:', error.message)
    return { 
      success: false, 
      error: error.message || 'Erreur de connexion inconnue'
    }
  }
}

/**
 * Récupère tous les produits avec pagination
 */
async function getAllProducts(limit: number = 250): Promise<FormattedProduct[]> {
  try {
    let allProducts: ShopifyProduct[] = []
    let hasNextPage = true
    let sinceId = 0

    while (hasNextPage) {
      console.log(`📦 Récupération des produits depuis ID: ${sinceId}`)
      
      const products = await shopify.product.list({
        limit: limit,
        since_id: sinceId,
        fields: 'id,title,description,body_html,handle,product_type,vendor,tags,status,images,variants,options'
      }) as ShopifyProduct[]
      console.log(products[0], 'productsDWD')
      if (products.length === 0) {
        hasNextPage = false
      } else {
        allProducts = allProducts.concat(products)
        sinceId = products[products.length - 1].id
        hasNextPage = products.length === limit
        console.log(products[0], 'products')
        console.log(`📦 ${products.length} produits récupérés (Total: ${allProducts.length})`)
        
        // Pause pour éviter les limites de taux
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    console.log(`✅ Total final: ${allProducts.length} produits Shopify récupérés`)
    let arr: (ShopifyProduct & { option1?: string; option2?: string; option3?: string })[] = []
    const preFormattedProducts = allProducts.forEach(item => {
      item.variants.forEach(variant => {
        arr.push({
          ...item,
          option1: variant.option1,
          option2: variant.option2,
          option3: variant.option3,
        })
      })
    })
    // Formater tous les produits
    const formattedProducts = arr.map(formatShopifyProduct)
    
    return formattedProducts
  } catch (error) {
    console.error('❌ Erreur récupération produits Shopify:', error)
    throw error
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  // Vérification des variables d'environnement
  const requiredEnvVars = {
    SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
    SHOPIFY_SHOP_NAME: process.env.SHOPIFY_SHOP_NAME
  }

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key)

  if (missingVars.length > 0) {
    console.error('❌ Variables d\'environnement manquantes:', missingVars)
    return res.status(500).json({
      success: false,
      error: 'Configuration Shopify incomplète',
      details: `Variables manquantes: ${missingVars.join(', ')}`,
      required: 'Ajoutez SHOPIFY_API_KEY, SHOPIFY_API_SECRET, et SHOPIFY_SHOP_NAME dans .env.local'
    })
  }

  try {
    console.log('🚀 Début récupération produits Shopify...')
    console.log('🔧 Configuration:', {
      shopName: process.env.SHOPIFY_SHOP_NAME,
      hasApiKey: !!process.env.SHOPIFY_API_KEY,
      hasApiSecret: !!process.env.SHOPIFY_API_SECRET
    })

    // Test de connexion d'abord
    console.log('🔍 Test de connexion Shopify...')
    const connectionTest = await testShopifyConnection()
    
    if (!connectionTest.success) {
      return res.status(401).json({
        success: false,
        error: 'Échec de l\'authentification Shopify',
        details: connectionTest.error,
        suggestions: [
          'Vérifiez vos clés API Shopify dans .env.local',
          'Assurez-vous que le nom de boutique est correct',
          'Vérifiez que votre app a les permissions nécessaires',
          'Format attendu: SHOPIFY_SHOP_NAME=votre-boutique (sans .myshopify.com)'
        ]
      })
    }

    console.log('✅ Connexion Shopify validée, récupération des produits...')
    
    const startTime = Date.now()
    const products = await getAllProducts()
    const endTime = Date.now()
    
    const stats = {
      totalProducts: products.length,
      totalVariants: products.reduce((total, p) => total + p.variants.length, 0),
      totalStock: products.reduce((total, p) => total + p.stock, 0),
      activeProducts: products.filter(p => p.status === 'active').length,
      averagePrice: products.length > 0 
        ? products.reduce((total, p) => total + p.price, 0) / products.length 
        : 0,
      processingTime: endTime - startTime
    }

    console.log('📊 Statistiques:', stats)

    // 💾 Sauvegarde automatique en CSV + S3
    console.log('💾 Sauvegarde automatique en CSV...')
    const csvResult = await saveProductsAsCSV(products)
    
    const response: any = {
      success: true,
      data: products,
      stats: stats,
      message: `${products.length} produits récupérés avec succès`,
      csv: {
        generated: csvResult.csvGenerated,
        filename: csvResult.filename,
        stats: csvResult.stats
      }
    }

    // Ajouter les infos S3 si disponibles
    if (csvResult.s3Upload) {
      response.csv.s3Upload = csvResult.s3Upload
      if (csvResult.s3Upload.success) {
        console.log('✅ CSV sauvegardé vers S3 avec succès')
        response.csv.s3Url = csvResult.s3Upload.url
      } else {
        console.log('⚠️ Upload S3 non disponible:', csvResult.s3Upload.error)
      }
    }

    // Ajouter le contenu CSV pour téléchargement si généré
    if (csvResult.csvGenerated && csvResult.csvContent) {
      response.csv.downloadUrl = csvResult.s3Upload?.url
      console.log(`✅ CSV généré: ${csvResult.filename} (${csvResult.stats.csvSize} bytes)`)
    }
    // Sauvegarder dans Supabase
    if (supabase) {
      await supabase?.from('importations').insert({
        doc_url: "https://eu-west-3.console.aws.amazon.com/s3/object/younzee?region=eu-west-3&bucketType=general&prefix=" + csvResult.filename,
        created_at: new Date().toISOString(),
        filename: csvResult.filename,
        access_token: process.env.SHOPIFY_ACCESS_TOKEN,
      })
    }

    // 🔄 Mise à jour automatique du RAG S3 après upload réussi
    if (csvResult.s3Upload?.success) {
      try {
        console.log('🔄 Déclenchement mise à jour RAG S3...')
        const { s3RagService } = await import('@/lib/langchain/services/rag-s3.service')
        
        // Déclencher le rafraîchissement en arrière-plan
        setTimeout(async () => {
          try {
            const refreshed = await s3RagService.refreshFromS3()
            console.log(refreshed ? '✅ RAG S3 mis à jour avec succès' : '⚠️ RAG S3 déjà à jour')
          } catch (error) {
            console.error('❌ Erreur mise à jour RAG S3:', error)
          }
        }, 5000) // Attendre 5 secondes pour que l'upload S3 soit complètement propagé
        
        response.ragUpdate = {
          triggered: true,
          message: 'Mise à jour RAG S3 déclenchée en arrière-plan'
        }
      } catch (error) {
        console.error('❌ Erreur déclenchement RAG S3:', error)
        response.ragUpdate = {
          triggered: false,
          error: 'Erreur lors du déclenchement de la mise à jour RAG'
        }
      }
    }
    
    return res.status(200).json(response)

  } catch (error: any) {
    console.error('❌ Erreur API Shopify:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des produits Shopify',
      details: error.message || 'Erreur inconnue'
    })
  }
}