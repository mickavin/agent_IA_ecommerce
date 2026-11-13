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

interface ChatMessage {
  id: string
  content: string
  type: 'user' | 'bot'
  timestamp: string
  metadata?: {
    intent?: string
    confidence?: number
    aiType?: string
    processingTime?: number
  }
}

const defaultVisualConfig: ChatbotVisualConfig = {
  primaryColor: "#ff6f61",
  secondaryColor: "#f3f4f6",
  textColor: "#1f2937",
  backgroundColor: "#ffffff",
  borderRadius: "Arrondi",
  position: "Bas droite",
  size: "Standard",
  welcomeMessage: "Salut ! Je suis votre assistant IA intelligent ! 👋 Comment puis-je vous aider aujourd'hui ?",
  placeholder: "Tapez votre message..."
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
  chatbotName = "Assistant Wikzy",
  showSparkles = true
}: IntelligentChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      content: `Salut ! Je suis ${chatbotName}, votre assistant IA intelligent ! 👋 Comment puis-je vous aider aujourd'hui ?`,
      type: "bot",
      timestamp: new Date().toISOString(),
      metadata: {
        intent: 'greeting',
        confidence: 1.0,
        aiType: 'faq'
      }
    }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Styles basés sur la configuration visuelle
  const primaryBg = { backgroundColor: visualConfig.primaryColor }
  const secondaryBg = { backgroundColor: visualConfig.secondaryColor }
  const textColor = { color: visualConfig.textColor }
  const borderRadiusClass = `rounded-${visualConfig.borderRadius}`

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: message,
      type: 'user',
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: {
            conversationHistory: messages.slice(-5), // Derniers 5 messages pour contexte
            userPreferences: {},
            userId: `session-${Date.now()}`
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

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && data.response) {
        const botMessage: ChatMessage = {
          id: data.response.id,
          content: data.response.content,
          type: 'bot',
          timestamp: data.response.timestamp,
          metadata: data.response.metadata
        }
        setMessages(prev => [...prev, botMessage])
      } else {
        throw new Error(data.error || 'Erreur inconnue')
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      setError(error instanceof Error ? error.message : 'Erreur de communication')
      
      // Message d'erreur pour l'utilisateur
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        type: 'bot',
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

  const getAITypeBadge = (aiType?: string) => {
    if (!aiType) return null
    
    const badgeConfig = {
      'faq': { label: 'FAQ', color: 'bg-blue-100 text-blue-800' },
      'outfit_recommendation': { label: 'Outfit', color: 'bg-purple-100 text-purple-800' },
      'individual_clothing_recommendation': { label: 'Produit', color: 'bg-green-100 text-green-800' },
      'error': { label: 'Erreur', color: 'bg-red-100 text-red-800' }
    }
    
    const config = badgeConfig[aiType as keyof typeof badgeConfig] || 
                   { label: aiType, color: 'bg-gray-100 text-gray-800' }
    
    return (
      <Badge className={`text-xs ${config.color} ml-2`}>
        {config.label}
      </Badge>
    )
  }

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full h-12 w-12 shadow-lg"
          style={primaryBg}
        >
          <MessageSquare className="h-6 w-6 text-white" />
          {showSparkles && <Sparkles className="h-3 w-3 text-white absolute -top-1 -right-1" />}
        </Button>
      </div>
    )
  }

  return (
    <div className={`fixed ${isExpanded ? 'inset-4' : 'bottom-4 right-4 w-80 h-96'} z-50 ${className}`}>
             <div 
         className={`bg-white rounded-lg shadow-xl border flex flex-col h-full`}
         style={{ 
           borderColor: visualConfig.primaryColor
         }}
       >
        {/* Header */}
        <div 
          className={`${borderRadiusClass} ${borderRadiusClass.replace('rounded', 'rounded-t')} p-3 flex items-center justify-between`}
          style={primaryBg}
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-white text-xs">
                <Bot className="h-3 w-3" style={primaryBg} />
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-white text-sm">{chatbotName}</span>
            {showSparkles && <Sparkles className="h-4 w-4 text-white" />}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0 text-white hover:bg-white/20"
            >
              {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMinimized(true)}
              className="h-6 w-6 p-0 text-white hover:bg-white/20"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message: ChatMessage) => (
              <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.type === 'bot' && (
                  <Avatar className="h-6 w-6 mt-1 flex-shrink-0">
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
                  
                  {/* Métadonnées pour les messages bot */}
                  {message.type === 'bot' && message.metadata && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{getFormattedTime(message.timestamp)}</span>
                      {getAITypeBadge(message.metadata.aiType)}
                      {message.metadata.confidence && (
                        <span className="text-xs">
                          Confiance: {Math.round(message.metadata.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {message.type === 'user' && (
                  <Avatar className="h-6 w-6 mt-1 order-2 flex-shrink-0">
                    <AvatarFallback style={secondaryBg}>
                      <User className="h-3 w-3" style={textColor} />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {/* Indicateur de chargement */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-6 w-6 mt-1">
                  <AvatarFallback style={primaryBg}>
                    <Bot className="h-3 w-3 text-white" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex space-x-1 p-3 rounded-lg" style={secondaryBg}>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSendMessage(inputMessage)}
              disabled={!inputMessage.trim() || isLoading}
              style={primaryBg}
              className="text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
