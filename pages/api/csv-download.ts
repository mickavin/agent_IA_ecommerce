import { NextApiRequest, NextApiResponse } from 'next'
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { filename } = req.body

    if (!filename) {
      return res.status(400).json({
        success: false,
        error: 'Nom de fichier manquant'
      })
    }

    // Vérifier la configuration AWS
    const awsConfig = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      bucketName: process.env.AWS_S3_BUCKET_NAME,
      region: 'eu-west-3'
    }

    console.log(`🔧 Téléchargement CSV - région=${awsConfig.region}, bucket=${awsConfig.bucketName}, fichier=${filename}`)

    if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey || !awsConfig.bucketName) {
      return res.status(500).json({
        success: false,
        error: 'Configuration AWS S3 incomplète'
      })
    }

    // Configurer le client S3
    const s3Client = new S3Client({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      },
      forcePathStyle: false,
      useAccelerateEndpoint: false, // Désactiver l'accélération pour éviter les conflits de région
      maxAttempts: 3, // Nombre de tentatives en cas d'erreur
    });

    // Générer une URL signée
    const getObjectCommand = new GetObjectCommand({
      Bucket: awsConfig.bucketName,
      Key: filename,
    });

    const signedUrl = await getSignedUrl(s3Client, getObjectCommand, { 
      expiresIn: 60 * 60 // 1 heure
    });

    return res.status(200).json({
      success: true,
      downloadUrl: signedUrl,
      filename: filename,
      expiresIn: '1 heure'
    })

  } catch (error: any) {
    console.error('❌ Erreur génération URL signée:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération de l\'URL de téléchargement',
      details: error.message || 'Erreur inconnue'
    })
  }
} 