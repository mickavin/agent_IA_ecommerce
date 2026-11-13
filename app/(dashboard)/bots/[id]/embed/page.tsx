"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Copy,
  Eye,
  Settings,
  Code,
  Monitor,
  Smartphone,
  Tablet,
  Download,
  ExternalLink,
  Palette,
  MessageSquare,
  Globe,
  Shield,
  Zap,
  RefreshCw
} from "lucide-react"
import { Chatbot, ChatbotStatus } from "@/lib/types"
import { ChatbotService } from "@/lib/services/chatbot.service"
import { toast } from "sonner"

// Configuration par défaut du widget
const defaultConfig = {
  theme: 'light',
  position: 'bottom-right',
  size: 'standard',
  primaryColor: '#ff6f61',
  textColor: '#1F2937',
  backgroundColor: '#FFFFFF',
  showBranding: true,
  autoOpen: false,
  soundEnabled: true,
  welcomeMessage: "Bonjour ! Comment puis-je vous aider ?",
  placeholder: "Tapez votre message...",
  borderRadius: 'rounded',
  animation: 'smooth'
}

export default function ChatbotEmbedPage() {
  const params = useParams()
  const botId = params?.id as string
  const [chatbot, setChatbot] = useState<Chatbot | null>(null)
  const [config, setConfig] = useState(defaultConfig)
  const [isLoading, setIsLoading] = useState(true)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('configure')

  useEffect(() => {
    const fetchChatbot = async () => {
      try {
        setIsLoading(true)
        const data = await ChatbotService.getById(botId)
        if (data) {
          setChatbot(data)
          // Mettre à jour la config locale avec les valeurs du bot si elles existent
          if (data.generatorConfig) {
            setConfig(prev => ({
              ...prev,
              primaryColor: data.generatorConfig?.primaryColor || prev.primaryColor,
              backgroundColor: data.generatorConfig?.backgroundColor || prev.backgroundColor,
              textColor: data.generatorConfig?.textColor || prev.textColor,
              welcomeMessage: data.generatorConfig?.welcomeMessage || prev.welcomeMessage,
              placeholder: data.generatorConfig?.placeholder || prev.placeholder,
            }))
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement du chatbot:", error)
        toast.error("Erreur lors du chargement des données")
      } finally {
        setIsLoading(false)
      }
    }
    fetchChatbot()
  }, [botId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!chatbot) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Chatbot non trouvé</h2>
        <Button variant="link" onClick={() => window.history.back()}>Retour</Button>
      </div>
    )
  }

  // Générer l'URL du widget
  const generateWidgetUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    return `${baseUrl}/widget/${botId}`
  }

  // Générer le code d'intégration du script (Recommandé)
  const generateScriptCode = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    return `<!-- Wikzy Chatbot Widget - Script Integration -->
<script 
  src="${baseUrl}/chatbot-generator.js" 
  data-bot-id="${botId}"
  async
></script>`
  }

  // Générer le code d'intégration iframe
  const generateIframeCode = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    const url = `${baseUrl}/widget/${botId}`
    const sizeProps = getSizeProperties()
    
    return `<!-- Wikzy Chatbot Widget - Iframe Integration -->
<iframe 
  src="${url}"
  width="${sizeProps.width}"
  height="${sizeProps.height}"
  frameborder="0"
  allow="microphone"
  style="position: fixed; ${getPositionStyles()}; z-index: 9999; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12);"
  title="Assistant Wikzy"
></iframe>`
  }

  const getSizeProperties = () => {
    switch (config.size) {
      case 'compact':
        return { width: '320px', height: '400px' }
      case 'large':
        return { width: '400px', height: '600px' }
      default:
        return { width: '350px', height: '500px' }
    }
  }

  const getPositionStyles = () => {
    switch (config.position) {
      case 'bottom-left':
        return 'bottom: 20px; left: 20px;'
      case 'top-right':
        return 'top: 20px; right: 20px;'
      case 'top-left':
        return 'top: 20px; left: 20px;'
      default:
        return 'bottom: 20px; right: 20px;'
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(type)
      toast.success(`Code ${type} copié !`)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      toast.error("Erreur lors de la copie")
    }
  }

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getPreviewSize = () => {
    switch (previewDevice) {
      case 'mobile':
        return 'w-[375px] h-[667px]'
      case 'tablet':
        return 'w-[768px] h-[1024px]'
      default:
        return 'w-[1200px] h-[800px]'
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title={`Intégration - ${chatbot.name}`}
        description="Générez le code d'intégration pour ajouter votre chatbot sur n'importe quel site web"
        backHref={`/bots/${botId}`}
      >
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(generateWidgetUrl(), '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Tester
          </Button>
          <Button size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configure" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Aperçu
          </TabsTrigger>
          <TabsTrigger value="integrate" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Intégration
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Analytiques
          </TabsTrigger>
        </TabsList>

        {/* Configuration */}
        <TabsContent value="configure" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Apparence */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Apparence
                </CardTitle>
                <CardDescription>
                  Personnalisez l'apparence de votre widget
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="size">Taille</Label>
                    <Select 
                      value={config.size} 
                      onValueChange={(value) => setConfig({...config, size: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact (320x400)</SelectItem>
                        <SelectItem value="standard">Standard (350x500)</SelectItem>
                        <SelectItem value="large">Large (400x600)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Select 
                      value={config.position} 
                      onValueChange={(value) => setConfig({...config, position: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">Bas droite</SelectItem>
                        <SelectItem value="bottom-left">Bas gauche</SelectItem>
                        <SelectItem value="top-right">Haut droite</SelectItem>
                        <SelectItem value="top-left">Haut gauche</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Couleur principale</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                        className="w-12 h-10 p-1 rounded"
                      />
                      <Input
                        value={config.primaryColor}
                        onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Couleur de fond</Label>
                    <div className="flex gap-2">
                      <Input
                        id="backgroundColor"
                        type="color"
                        value={config.backgroundColor}
                        onChange={(e) => setConfig({...config, backgroundColor: e.target.value})}
                        className="w-12 h-10 p-1 rounded"
                      />
                      <Input
                        value={config.backgroundColor}
                        onChange={(e) => setConfig({...config, backgroundColor: e.target.value})}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textColor">Couleur du texte</Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={config.textColor}
                      onChange={(e) => setConfig({...config, textColor: e.target.value})}
                      className="w-12 h-10 p-1 rounded"
                    />
                    <Input
                      value={config.textColor}
                      onChange={(e) => setConfig({...config, textColor: e.target.value})}
                      className="flex-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comportement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comportement
                </CardTitle>
                <CardDescription>
                  Configurez le comportement du widget
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage">Message de bienvenue</Label>
                  <Textarea
                    id="welcomeMessage"
                    value={config.welcomeMessage}
                    onChange={(e) => setConfig({...config, welcomeMessage: e.target.value})}
                    placeholder="Message d'accueil du chatbot"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placeholder">Placeholder de saisie</Label>
                  <Input
                    id="placeholder"
                    value={config.placeholder}
                    onChange={(e) => setConfig({...config, placeholder: e.target.value})}
                    placeholder="Texte de l'input"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Ouverture automatique</Label>
                      <p className="text-xs text-muted-foreground">
                        Ouvre le widget automatiquement au chargement
                      </p>
                    </div>
                    <Switch
                      checked={config.autoOpen}
                      onCheckedChange={(checked) => setConfig({...config, autoOpen: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sons de notification</Label>
                      <p className="text-xs text-muted-foreground">
                        Active les sons lors des réponses
                      </p>
                    </div>
                    <Switch
                      checked={config.soundEnabled}
                      onCheckedChange={(checked) => setConfig({...config, soundEnabled: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Afficher le branding</Label>
                      <p className="text-xs text-muted-foreground">
                        Affiche "Propulsé par Wikzy"
                      </p>
                    </div>
                    <Switch
                      checked={config.showBranding}
                      onCheckedChange={(checked) => setConfig({...config, showBranding: checked})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aperçu */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Aperçu du widget</CardTitle>
                  <CardDescription>
                    Visualisez votre chatbot sur différents appareils
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={previewDevice === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewDevice('desktop')}
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  {/* <Button
                    variant={previewDevice === 'tablet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewDevice('tablet')}
                  >
                    <Tablet className="h-4 w-4" />
                  </Button> */}
                  <Button
                    //variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                    variant={previewDevice === 'tablet' ? 'default' : 'outline'}
                    size="sm"
                    //onClick={() => setPreviewDevice('mobile')}
                    onClick={() => setPreviewDevice('tablet')}
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center p-8 bg-gray-50 rounded-lg">
                <div className={`${getPreviewSize()} border border-gray-300 rounded-lg bg-white shadow-lg relative overflow-hidden`}>
                  <iframe
                    src={generateWidgetUrl()}
                    className="w-full h-full"
                    frameBorder="0"
                    title="Aperçu du chatbot"
                  />
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {previewDevice === 'desktop' ? 'Ordinateur' : 
                     previewDevice === 'tablet' ? 'Tablette' : 'Mobile'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Intégration */}
        <TabsContent value="integrate" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Code Script (Recommandé) */}
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Script intelligent (Recommandé)
                </CardTitle>
                <CardDescription>
                  La méthode la plus simple et la plus performante. Ajoute un bouton flottant sur votre site.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Textarea
                      value={generateScriptCode()}
                      readOnly
                      className="font-mono text-sm min-h-[100px] bg-slate-900 text-slate-100 border-none"
                    />
                    <Button
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(generateScriptCode(), 'script')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {copiedCode === 'script' ? 'Copié !' : 'Copier'}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                    <Globe className="h-3 w-3" />
                    Placez ce code juste avant la balise &lt;/body&gt; de votre site.
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Code Iframe */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Code Iframe (Standard)
                </CardTitle>
                <CardDescription>
                  Intégrez le chatbot directement dans une zone spécifique de votre site.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Textarea
                      value={generateIframeCode()}
                      readOnly
                      className="font-mono text-sm min-h-[120px] bg-gray-50"
                    />
                    <Button
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(generateIframeCode(), 'iframe')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {copiedCode === 'iframe' ? 'Copié !' : 'Copier'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytiques */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Globe className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-sm text-muted-foreground">Sites actifs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">1,247</p>
                    <p className="text-sm text-muted-foreground">Conversations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">94%</p>
                    <p className="text-sm text-muted-foreground">Satisfaction</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Domaines autorisés</CardTitle>
              <CardDescription>
                Gérez les domaines où votre chatbot peut être intégré
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="exemple.com" 
                    className="flex-1"
                  />
                  <Button>Ajouter</Button>
                </div>
                <div className="space-y-2">
                  {['monsite.fr', 'boutique.example.com', 'blog.exemple.org'].map((domain) => (
                    <div key={domain} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{domain}</span>
                      </div>
                      <Badge variant="secondary">Actif</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 