"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Bot,
  Save,
  Palette,
  MessageSquare,
  Settings,
  Download,
  Copy,
  RefreshCw,
  Sparkles,
  Zap,
  Code,
  Database,
  Brain,
  Target,
  ArrowLeft
} from "lucide-react"
import { Chatbot, ChatbotPersonality, ChatbotVisualConfig, ChatbotDataSource, ChatbotAdvancedConfig, ChatbotStatus } from "@/lib/types"
import { toast } from "sonner"
import Link from "next/link"
import { ChatbotService } from "@/lib/services/chatbot.service"
import { ChatbotGeneratorCustomizer } from "@/components/chatbot-generator-customizer"
import { ChatbotLivePreview } from "@/components/chatbot-live-preview"

const animations = [
  { name: "Fondu", value: "fade" },
  { name: "Glissement bas", value: "slide-up" },
  { name: "Glissement droite", value: "slide-right" },
  { name: "Zoom", value: "scale" },
  { name: "Rebond", value: "bounce" }
]

const soundEffects = [
  { name: "Aucun", value: "none" },
  { name: "Notification douce", value: "soft-notification" },
  { name: "Bip moderne", value: "modern-beep" },
  { name: "Chime", value: "chime" },
  { name: "Pop", value: "pop" }
]

export default function NewBotPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [activeView, setActiveView] = useState<"settings" | "design">("settings")
  
  // États pour la configuration du chatbot
  const [botConfig, setBotConfig] = useState<Chatbot>({
    id: "",
    name: "Assistant Wikzy",
    description: "Votre styliste personnel, toujours à vos côtés",
    status: "Actif",
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    personality: {
      tone: "Amical",
      formality: "Tutoiement",
      verbosity: "Détaillé",
      empathy: "Élevée",
      proactivity: "Proactif"
    },
    visualConfig: {
      primaryColor: "#ff6f61",
      secondaryColor: "#ffdd5b",
      textColor: "#1F2937",
      backgroundColor: "#FFFFFF",
      borderRadius: "Très arrondi",
      position: "Bas droite",
      size: "Standard",
      welcomeMessage: "✨ Bonjour ! Je suis Wikzy, votre styliste personnel. Prêt à trouver le look parfait ? Essayez \"robes\", \"chaussures\" ou \"nouveau style\" !",
      placeholder: "Ex: Robe rouge, taille M..."
    },
    dataSources: [],
    conversationsCount: 0,
    avgResponseTime: 0,
    satisfactionRate: 0
  })

  // Configuration avancée
  const [advancedConfig, setAdvancedConfig] = useState<ChatbotAdvancedConfig>({
    animation: "fade",
    soundEffect: "soft-notification",
    enableTypingIndicator: true,
    enableReadReceipts: true,
    enableQuickReplies: true,
    maxConversationLength: 50,
    responseDelay: 1000,
    customCSS: "",
    customAvatar: undefined,
    brandLogo: undefined,
    headerGradient: false,
    shadowIntensity: 3,
    borderWidth: 1,
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 1.5,
    messageSpacing: 12,
    enableEmojis: true,
    enableFileUpload: false,
    enableVoiceMessages: false,
    customGreetings: [],
    workingHours: {
      enabled: false,
      start: "09:00",
      end: "18:00",
      timezone: "Europe/Paris",
      offlineMessage: "Nous sommes actuellement fermés. Laissez-nous un message !"
    }
  })

  const [dataSources, setDataSources] = useState<ChatbotDataSource[]>([
    { id: "1", type: "faq", name: "FAQ Générale", isEnabled: true, priority: 1 },
    { id: "2", type: "products", name: "Catalogue Produits", isEnabled: true, priority: 2 },
    { id: "3", type: "orders", name: "Commandes", isEnabled: true, priority: 3 },
    { id: "4", type: "policies", name: "Politiques", isEnabled: true, priority: 4 },
  ])

  const [generatorConfig, setGeneratorConfig] = useState<any>({
    chatbotId: 'wikzy-premium',
    title: 'Assistant Wikzy',
    subtitle: 'Votre styliste personnel, toujours à vos côtés',
    apiEndpoint: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/ai/master`,
    position: 'bottom-right',
    primaryColor: '#ff6f61',
    secondaryColor: '#ffdd5b',
    accentColor: '#ffdd5b',
    textColor: '#1F2937',
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    size: 'standard',
    showTypingIndicator: true,
    enableSound: true,
    autoOpen: false,
    autoOpenDelay: 2000,
    welcomeMessage: '✨ Bonjour ! Je suis Wikzy, votre styliste personnel. Prêt à trouver le look parfait ? Essayez "robes", "chaussures" ou "nouveau style" !',
    placeholder: 'Ex: Robe rouge, taille M...',
    personality: {
      tone: 'Amical',
      formality: 'Tutoiement',
      verbosity: 'Détaillé',
      empathy: 'Élevée',
      proactivity: 'Proactif'
    },
    fontFamily: '"Poppins", sans-serif',
    fontSize: 15,
    buttonSize: 72,
    borderWidth: 0,
    borderColor: 'transparent',
    headerBackgroundColor: 'linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)',
    headerTextColor: '#FFFFFF',
    headerPadding: 18,
    headerTitleFontSize: 19,
    avatarType: 'image',
    avatarValue: 'http://localhost:3000/styli.png',
    buttonBackgroundColor: 'linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)',
    buttonIconColor: '#FFFFFF',
    closeButtonColor: '#FFFFFF',
    shadowEffect: 'medium',
    animationStyle: 'gradient-pulse',
    customIcon: null,
    attentionText: {
      enabled: false,
      messages: ['Trouvez votre style !', 'Besoin d\'aide ? 💬'],
      color: '#FFFFFF',
      backgroundColor: 'linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)',
      animation: 'bounce',
      duration: 3000,
      delay: 3000,
      repeatInterval: 8000,
      particleEffect: false,
      trailEffect: false,
      orbitRadius: 60,
      orbitSpeed: 5,
      orbitDirection: 'clockwise',
      curveIntensity: 0
    },
    theme: 'dark',
    quickReplies: []
  })

  const updateVisualConfig = (key: keyof ChatbotVisualConfig, value: any) => {
    setBotConfig(prev => ({
      ...prev,
      visualConfig: {
        ...prev.visualConfig,
        [key]: value
      }
    }))
  }

  const updatePersonality = (key: keyof ChatbotPersonality, value: any) => {
    setBotConfig(prev => ({
      ...prev,
      personality: {
        ...prev.personality,
        [key]: value
      }
    }))
  }

  const updateDataSource = (id: string, updates: Partial<ChatbotDataSource>) => {
    setDataSources(prev => prev.map(source => source.id === id ? { ...source, ...updates } : source))
  }

  const handleSubmit = async () => {
    if (!botConfig.name.trim()) {
      toast.error("Le nom du chatbot est requis")
      return
    }

    setIsLoading(true)
    try {
      const newBotData = {
        name: botConfig.name,
        description: botConfig.description,
        personality: botConfig.personality,
        visual_config: botConfig.visualConfig,
        advanced_config: advancedConfig,
        generator_config: generatorConfig,
        status: "Actif" as ChatbotStatus,
        is_default: false,
        data_sources: dataSources.filter(ds => ds.isEnabled),
      }

      const createdBot = await ChatbotService.create(newBotData)
      
      if (createdBot) {
        toast.success("Chatbot créé avec succès !")
        router.push(`/bots/${createdBot.id}/edit`)
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error)
      toast.error("Erreur lors de la création du chatbot")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/bots" className="hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Retour aux bots
        </Link>
      </div>

      <PageHeader 
        title={activeView === "design" ? `Design de votre nouveau bot` : `Créer un nouveau chatbot`}
        description={activeView === "design" ? "Personnalisez l'apparence visuelle de votre futur assistant" : "Configurez la personnalité et le comportement de votre nouvel assistant IA"}
      >
        <div className="flex gap-2">
          {activeView === "settings" ? (
            <Button variant="outline" onClick={() => setActiveView("design")}>
              <Palette className="h-4 w-4 mr-2" />
              Design
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setActiveView("settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Réglages
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Création..." : "Créer le bot"}
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6">
        {activeView === "settings" ? (
          <div className="space-y-6">
            <Tabs defaultValue="personality" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personality">Personnalité</TabsTrigger>
                <TabsTrigger value="data">Données</TabsTrigger>
                <TabsTrigger value="behavior">Comportement</TabsTrigger>
                <TabsTrigger value="advanced">Avancé</TabsTrigger>
              </TabsList>

              <TabsContent value="personality" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        Identité du chatbot
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom du chatbot</Label>
                        <Input 
                          id="name" 
                          placeholder="Ex: Assistant Wikzy"
                          value={botConfig.name} 
                          onChange={(e) => setBotConfig({...botConfig, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description interne</Label>
                        <Textarea 
                          id="description" 
                          placeholder="Décrivez les fonctionnalités de votre bot..."
                          value={botConfig.description} 
                          onChange={(e) => setBotConfig({...botConfig, description: e.target.value})}
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Personnalité AI
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Ton de la voix</Label>
                        <Select 
                          value={botConfig.personality.tone} 
                          onValueChange={(value) => updatePersonality("tone", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Amical">Amical et chaleureux</SelectItem>
                            <SelectItem value="Professionnel">Professionnel et direct</SelectItem>
                            <SelectItem value="Décontracté">Décontracté et fun</SelectItem>
                            <SelectItem value="Expert">Expert et pédagogique</SelectItem>
                            <SelectItem value="Humoristique">Humoristique et léger</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Niveau de formalité</Label>
                        <Select 
                          value={botConfig.personality.formality} 
                          onValueChange={(value) => updatePersonality("formality", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tutoiement">Tutoiement (Plus proche)</SelectItem>
                            <SelectItem value="Vouvoiement">Vouvoiement (Plus formel)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="data" className="space-y-6">
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Sources de données
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dataSources.map((source) => (
                      <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary/10 rounded-full text-primary">
                            {source.type === "faq" && <MessageSquare className="h-5 w-5" />}
                            {source.type === "products" && <Zap className="h-5 w-5" />}
                            {source.type === "orders" && <Code className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-medium">{source.name}</p>
                            <p className="text-sm text-muted-foreground">Priorité: {source.priority}</p>
                          </div>
                        </div>
                        <Switch 
                          checked={source.isEnabled} 
                          onCheckedChange={(checked) => updateDataSource(source.id, { isEnabled: checked })}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="behavior" className="space-y-6">
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Comportement et fonctionnalités
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Indicateur de frappe</Label>
                          <p className="text-sm text-muted-foreground">Afficher "en train d'écrire..."</p>
                        </div>
                        <Switch
                          checked={advancedConfig.enableTypingIndicator}
                          onCheckedChange={(checked) => setAdvancedConfig(prev => ({ ...prev, enableTypingIndicator: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Réponses rapides</Label>
                          <p className="text-sm text-muted-foreground">Boutons de réponses suggérées</p>
                        </div>
                        <Switch
                          checked={advancedConfig.enableQuickReplies}
                          onCheckedChange={(checked) => setAdvancedConfig(prev => ({ ...prev, enableQuickReplies: checked }))}
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <Label>Délai de simulation de réponse</Label>
                      <Slider
                        value={[advancedConfig.responseDelay]}
                        onValueChange={(value) => setAdvancedConfig(prev => ({ ...prev, responseDelay: value[0] }))}
                        max={5000}
                        min={500}
                        step={250}
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>500ms</span>
                        <span>{advancedConfig.responseDelay}ms</span>
                        <span>5000ms</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Configuration avancée
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Animation d'apparition</Label>
                        <Select 
                          value={advancedConfig.animation} 
                          onValueChange={(value) => setAdvancedConfig(prev => ({ ...prev, animation: value }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {animations.map(anim => <SelectItem key={anim.value} value={anim.value}>{anim.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Effet sonore</Label>
                        <Select 
                          value={advancedConfig.soundEffect} 
                          onValueChange={(value) => setAdvancedConfig(prev => ({ ...prev, soundEffect: value }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {soundEffects.map(sound => <SelectItem key={sound.value} value={sound.value}>{sound.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
            <div className="space-y-8">
              <Card className="border-primary/20 shadow-lg">
                <CardHeader className="bg-primary/5 border-b">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <Palette className="h-5 w-5" />
                      Style du Widget
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveView("settings")}>
                      Retour aux réglages
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ChatbotGeneratorCustomizer
                    initialConfig={generatorConfig}
                    onConfigChange={(config) => {
                      setGeneratorConfig(config)
                      setBotConfig(prev => ({
                        ...prev,
                        name: config.title,
                        description: config.subtitle,
                        visualConfig: {
                          ...prev.visualConfig,
                          primaryColor: config.primaryColor,
                          secondaryColor: config.secondaryColor,
                          textColor: config.textColor,
                          backgroundColor: config.backgroundColor,
                          borderRadius: config.borderRadius === '24px' ? 'Très arrondi' : 
                                       config.borderRadius === '12px' ? 'Arrondi' : 'Carré',
                          position: config.position === 'bottom-right' ? 'Bas droite' :
                                   config.position === 'bottom-left' ? 'Bas gauche' :
                                   config.position === 'top-right' ? 'Haut droite' : 'Haut gauche',
                          size: config.size === 'compact' ? 'Compact' :
                                config.size === 'standard' ? 'Standard' : 'Large',
                          welcomeMessage: config.welcomeMessage,
                          placeholder: config.placeholder
                        },
                        personality: {
                          tone: config.personality.tone as ChatbotPersonality['tone'],
                          formality: config.personality.formality as ChatbotPersonality['formality'],
                          verbosity: config.personality.verbosity as ChatbotPersonality['verbosity'],
                          empathy: config.personality.empathy as ChatbotPersonality['empathy'],
                          proactivity: config.personality.proactivity as ChatbotPersonality['proactivity']
                        }
                      }))
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <div className="sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="font-bold text-lg">Aperçu en temps réel</Label>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Interactif</Badge>
                </div>
                <div className="border rounded-2xl overflow-hidden bg-white h-[800px] relative shadow-2xl border-primary/10">
                  <ChatbotLivePreview 
                    config={generatorConfig} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
