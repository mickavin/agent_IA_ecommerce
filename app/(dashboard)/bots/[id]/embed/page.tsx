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
  Zap
} from "lucide-react"
import { Chatbot } from "@/lib/types"
import { toast } from "sonner"

// Configuration par défaut du widget
const defaultConfig = {
  theme: 'light',
  position: 'bottom-right',
  size: 'standard',
  primaryColor: '#3B82F6',
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

// Simulation de données du chatbot
const mockChatbot: Chatbot = {
  id: "1",
  name: "Assistant Younzee",
  description: "Chatbot intelligent avec recommandations produits",
  status: "Actif",
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

export default function ChatbotEmbedPage() {
  const params = useParams()
  const botId = params?.id as string
  const [chatbot] = useState<Chatbot>(mockChatbot)
  const [config, setConfig] = useState(defaultConfig)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('configure')

  // Générer l'URL du widget
  const generateWidgetUrl = () => {
    const baseUrl = window.location.origin
    const params = new URLSearchParams()
    
    Object.entries(config).forEach(([key, value]) => {
      if (value !== defaultConfig[key as keyof typeof defaultConfig]) {
        params.set(key, value.toString())
      }
    })
    
    return `${baseUrl}/widget/${botId}${params.toString() ? '?' + params.toString() : ''}`
  }

  // Générer le code d'intégration iframe
  const generateIframeCode = () => {
    const url = generateWidgetUrl()
    const sizeProps = getSizeProperties()
    
    return `<!-- Younzee Chatbot Widget -->
<iframe 
  src="${url}"
  width="${sizeProps.width}"
  height="${sizeProps.height}"
  frameborder="0"
  allow="microphone"
  style="position: fixed; ${getPositionStyles()}; z-index: 9999; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12);"
  title="Assistant Younzee"
></iframe>`
  }

  // Générer le code JavaScript avancé
  const generateJavaScriptCode = () => {
    const url = generateWidgetUrl()
    
    return `<!-- Younzee Chatbot Widget - JavaScript Integration -->
<script>
(function() {
  var chatbotConfig = ${JSON.stringify(config, null, 2)};
  
  function loadYounzeeChatbot() {
    var iframe = document.createElement('iframe');
    iframe.src = '${url}';
    iframe.width = '${getSizeProperties().width}';
    iframe.height = '${getSizeProperties().height}';
    iframe.frameBorder = '0';
    iframe.allow = 'microphone';
    iframe.style.cssText = 'position: fixed; ${getPositionStyles()}; z-index: 9999; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12);';
    iframe.title = 'Assistant Younzee';
    
    document.body.appendChild(iframe);
    
    // Communication avec le widget
    window.addEventListener('message', function(event) {
      if (event.origin !== '${window.location.origin}') return;
      
      // Gérer les événements du chatbot
      switch(event.data.type) {
        case 'chatbot-ready':
          console.log('Younzee Chatbot: Widget prêt');
          break;
        case 'chatbot-message-sent':
          console.log('Younzee Chatbot: Message envoyé', event.data.message);
          break;
        case 'chatbot-conversation-started':
          console.log('Younzee Chatbot: Conversation démarrée');
          break;
      }
    });
  }
  
  // Charger le chatbot quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadYounzeeChatbot);
  } else {
    loadYounzeeChatbot();
  }
})();
</script>`
  }

  // Générer le code WordPress
  const generateWordPressCode = () => {
    return `<!-- Pour WordPress: Ajoutez ce code dans Apparence > Personnaliser > HTML/CSS personnalisé -->
<!-- Ou utilisez le plugin "Insert Headers and Footers" -->

${generateIframeCode()}

<!-- Alternative avec shortcode WordPress -->
<!-- Ajoutez ce code dans functions.php de votre thème : -->

<?php
function younzee_chatbot_shortcode() {
    return '${generateIframeCode().replace(/'/g, "\\'")}';
}
add_shortcode('younzee_chatbot', 'younzee_chatbot_shortcode');
?>

<!-- Puis utilisez [younzee_chatbot] dans vos pages/articles -->`
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
                        Affiche "Propulsé par Younzee"
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
                  <Button
                    variant={previewDevice === 'tablet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewDevice('tablet')}
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewDevice === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewDevice('mobile')}
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
            {/* Code iframe simple */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Code iframe (Recommandé)
                </CardTitle>
                <CardDescription>
                  Code HTML simple à copier-coller sur votre site
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(generateIframeCode(), 'younzee-chatbot.html')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger HTML
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Code JavaScript avancé */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Code JavaScript avancé
                </CardTitle>
                <CardDescription>
                  Intégration avancée avec communication bidirectionnelle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Textarea
                      value={generateJavaScriptCode()}
                      readOnly
                      className="font-mono text-sm min-h-[200px] bg-gray-50"
                    />
                    <Button
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(generateJavaScriptCode(), 'javascript')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {copiedCode === 'javascript' ? 'Copié !' : 'Copier'}
                    </Button>
                  </div>
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Fonctionnalités avancées :</strong> Communication avec le parent, événements personnalisés, chargement dynamique
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Code WordPress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Code WordPress
                </CardTitle>
                <CardDescription>
                  Intégration spécialement conçue pour WordPress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Textarea
                      value={generateWordPressCode()}
                      readOnly
                      className="font-mono text-sm min-h-[180px] bg-gray-50"
                    />
                    <Button
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(generateWordPressCode(), 'wordpress')}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      {copiedCode === 'wordpress' ? 'Copié !' : 'Copier'}
                    </Button>
                  </div>
                  <div className="bg-purple-50 p-3 rounded border border-purple-200">
                    <p className="text-sm text-purple-800">
                      <strong>Instructions :</strong> Utilisez le shortcode [younzee_chatbot] ou ajoutez le code directement dans votre thème
                    </p>
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