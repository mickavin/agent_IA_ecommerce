"use client"

import { useState, useRef, useEffect } from "react"
import { useParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import ReactMarkdown from "react-markdown";

import {
  Bot,
  Send,
  User,
  Settings,
  Play,
  Pause,
  RotateCcw,
  MessageSquare,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Sparkles
} from "lucide-react"
import { ChatMessage, Chatbot, Product } from "@/lib/types"
import { IntelligentChatbot } from "@/components/intelligent-chatbot"
import { supabase } from "@/lib/supabase"
import { ProductCarousel } from "@/components/product-carousel"

// Simulation de données du chatbot
const mockChatbot: Chatbot = {
  id: "1",
  name: "Assistant Younzee",
  description: "Chatbot intelligent avec recommandations produits",
  status: "En test",
  createdAt: "2024-01-15",
  updatedAt: "2024-01-20",
  personality: {
    tone: "Amical",
    formality: "Tutoiement",
    verbosity: "Détaillé",
    empathy: "Élevée",
    proactivity: "Proactif"
  },
  visualConfig: {
    primaryColor: "#3B82F6",
    secondaryColor: "#EFF6FF",
    textColor: "#1F2937",
    backgroundColor: "#FFFFFF",
    borderRadius: "Arrondi",
    position: "Bas droite",
    size: "Standard",
    welcomeMessage: "Salut ! Comment puis-je t'aider avec tes achats aujourd'hui ?",
    placeholder: "Tape ton message..."
  },
  dataSources: [],
  conversationsCount: 0,
  avgResponseTime: 850,
  satisfactionRate: 0
}

export default function TestBotPage() {
  const params = useParams()
  const botId = params?.id as string
  const [chatbot] = useState<Chatbot>(mockChatbot)
  const [suggestions, setSuggestions] = useState<string[]>([
    'Je cherche un t-shirt noir en M',
    'Conseille-moi une tenue pour l\'hiver',
    'Quelles sont vos dernières tendances ?',
    'J\'ai un budget de 100€, que recommandes-tu ?',
    'Guide des tailles pour les pantalons'
  ])
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      content: "🤖 Bonjour, Je suis votre Styliste Personnel. Comment je peux vous aider aujourd'hui ? Donnez moi une catégorie de produit, une couleur et votre taille pour que je puisse vous proposer des articles adaptés à vous.",
      type: "bot",
      timestamp: new Date().toISOString()
    }
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [dataProducts, setDataProducts] = useState<Product[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [sessionStats, setSessionStats] = useState({
    messagesCount: 0,
    avgResponseTime: 0,
    productsRecommended: 0,
    intentAccuracy: 0
  })
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    const fetchChatbot = async () => {
      if (!botId) return
      if (supabase) {
      const { data, error } = await supabase?.from('chatbots')
      .select('*')
      .eq('id', botId)
      .single()
      
      }
    }
    fetchChatbot()
  }, [])


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
          chatbotId: botId,
          context: {
            conversationHistory: messages.slice(-10),
            userPreferences: {},
            userId: `test-${botId}-${Date.now()}`
          },
          chatbotConfig: {}
        })
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      
        const botMessage = {
          id: data?.response?.id || `bot-${Date.now()}`,
          content: data?.response?.content || data?.response?.message || data?.message,
          type: 'bot' as const,
          timestamp: new Date().toISOString(),
          metadata: data?.response?.metadata || {}
        }
        setMessages(prev => [...prev, botMessage])
        setSuggestions(data?.response?.suggestions || data?.suggestions || [])
        setDataProducts(data?.response?.products || data?.products || [])
        console.log('botMessage', data)
        } catch (error) {
      console.error('Erreur test chatbot:', error)
      const errorMessage = {
        id: `error-${Date.now()}`,
        content: "❌ Erreur lors du test. Vérifiez la console pour plus de détails.",
        type: 'bot' as const,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

    const resetConversation = () => {
    setMessages([{
      id: "welcome-reset",
      content: "🔄 Nouvelle session démarrée ! Je suis votre assistant IA mode. N'hésitez pas à me poser des questions sur nos produits, demander des conseils de style ou des recommandations personnalisées !",
      type: "bot",
      timestamp: new Date().toISOString()    
    }])
    setSessionStats({
      messagesCount: 0,
      avgResponseTime: 0,
      productsRecommended: 0,
      intentAccuracy: 0
    })
  }

  const getMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title={`Test IA - ${chatbot.name}`}
        description="Testez votre chatbot intelligent avec accès aux données produits"
        backHref="/bots"
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetConversation}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurer
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Interface de chat IA */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col overflow-y-auto">
            <CardHeader className="sticky top-0 bg-stone-900" style={{zIndex: 50}}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600">
                    <AvatarFallback>
                      <Bot className="h-4 w-4 text-white" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {chatbot.name}
                      <Sparkles className="h-4 w-4 text-purple-500" />
                    </CardTitle>
                    <CardDescription>Propulsé par Younzee - Agent IA expert en mode</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge 
                    variant="outline" 
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    IA Item
                  </Badge>
                  
                </div>
              </div>
            </CardHeader>
            
            {/* Zone des messages avec IA */}
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 pr-4 overflow-x-hidden relative p-6">
                <div className="space-y-4">
                  {!isTyping && messages.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {message.type === 'bot' && (
                        <Avatar className="h-8 w-8 mt-1 bg-gradient-to-br from-blue-500 to-purple-600">
                          <AvatarFallback>
                            <Bot className="h-4 w-4 text-white" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`max-w-[80%] ${message.type === 'user' ? 'order-1' : ''}`}>
                        <div 
                          className={`rounded-lg px-4 py-3 ${
                            message.type === 'user' 
                              ? 'text-white ml-auto bg-gradient-to-r from-blue-500 to-purple-600' 
                              : 'text-gray-800 bg-gray-100'
                          }`}
                        >
                          <p id="message-content" className="text-sm whitespace-pre-wrap">
                            <ReactMarkdown   
                            components={{
                              img: ({ node, ...props }) => (
                                <img
                                  {...props}
                                  style={{ height: '180px', borderRadius: '12px', objectFit: 'cover', marginBottom: '10px' }}
                                  alt={props.alt || ''}
                                />
                              ),
                            }}                         
                            >{message.content}</ReactMarkdown>
                            {/* Curseur clignotant pendant le streaming */}
                            {message.type === 'bot' && isStreaming && message.content && (
                              <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
                            )}
                          </p>
                          <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                            <span>{getMessageTime(message.timestamp)}</span>
                            
                          </div>
                        </div>
                        
                        {message.type === 'bot' && (
                          <div className="flex gap-1 mt-2">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {message.type === 'user' && (
                        <Avatar className="h-8 w-8 mt-1 order-2">
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
            
                      
                 
                    </div>
                  ))}
                  {(dataProducts.length > 0 && dataProducts[0]?.colors?.length) && (
                    <ProductCarousel products={dataProducts} />
                  )}
                  {/* <div className="flex gap-2 mt-2 flex-col">
                  <Avatar className="h-8 w-8 mt-1 bg-gradient-to-br from-blue-500 to-purple-600">
                      <AvatarFallback>
                        <Bot className="h-4 w-4 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex mt-2 overflow-x-auto justify-center flex-row w-full" style={{paddingLeft: '220px'}}>
                          {['item', 'outfit', 'item', 'outfit'].map((recommendation) => (
                            <div className="bg-gray-100 rounded-lg px-4 py-3 mr-6 h-48 w-48 flex items-center justify-center">
                              <div className="flex gap-1 items-center">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                <br/>
                                <span className="text-xs text-gray-500 ml-2">Affichage en cours...</span>
                              </div>
                            </div>
                          ))}
                        </div>
                  </div> */}
                  {/* <div className="flex gap-2 mt-2 flex-col">
                  <Avatar className="h-8 w-8 mt-1 bg-gradient-to-br from-blue-500 to-purple-600">
                      <AvatarFallback>
                        <Bot className="h-4 w-4 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex mt-2 overflow-x-auto justify-center flex-row w-full" style={{paddingLeft: '220px'}}>
                          {['item', 'outfit', 'item', 'outfit'].map((recommendation, index) => (
                            <div className="bg-gray-100 rounded-lg mr-6 h-56 w-48 flex overflow-hidden flex-col">
                              <div className="flex gap-1 items-center h-32 w-48 bg-white rounded-lg">
                              <img 
                              src={`https://cdn.shopify.com/s/files/1/0806/4814/3128/products/bonnetbriqueetorangecitrouillehuguette_1491cfbf-06f7-4dde-971f-190c4d58b419.jpg?v=1708512903`} 
                              alt={`Recommendation${index}`} 
                              className="h-100 w-100" 
                              style={{objectFit: 'cover', objectPosition: 'center', marginLeft: '-15%', marginRight: '-15%'}}
                              />
                              
                              </div>
                              <div className="flex flex-col gap-1 items-center h-32 w-48 bg-white rounded-lg text-black">
                                <div className="flex flex-row gap-1 items-center">
                                  <span className="text-xs text-gray-500 ml-2">Bonnet</span>
                                  <span className="text-xs text-gray-500 ml-2">Brique et orange</span>
                                </div>
                                <div className="flex flex-row gap-1 items-center">
                                <span className="text-xs text-gray-500 ml-2">Citrouille</span>
                                <span className="text-xs text-gray-500 ml-2">Huguette</span> 
                                <span className="text-xs text-gray-500 ml-2">Huguette</span>
                                <span className="text-xs text-gray-500 ml-2">Huguette</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                  </div> */}
                  {isTyping && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600">
                        <AvatarFallback>
                          <Bot className="h-4 w-4 text-white" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 rounded-lg px-4 py-3">
                        <div className="flex gap-1 items-center">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          <span className="text-xs text-gray-500 ml-2">IA analyse...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                </div>
              </ScrollArea>
              
              <div className="mt-4 border-t pt-4 sticky bottom-0 z-50 p-6 bg-stone-900" style={{zIndex: 50}}>
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
                    placeholder="Ex: 'Je cherche un sweat noir en M sous 60€' ou 'Conseille-moi une tenue pour l'hiver'"
                    className="flex-1"
                    disabled={isTyping || isStreaming || isLoading}
                  />
                  <Button 
                    onClick={(e) => { e.preventDefault(); handleSendMessage(inputMessage); }}
                    disabled={!inputMessage.trim() || isTyping || isStreaming || isLoading}
                    className="bg-gradient-to-r from-blue-500 to-purple-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Suggestions intelligentes */}
                <div className="flex gap-2 mt-2 overflow-x-auto">
                  {suggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="text-xs whitespace-nowrap"
                      onClick={(e) => { e.preventDefault(); setInputMessage(suggestion); }}
                      disabled={isTyping || isStreaming || isLoading}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panneau de statistiques IA */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Performance IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Messages:</span>
                  <span className="font-medium">{sessionStats.messagesCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Temps réponse:</span>
                  <span className="font-medium">{sessionStats.avgResponseTime.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Produits suggérés:</span>
                  <span className="font-medium">{sessionStats.productsRecommended}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Précision IA:</span>
                  <span className="font-medium">{(sessionStats.intentAccuracy * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Mode streaming:</span>
                  <span className="font-medium flex items-center gap-1">
                    {isStreaming ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Active
                      </>
                    ) : (
                      "Prêt"
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Configuration IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">CAPACITÉS IA AVANCÉES</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Recherche intelligente</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Conseils de style</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Recommandations personnalisées</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Analyse contextuelle</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Mémoire conversation</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Filtrage par budget</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      <span>Réponse en temps réel</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Widget chatbot flottant pour test */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Test Widget</CardTitle>
                <CardDescription>Testez le chatbot en mode widget</CardDescription>
              </CardHeader>
              <CardContent>
                <IntelligentChatbot />
                <p className="text-xs text-muted-foreground mt-2">
                  Cliquez sur l'icône en bas à droite pour tester le widget (utilise aussi l'API OpenAI)
                </p>
              </CardContent>
            </Card>         
          </div>
        </div>
      </div>
    </div>
  )
} 