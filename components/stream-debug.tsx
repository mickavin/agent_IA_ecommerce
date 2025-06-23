'use client'

import { useState } from 'react'

export function StreamDebug() {
  const [logs, setLogs] = useState<string[]>([])
  const [message, setMessage] = useState('Bonjour, peux-tu me conseiller ?')
  const [isLoading, setIsLoading] = useState(false)

  const addLog = (log: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${log}`])
    console.log(log)
  }

  const testStream = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    setLogs([])
    addLog('🚀 Démarrage test streaming')

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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🐛 Debug Streaming API</h2>
      
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

        <button
          onClick={testStream}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {isLoading ? '⏳ Test en cours...' : '🚀 Tester Streaming'}
        </button>

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
            <li>Cliquez sur "Tester Streaming" pour lancer un test</li>
            <li>Vérifiez les logs pour identifier les problèmes</li>
            <li>Assurez-vous que OPENAI_API_KEY est configurée</li>
            <li>Le serveur doit tourner sur localhost:3000</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 