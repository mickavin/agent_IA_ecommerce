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
    const intent = analyzeIntent(userMessage)
    const entities = extractEntities(userMessage)
    
    try {
      // Import dynamique du service produit
      const { ProductService } = await import('@/lib/services/api.service')
      
      let response = ''
      let products: any[] = []

      switch (intent) {
        case 'search':
          const searchFilters: Record<string, string[]> = {}
          if (entities.color) searchFilters.colors = [entities.color]
          if (entities.size) searchFilters.sizes = [entities.size]
          if (entities.gender) searchFilters.gender = [entities.gender]
          if (entities.category) searchFilters.category = [entities.category]

          const searchResult = await ProductService.getAll(1, 5, undefined, searchFilters)
          products = searchResult.data

          if (products.length > 0) {
            response = `🔍 J'ai trouvé ${products.length} produit${products.length > 1 ? 's' : ''} qui pourrai${products.length > 1 ? 'ent' : 't'} vous intéresser !\n\n`
            
            products.slice(0, 3).forEach((product, index) => {
              response += `${index + 1}. **${product.name}** - ${product.price}€\n`
              if (product.colors?.length > 0) response += `   Couleurs: ${product.colors.join(', ')}\n`
              if (product.sizes?.length > 0) response += `   Tailles: ${product.sizes.join(', ')}\n`
              response += '\n'
            })
          } else {
            response = "😔 Désolé, je n'ai pas trouvé de produits correspondant exactement à vos critères. Puis-je vous proposer des alternatives ?"
          }
          break

        case 'recommendation':
          const recResult = await ProductService.getAll(1, 5)
          products = recResult.data

          response = "✨ Voici mes recommandations personnalisées pour vous :\n\n"
          
          if (products.length > 0) {
            products.slice(0, 3).forEach((product, index) => {
              const emoji = ['🏆', '⭐', '💎'][index]
              response += `${emoji} **${product.name}** - ${product.price}€\n`
              response += `   Parfait pour votre style !\n\n`
            })
          } else {
            response = "Je n'ai pas encore assez d'informations pour des recommandations personnalisées. Parlez-moi de vos goûts ! 😊"
          }
          break

        case 'price':
          if (entities.budget) {
            const budgetResult = await ProductService.getAll(1, 10)
            const affordable = budgetResult.data.filter((p: any) => p.price <= entities.budget)
            response = `💰 Avec un budget de ${entities.budget}€, vous avez ${affordable.length} options ! Voulez-vous que je vous montre les meilleures affaires ?`
          } else {
            response = "💡 Nos prix varient :\n🏷️ T-shirts : à partir de 29€\n🏷️ Sweatshirts : à partir de 49€\n🏷️ Robes : à partir de 79€\n\nQuel est votre budget ?"
          }
          break

        case 'size':
          response = "📏 **Guide des tailles** :\n\n👕 **Hauts** :\n• XS: 32-34 | S: 36-38 | M: 40-42 | L: 44-46 | XL: 48-50\n\n👖 **Bas** :\n• XS: 34-36 | S: 38-40 | M: 42-44 | L: 46-48 | XL: 50-52\n\n💡 En cas de doute, prenez une taille au-dessus !"
          break

        case 'availability':
          const stockResult = await ProductService.getAll(1, 20)
          const inStock = stockResult.data.filter((p: any) => p.stock > 0).length
          const lowStock = stockResult.data.filter((p: any) => p.stock > 0 && p.stock < 10).length
          
          response = `📦 **État des stocks** :\n✅ ${inStock} produits en stock\n⚠️ ${lowStock} produits en stock limité\n\nQuel produit vous intéresse ?`
          break

        case 'style':
          const styleAdvice = [
            "💡 Pour un look décontracté : t-shirt + jean + sneakers",
            "✨ Pour le bureau : chemise + pantalon + chaussures classiques", 
            "🌟 Pour une soirée : robe élégante + talons + accessoires",
            "🔥 Style streetwear : sweat oversize + jogger + baskets"
          ]
          response = styleAdvice[Math.floor(Math.random() * styleAdvice.length)]
          break

        default:
          const helpfulResponses = [
            "😊 Je suis là pour vous aider à trouver les produits parfaits ! Que cherchez-vous ?",
            "🛍️ Je peux vous aider à chercher des produits, vous donner des conseils de style, ou répondre à vos questions !",
            "✨ Que puis-je faire pour vous ? Recherche, recommandations, guide des tailles ?"
          ]
          response = helpfulResponses[Math.floor(Math.random() * helpfulResponses.length)]
          break
      }

      return {
        content: response,
        metadata: { 
          intent, 
          confidence: 0.8,
          entities: Object.entries(entities).map(([type, value]) => ({ type, value: String(value) }))
        }
      }

    } catch (error) {
      console.error('Erreur lors de la génération de réponse:', error)
      return {
        content: "😅 Désolé, j'ai rencontré un petit problème technique. Pouvez-vous réessayer ?",
        metadata: { intent: 'error', entities: [], confidence: 0 }
      }
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !interactive) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: inputMessage,
      type: "user",
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    // Génération de réponse intelligente
    setTimeout(async () => {
      try {
        const intelligentResponse = await generateIntelligentResponse(userMessage.content)
        
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          content: intelligentResponse.content,
          type: "bot",
          timestamp: new Date().toISOString(),
          metadata: intelligentResponse.metadata
        }
        
        setMessages(prev => [...prev, botMessage])
        
      } catch (error) {
        const errorMessage: ChatMessage = {
          id: `bot-error-${Date.now()}`,
          content: "😅 Désolé, j'ai eu un petit problème. Pouvez-vous réessayer ?",
          type: "bot",
          timestamp: new Date().toISOString()
        }
        setMessages(prev => [...prev, errorMessage])
      } finally {
        setIsTyping(false)
      }
    }, 800 + Math.random() * 800)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
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
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        </div>
                        
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
                    onClick={handleSendMessage}
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