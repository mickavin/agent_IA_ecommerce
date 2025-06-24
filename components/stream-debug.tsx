'use client'

import { useState } from 'react'

export function StreamDebug() {
  const [logs, setLogs] = useState<string[]>([])
  const [message, setMessage] = useState('Bonjour, peux-tu me conseiller ?')
  const [isLoading, setIsLoading] = useState(false)
  const [testType, setTestType] = useState<'streaming' | 'direct'>('direct')

  const addLog = (log: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${log}`])
    console.log(log)
  }

  const testIAMaster = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    setLogs([])
    addLog('🚀 Démarrage test IA Master (API directe)')

    try {
      addLog('📤 Envoi requête vers /api/ia...')
      const response = await fetch('/api/ia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          userId: 'debug-user',
          context: {
            conversationHistory: [],
            userPreferences: {
              budget: { min: 0, max: 100 }
            }
          }
        })
      })

      addLog(`📡 Status: ${response.status}`)
      addLog(`📡 Content-Type: ${response.headers.get('content-type')}`)

      if (!response.ok) {
        const errorText = await response.text()
        addLog(`❌ Erreur HTTP: ${errorText}`)
        return
      }

      const data = await response.json()
      addLog(`📋 Réponse reçue: ${JSON.stringify(data, null, 2)}`)

      if (data.success) {
        addLog(`✅ IA utilisée: ${data.data.aiType}`)
        addLog(`✅ Confiance: ${Math.round(data.data.confidence * 100)}%`)
        addLog(`✅ Contenu: ${data.data.content.substring(0, 100)}...`)
        addLog(`✅ Temps de traitement: ${data.data.metadata?.processingTime || 'N/A'}ms`)
      } else {
        addLog(`❌ Erreur IA Master: ${data.error}`)
      }

    } catch (error: any) {
      addLog(`❌ Erreur client: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testStreamingCompatibility = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    setLogs([])
    addLog('🚀 Démarrage test compatibilité streaming (via /api/chat-stream)')

    try {
      addLog('📤 Envoi requête...')
      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: {
            userId: 'test-debug',
            userPreferences: {
              budget: { min: 0, max: 100 }
            }
          },
          chatbotConfig: {
            personality: {
              tone: "Amical",
              formality: "Tutoiement"
            }
          }
        })
      })

      addLog(`📡 Status: ${response.status}`)
      addLog(`📡 Content-Type: ${response.headers.get('content-type')}`)

      if (!response.ok) {
        const errorText = await response.text()
        addLog(`❌ Erreur HTTP: ${errorText}`)
        return
      }

      addLog('📖 Début lecture stream...')
      const reader = response.body?.getReader()
      
      if (!reader) {
        addLog('❌ Reader non disponible')
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let chunkCount = 0
      let fullResponse = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          addLog('✅ Stream terminé (done=true)')
          break
        }

        chunkCount++
        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        if (chunkCount <= 3) {
          addLog(`📦 Chunk ${chunkCount}: ${chunk.substring(0, 50)}...`)
        }

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim() === '' || line.trim() === 'data: [DONE]') continue
          
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim()
              if (!jsonStr) continue
              
              const data = JSON.parse(jsonStr)
              addLog(`📋 Event: ${data.type} (${data.data?.fullResponse?.length || 0} chars)`)

              if (data.type === 'content') {
                fullResponse = data.data.fullResponse
              } else if (data.type === 'complete') {
                addLog(`🎉 Complete: ${JSON.stringify(data.data.stats)}`)
                addLog(`✅ IA Type: ${data.data.stats?.aiType || 'N/A'}`)
                addLog(`✅ Confiance: ${Math.round((data.data.stats?.confidence || 0) * 100)}%`)
                break
              } else if (data.type === 'error') {
                addLog(`❌ Erreur serveur: ${data.data.error}`)
                break
              }
            } catch (parseError) {
              addLog(`❌ Parse error: ${parseError} | Line: ${line}`)
            }
          }
        }
      }

      addLog(`✅ Streaming terminé: ${chunkCount} chunks, réponse: ${fullResponse.length} chars`)

    } catch (error: any) {
      addLog(`❌ Erreur client: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testAdminEndpoints = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    setLogs([])
    addLog('🚀 Test des endpoints d\'administration IA Master')

    try {
      // Test des stats
      addLog('📊 Test GET /api/ia?action=stats')
      const statsResponse = await fetch('/api/ia?action=stats')
      const statsData = await statsResponse.json()
      addLog(`📊 Stats: ${JSON.stringify(statsData, null, 2)}`)

      // Test de la configuration
      addLog('⚙️ Test GET /api/ia?action=config')
      const configResponse = await fetch('/api/ia?action=config')
      const configData = await configResponse.json()
      addLog(`⚙️ Config: ${JSON.stringify(configData, null, 2)}`)

      // Test de routage
      addLog('🧭 Test GET /api/ia?action=test-routing')
      const routingResponse = await fetch('/api/ia?action=test-routing')
      const routingData = await routingResponse.json()
      addLog(`🧭 Routage: ${JSON.stringify(routingData, null, 2)}`)

    } catch (error: any) {
      addLog(`❌ Erreur test admin: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const runTest = () => {
    if (testType === 'streaming') {
      testStreamingCompatibility()
    } else {
      testIAMaster()
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🧪 Debug IA Master & Compatibilité</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Message de test:</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Votre message..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Type de test:</label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="testType"
                value="direct"
                checked={testType === 'direct'}
                onChange={(e) => setTestType(e.target.value as 'direct' | 'streaming')}
                className="mr-2"
              />
              API IA Master directe
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="testType"
                value="streaming"
                checked={testType === 'streaming'}
                onChange={(e) => setTestType(e.target.value as 'direct' | 'streaming')}
                className="mr-2"
              />
              Compatibilité Streaming
            </label>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={runTest}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            {isLoading ? '⏳ Test en cours...' : '🚀 Tester API'}
          </button>

          <button
            onClick={testAdminEndpoints}
            disabled={isLoading}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            📊 Tester Admin
          </button>
        </div>

        <div className="border rounded p-4 bg-gray-50">
          <h3 className="font-medium mb-2">Logs de debug:</h3>
          <div className="bg-black text-green-400 p-3 rounded font-mono text-sm h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">En attente de test...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            )}
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Instructions:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>API IA Master directe:</strong> Teste la nouvelle architecture directement</li>
            <li><strong>Compatibilité Streaming:</strong> Teste la redirection depuis l'ancienne API</li>
            <li><strong>Admin:</strong> Teste les endpoints d'administration (stats, config, routage)</li>
            <li>Vérifiez que les réponses incluent le type d'IA et la confiance</li>
            <li>Le serveur doit tourner sur localhost:3000</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h4 className="font-medium text-blue-800 mb-2">Exemples de messages à tester:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <button 
              onClick={() => setMessage('Comment retourner un produit ?')}
              className="text-left p-2 bg-white border rounded hover:bg-blue-100"
            >
              <strong>FAQ:</strong> Comment retourner un produit ?
            </button>
            <button 
              onClick={() => setMessage('Je veux une tenue pour une soirée')}
              className="text-left p-2 bg-white border rounded hover:bg-blue-100"
            >
              <strong>Outfit:</strong> Je veux une tenue pour une soirée
            </button>
            <button 
              onClick={() => setMessage('Cherche un t-shirt noir en M')}
              className="text-left p-2 bg-white border rounded hover:bg-blue-100"
            >
              <strong>Produit:</strong> Cherche un t-shirt noir en M
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 