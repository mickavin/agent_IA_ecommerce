"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Bot,
  Send,
  User,
  MessageSquare,
  Minimize2,
  Maximize2,
  X,
  Sparkles,
  ShoppingBag
} from "lucide-react"
import { ChatbotVisualConfig, ChatbotPersonality, ChatMessage } from "@/lib/types"
import { ProductCarousel } from "@/components/product-carousel"
import ReactMarkdown from "react-markdown"

interface ChatbotPreviewProps {
  visualConfig: ChatbotVisualConfig
  personality: ChatbotPersonality
  chatbotName?: string
  interactive?: boolean
  className?: string
}

export function ChatbotPreview({ 
  visualConfig, 
  personality, 
  chatbotName = "Assistant Younzee",
  interactive = false,
  className = ""
}: ChatbotPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      content: visualConfig.welcomeMessage || "👋 Salut ! Je suis votre assistant mode personnel ! Comment puis-je vous aider à trouver le produit parfait aujourd'hui ?",
      type: "bot",
      timestamp: new Date().toISOString()
    }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Mettre à jour le message de bienvenue quand la config change
  useEffect(() => {
    setMessages([{
      id: "welcome",
      content: visualConfig.welcomeMessage || "👋 Salut ! Je suis votre assistant mode personnel ! Comment puis-je vous aider à trouver le produit parfait aujourd'hui ?",
      type: "bot",
      timestamp: new Date().toISOString()
    }])
  }, [visualConfig.welcomeMessage])

  const borderRadiusClass = {
    "Carré": "rounded-none",
    "Arrondi": "rounded-lg",
    "Très arrondi": "rounded-2xl"
  }[visualConfig.borderRadius]

  const sizeConfig = {
    "Compact": { width: "w-72", height: "h-96" },
    "Standard": { width: "w-80", height: "h-[500px]" },
    "Large": { width: "w-96", height: "h-[600px]" }
  }[visualConfig.size]

  const positionClass = {
    "Bas droite": "bottom-4 right-4",
    "Bas gauche": "bottom-4 left-4", 
    "Flottant centre": "bottom-1/2 right-1/2 transform translate-x-1/2 translate-y-1/2"
  }[visualConfig.position]

  // Analyse d'intention simple
  const analyzeIntent = (message: string) => {
    const normalized = message.toLowerCase()
    
    if (normalized.includes('cherche') || normalized.includes('veux') || normalized.includes('besoin')) {
      return 'search'
    }
    if (normalized.includes('conseil') || normalized.includes('recommande') || normalized.includes('suggère')) {
      return 'recommendation'
    }
    if (normalized.includes('prix') || normalized.includes('coûte') || normalized.includes('budget')) {
      return 'price'
    }
    if (normalized.includes('taille') || normalized.includes('pointure')) {
      return 'size'
    }
    if (normalized.includes('couleur') || normalized.includes('style')) {
      return 'style'
    }
    if (normalized.includes('stock') || normalized.includes('disponible')) {
      return 'availability'
    }
    
    return 'general'
  }

  // Extraction d'entités
  const extractEntities = (message: string) => {
    const entities: any = {}
    const normalized = message.toLowerCase()

    // Couleurs
    const colors = ['noir', 'blanc', 'rouge', 'bleu', 'vert', 'jaune', 'rose', 'violet', 'gris']
    colors.forEach(color => {
      if (normalized.includes(color)) entities.color = color
    })

    // Tailles
    const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl']
    sizes.forEach(size => {
      if (normalized.includes(size)) entities.size = size.toUpperCase()
    })

    // Genre
    if (normalized.includes('homme') || normalized.includes('masculin')) {
      entities.gender = 'Homme'
    } else if (normalized.includes('femme') || normalized.includes('féminin')) {
      entities.gender = 'Femme'
    }

    // Catégories
    if (normalized.includes('tshirt') || normalized.includes('t-shirt')) {
      entities.category = 'Tshirt'
    } else if (normalized.includes('sweat')) {
      entities.category = 'Sweatshirt'
    } else if (normalized.includes('robe')) {
      entities.category = 'Robe'
    }

    // Budget
    const priceMatch = normalized.match(/(\d+)\s*€|(\d+)\s*euros?/)
    if (priceMatch) {
      entities.budget = parseInt(priceMatch[1] || priceMatch[2])
    }

    return entities
  }

  // Génération de réponse intelligente avec données produits
  const generateIntelligentResponse = async (userMessage: string) => {
    try {
      // Appel vers la nouvelle API IA Master
      const response = await fetch('/api/ia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.trim(),
          userId: `preview-user-${Date.now()}`,
          context: {
            conversationHistory: messages.slice(-4).map(msg => ({
              id: msg.id,
              content: msg.content,
              type: msg.type,
              timestamp: msg.timestamp
            })),
            userPreferences: {
              personality: personality,
              chatbotName: chatbotName,
              preview: true
            }
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        return {
          content: data.data.content,
          metadata: {
            intent: data.data.metadata?.intent || 'general',
            entities: data.data.metadata?.entities || [],
            confidence: data.data.confidence,
            aiType: data.data.aiType,
            processingTime: data.data.metadata?.processingTime
          }
        }
      } else {
        throw new Error(data.error || 'Erreur IA Master')
      }

    } catch (error) {
      console.error('Erreur lors de l\'appel à l\'IA Master:', error)
      return {
        content: "😅 Désolé, j'ai rencontré un petit problème technique. Pouvez-vous réessayer ?",
        metadata: { intent: 'error', entities: [], confidence: 0 }
      }
    }
  }

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return

    const userMessage = {
      id: `user-${Date.now()}`,
      content: message,
      type: 'user' as const,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: {
            conversationHistory: messages.slice(-5),
            userPreferences: {},
            userId: `preview-${Date.now()}`
          },
          chatbotConfig: {
            personality: personality,
            visualConfig: visualConfig
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success !== false && data.response) {
        const botMessage = {
          id: data.response.id || `bot-${Date.now()}`,
          content: data.response.content || data.content,
          type: 'bot' as const,
          timestamp: data.response.timestamp || new Date().toISOString(),
          metadata: {
            ...data.response.metadata,
            products: data.response.products || data.products,
            showCarousel: data.response.showCarousel || data.showCarousel
          }
        }
        setMessages(prev => [...prev, botMessage])
      } else if (data.content) {
        // Gestion directe si l'API retourne directement le contenu
        const botMessage = {
          id: `bot-${Date.now()}`,
          content: data.content,
          type: 'bot' as const,
          timestamp: new Date().toISOString(),
          metadata: {
            products: data.products,
            showCarousel: data.showCarousel
          }
        }
        setMessages(prev => [...prev, botMessage])
      } else {
        throw new Error(data.error || 'Erreur de réponse')
      }
    } catch (error) {
      console.error('Erreur chatbot preview:', error)
      const errorMessage = {
        id: `error-${Date.now()}`,
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        type: 'bot' as const,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputMessage)
    }
  }

  const getFormattedTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (!interactive) {
    // Version statique pour les aperçus
    return (
      <div className={`relative`} style={{
        height: "100%",
      }}>
        <div className={`${positionClass} z-50`}>
          {/* Bouton flottant */}
          <div 
            style={{
              position: "absolute",
              bottom: 10,
              right: 10,
              zIndex: 1000,
              background: `linear-gradient(135deg, ${visualConfig.primaryColor}, ${visualConfig.primaryColor}dd)`
            }}
            className={`${borderRadiusClass === "rounded-none" ? "rounded-full" : borderRadiusClass} p-4 shadow-lg cursor-pointer transform hover:scale-105 transition-transform relative`}
          >
            <Bot className="h-6 w-6 text-white" />
            <Sparkles className="h-3 w-3 text-white absolute -top-1 -right-1 animate-pulse" />
          </div>
          
          {/* Fenêtre de chat statique */}
          <div 
            className={`${sizeConfig.width} ${borderRadiusClass} shadow-xl overflow-hidden mb-4`}
            style={{ backgroundColor: visualConfig.backgroundColor, position: "absolute", bottom: 50, right: 70, zIndex: 1000 }}
          >
            {/* Header amélioré */}
            <div 
              className="p-4 text-white"
              style={{
                background: `linear-gradient(135deg, ${visualConfig.primaryColor}, ${visualConfig.primaryColor}dd)`
              }}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-white/20">
                    <Bot className="h-4 w-4 text-white" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{chatbotName}</div>
                  <div className="text-xs opacity-90 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Assistant IA • Mode
                  </div>
                </div>
              </div>
            </div>
            
            {/* Message d'exemple */}
            <div className="p-4">
              <div className="flex gap-2">
                <Avatar className="h-6 w-6 mt-1">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600">
                    <Bot className="h-3 w-3 text-white" />
                  </AvatarFallback>
                </Avatar>
                <div 
                  className={`${borderRadiusClass} px-3 py-2 max-w-xs text-sm bg-gray-100 text-gray-800`}
                >
                  {visualConfig.welcomeMessage || "👋 Salut ! Je suis votre assistant mode personnel ! Comment puis-je vous aider ?"}
                </div>
              </div>
              
              <div className="flex gap-2 justify-end mt-3">
                <div 
                  className={`${borderRadiusClass} px-3 py-2 max-w-xs text-sm text-white`}
                  style={{
                    background: `linear-gradient(135deg, ${visualConfig.primaryColor}, ${visualConfig.primaryColor}dd)`
                  }}
                >
                  {personality.formality === "Tutoiement" ? "Je cherche un t-shirt bleu" : "Je recherche un t-shirt bleu"}
                </div>
              </div>
            </div>
            
            {/* Input de démonstration */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder={visualConfig.placeholder || "Décrivez ce que vous cherchez..."}
                  className={`flex-1 ${borderRadiusClass} border px-3 py-2 text-sm`}
                  disabled
                />
                <Button 
                  size="sm" 
                  className={`${borderRadiusClass}`}
                  style={{
                    background: `linear-gradient(135deg, ${visualConfig.primaryColor}, ${visualConfig.primaryColor}dd)`
                  }}
                  disabled
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Version interactive pour les tests
  return (
    <div className={`fixed ${positionClass} z-50 ${className}`}>
      {!isOpen ? (
        /* Bouton flottant amélioré */
        <div 
          className={`${borderRadiusClass === "rounded-none" ? "rounded-full" : borderRadiusClass} inline-flex p-4 shadow-lg cursor-pointer transform hover:scale-105 transition-transform relative`}
          style={{
            background: `linear-gradient(135deg, ${visualConfig.primaryColor}, ${visualConfig.primaryColor}dd)`
          }}
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="h-6 w-6 text-white" />
          <Sparkles className="h-3 w-3 text-white absolute -top-1 -right-1 animate-pulse" />
        </div>
      ) : (
        /* Fenêtre de chat interactive */
        <div 
          className={`${sizeConfig.width} ${sizeConfig.height} ${borderRadiusClass} shadow-xl overflow-hidden bg-white flex flex-col`}
          
        >
          {/* Header amélioré */}
          <div 
            className="p-4 text-white flex items-center justify-between"
            style={{
              background: `linear-gradient(135deg, ${visualConfig.primaryColor}, ${visualConfig.primaryColor}dd)`
            }}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-white/20">
                  <Bot className="h-4 w-4 text-white" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{chatbotName}</div>
                <div className="text-xs opacity-90 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Assistant IA • Mode
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {!isMinimized && (
            <>
              {/* Messages avec intelligence */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.type === 'bot' && (
                        <Avatar className="h-6 w-6 mt-1">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600">
                            <Bot className="h-3 w-3 text-white" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[85%] ${message.type === 'user' ? 'order-1' : ''}`}>
                        <div 
                          className={`${borderRadiusClass} px-3 py-2 text-sm ${
                            message.type === 'user' 
                              ? 'text-white ml-auto' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                          style={message.type === 'user' ? {
                            background: `linear-gradient(135deg, ${visualConfig.primaryColor}, ${visualConfig.primaryColor}dd)`
                          } : undefined}
                        >
                          {message.type === 'bot' && message.content ? (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown>
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          )}
                        </div>

                        {/* Carousel de produits pour les recommandations */}
                        {message.type === 'bot' && message.metadata?.showCarousel && message.metadata?.products && (
                          <div className="mt-3">
                            <ProductCarousel
                              products={message.metadata.products}
                              title="Nos recommandations"
                              primaryColor={visualConfig.primaryColor}
                              onProductClick={(product) => {
                                console.log('Produit cliqué:', product)
                                // Ici on pourrait ajouter une action comme ouvrir une modal ou rediriger
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Affichage des métadonnées d'intelligence */}
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <span>{getFormattedTime(message.timestamp)}</span>
                          {message.metadata?.intent && message.type === 'bot' && (
                            <Badge variant="outline" className="text-xs">
                              {message.metadata.intent}
                            </Badge>
                          )}
                          {message.metadata?.confidence && (
                            <span className="opacity-70">
                              IA: {(message.metadata.confidence * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {message.type === 'user' && (
                        <Avatar className="h-6 w-6 mt-1 order-2">
                          <AvatarFallback className="bg-gray-200">
                            <User className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  
                  {/* Indicateur de frappe */}
                  {isTyping && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="h-6 w-6 mt-1">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600">
                          <Bot className="h-3 w-3 text-white" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 rounded-lg px-3 py-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              {/* Input amélioré */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={visualConfig.placeholder || "Décrivez ce que vous cherchez..."}
                    className={`flex-1 ${borderRadiusClass}`}
                    disabled={isTyping}
                  />
                  <Button 
                    onClick={() => handleSendMessage(inputMessage)}
                    disabled={!inputMessage.trim() || isTyping}
                    className={`${borderRadiusClass}`}
                    style={{
                      background: `linear-gradient(135deg, ${visualConfig.primaryColor}, ${visualConfig.primaryColor}dd)`
                    }}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Suggestions rapides */}
                <div className="flex gap-2 mt-2 overflow-x-auto">
                  {['Recommandations', 'T-shirts', 'Budget 50€', 'Guide tailles'].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs whitespace-nowrap"
                      onClick={() => setInputMessage(suggestion)}
                      disabled={isTyping}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
} 