"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, RefreshCw, Monitor, Tablet, Smartphone } from "lucide-react"
import type { ChatbotGeneratorConfig } from "@/lib/types"

interface ChatbotLivePreviewProps {
  config: ChatbotGeneratorConfig
  botId?: string
}

export function ChatbotLivePreview({ config, botId }: ChatbotLivePreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile" | "tablet">("desktop")
  const [isLoading, setIsLoading] = useState(true)
  const chatbotInstanceRef = useRef<any>(null)
  const instanceIdRef = useRef<string>(`preview-${Date.now()}-${Math.random()}`)

  useEffect(() => {
    let isMounted = true;
    if (!previewRef.current) return

    // Nettoyer toutes les instances précédentes
    const cleanup = () => {
      // Nettoyer l'instance précédente
      if (chatbotInstanceRef.current && typeof chatbotInstanceRef.current.destroy === 'function') {
        try {
          chatbotInstanceRef.current.destroy()
        } catch (e) {
          console.warn('Erreur lors de la destruction du chatbot:', e)
        }
        chatbotInstanceRef.current = null
      }

      // Nettoyer tous les conteneurs de chatbot dans notre preview
      if (previewRef.current) {
        const containers = previewRef.current.querySelectorAll('.wikzy-chatbot-container')
        containers.forEach(container => {
          container.remove()
        })
      }
      
      // Nettoyer aussi depuis le body au cas où
      const bodyContainers = document.body.querySelectorAll('.wikzy-chatbot-container')
      bodyContainers.forEach(container => {
        // Si c'est un conteneur orphelin sans parent preview, on le supprime
        if (!container.closest('[data-preview-container]')) {
          container.remove()
        }
      })
    }

    // Charger le script chatbot-generator.js si pas déjà chargé
    const loadScript = () => {
      return new Promise<void>((resolve, reject) => {
        if ((window as any).WikzyChatbot) {
          resolve()
          return
        }

        const script = document.createElement('script')
        script.src = '/chatbot-generator.js'
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load chatbot-generator.js'))
        document.head.appendChild(script)
      })
    }

    // Initialiser le chatbot
    const initChatbot = async () => {
      try {
        if (isMounted) setIsLoading(true)
        await loadScript()
        
        // Attendre un peu pour que le script soit complètement prêt
        await new Promise(resolve => setTimeout(resolve, 100))

        if (!isMounted) return;

        if ((window as any).WikzyChatbot && previewRef.current) {
          const previewContainer = previewRef.current
          const WikzyChatbotClass = (window as any).WikzyChatbot
          
          // Nettoyage avant de créer une nouvelle instance
          cleanup()
          
          // Créer une nouvelle instance avec la config ET le conteneur cible
          chatbotInstanceRef.current = new WikzyChatbotClass(config, previewContainer)
          
          if (chatbotInstanceRef.current && chatbotInstanceRef.current.container) {
            const container = chatbotInstanceRef.current.container;
            
            // Appliquer les styles de positionnement pour la preview
            container.style.position = 'absolute'
            container.style.zIndex = '1000'
            
            const pos = config.position || 'bottom-right'
            container.style.top = pos.includes('top') ? '20px' : 'auto'
            container.style.bottom = pos.includes('bottom') ? '20px' : 'auto'
            container.style.left = pos.includes('left') ? '20px' : 'auto'
            container.style.right = pos.includes('right') ? '20px' : 'auto'
            
            // Ouvrir automatiquement pour la prévisualisation
            if (chatbotInstanceRef.current.open) {
              setTimeout(() => {
                if (isMounted && chatbotInstanceRef.current) {
                  chatbotInstanceRef.current.open()
                }
              }, 300)
            }
          }
          
          if (isMounted) setIsLoading(false)
        }
      } catch (error) {
        console.error('Error loading chatbot preview:', error)
        if (isMounted) setIsLoading(false)
      }
    }

    initChatbot()

    return () => {
      isMounted = false
      cleanup()
    }
  }, [config])

  const refreshPreview = () => {
    if (chatbotInstanceRef.current && typeof chatbotInstanceRef.current.destroy === 'function') {
      chatbotInstanceRef.current.destroy()
    }
    chatbotInstanceRef.current = null
    
    // Forcer un re-montage via le changement de config ou un état local si nécessaire
    // Ici le changement de config déclenche déjà le useEffect
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Aperçu en temps réel
            </CardTitle>
            <CardDescription>
              Visualisez les modifications en direct
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={previewDevice === "desktop" ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewDevice("desktop")}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Desktop
            </Button>
            {/* <Button
              variant={previewDevice === "tablet" ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewDevice("tablet")}
            >
              <Tablet className="h-4 w-4 mr-2" />
              Tablet
            </Button>} */}
            <Button
              //variant={previewDevice === "mobile" ? "default" : "outline"}
              variant={previewDevice === "tablet" ? "default" : "outline"}
              size="sm"
              //onClick={() => setPreviewDevice("mobile")}
              onClick={() => setPreviewDevice("tablet")}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Mobile
            </Button>
            <Button variant="outline" size="sm" onClick={refreshPreview}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className={`relative border rounded-lg overflow-hidden bg-slate-900 ${
            previewDevice === "mobile" ? "w-full max-w-sm mx-auto h-[600px]" :
            previewDevice === "tablet" ? "w-full max-w-md mx-auto h-[700px]" :
            "w-full h-[700px]"
          }`}
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)",
            backgroundSize: "24px 24px"
          }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Chargement de l'aperçu...</p>
              </div>
            </div>
          )}
          <div 
            ref={previewRef}
            data-preview-container="true"
            className="w-full h-full relative"
            style={{
              transform: previewDevice === "mobile" ? "scale(0.85)" : 
                        previewDevice === "tablet" ? "scale(0.95)" : "scale(1)",
              transformOrigin: config.position ? (
                config.position.includes('bottom') ? 
                  (config.position.includes('right') ? 'bottom right' : 'bottom left') :
                  (config.position.includes('right') ? 'top right' : 'top left')
              ) : 'bottom right',
              overflow: "hidden"
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          💡 L'aperçu se met à jour automatiquement lorsque vous modifiez la configuration
        </p>
      </CardContent>
    </Card>
  )
}
