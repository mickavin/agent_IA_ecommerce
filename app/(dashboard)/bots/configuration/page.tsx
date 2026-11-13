'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Save, Eye, Copy, Download, Palette, MessageCircle, Settings, Code, BarChart3, Bot, Sparkles, Zap, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'

interface ChatbotConfig {
  id: string
  name: string
  description: string
  status: 'Actif' | 'Inactif' | 'En test' | 'Maintenance'
  personality: {
    tone: string
    formality: string
    verbosity: string
    empathy: string
    proactivity: string
  }
  visualConfig: {
    primaryColor: string
    secondaryColor: string
    textColor: string
    backgroundColor: string
    borderRadius: string
    position: string
    size: string
    avatar?: string
    welcomeMessage: string
    placeholder: string
  }
  dataSources: Array<{
    id: string
    type: string
    name: string
    isEnabled: boolean
    priority: number
  }>
  metrics: {
    totalConversations: number
    satisfactionRate: number
    avgResponseTime: number
    activeWidgets: number
  }
}

// Composant interne qui utilise useSearchParams
function ChatbotConfigurationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const botId = searchParams?.get('id')
  
  // Vérification de l'ID
  if (!botId) {
    //router.push('/bots')
    return null
  }
  
  const [config, setConfig] = useState<ChatbotConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    loadChatbotConfig()
  }, [botId])

  const loadChatbotConfig = async () => {
    try {
      setLoading(true)
      // Données simulées pour la démonstration
      const mockConfig: ChatbotConfig = {
        id: botId || '1',
        name: 'Assistant Wikzy',
        description: 'Assistant IA spécialisé dans la mode et les conseils vestimentaires',
        status: 'Actif',
        personality: {
          tone: 'Amical',
          formality: 'Tutoiement',
          verbosity: 'Détaillé',
          empathy: 'Élevée',
          proactivity: 'Proactif'
        },
        visualConfig: {
          primaryColor: '#2563eb',
          secondaryColor: '#64748b',
          textColor: '#1f2937',
          backgroundColor: '#ffffff',
          borderRadius: '12',
          position: 'bottom-right',
          size: 'standard',
          welcomeMessage: 'Bonjour ! Je suis votre conseiller mode IA. Comment puis-je vous aider aujourd\'hui ? 👗✨',
          placeholder: 'Posez-moi une question sur la mode...'
        },
        dataSources: [
          { id: '1', type: 'faq', name: 'Questions fréquentes', isEnabled: true, priority: 1 },
          { id: '2', type: 'products', name: 'Catalogue produits', isEnabled: true, priority: 2 },
          { id: '3', type: 'orders', name: 'Gestion commandes', isEnabled: true, priority: 3 },
          { id: '4', type: 'reviews', name: 'Avis clients', isEnabled: false, priority: 4 },
          { id: '5', type: 'blog', name: 'Articles de blog', isEnabled: false, priority: 5 }
        ],
        metrics: {
          totalConversations: 1234,
          satisfactionRate: 89,
          avgResponseTime: 1.2,
          activeWidgets: 3
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 800)) // Simule le chargement
      setConfig(mockConfig)
    } catch (error: any) {
      toast.error('Erreur lors du chargement: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const saveChatbotConfig = async () => {
    if (!config) return

    try {
      setSaving(true)
      // Simulation de la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success('✅ Configuration sauvegardée avec succès!')
    } catch (error: any) {
      toast.error('❌ Erreur lors de la sauvegarde: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const updatePersonality = (field: string, value: string) => {
    if (!config) return
    setConfig({
      ...config,
      personality: {
        ...config.personality,
        [field]: value
      }
    })
  }

  const updateVisualConfig = (field: string, value: string) => {
    if (!config) return
    setConfig({
      ...config,
      visualConfig: {
        ...config.visualConfig,
        [field]: value
      }
    })
  }

  const generateEmbedCode = () => {
    if (!config) return ''
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `<!-- Wikzy Chatbot - ${config.name} -->
<script src="${baseUrl}/chatbot-generator.js" 
  data-bot-id="${config.id}"
  data-color="${config.visualConfig.primaryColor}"
  data-bg-color="${config.visualConfig.backgroundColor}"
  data-text-color="${config.visualConfig.textColor}"
  data-position="${config.visualConfig.position}"
  data-size="${config.visualConfig.size}"
  data-welcome="${config.visualConfig.welcomeMessage}"
  data-placeholder="${config.visualConfig.placeholder}"
  data-border-radius="${config.visualConfig.borderRadius}">
</script>`
  }

  const copyEmbedCode = async () => {
    const code = generateEmbedCode()
    try {
      await navigator.clipboard.writeText(code)
      toast.success('📋 Code d\'intégration copié dans le presse-papiers!')
    } catch (error) {
      toast.error('❌ Erreur lors de la copie')
    }
  }

  const downloadScript = () => {
    const element = document.createElement('a')
    const file = new Blob([generateEmbedCode()], { type: 'text/html' })
    element.href = URL.createObjectURL(file)
    element.download = `wikzy-chatbot-${config?.id}.html`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    toast.success('📥 Script téléchargé!')
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
            <div className="col-span-4">
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Chatbot introuvable</h3>
              <p className="text-gray-600 mb-6">Le chatbot demandé n'existe pas ou a été supprimé.</p>
              <Button onClick={() => {}} size="lg">
                <Bot className="h-4 w-4 mr-2" />
                Retour à la liste
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* En-tête avec actions */}
      <PageHeader
        title="Configuration du Chatbot"
        description="Personnalisez le comportement et l'apparence de votre assistant IA"
        badge={
          <Badge variant={config.status === 'Actif' ? 'default' : 'secondary'} className="ml-2">
            {config.status}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Masquer aperçu' : 'Voir aperçu'}
            </Button>
            <Button onClick={saveChatbotConfig} disabled={saving} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-8">
        {/* Panneau de configuration principal */}
        <div className={`${showPreview ? 'col-span-8' : 'col-span-12'}`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 h-12">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Général</span>
              </TabsTrigger>
              <TabsTrigger value="personality" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Personnalité</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Apparence</span>
              </TabsTrigger>
              <TabsTrigger value="integration" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                <span className="hidden sm:inline">Intégration</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>

            {/* Onglet Général */}
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Informations générales
                  </CardTitle>
                  <CardDescription>
                    Configuration de base de votre assistant IA
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom du chatbot</Label>
                      <Input
                        id="name"
                        value={config.name}
                        onChange={(e) => setConfig({...config, name: e.target.value})}
                        placeholder="Assistant Wikzy"
                        className="font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Statut</Label>
                      <Select
                        value={config.status}
                        onValueChange={(value) => setConfig({...config, status: value as any})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Actif">🟢 Actif</SelectItem>
                          <SelectItem value="En test">🟠 En test</SelectItem>
                          <SelectItem value="Inactif">🔴 Inactif</SelectItem>
                          <SelectItem value="Maintenance">🟡 Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={config.description}
                      onChange={(e) => setConfig({...config, description: e.target.value})}
                      placeholder="Décrivez le rôle et les capacités de votre assistant IA..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Sources de données
                  </CardTitle>
                  <CardDescription>
                    Configurez les sources d'information de votre chatbot
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {config.dataSources.map((source) => (
                      <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <Switch
                            checked={source.isEnabled}
                            onCheckedChange={(checked) => {
                              const updatedSources = config.dataSources.map(s =>
                                s.id === source.id ? {...s, isEnabled: checked} : s
                              )
                              setConfig({...config, dataSources: updatedSources})
                            }}
                          />
                          <div>
                            <p className="font-medium text-gray-900">{source.name}</p>
                            <p className="text-sm text-gray-500 capitalize">
                              Type: {source.type} • Priorité: {source.priority}
                            </p>
                          </div>
                        </div>
                        <Badge variant={source.isEnabled ? 'default' : 'secondary'}>
                          {source.isEnabled ? 'Activé' : 'Désactivé'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Personnalité */}
            <TabsContent value="personality" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Configuration de la personnalité
                  </CardTitle>
                  <CardDescription>
                    Définissez le style de communication et le comportement de votre assistant
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Ton de communication</Label>
                      <Select
                        value={config.personality.tone}
                        onValueChange={(value) => updatePersonality('tone', value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Professionnel">👔 Professionnel</SelectItem>
                          <SelectItem value="Décontracté">😊 Décontracté</SelectItem>
                          <SelectItem value="Amical">🤗 Amical</SelectItem>
                          <SelectItem value="Expert">🎓 Expert</SelectItem>
                          <SelectItem value="Humoristique">😄 Humoristique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-medium">Niveau de formalité</Label>
                      <Select
                        value={config.personality.formality}
                        onValueChange={(value) => updatePersonality('formality', value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tutoiement">😊 Tutoiement (Tu)</SelectItem>
                          <SelectItem value="Vouvoiement">🎩 Vouvoiement (Vous)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-medium">Verbosité des réponses</Label>
                      <Select
                        value={config.personality.verbosity}
                        onValueChange={(value) => updatePersonality('verbosity', value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Concis">📝 Concis</SelectItem>
                          <SelectItem value="Détaillé">📚 Détaillé</SelectItem>
                          <SelectItem value="Très détaillé">📖 Très détaillé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-medium">Niveau d'empathie</Label>
                      <Select
                        value={config.personality.empathy}
                        onValueChange={(value) => updatePersonality('empathy', value)}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Faible">😐 Faible</SelectItem>
                          <SelectItem value="Moyenne">😊 Moyenne</SelectItem>
                          <SelectItem value="Élevée">🤗 Élevée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Comportement proactif</Label>
                    <Select
                      value={config.personality.proactivity}
                      onValueChange={(value) => updatePersonality('proactivity', value)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Réactif">⏳ Réactif (répond aux questions uniquement)</SelectItem>
                        <SelectItem value="Proactif">💡 Proactif (propose des suggestions)</SelectItem>
                        <SelectItem value="Très proactif">🚀 Très proactif (guide activement l'utilisateur)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Apparence */}
            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Personnalisation visuelle
                  </CardTitle>
                  <CardDescription>
                    Configurez l'apparence et le design de votre chatbot
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Couleurs */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg">Couleurs</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label>Couleur principale</Label>
                        <div className="flex gap-3">
                          <Input
                            type="color"
                            value={config.visualConfig.primaryColor}
                            onChange={(e) => updateVisualConfig('primaryColor', e.target.value)}
                            className="w-16 h-11 p-1 border-2"
                          />
                          <Input
                            value={config.visualConfig.primaryColor}
                            onChange={(e) => updateVisualConfig('primaryColor', e.target.value)}
                            placeholder="#2563eb"
                            className="font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Couleur d'arrière-plan</Label>
                        <div className="flex gap-3">
                          <Input
                            type="color"
                            value={config.visualConfig.backgroundColor}
                            onChange={(e) => updateVisualConfig('backgroundColor', e.target.value)}
                            className="w-16 h-11 p-1 border-2"
                          />
                          <Input
                            value={config.visualConfig.backgroundColor}
                            onChange={(e) => updateVisualConfig('backgroundColor', e.target.value)}
                            placeholder="#ffffff"
                            className="font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Position et taille */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg">Position et taille</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label>Position sur la page</Label>
                        <Select
                          value={config.visualConfig.position}
                          onValueChange={(value) => updateVisualConfig('position', value)}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bottom-right">↘️ Bas droite</SelectItem>
                            <SelectItem value="bottom-left">↙️ Bas gauche</SelectItem>
                            <SelectItem value="top-right">↗️ Haut droite</SelectItem>
                            <SelectItem value="top-left">↖️ Haut gauche</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label>Taille de la fenêtre</Label>
                        <Select
                          value={config.visualConfig.size}
                          onValueChange={(value) => updateVisualConfig('size', value)}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compact">📱 Compact (320px)</SelectItem>
                            <SelectItem value="standard">💻 Standard (400px)</SelectItem>
                            <SelectItem value="large">🖥️ Large (480px)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Messages */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg">Messages personnalisés</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="welcomeMessage">Message de bienvenue</Label>
                        <Textarea
                          id="welcomeMessage"
                          value={config.visualConfig.welcomeMessage}
                          onChange={(e) => updateVisualConfig('welcomeMessage', e.target.value)}
                          placeholder="Bonjour ! Comment puis-je vous aider ?"
                          rows={3}
                          className="resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="placeholder">Placeholder du champ de saisie</Label>
                        <Input
                          id="placeholder"
                          value={config.visualConfig.placeholder}
                          onChange={(e) => updateVisualConfig('placeholder', e.target.value)}
                          placeholder="Tapez votre message..."
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Intégration */}
            <TabsContent value="integration" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Code d'intégration
                  </CardTitle>
                  <CardDescription>
                    Copiez ce code dans votre site web pour intégrer le chatbot
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg border">
                    <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                      <code>{generateEmbedCode()}</code>
                    </pre>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={copyEmbedCode} variant="outline" size="lg">
                      <Copy className="h-4 w-4 mr-2" />
                      Copier le code
                    </Button>
                    <Button onClick={downloadScript} variant="outline" size="lg">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">💡 Instructions d'installation</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>1. Copiez le code d'intégration ci-dessus</li>
                      <li>2. Collez-le dans votre page HTML, juste avant la balise &lt;/body&gt;</li>
                      <li>3. Le chatbot apparaîtra automatiquement sur votre site</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Analytics */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="h-5 w-5 text-blue-500" />
                      <p className="text-sm font-medium text-gray-600">Conversations</p>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{config.metrics.totalConversations.toLocaleString()}</div>
                    <p className="text-sm text-green-600 mt-1">+12% ce mois</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-green-500" />
                      <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{config.metrics.satisfactionRate}%</div>
                    <p className="text-sm text-green-600 mt-1">+5% ce mois</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      <p className="text-sm font-medium text-gray-600">Réponse</p>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{config.metrics.avgResponseTime}s</div>
                    <p className="text-sm text-green-600 mt-1">-0.3s ce mois</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-5 w-5 text-purple-500" />
                      <p className="text-sm font-medium text-gray-600">Widgets actifs</p>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{config.metrics.activeWidgets}</div>
                    <p className="text-sm text-gray-500 mt-1">Sur 3 sites</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Performances détaillées</CardTitle>
                  <CardDescription>
                    Analyse approfondie de l'utilisation de votre chatbot
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Graphiques détaillés à venir...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Panneau d'aperçu */}
        {showPreview && (
          <div className="col-span-4">
            <div className="sticky top-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Aperçu en temps réel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 min-h-[500px] flex items-center justify-center"
                    style={{ backgroundColor: config.visualConfig.backgroundColor }}
                  >
                    <div className="text-center space-y-4">
                      <div 
                        className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                        style={{ backgroundColor: config.visualConfig.primaryColor }}
                      >
                        <Bot className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: config.visualConfig.textColor }}>
                          {config.name}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          {config.visualConfig.welcomeMessage}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <p>Position: {config.visualConfig.position}</p>
                        <p>Taille: {config.visualConfig.size}</p>
                        <p>Couleur: {config.visualConfig.primaryColor}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Composant de fallback pour le chargement
function LoadingFallback() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        {/* Skeleton de chargement */}
      </div>
    </div>
  )
}

// Composant principal exporté avec Suspense
export default function ChatbotConfigurationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ChatbotConfigurationContent />
    </Suspense>
  )
} 