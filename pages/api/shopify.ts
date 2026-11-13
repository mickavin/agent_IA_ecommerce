import { NextApiRequest, NextApiResponse } from 'next'
import { Readable } from 'stream'
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { supabase } from '@/lib/supabase';
import { ShopifyConfigService } from '@/lib/services/shopify-config.service';

const Shopify = require('shopify-api-node');

/**
 * Récupère la configuration Shopify active
 */
async function getShopifyConfig() {
  // Essayer d'abord de récupérer depuis Supabase
  const config = await ShopifyConfigService.getActiveConfig()
  
  if (config) {
    console.log('✅ Configuration Shopify chargée depuis Supabase:', config.shop_name)
    return {
      shopName: config.shop_name,
      accessToken: config.access_token,
      apiKey: config.api_key,
      apiSecret: config.api_secret
    }
  }

  // Fallback vers les variables d'environnement pour compatibilité
  console.warn('⚠️ Aucune configuration Shopify active trouvée, utilisation des variables d\'environnement')
  
  if (!process.env.SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Configuration Shopify manquante: aucune configuration active dans Supabase et SHOPIFY_ACCESS_TOKEN non défini')
  }

  return {
    shopName: process.env.SHOPIFY_SHOP_NAME || 'younzee-prod',
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecret: process.env.SHOPIFY_API_SECRET
  }
}

/**
 * Crée une instance Shopify avec la configuration
 */
async function createShopifyClient() {
  const config = await getShopifyConfig()
  
  return new Shopify({
    shopName: config.shopName,
    accessToken: config.accessToken
  })
}

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
 * Nettoie et valide une chaîne de caractères pour éviter les erreurs de parsing CSV
 */
function sanitizeString(value: any): string {
  if (value === null || value === undefined) return ''
  
  const str = String(value)
  // Supprimer les caractères de contrôle et les retours à la ligne problématiques
  return str
    .replace(/[\r\n\t]/g, ' ')  // Remplacer les retours à la ligne par des espaces
    .replace(/"/g, '""')        // Échapper les guillemets
    .replace(/\x00-\x1F/g, '')  // Supprimer les caractères de contrôle
    .trim()
}

/**
 * Valide et nettoie un nombre
 */
function sanitizeNumber(value: any): number {
  if (value === null || value === undefined || value === '') return 0
  const num = parseFloat(String(value))
  return isNaN(num) ? 0 : num
}

/**
 * Valide et nettoie un tableau de chaînes
 */
function sanitizeStringArray(value: any[]): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(item => item !== null && item !== undefined)
    .map(item => sanitizeString(item))
    .filter(item => item.length > 0)
}

/**
 * Formate un produit Shopify pour notre application avec gestion d'erreurs robuste
 */
function formatShopifyProduct(shopifyProduct: ShopifyProduct & { option1?: string; option2?: string; option3?: string }): FormattedProduct | null {
  try {
    // Validation des données essentielles
    if (!shopifyProduct || !shopifyProduct.id) {
      console.warn('⚠️ Produit ignoré: ID manquant', shopifyProduct)
      return null
    }

    const variants = Array.isArray(shopifyProduct.variants) ? shopifyProduct.variants : []
    const images = Array.isArray(shopifyProduct.images) ? shopifyProduct.images : []
    
    // Extraire les tailles et couleurs des variants avec validation
    const options1 = sanitizeStringArray(variants.map(v => v?.option1).filter(Boolean))
    const options2 = sanitizeStringArray(variants.map(v => v?.option2).filter(Boolean))
    const options3 = sanitizeStringArray(variants.map(v => v?.option3).filter(Boolean))
    
    // Calculer le prix moyen avec validation
    const prices = variants
      .map(v => sanitizeNumber(v?.price))
      .filter(p => p > 0)
    const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
    
    // Calculer le stock total avec validation
    const totalStock = variants.reduce((total, variant) => {
      return total + sanitizeNumber(variant?.inventory_quantity)
    }, 0)

    // Gestion sécurisée des options
    const getOptionName = (position: number): string => {
      try {
        const option = shopifyProduct?.options?.find(opt => opt?.position === position)
        const optionValue = position === 1 ? shopifyProduct?.option1 : 
                           position === 2 ? shopifyProduct?.option2 : 
                           shopifyProduct?.option3
        
        if (option?.name && optionValue) {
          return `${sanitizeString(option.name)} : ${sanitizeString(optionValue)}`
        }
        return ''
      } catch (error) {
        console.warn(`⚠️ Erreur lors de l'extraction de l'option ${position}:`, error)
        return ''
      }
    }

    // Gestion sécurisée des tags
    let tags: string[] = []
    try {
      if (shopifyProduct.tags) {
        if (typeof shopifyProduct.tags === 'string') {
          tags = shopifyProduct.tags.split(',').map(tag => sanitizeString(tag)).filter(tag => tag.length > 0)
        } else if (Array.isArray(shopifyProduct.tags)) {
          tags = sanitizeStringArray(shopifyProduct.tags)
        }
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors du parsing des tags:', error)
      tags = []
    }

    // Gestion sécurisée de la description
    let description = ''
    try {
      description = shopifyProduct?.description ? 
        sanitizeString(shopifyProduct.description) : 
        shopifyProduct?.body_html ? 
          sanitizeString(shopifyProduct.body_html.replace(/<[^>]*>/g, '')) : // Supprimer les balises HTML
          ''
    } catch (error) {
      console.warn('⚠️ Erreur lors du parsing de la description:', error)
      description = ''
    }
    
    return {
      id: sanitizeString(shopifyProduct.id),
      name: sanitizeString(shopifyProduct.title) || 'Produit sans nom',
      product_title: sanitizeString(shopifyProduct.title) || 'Produit sans nom',
      handle: sanitizeString(shopifyProduct.handle) || '',
      category: sanitizeString(shopifyProduct.product_type) || 'Non classé',
      vendor: sanitizeString(shopifyProduct.vendor) || '',
      status: sanitizeString(shopifyProduct.status) || 'unknown',
      price: averagePrice,
      stock: totalStock,
      thumbnail_url: sanitizeString(images[0]?.src) || '',
      images: sanitizeStringArray(images.map(img => img?.src).filter(Boolean)),
      option1: getOptionName(1),
      option2: getOptionName(2),
      option3: getOptionName(3),
      others_options1: [...new Set(options1)],
      others_options2: [...new Set(options2)],
      others_options3: [...new Set(options3)],
      variants: variants.map(variant => {
        try {
          return {
            id: sanitizeString(variant?.id) || '',
            title: sanitizeString(variant?.title) || '',
            price: sanitizeNumber(variant?.price),
            sku: sanitizeString(variant?.sku) || '',
            stock: sanitizeNumber(variant?.inventory_quantity),
            option1: sanitizeString(variant?.option1) || '',
            option2: sanitizeString(variant?.option2) || '',
            option3: sanitizeString(variant?.option3) || ''
          }
        } catch (error) {
          console.warn('⚠️ Erreur lors du formatage d\'un variant:', error)
          return {
            id: '', title: '', price: 0, sku: '', stock: 0,
            option1: '', option2: '', option3: ''
          }
        }
      }),
      tags,
      description,
      availableForSale: shopifyProduct.status === 'active' && totalStock > 0
    }
  } catch (error) {
    console.error('❌ Erreur lors du formatage du produit:', error, shopifyProduct)
    return null
  }
}

/**
 * Formate une valeur pour CSV avec échappement complet
 */
function formatCSVField(value: any): string {
  if (value === null || value === undefined) return '""'
  
  let str = String(value)
  
  // Nettoyer les caractères problématiques
  str = str
    .replace(/[\r\n]/g, ' ')    // Remplacer les retours à la ligne
    .replace(/\t/g, ' ')        // Remplacer les tabulations
    .replace(/"/g, '""')        // Échapper les guillemets
    .trim()
  
  // Toujours entourer de guillemets pour éviter les problèmes
  return `"${str}"`
}

/**
 * Formate un tableau pour CSV
 */
function formatCSVArray(arr: string[], separator: string = ';'): string {
  if (!Array.isArray(arr) || arr.length === 0) return '""'
  
  const cleanedArray = arr
    .filter(item => item !== null && item !== undefined && item !== '')
    .map(item => String(item).replace(/[;\r\n\t]/g, ' ').trim())
    .filter(item => item.length > 0)
  
  return `"${cleanedArray.join(separator)}"`
}

/**
 * Valide qu'une ligne CSV est bien formée
 */
function validateCSVLine(line: string, expectedFieldCount: number): boolean {
  if (!line || typeof line !== 'string') return false
  
  // Compter les champs en tenant compte des guillemets
  let fieldCount = 0
  let inQuotes = false
  let prevChar = ''
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"' && prevChar !== '\\') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      fieldCount++
    }
    
    prevChar = char
  }
  
  fieldCount++ // Ajouter le dernier champ
  
  const isValid = fieldCount === expectedFieldCount
  if (!isValid) {
    console.warn(`⚠️ Ligne CSV invalide: ${fieldCount} champs trouvés, ${expectedFieldCount} attendus`)
    console.warn(`Ligne: ${line.substring(0, 200)}...`)
  }
  
  return isValid
}

/**
 * Convertit les produits en format CSV avec validation robuste
 */
async function convertProductsToCSV(products: FormattedProduct[]): Promise<string> {
  if (products.length === 0) {
    console.warn('⚠️ Aucun produit à convertir en CSV')
    return ''
  }

  console.log(`📄 Début conversion CSV pour ${products.length} produits`)

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
    'availableForSale',
    'variant_count',
    'url'
  ]

  const headerLine = headers.join(',')
  const csvRows = [headerLine]
  let validRows = 0
  let invalidRows = 0

  // Traiter chaque produit avec gestion d'erreur individuelle
  products.forEach((product, index) => {
    try {
      const fields = [
        formatCSVField(product.id),
        formatCSVField(product.product_title),
        formatCSVField(product.handle),
        formatCSVField(product.category),
        formatCSVField(product.vendor),
        formatCSVField(product.status),
        formatCSVField(product.price),
        formatCSVField(product.stock),
        formatCSVField(product.thumbnail_url),
        formatCSVArray(product.images),
        formatCSVArray(product.others_options1),
        formatCSVArray(product.others_options2),
        formatCSVArray(product.others_options3),
        formatCSVField(product.option1),
        formatCSVField(product.option2),
        formatCSVField(product.option3),
        formatCSVArray(product.tags),
        formatCSVField(product.availableForSale),
        formatCSVField(product.variants.length),
        formatCSVField(`https://${shopName}.myshopify.com/products/${product.handle}`)
      ]

      const csvLine = fields.join(',')
      
      // Valider la ligne avant de l'ajouter
      if (validateCSVLine(csvLine, headers.length)) {
        csvRows.push(csvLine)
        validRows++
      } else {
        console.error(`❌ Ligne CSV invalide pour le produit ${product.id} (index ${index})`)
        console.error(`Produit problématique:`, {
          id: product.id,
          title: product.product_title?.substring(0, 50),
          fieldsCount: fields.length
        })
        invalidRows++
        
        // Ajouter une ligne de remplacement sécurisée
        const safeFields = [
          formatCSVField(product.id || 'unknown'),
          formatCSVField('Produit avec erreur de formatage'),
          formatCSVField(product.handle || ''),
          formatCSVField('Erreur'),
          formatCSVField(''),
          formatCSVField('error'),
          formatCSVField(0),
          formatCSVField(0),
          formatCSVField(''),
          formatCSVField(''),
          formatCSVField(''),
          formatCSVField(''),
          formatCSVField(''),
          formatCSVField(''),
          formatCSVField(''),
          formatCSVField(''),
          formatCSVField(''),
          formatCSVField(false),
          formatCSVField(0),
          formatCSVField('')
        ]
        csvRows.push(safeFields.join(','))
      }
    } catch (error) {
      console.error(`❌ Erreur lors du formatage du produit ${product.id}:`, error)
      invalidRows++
      
      // Ligne de remplacement en cas d'erreur complète
      const errorFields = new Array(headers.length).fill('""')
      errorFields[0] = formatCSVField(product.id || 'error')
      errorFields[1] = formatCSVField('Erreur de traitement')
      csvRows.push(errorFields.join(','))
    }
  })

  console.log(`✅ Conversion CSV terminée: ${validRows} lignes valides, ${invalidRows} lignes avec erreurs`)

  const result = csvRows.join('\n')
  
  // Validation finale du CSV complet
  const lines = result.split('\n')
  const expectedFieldCount = headers.length
  let totalValidLines = 0
  
  lines.forEach((line, index) => {
    if (index === 0) return // Skip header
    if (validateCSVLine(line, expectedFieldCount)) {
      totalValidLines++
    }
  })
  
  console.log(`📊 Validation finale CSV: ${totalValidLines}/${lines.length - 1} lignes valides`)
  
  return result
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
      `https://[yourstore].myshopify.com/products/`,
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
 * Sauvegarde les produits en CSV local et/ou S3 avec validation robuste
 */
async function saveProductsAsCSV(products: FormattedProduct[]): Promise<{
  csvGenerated: boolean,
  s3Upload?: {success: boolean, url?: string, error?: string},
  csvContent?: string,
  filename: string,
  stats: {
    productsCount: number,
    variantsCount: number,
    csvSize: number,
    validLines?: number,
    invalidLines?: number
  },
  validationErrors?: string[]
}> {
  const validationErrors: string[] = []
  
  try {
    if (!products || products.length === 0) {
      const error = 'Aucun produit à sauvegarder'
      console.warn(`⚠️ ${error}`)
      validationErrors.push(error)
      return {
        csvGenerated: false,
        filename: '',
        stats: { productsCount: 0, variantsCount: 0, csvSize: 0 },
        validationErrors
      }
    }

    // Générer le nom de fichier avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `shopify-products-${timestamp}.csv`
    
    console.log(`📄 Génération du CSV: ${filename} pour ${products.length} produits`)
    
    // Pré-validation des produits
    const validProducts = products.filter(product => {
      if (!product || !product.id) {
        validationErrors.push(`Produit sans ID ignoré: ${JSON.stringify(product).substring(0, 100)}`)
        return false
      }
      if (!product.product_title || product.product_title.trim() === '') {
        validationErrors.push(`Produit ${product.id} sans titre ignoré`)
        return false
      }
      return true
    })

    if (validProducts.length !== products.length) {
      const ignoredCount = products.length - validProducts.length
      console.warn(`⚠️ ${ignoredCount} produits ignorés lors de la pré-validation`)
    }

    // Convertir en CSV avec validation
    const csvContent = await convertProductsToCSV(validProducts)
    if (!csvContent || csvContent.trim() === '') {
      const error = 'Échec de la génération du contenu CSV'
      console.error(`❌ ${error}`)
      validationErrors.push(error)
      return {
        csvGenerated: false,
        filename,
        stats: { productsCount: products.length, variantsCount: 0, csvSize: 0 },
        validationErrors
      }
    }

    // Validation finale du CSV généré
    const csvLines = csvContent.split('\n').filter(line => line.trim() !== '')
    const dataLines = csvLines.slice(1) // Exclure l'en-tête
    
    if (csvLines.length < 2) {
      const error = 'CSV généré ne contient pas de données valides'
      console.error(`❌ ${error}`)
      validationErrors.push(error)
      return {
        csvGenerated: false,
        filename,
        stats: { productsCount: products.length, variantsCount: 0, csvSize: 0 },
        validationErrors
      }
    }

    // Statistiques détaillées
    const stats = {
      productsCount: validProducts.length,
      variantsCount: validProducts.reduce((total, p) => total + (p.variants?.length || 0), 0),
      csvSize: Buffer.byteLength(csvContent, 'utf8'),
      validLines: dataLines.length,
      invalidLines: validationErrors.length
    }

    console.log('📊 Statistiques CSV détaillées:', {
      ...stats,
      csvSizeKB: Math.round(stats.csvSize / 1024),
      averageVariantsPerProduct: Math.round(stats.variantsCount / stats.productsCount * 100) / 100
    })

    // Tentative d'upload vers S3 avec gestion d'erreurs
    let s3Upload: {success: boolean, url?: string, error?: string} | undefined
    
    try {
      s3Upload = await uploadCSVToS3(csvContent, filename)
      if (s3Upload.success) {
        console.log('✅ Upload S3 réussi')
      } else {
        console.warn('⚠️ Upload S3 échoué:', s3Upload.error)
        validationErrors.push(`Upload S3 échoué: ${s3Upload.error}`)
      }
    } catch (s3Error: any) {
      console.error('❌ Erreur critique upload S3:', s3Error)
      s3Upload = { success: false, error: s3Error.message }
      validationErrors.push(`Erreur S3: ${s3Error.message}`)
    }

    const result = {
      csvGenerated: true,
      s3Upload,
      csvContent: csvContent,
      filename,
      stats,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined
    }

    if (validationErrors.length > 0) {
      console.warn(`⚠️ CSV généré avec ${validationErrors.length} avertissements:`, validationErrors.slice(0, 5))
    } else {
      console.log('✅ CSV généré sans erreur')
    }

    return result

  } catch (error: any) {
    console.error('❌ Erreur critique lors de la génération CSV:', error)
    validationErrors.push(`Erreur critique: ${error.message}`)
    
    return {
      csvGenerated: false,
      filename: '',
      stats: { 
        productsCount: products?.length || 0, 
        variantsCount: 0, 
        csvSize: 0,
        validLines: 0,
        invalidLines: validationErrors.length
      },
      validationErrors
    }
  }
}

/**
 * Teste la connexion Shopify
 */
async function testShopifyConnection(): Promise<{success: boolean, error?: string, shopInfo?: any}> {
  try {
    const shopify = await createShopifyClient()
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
 * Fonction utilitaire pour retry avec backoff exponentiel
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  context: string = 'operation'
): Promise<T> {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      if (attempt === maxRetries) {
        console.error(`❌ ${context} échoué après ${maxRetries} tentatives:`, error.message)
        throw error
      }

      const delay = baseDelay * Math.pow(2, attempt - 1)
      console.warn(`⚠️ ${context} échoué (tentative ${attempt}/${maxRetries}), retry dans ${delay}ms:`, error.message)
      
      // Attendre avant la prochaine tentative
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Récupère une page de produits avec retry
 */
async function getProductsPage(limit: number, sinceId: number, attempt: number = 1): Promise<ShopifyProduct[]> {
  return retryWithBackoff(
    async () => {
      console.log(`📦 Récupération des produits depuis ID: ${sinceId} (Page ${attempt})`)
      
      const shopify = await createShopifyClient()
      const products = await shopify.product.list({
        limit: limit,
        since_id: sinceId,
        fields: 'id,title,description,body_html,handle,product_type,vendor,tags,status,images,variants,options'
      }) as ShopifyProduct[]

      // Validation de base des produits reçus
      if (!Array.isArray(products)) {
        throw new Error('Réponse API Shopify invalide: products n\'est pas un tableau')
      }

      // Vérifier que les produits ont les champs essentiels
      const validProducts = products.filter(product => {
        if (!product || !product.id) {
          console.warn('⚠️ Produit ignoré: pas d\'ID', product)
          return false
        }
        return true
      })

      if (validProducts.length !== products.length) {
        console.warn(`⚠️ ${products.length - validProducts.length} produits ignorés car invalides`)
      }

      console.log(`✅ ${validProducts.length} produits valides récupérés`)
      return validProducts
    },
    3,
    1000,
    `Récupération produits page ${attempt}`
  )
}

/**
 * Récupère tous les produits avec pagination et gestion d'erreurs robuste
 */
async function getAllProducts(limit: number = 250): Promise<FormattedProduct[]> {
  let allProducts: ShopifyProduct[] = []
  let hasNextPage = true
  let sinceId = 0
  let pageCount = 0
  let totalErrors = 0

  try {
    console.log('🚀 Début récupération de tous les produits Shopify...')

    while (hasNextPage) {
      pageCount++
      
      try {
        const products = await getProductsPage(limit, sinceId, pageCount)
        
        if (products.length === 0) {
          console.log('✅ Aucun produit supplémentaire trouvé, fin de pagination')
          hasNextPage = false
        } else {
          allProducts = allProducts.concat(products)
          sinceId = products[products.length - 1].id
          hasNextPage = products.length === limit
          
          console.log(`📊 Page ${pageCount}: ${products.length} produits récupérés (Total: ${allProducts.length})`)
          
          // Pause adaptative pour éviter les limites de taux
          const delay = totalErrors > 0 ? 1000 + (totalErrors * 500) : 500
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      } catch (error: any) {
        totalErrors++
        console.error(`❌ Erreur page ${pageCount}:`, error.message)
        
        // Si trop d'erreurs consécutives, arrêter
        if (totalErrors >= 5) {
          console.error('❌ Trop d\'erreurs consécutives, arrêt de la récupération')
          break
        }
        
        // Continuer avec la page suivante si possible
        if (allProducts.length > 0) {
          console.log('⚠️ Tentative de continuer avec les produits récupérés jusqu\'à présent')
          hasNextPage = false
        } else {
          throw error
        }
      }
    }

    console.log(`✅ Récupération terminée: ${allProducts.length} produits Shopify récupérés en ${pageCount} pages`)

    // Traitement et formatage des produits avec gestion d'erreurs
    let formattedProductsArray: FormattedProduct[] = []
    let processingErrors = 0

    console.log('🔄 Début formatage des produits...')

    for (const product of allProducts) {
      try {
        if (!product.variants || !Array.isArray(product.variants)) {
          console.warn(`⚠️ Produit ${product.id} ignoré: pas de variants valides`)
          continue
        }

        // Créer un produit formaté pour chaque variant
        for (const variant of product.variants) {
          try {
            const productWithVariant = {
              ...product,
              option1: variant.option1,
              option2: variant.option2,
              option3: variant.option3,
            }

            const formattedProduct = formatShopifyProduct(productWithVariant)
            if (formattedProduct) {
              formattedProductsArray.push(formattedProduct)
            } else {
              console.warn(`⚠️ Produit ${product.id} variant ${variant.id} ignoré après formatage`)
            }
          } catch (variantError) {
            console.error(`❌ Erreur formatage variant ${variant.id} du produit ${product.id}:`, variantError)
            processingErrors++
          }
        }
      } catch (productError) {
        console.error(`❌ Erreur traitement produit ${product.id}:`, productError)
        processingErrors++
      }
    }

    console.log(`✅ Formatage terminé: ${formattedProductsArray.length} produits formatés, ${processingErrors} erreurs`)

    if (processingErrors > 0) {
      console.warn(`⚠️ ${processingErrors} erreurs de traitement détectées, mais ${formattedProductsArray.length} produits ont été traités avec succès`)
    }

    return formattedProductsArray

  } catch (error: any) {
    console.error('❌ Erreur critique lors de la récupération des produits Shopify:', error)
    
    // Si nous avons au moins quelques produits, retourner ce qu'on a
    if (allProducts.length > 0) {
      console.log(`⚠️ Retour des ${allProducts.length} produits récupérés avant l'erreur`)
      try {
        const partialFormattedProducts = allProducts
          .flatMap(product => {
            if (!product.variants) return []
            return product.variants.map(variant => ({
              ...product,
              option1: variant.option1,
              option2: variant.option2,
              option3: variant.option3,
            }))
          })
          .map(formatShopifyProduct)
          .filter(Boolean) as FormattedProduct[]
          
        return partialFormattedProducts
      } catch (formatError) {
        console.error('❌ Erreur lors du formatage partiel:', formatError)
      }
    }
    
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

  try {
    // Récupérer la configuration Shopify
    let shopifyConfig
    try {
      shopifyConfig = await getShopifyConfig()
      console.log('🚀 Début récupération produits Shopify...')
      console.log('🔧 Configuration:', {
        shopName: shopifyConfig.shopName,
        hasAccessToken: !!shopifyConfig.accessToken,
        source: 'Supabase'
      })
    } catch (configError: any) {
      console.error('❌ Erreur récupération configuration Shopify:', configError)
      return res.status(500).json({
        success: false,
        error: 'Configuration Shopify manquante',
        details: configError.message,
        required: 'Configurez Shopify dans les paramètres ou définissez SHOPIFY_ACCESS_TOKEN dans .env.local'
      })
    }

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
      const config = await getShopifyConfig()
      await supabase?.from('importations').insert({
        doc_url: "https://eu-west-3.console.aws.amazon.com/s3/object/younzee?region=eu-west-3&bucketType=general&prefix=" + csvResult.filename,
        created_at: new Date().toISOString(),
        filename: csvResult.filename,
        access_token: config.accessToken,
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