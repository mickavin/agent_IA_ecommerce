import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // Vérifier que Supabase est initialisé
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase non initialisé',
        details: 'Configuration de base de données manquante'
      })
    }

    // Récupérer l'historique des CSV depuis Supabase
    const { data, error } = await supabase
      .from('importations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20) // Limiter à 20 derniers fichiers

    if (error) {
      // Si la table n'existe pas, retourner un tableau vide au lieu d'une erreur
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        console.warn('⚠️ Table importations non trouvée. Retour d\'un tableau vide.')
        return res.status(200).json({
          success: true,
          data: [],
          message: 'Aucun historique disponible (table non créée)'
        })
      }
      
      console.error('Erreur Supabase:', error)
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de l\'historique',
        details: error.message
      })
    }

    return res.status(200).json({
      success: true,
      data: data || [],
      message: `${data?.length || 0} fichiers CSV trouvés`
    })

  } catch (error: any) {
    console.error('❌ Erreur API csv-history:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de l\'historique',
      details: error.message || 'Erreur inconnue'
    })
  }
} 