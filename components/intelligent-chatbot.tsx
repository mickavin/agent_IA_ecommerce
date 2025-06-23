"use client"

import { useState } from "react"
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
  Sparkles
} from "lucide-react"
import { ChatbotVisualConfig, ChatbotPersonality } from "@/lib/types"

interface IntelligentChatbotProps {
  className?: string
  visualConfig?: ChatbotVisualConfig
  personality?: ChatbotPersonality
  chatbotName?: string
  showSparkles?: boolean
}

// Configuration par défaut (design actuel)
const defaultVisualConfig: ChatbotVisualConfig = {
  primaryColor: "#3B82F6",
  secondaryColor: "#EFF6FF", 
  textColor: "#1F2937",
  backgroundColor: "#FFFFFF",
  borderRadius: "Arrondi",
  position: "Bas droite",
  size: "Standard",
  welcomeMessage: "👋 Salut ! Je suis votre assistant mode personnel ! Comment puis-je vous aider à trouver le produit parfait aujourd'hui ?",
  placeholder: "Que cherchez-vous ?"
}

const defaultPersonality: ChatbotPersonality = {
  tone: "Amical",
  formality: "Tutoiement", 
  verbosity: "Détaillé",
  empathy: "Élevée",
  proactivity: "Proactif"
}

export function IntelligentChatbot({ 
  className = "", 
  visualConfig = defaultVisualConfig,
  personality = defaultPersonality,
  chatbotName = "Assistant Younzee",
  showSparkles = true
}: IntelligentChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([
    {
      id: "welcome",
      content: visualConfig.welcomeMessage,
      type: "bot",
      timestamp: new Date().toISOString()
    }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  // Configuration visuelle dynamique
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
    if (normalized.includes('conseil') || normalized.includes('recommande')) {
      return 'recommendation'
    }
    if (normalized.includes('prix') || normalized.includes('budget')) {
      return 'price'
    }
    if (normalized.includes('taille')) {
      return 'size'
    }
    
    return 'general'
  }

  // Extraction d'entités
  const extractEntities = (message: string) => {
    const entities: any = {}
    const normalized = message.toLowerCase()

    // Couleurs
    const colors = ['noir', 'blanc', 'rouge', 'bleu', 'vert']
    colors.forEach(color => {
      if (normalized.includes(color)) entities.color = color
    })

    // Tailles
    const sizes = ['xs', 's', 'm', 'l', 'xl']
    sizes.forEach(size => {
      if (normalized.includes(size)) entities.size = size.toUpperCase()
    })

    return entities
  }

  // Génération de réponse intelligente personnalisée
  const generateResponse = async (userMessage: string) => {
    const intent = analyzeIntent(userMessage)
    const entities = extractEntities(userMessage)
    
    try {
      const { ProductService } = await import('@/lib/services/api.service')
      
      let response = ''

      // Adaptation du ton selon la personnalité
      const getGreeting = () => {
        if (personality.formality === "Vouvoiement") {
          return personality.tone === "Professionnel" ? "Bien sûr" : "Certainement"
        } else {
          return personality.tone === "Amical" ? "Bien sûr" : "D'accord"
        }
      }

      const getEmoji = () => {
        return personality.tone === "Humoristique" ? "😄" : 
               personality.tone === "Amical" ? "😊" : ""
      }

      switch (intent) {
        case 'search':
          const searchFilters: Record<string, string[]> = {}
          if (entities.color) searchFilters.colors = [entities.color]
          if (entities.size) searchFilters.sizes = [entities.size]

          const result = await ProductService.getAll(1, 3, undefined, searchFilters)
          const products = result.data

          if (products.length > 0) {
            const verbosity = personality.verbosity === "Concis" ? "J'ai trouvé" : 
                            personality.verbosity === "Détaillé" ? "🔍 J'ai trouvé" :
                            "🔍 Excellente recherche ! J'ai trouvé"
            
            response = `${verbosity} ${products.length} produit(s) ${getEmoji()}\n\n`
            products.forEach((product: any, index: number) => {
              response += `${index + 1}. **${product.name}** - ${product.price}€\n`
              if (personality.verbosity === "Très détaillé" && product.colors) {
                response += `   Couleurs disponibles: ${product.colors.join(', ')}\n`
              }
            })
          } else {
            response = personality.empathy === "Élevée" ? 
              "😔 Désolé, aucun produit trouvé avec ces critères. Puis-je vous aider autrement ?" :
              "Aucun produit trouvé avec ces critères."
          }
          break

        case 'recommendation':
          const recResult = await ProductService.getAll(1, 3)
          const recommendations = recResult.data

          const recGreeting = personality.proactivity === "Très proactif" ? 
            "✨ J'ai sélectionné spécialement pour vous" :
            "✨ Mes recommandations"

          response = `${recGreeting} :\n\n`
          recommendations.slice(0, 3).forEach((product: any, index: number) => {
            response += `${['🏆', '⭐', '💎'][index]} **${product.name}** - ${product.price}€\n`
          })
          break

        case 'price':
          response = personality.verbosity === "Concis" ?
            "💡 T-shirts: 29€+, Sweatshirts: 49€+" :
            "💡 Nos prix :\n🏷️ T-shirts : à partir de 29€\n🏷️ Sweatshirts : à partir de 49€"
          break

        case 'size':
          response = personality.verbosity === "Concis" ?
            "📏 XS: 32-34, S: 36-38, M: 40-42" :
            "📏 Guide des tailles :\n• XS: 32-34 | S: 36-38 | M: 40-42"
          break

        default:
          const helpMessage = personality.formality === "Vouvoiement" ?
            "😊 Comment puis-je vous aider avec vos achats ?" :
            "😊 Comment je peux t'aider avec tes achats ?"
          response = helpMessage
          break
      }

      return response
    } catch (error) {
      return personality.empathy === "Élevée" ? 
        "😅 Désolé, petit problème technique. Réessayez !" :
        "Erreur technique, réessayez."
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = {
      id: `user-${Date.now()}`,
      content: inputMessage,
      type: "user",
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)

    setTimeout(async () => {
      const botResponse = await generateResponse(userMessage.content)
      
      setMessages(prev => [...prev, {
        id: `bot-${Date.now()}`,
        content: botResponse,
        type: "bot",
        timestamp: new Date().toISOString()
      }])
      
      setIsTyping(false)
    }, 1000)
  }

  // Styles dynamiques basés sur la configuration
  const primaryBg = { backgroundColor: visualConfig.primaryColor }
  const secondaryBg = { backgroundColor: visualConfig.secondaryColor }
  const textColor = { color: visualConfig.textColor }
  const bgColor = { backgroundColor: visualConfig.backgroundColor }

  return (
    <div className={`fixed ${positionClass} z-50 ${className}`}>
      {!isOpen ? (
        <div 
          className={`inline-flex p-4 shadow-lg cursor-pointer transform hover:scale-105 transition-transform ${borderRadiusClass === "rounded-none" ? "rounded-full" : borderRadiusClass} relative`}
          style={primaryBg}
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="h-6 w-6 text-white" />
          {showSparkles && (
            <Sparkles className="h-3 w-3 text-white absolute -top-1 -right-1 animate-pulse" />
          )}
        </div>
      ) : (
        <div className={`${sizeConfig.width} ${sizeConfig.height} ${borderRadiusClass} shadow-xl overflow-hidden flex flex-col`} style={bgColor}>
          {/* Header personnalisé */}
          <div 
            className="p-4 text-white flex items-center justify-between"
            style={primaryBg}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                  <Bot className="h-4 w-4 text-white" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{chatbotName}</div>
                <div className="text-xs opacity-90">
                  {personality.tone === "Professionnel" ? "Assistant professionnel" : "Assistant Mode IA"}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Messages avec style personnalisé */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message: any) => (
                <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.type === 'bot' && (
                    <Avatar className="h-6 w-6 mt-1">
                      <AvatarFallback style={primaryBg}>
                        <Bot className="h-3 w-3 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[80%] ${message.type === 'user' ? 'order-1' : ''}`}>
                    <div 
                      className={`${borderRadiusClass} px-3 py-2 text-sm`}
                      style={message.type === 'user' 
                        ? { ...primaryBg, color: '#ffffff' }
                        : { ...secondaryBg, ...textColor }
                      }
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                  
                  {message.type === 'user' && (
                    <Avatar className="h-6 w-6 mt-1 order-2">
                      <AvatarFallback style={secondaryBg}>
                        <User className="h-3 w-3" style={textColor} />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-6 w-6 mt-1">
                    <AvatarFallback style={primaryBg}>
                      <Bot className="h-3 w-3 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div className={`${borderRadiusClass} px-3 py-2`} style={secondaryBg}>
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
          
          {/* Input personnalisé */}
          <div className="p-4 border-t" style={visualConfig.backgroundColor !== "#FFFFFF" ? { backgroundColor: "rgba(255,255,255,0.05)" } : {}}>
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={visualConfig.placeholder}
                className={`flex-1 ${borderRadiusClass}`}
                style={textColor}
                disabled={isTyping}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className={borderRadiusClass}
                style={primaryBg}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Suggestions personnalisées selon la personnalité */}
            <div className="flex gap-2 mt-2">
              {personality.proactivity === "Très proactif" ? 
                ['Recommandations', 'Nouveautés', 'Tendances'].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setInputMessage(suggestion)}
                    disabled={isTyping}
                  >
                    {suggestion}
                  </Button>
                )) :
                ['Rechercher', 'Prix', 'Tailles'].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setInputMessage(suggestion)}
                    disabled={isTyping}
                  >
                    {suggestion}
                  </Button>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
