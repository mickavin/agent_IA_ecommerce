"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type LogEntry = {
  id: string
  timestamp: string
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
  data?: any
}

export function StreamDebug() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [testMessage, setTestMessage] = useState("Je cherche une robe pour une soirée")
  const [isLoading, setIsLoading] = useState(false)

  const addLog = (message: string, type: LogEntry['type'] = 'info', data?: any) => {
    const log: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      data
    }
    setLogs(prev => [...prev, log])
  }

  const testNewArchitecture = async () => {
    setIsLoading(true)
    addLog('🚀 Test de la nouvelle architecture IA Master...')
    
    try {
      addLog('📤 Envoi requête vers /api/ai/master...')
      const response = await fetch('/api/ai/master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testMessage,
          context: {
            conversationHistory: [],
            userPreferences: {},
            userId: `debug-${Date.now()}`
          },
          chatbotConfig: {
            personality: {
              tone: "Amical",
              formality: "Tutoiement",
              verbosity: "Détaillé",
              empathy: "Élevée",
              proactivity: "Proactif"
            }
          }
        })
      })

      addLog(`📥 Réponse reçue: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      addLog('✅ Données parsées avec succès', 'success', data)

      if (data.success && data.response) {
        addLog(`🤖 IA utilisée: ${data.response.metadata?.routedTo || 'non spécifiée'}`, 'success')
        addLog(`📊 Confiance: ${Math.round((data.response.metadata?.confidence || 0) * 100)}%`, 'info')
        addLog(`🎭 Personnalité appliquée: ${JSON.stringify(data.response.metadata?.personalityApplied)}`, 'info')
        addLog(`💬 Réponse: ${data.response.content.substring(0, 100)}...`, 'success')
      } else {
        addLog(`❌ Erreur dans la réponse: ${data.error}`, 'error')
      }

    } catch (error: any) {
      addLog(`💥 Erreur: ${error.message}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const testCompatibilityAPI = async () => {
    setIsLoading(true)
    addLog('🔗 Test de l\'API de compatibilité /api/chat...')
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testMessage,
          chatbotConfig: {
            personality: {
              tone: "Professionnel",
              formality: "Vouvoiement"
            }
          }
        })
      })

      addLog(`📥 Réponse API compatibilité: ${response.status}`)

      if (response.ok) {
        const data = await response.json()
        addLog('✅ API de compatibilité fonctionne', 'success', data)
        addLog(`🤖 Modèle: ${data.response?.metadata?.model}`, 'info')
        addLog(`🎯 Routé vers: ${data.response?.metadata?.routedTo}`, 'info')
      } else {
        addLog('❌ API de compatibilité échoue', 'error')
      }

    } catch (error: any) {
      addLog(`💥 Erreur API compatibilité: ${error.message}`, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const testSpecializedAIs = async () => {
    setIsLoading(true)
    addLog('🧪 Test des IAs spécialisées...')

    const tests = [
      { name: 'FAQ', endpoint: 'faq', message: 'Bonjour, comment ça marche ?' },
      { name: 'Articles', endpoint: 'articles', message: 'Je cherche un t-shirt noir' },
      { name: 'Outfits', endpoint: 'outfits', message: 'Je veux une tenue pour le travail' }
    ]

    for (const test of tests) {
      try {
        addLog(`🎯 Test IA ${test.name}...`)
        
        const response = await fetch(`/api/ai/${test.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: test.message,
            context: {}
          })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            addLog(`✅ IA ${test.name} fonctionne`, 'success')
            addLog(`📊 Confiance: ${Math.round((data.response?.metadata?.confidence || 0) * 100)}%`)
          } else {
            addLog(`⚠️ IA ${test.name} refuse la requête`, 'warning')
          }
        } else {
          addLog(`❌ IA ${test.name} erreur HTTP ${response.status}`, 'error')
        }

      } catch (error: any) {
        addLog(`💥 Erreur IA ${test.name}: ${error.message}`, 'error')
      }
    }

    setIsLoading(false)
  }

  const clearLogs = () => {
    setLogs([])
  }

  const getLogBadgeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Debug - Nouvelle Architecture IA
        </CardTitle>
        <CardDescription>
          Testez et déboguez la nouvelle architecture IA Master avec les IAs spécialisées
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contrôles de test */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Message de test"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testNewArchitecture} disabled={isLoading}>
              🧠 Test IA Master
            </Button>
            <Button onClick={testCompatibilityAPI} disabled={isLoading} variant="outline">
              🔗 Test Compatibilité
            </Button>
            <Button onClick={testSpecializedAIs} disabled={isLoading} variant="outline">
              🎯 Test IAs Spécialisées
            </Button>
            <Button onClick={clearLogs} variant="outline">
              🗑️ Effacer
            </Button>
          </div>
        </div>

        <Separator />

        {/* Logs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Logs de Debug</h3>
            <Badge variant="outline">{logs.length} entrées</Badge>
          </div>
          
          <ScrollArea className="h-[400px] w-full border rounded-md p-4">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucun log pour le moment. Lancez un test pour commencer.
              </p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-sm">
                    <Badge className={getLogBadgeColor(log.type)} variant="outline">
                      {log.timestamp}
                    </Badge>
                    <div className="flex-1">
                      <div className="font-mono">{log.message}</div>
                      {log.data && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-muted-foreground">
                            Voir les détails
                          </summary>
                          <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Informations sur l'architecture */}
        <Separator />
        
        <div className="text-sm text-muted-foreground space-y-2">
          <h4 className="font-semibold text-foreground">Architecture actuelle :</h4>
          <ul className="space-y-1 pl-4">
            <li>• 🧠 <strong>IA Master</strong> : /api/ai/master (Orchestrateur intelligent)</li>
            <li>• 📚 <strong>IA FAQ</strong> : /api/ai/faq (Questions fréquentes)</li>
            <li>• 👕 <strong>IA Articles</strong> : /api/ai/articles (Recommandations produits)</li>
            <li>• 👗 <strong>IA Outfits</strong> : /api/ai/outfits (Suggestions tenues)</li>
            <li>• 🔗 <strong>Compatibilité</strong> : /api/chat et /api/chat-stream</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 