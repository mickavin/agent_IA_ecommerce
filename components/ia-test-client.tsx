"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Bot, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Zap,
  MessageSquare,
  Settings,
  TrendingUp,
  Clock,
  Target
} from "lucide-react"

interface TestResult {
  message: string
  response?: any
  error?: string
  timestamp: string
  aiType?: string
  confidence?: number
  processingTime?: number
}

export function IATestClient() {
  const [testMessage, setTestMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [selectedExample, setSelectedExample] = useState("")
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Personnalité par défaut pour les tests
  const selectedPersonality = {
    tone: "Amical",
    formality: "Tutoiement", 
    verbosity: "Détaillé",
    empathy: "Élevée",
    proactivity: "Proactif"
  }

  const exampleMessages = [
    {
      category: "FAQ",
      message: "Comment puis-je retourner un produit ?",
      description: "Teste l'IA FAQ pour les questions fréquentes"
    },
    {
      category: "Outfit",
      message: "Je veux une tenue élégante pour une soirée d'été",
      description: "Teste l'IA recommandation d'outfits complets"
    },
    {
      category: "Produit",
      message: "Cherche un sweatshirt noir en taille L sous 60€",
      description: "Teste l'IA recommandation de produits individuels"
    },
    {
      category: "Général",
      message: "Bonjour, pouvez-vous m'aider ?",
      description: "Message général pour tester le routage"
    }
  ]

  const handleTest = async () => {
    if (!testMessage.trim() || isLoading) return

    setIsLoading(true)
    const startTime = Date.now()

    try {
      const response = await fetch('/api/ai/master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testMessage.trim(),
          context: {
            conversationHistory: testResults.slice(-3).map(result => ({
              id: `test-${result.timestamp}`,
              content: result.message,
              type: 'user',
              timestamp: result.timestamp
            })),
            userPreferences: {
              budget: { min: 0, max: 200 },
              sizes: ['M', 'L'],
              colors: ['Noir', 'Blanc', 'Bleu']
            },
            userId: `test-user-${Date.now()}`
          },
          chatbotConfig: {
            personality: {
              tone: selectedPersonality.tone,
              formality: selectedPersonality.formality,
              verbosity: selectedPersonality.verbosity,
              empathy: selectedPersonality.empathy,
              proactivity: selectedPersonality.proactivity
            }
          }
        })
      })

      const processingTime = Date.now() - startTime
      const data = await response.json()

      const result: TestResult = {
        message: testMessage,
        timestamp: new Date().toISOString(),
        processingTime
      }

      if (data.success) {
        result.response = data.response
        result.aiType = data.response.metadata?.aiType
        result.confidence = data.response.metadata?.confidence
      } else {
        result.error = data.error || 'Erreur inconnue'
      }

      setTestResults(prev => [result, ...prev.slice(0, 9)]) // Garde les 10 derniers
      setTestMessage("")

    } catch (error: any) {
      const result: TestResult = {
        message: testMessage,
        error: `Erreur réseau: ${error.message}`,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      }
      setTestResults(prev => [result, ...prev.slice(0, 9)])
    } finally {
      setIsLoading(false)
    }
  }

  const getAITypeBadge = (aiType?: string) => {
    const config = {
      'faq': { label: 'FAQ', color: 'bg-blue-100 text-blue-800' },
      'outfit_recommendation': { label: 'Outfit', color: 'bg-purple-100 text-purple-800' },
      'individual_clothing_recommendation': { label: 'Produit', color: 'bg-green-100 text-green-800' }
    }
    
    const typeConfig = config[aiType as keyof typeof config] || 
                       { label: aiType || 'Inconnu', color: 'bg-gray-100 text-gray-800' }
    
    return (
      <Badge className={`text-xs ${typeConfig.color}`}>
        {typeConfig.label}
      </Badge>
    )
  }

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null
    
    const percentage = Math.round(confidence * 100)
    const color = percentage >= 80 ? 'bg-green-100 text-green-800' :
                  percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
    
    return (
      <Badge className={`text-xs ${color}`}>
        {percentage}%
      </Badge>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header avec informations sur la migration */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">IA Master - Test Client</h1>
            <p className="text-muted-foreground">
              Nouvelle architecture d'IA modulaire avec routage intelligent
            </p>
          </div>
        </div>

        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            ✅ <strong>Migration terminée !</strong> Toutes les anciennes API de chatbot ont été migrées vers l'architecture IA Master. 
            L'IA route automatiquement vers 3 spécialistes : FAQ, Recommandations d'outfits, et Produits individuels.
          </AlertDescription>
        </Alert>
      </div>

      <Tabs defaultValue="test" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="test">🧪 Test Interface</TabsTrigger>
          <TabsTrigger value="features">✨ Nouvelles Fonctionnalités</TabsTrigger>
          <TabsTrigger value="migration">🔄 Guide Migration</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-6">
          {/* Interface de test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Interface de Test IA Master
              </CardTitle>
              <CardDescription>
                Testez la nouvelle architecture avec routage intelligent vers les 3 IA spécialisées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Exemples prédéfinis */}
              <div>
                <label className="text-sm font-medium mb-2 block">Exemples de test :</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {exampleMessages.map((example, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-left justify-start h-auto p-3"
                      onClick={() => setTestMessage(example.message)}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {example.category}
                          </Badge>
                        </div>
                        <div className="text-sm font-medium">{example.message}</div>
                        <div className="text-xs text-muted-foreground">
                          {example.description}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Interface de saisie */}
              <div className="flex gap-2">
                <Input
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Tapez votre message de test..."
                  onKeyPress={(e) => e.key === 'Enter' && handleTest()}
                  disabled={isLoading}
                />
                <Button onClick={handleTest} disabled={!testMessage.trim() || isLoading}>
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Test...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Tester
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Résultats */}
          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Résultats des Tests</CardTitle>
                <CardDescription>
                  Historique des appels avec métadonnées détaillées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {testResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium mb-1">📨 {result.message}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(result.timestamp).toLocaleString('fr-FR')}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {result.aiType && getAITypeBadge(result.aiType)}
                          {result.confidence && getConfidenceBadge(result.confidence)}
                          {result.processingTime && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {result.processingTime}ms
                            </Badge>
                          )}
                        </div>
                      </div>

                      {result.error ? (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{result.error}</AlertDescription>
                        </Alert>
                      ) : result.response ? (
                        <div className="bg-muted rounded-lg p-3">
                          <div className="text-sm mb-2">
                            🤖 <strong>Réponse :</strong>
                          </div>
                          <div className="text-sm whitespace-pre-wrap">
                            {result.response.content}
                          </div>
                          {result.response.metadata?.recommendations?.length > 0 && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              💡 {result.response.metadata.recommendations.length} recommandation(s) générée(s)
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  IA FAQ Spécialisée
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✅ Base de 5 FAQ prédéfinies</li>
                  <li>✅ Recherche sémantique avancée</li>
                  <li>✅ Calcul de similarité textuelle</li>
                  <li>✅ Gestion de la popularité</li>
                  <li>✅ Seuil de confiance : 40%</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  IA Recommandation Outfits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✅ Génération de tenues complètes</li>
                  <li>✅ Règles de style par occasion</li>
                  <li>✅ Harmonie des couleurs</li>
                  <li>✅ Filtrage par budget/préférences</li>
                  <li>✅ Seuil de confiance : 50%</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  IA Produits Individuels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✅ Recommandations de produits spécifiques</li>
                  <li>✅ Scoring avancé multi-critères</li>
                  <li>✅ Extraction d'entités avancée</li>
                  <li>✅ Filtrage intelligent</li>
                  <li>✅ Seuil de confiance : 40%</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-orange-500" />
                  IA Master - Orchestrateur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✅ Routage intelligent multi-critères</li>
                  <li>✅ Gestion d'erreurs avec fallback</li>
                  <li>✅ Logging et analytics intégrés</li>
                  <li>✅ Configuration dynamique</li>
                  <li>✅ Timeout configurable (30s)</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="migration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>✅ Migration Réalisée</CardTitle>
              <CardDescription>
                Tous les composants ont été automatiquement migrés vers l'IA Master
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span><strong>API Routes :</strong> /api/ai/master, /api/ai/faq, /api/ai/articles, /api/ai/outfits, /api/chat, /api/chat-stream</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span><strong>Services :</strong> IntelligentChatbotService → IA Master wrapper</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span><strong>Composants React :</strong> intelligent-chatbot.tsx → API IA Master</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span><strong>Widget Public :</strong> chatbot-generator.js → API IA Master</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span><strong>Pages Admin :</strong> Test des bots → API IA Master</span>
                </div>
              </div>

              <Alert>
                <MessageSquare className="h-4 w-4" />
                <AlertDescription>
                  <strong>Rétrocompatibilité garantie :</strong> Les anciennes APIs redirigent automatiquement vers l'IA Master. 
                  Aucune modification n'est requise côté client.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📊 Endpoints disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><code className="bg-muted px-2 py-1 rounded">POST /api/ai/master</code> - Point d'entrée principal</div>
                <div><code className="bg-muted px-2 py-1 rounded">POST /api/ai/faq</code> - IA spécialisée FAQ</div>
                <div><code className="bg-muted px-2 py-1 rounded">POST /api/ai/articles</code> - IA spécialisée Articles</div>
                <div><code className="bg-muted px-2 py-1 rounded">POST /api/ai/outfits</code> - IA spécialisée Outfits</div>
                <div><code className="bg-muted px-2 py-1 rounded">POST /api/chat</code> - API de compatibilité</div>
                <div><code className="bg-muted px-2 py-1 rounded">POST /api/chat-stream</code> - API de compatibilité streaming</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 