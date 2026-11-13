"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Bot,
  Save,
  Eye,
  Palette,
  MessageSquare,
  Settings,
  Upload,
  Download,
  Copy,
  RefreshCw,
  Sparkles,
  Zap,
  Volume2,
  Image as ImageIcon,
  Type,
  Layout,
  Smartphone,
  Monitor,
  Tablet,
  Sun,
  Moon,
  Star,
  Heart,
  Smile,
  Code,
  Database,
  Brain,
  Target,
  Users,
  BarChart3
} from "lucide-react"
import { ChatbotPreview } from "@/components/chatbot-preview"
import { Chatbot, ChatbotPersonality, ChatbotVisualConfig, ChatbotDataSource, ChatbotAdvancedConfig, ChatbotGeneratorConfig } from "@/lib/types"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { ChatbotService } from "@/lib/services/chatbot.service"
import { ChatbotGeneratorCustomizer } from "@/components/chatbot-generator-customizer"
import { ChatbotLivePreview } from "@/components/chatbot-live-preview"


// Palettes de couleurs prédéfinies
const colorPalettes = [
  {
    name: "Océan",
    primary: "#0EA5E9",
    secondary: "#E0F2FE",
    accent: "#0C4A6E",
    background: "#F8FAFC"
  },
  {
    name: "Forêt",
    primary: "#10B981",
    secondary: "#ECFDF5",
    accent: "#064E3B",
    background: "#F9FAFB"
  },
  {
    name: "Coucher de soleil",
    primary: "#F59E0B",
    secondary: "#FEF3C7",
    accent: "#92400E",
    background: "#FFFBEB"
  },
  {
    name: "Violet royal",
    primary: "#8B5CF6",
    secondary: "#F3E8FF",
    accent: "#5B21B6",
    background: "#FAFAFA"
  },
  {
    name: "Wikzy (Défaut)",
    primary: "#ff6f61",
    secondary: "#FEF3C7",
    accent: "#ffdd5b",
    background: "#FFFFFF"
  },
  {
    name: "Mode sombre",
    primary: "#6366F1",
    secondary: "#1F2937",
    accent: "#4F46E5",
    background: "#111827"
  }
]

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

export default function EditBotPage() {
  const router = useRouter()
  const params = useParams()
  const botId = params?.id as string | undefined

  // États pour la configuration du chatbot
  const [botConfig, setBotConfig] = useState<Chatbot>({
    id: botId || "",
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

  // États pour les fonctionnalités avancées
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile" | "tablet">("desktop")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeView, setActiveView] = useState<"settings" | "design">("settings")

  // Configuration avancée du design
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
  const [generatorConfig, setGeneratorConfig] = useState<any>(null)
  const [showEmbedCode, setShowEmbedCode] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  const updateDataSource = (id: string, updates: Partial<ChatbotDataSource>) => {
    setDataSources(prev => prev.map(source => source.id === id ? { ...source, ...updates } : source))
  }

  useEffect(() => {
    if (!botId) {
      router.push("/bots")
      return
    }

    const fetchBotConfig = async () => {
      try {
        setIsInitialLoading(true)
        const data = await ChatbotService.getById(botId)
        
        if (data) {
          console.log('data', data)
          
          // Vérifier si c'est une ancienne couleur par défaut à migrer
          const isOldDefaultColor = data.visualConfig?.primaryColor === '#ffdd5b' || data.visualConfig?.primaryColor === '#3B82F6';
          
          // Pré-remplir les champs de base s'ils sont vides pour l'affichage
          const sanitizedData: Chatbot = {
            ...data,
            name: data.name || 'Assistant Wikzy',
            description: data.description || 'Votre styliste personnel, toujours à vos côtés',
            visualConfig: {
              ...data.visualConfig,
              primaryColor: isOldDefaultColor ? '#ff6f61' : (data.visualConfig?.primaryColor || '#ff6f61'),
              secondaryColor: isOldDefaultColor ? '#ffdd5b' : (data.visualConfig?.secondaryColor || '#ffdd5b'),
              welcomeMessage: data.visualConfig?.welcomeMessage || '✨ Bonjour ! Je suis Wikzy, votre styliste personnel. Prêt à trouver le look parfait ? Essayez "robes", "chaussures" ou "nouveau style" !',
              placeholder: data.visualConfig?.placeholder || 'Ex: Robe rouge, taille M...',
            }
          }
          
          setBotConfig(sanitizedData)
          
          // Charger advancedConfig depuis la base de données ou utiliser les valeurs par défaut
          if (data.advancedConfig) {
            setAdvancedConfig(data.advancedConfig)
          }
          
          // Charger generatorConfig depuis la base de données ou créer depuis botConfig
          if (data.generatorConfig) {
            // S'assurer que les champs essentiels ne sont pas vides dans generatorConfig
            // Migration automatique vers Wikzy Sunset si les couleurs sont les anciennes par défaut
            const isOldYellow = data.generatorConfig.primaryColor === '#ffdd5b' || data.generatorConfig.primaryColor === '#3B82F6';
            
            const updatedGeneratorConfig = {
              ...data.generatorConfig,
              primaryColor: isOldYellow ? '#ff6f61' : (data.generatorConfig.primaryColor || '#ff6f61'),
              secondaryColor: isOldYellow ? '#ffdd5b' : (data.generatorConfig.secondaryColor || '#ffdd5b'),
              accentColor: isOldYellow ? '#ffdd5b' : (data.generatorConfig.accentColor || '#ffdd5b'),
              headerBackgroundColor: isOldYellow ? 'linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)' : (data.generatorConfig.headerBackgroundColor || 'linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)'),
              buttonBackgroundColor: isOldYellow ? 'linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)' : (data.generatorConfig.buttonBackgroundColor || 'linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)'),
              fontFamily: isOldYellow ? '"Poppins", sans-serif' : (data.generatorConfig.fontFamily || '"Poppins", sans-serif'),
              headerTextColor: isOldYellow ? '#FFFFFF' : (data.generatorConfig.headerTextColor || '#FFFFFF'),
              buttonIconColor: isOldYellow ? '#FFFFFF' : (data.generatorConfig.buttonIconColor || '#FFFFFF'),
              closeButtonColor: isOldYellow ? '#FFFFFF' : (data.generatorConfig.closeButtonColor || '#FFFFFF'),
              attentionText: {
                ...(data.generatorConfig.attentionText || {}),
                backgroundColor: isOldYellow ? 'linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)' : (data.generatorConfig.attentionText?.backgroundColor || data.generatorConfig.headerBackgroundColor || data.generatorConfig.primaryColor || '#ff6f61'),
                color: isOldYellow ? '#FFFFFF' : (data.generatorConfig.attentionText?.color || data.generatorConfig.headerTextColor || '#FFFFFF')
              },
              title: data.generatorConfig.title || sanitizedData.name,
              subtitle: data.generatorConfig.subtitle || sanitizedData.description,
              welcomeMessage: data.generatorConfig.welcomeMessage || sanitizedData.visualConfig.welcomeMessage,
              placeholder: data.generatorConfig.placeholder || sanitizedData.visualConfig.placeholder,
              personality: data.generatorConfig.personality || sanitizedData.personality,
            }
            setGeneratorConfig(updatedGeneratorConfig)
          } else {
            // Initialiser generatorConfig avec les données du bot si non sauvegardé
            setGeneratorConfig({
              chatbotId: data.id || 'wikzy-premium',
              title: data.name || 'Assistant Wikzy',
              subtitle: data.description || 'Votre styliste personnel, toujours à vos côtés',
              apiEndpoint: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/ai/master`,
              position: data.visualConfig.position === 'Bas droite' ? 'bottom-right' :
                       data.visualConfig.position === 'Bas gauche' ? 'bottom-left' :
                       data.visualConfig.position === 'Haut droite' ? 'top-right' : 
                       data.visualConfig.position === 'Haut gauche' ? 'top-left' : 'bottom-right',
              primaryColor: '#ff6f61',
              secondaryColor: '#ffdd5b',
              accentColor: '#ffdd5b',
              textColor: '#1F2937',
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              size: data.visualConfig.size === 'Compact' ? 'compact' :
                   data.visualConfig.size === 'Standard' ? 'standard' : 'large',
              showTypingIndicator: data.advancedConfig?.enableTypingIndicator ?? true,
              enableSound: true,
              autoOpen: false,
              autoOpenDelay: 2000,
              welcomeMessage: data.visualConfig.welcomeMessage || '✨ Bonjour ! Je suis Wikzy, votre styliste personnel. Prêt à trouver le look parfait ? Essayez "robes", "chaussures" ou "nouveau style" !',
              placeholder: data.visualConfig.placeholder || 'Ex: Robe rouge, taille M...',
              personality: data.personality || {
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
          }
        } else {
          toast.error("Chatbot non trouvé")
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du chatbot:', error)
        toast.error("Erreur lors du chargement du chatbot")
      } finally {
        setIsInitialLoading(false)
      }
    }
    fetchBotConfig()
  }, [botId, router])

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

  const applyColorPalette = (palette: typeof colorPalettes[0]) => {
    setBotConfig(prev => ({
      ...prev,
      visualConfig: {
        ...prev.visualConfig,
        primaryColor: palette.primary,
        secondaryColor: palette.secondary,
        backgroundColor: palette.background
      }
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Préparer les données pour la sauvegarde
      const updateData = {
        name: botConfig.name,
        description: botConfig.description,
        personality: botConfig.personality,
        visual_config: botConfig.visualConfig,
        advanced_config: advancedConfig,
        generator_config: generatorConfig
      }

      console.log('Sauvegarde des données:', updateData)
      const updatedBot = await ChatbotService.update(botId!, updateData)
      
      if (updatedBot) {
        setBotConfig(updatedBot)
        if (updatedBot.advancedConfig) {
          setAdvancedConfig(updatedBot.advancedConfig)
        }
        if (updatedBot.generatorConfig) {
          setGeneratorConfig(updatedBot.generatorConfig)
        }
        toast.success("Configuration du chatbot sauvegardée avec succès !")
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setIsLoading(false)
    }
  }

  const exportConfig = () => {
    const configToExport = {
      ...botConfig,
      advancedConfig
    }
    const blob = new Blob([JSON.stringify(configToExport, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chatbot-${botConfig.name.toLowerCase().replace(/\s+/g, '-')}-config.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Configuration exportée !")
  }

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <RefreshCw className="h-12 w-12 animate-spin text-primary opacity-50" />
        <p className="text-muted-foreground animate-pulse">Chargement de votre assistant...</p>
      </div>
    )
  }

  if (!botId) {
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title={activeView === "design" ? `Design de ${botConfig.name}` : `Configuration de ${botConfig.name}`}
        description={activeView === "design" ? "Personnalisez l'apparence visuelle de votre widget" : "Gérez la personnalité, les données et le comportement de votre chatbot"}
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
          <Button variant="outline" onClick={exportConfig}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6">
        {activeView === "settings" ? (
          /* Configuration (Tabs) */
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
                  {/* Identité du bot */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        Identité du chatbot
                      </CardTitle>
                      <CardDescription>
                        Informations de base visibles par les clients
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom du chatbot</Label>
                        <Input 
                          id="name" 
                          value={botConfig.name} 
                          onChange={(e) => setBotConfig({...botConfig, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description interne</Label>
                        <Textarea 
                          id="description" 
                          value={botConfig.description} 
                          onChange={(e) => setBotConfig({...botConfig, description: e.target.value})}
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ton et comportement */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Personnalité AI
                      </CardTitle>
                      <CardDescription>
                        Définissez comment le bot interagit avec les utilisateurs
                      </CardDescription>
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
                    <CardDescription>
                      Sélectionnez les données que l'IA peut utiliser pour répondre
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dataSources.map((source) => (
                      <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary/10 rounded-full text-primary">
                            {source.type === "faq" && <MessageSquare className="h-5 w-5" />}
                            {source.type === "products" && <Zap className="h-5 w-5" />}
                            {source.type === "orders" && <Code className="h-5 w-5" />}
                            {source.type === "policies" && <ShieldCheck className="h-5 w-5" />}
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
                          <p className="text-sm text-muted-foreground">
                            Afficher "en train d'écrire..." pendant les réponses
                          </p>
                        </div>
                        <Switch
                          checked={advancedConfig.enableTypingIndicator}
                          onCheckedChange={(checked) => 
                            setAdvancedConfig(prev => ({ ...prev, enableTypingIndicator: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Accusés de lecture</Label>
                          <p className="text-sm text-muted-foreground">
                            Marquer les messages comme lus
                          </p>
                        </div>
                        <Switch
                          checked={advancedConfig.enableReadReceipts}
                          onCheckedChange={(checked) => 
                            setAdvancedConfig(prev => ({ ...prev, enableReadReceipts: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Réponses rapides</Label>
                          <p className="text-sm text-muted-foreground">
                            Boutons de réponses suggérées
                          </p>
                        </div>
                        <Switch
                          checked={advancedConfig.enableQuickReplies}
                          onCheckedChange={(checked) => 
                            setAdvancedConfig(prev => ({ ...prev, enableQuickReplies: checked }))
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label>Délai de simulation de réponse</Label>
                      <div className="space-y-2">
                        <Slider
                          value={[advancedConfig.responseDelay]}
                          onValueChange={(value) => 
                            setAdvancedConfig(prev => ({ ...prev, responseDelay: value[0] }))
                          }
                          max={5000}
                          min={500}
                          step={250}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>0.5s</span>
                          <span className="font-medium">{advancedConfig.responseDelay}ms</span>
                          <span>5s</span>
                        </div>
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
                    <div className="space-y-2">
                      <Label>Animation d'apparition</Label>
                      <Select 
                        value={advancedConfig.animation} 
                        onValueChange={(value) => 
                          setAdvancedConfig(prev => ({ ...prev, animation: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {animations.map(anim => (
                            <SelectItem key={anim.value} value={anim.value}>
                              {anim.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Effet sonore</Label>
                      <Select 
                        value={advancedConfig.soundEffect} 
                        onValueChange={(value) => 
                          setAdvancedConfig(prev => ({ ...prev, soundEffect: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {soundEffects.map(sound => (
                            <SelectItem key={sound.value} value={sound.value}>
                              {sound.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Emojis</Label>
                          <p className="text-sm text-muted-foreground">
                            Permettre l'utilisation d'emojis
                          </p>
                        </div>
                        <Switch
                          checked={advancedConfig.enableEmojis}
                          onCheckedChange={(checked) => 
                            setAdvancedConfig(prev => ({ ...prev, enableEmojis: checked }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Upload de fichiers</Label>
                          <p className="text-sm text-muted-foreground">
                            Permettre aux clients d'envoyer des fichiers
                          </p>
                        </div>
                        <Switch
                          checked={advancedConfig.enableFileUpload}
                          onCheckedChange={(checked) => 
                            setAdvancedConfig(prev => ({ ...prev, enableFileUpload: checked }))
                          }
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Heures d'ouverture</Label>
                      <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Activer les horaires</Label>
                          <Switch 
                            checked={advancedConfig.workingHours.enabled}
                            onCheckedChange={(checked) => 
                              setAdvancedConfig(prev => ({ 
                                ...prev, 
                                workingHours: { ...prev.workingHours, enabled: checked } 
                              }))
                            }
                          />
                        </div>
                        
                        {advancedConfig.workingHours.enabled && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-xs">Ouverture</Label>
                              <Input 
                                type="time" 
                                value={advancedConfig.workingHours.start}
                                onChange={(e) => 
                                  setAdvancedConfig(prev => ({ 
                                    ...prev, 
                                    workingHours: { ...prev.workingHours, start: e.target.value } 
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Fermeture</Label>
                              <Input 
                                type="time" 
                                value={advancedConfig.workingHours.end}
                                onChange={(e) => 
                                  setAdvancedConfig(prev => ({ 
                                    ...prev, 
                                    workingHours: { ...prev.workingHours, end: e.target.value } 
                                  }))
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          /* Design (Full Page) */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
            <div className="space-y-8">
              <Card className="border-primary/20 shadow-lg">
                <CardHeader className="bg-primary/5 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        Style du Widget
                      </CardTitle>
                      <CardDescription>
                        Personnalisez chaque détail visuel de votre assistant
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveView("settings")}>
                      Retour aux réglages
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ChatbotGeneratorCustomizer
                    initialConfig={generatorConfig || {
                      chatbotId: botConfig.id || 'wikzy-premium',
                      title: botConfig.name || 'Assistant Wikzy',
                      subtitle: botConfig.description || 'Votre styliste personnel, toujours à vos côtés',
                      primaryColor: '#ff6f61',
                      secondaryColor: '#ffdd5b',
                      accentColor: '#ffdd5b',
                      textColor: '#1F2937',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '24px',
                      position: botConfig.visualConfig.position === 'Bas droite' ? 'bottom-right' :
                               botConfig.visualConfig.position === 'Bas gauche' ? 'bottom-left' :
                               botConfig.visualConfig.position === 'Haut droite' ? 'top-right' : 
                               botConfig.visualConfig.position === 'Haut gauche' ? 'top-left' : 'bottom-right',
                      size: botConfig.visualConfig.size === 'Compact' ? 'compact' :
                           botConfig.visualConfig.size === 'Standard' ? 'standard' : 'large',
                      welcomeMessage: botConfig.visualConfig.welcomeMessage || '✨ Bonjour ! Je suis Wikzy, votre styliste personnel. Prêt à trouver le look parfait ? Essayez "robes", "chaussures" ou "nouveau style" !',
                      placeholder: botConfig.visualConfig.placeholder || 'Ex: Robe rouge, taille M...',
                      personality: botConfig.personality,
                      fontFamily: '"Poppins", sans-serif',
                      buttonSize: 72,
                      shadowEffect: 'medium',
                      animationStyle: 'gradient-pulse',
                      customIcon: null,
                      headerBackgroundColor: 'linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)',
                      headerTextColor: '#FFFFFF',
                      headerPadding: 18,
                      headerTitleFontSize: 19,
                      avatarType: 'image',
                      avatarValue: 'http://localhost:3000/styli.png',
                      buttonBackgroundColor: 'linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)',
                      buttonIconColor: '#FFFFFF',
                      closeButtonColor: '#FFFFFF'
                    }}
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
                                   config.position === 'top-right' ? 'Haut droite' : 
                                   config.position === 'top-left' ? 'Haut gauche' : 'Bas droite',
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
                        },
                        generatorConfig: {
                          ...config,
                          accentColor: config.accentColor || config.primaryColor, // Assurer que l'accent est synchronisé
                          personality: {
                            tone: config.personality.tone as ChatbotPersonality['tone'],
                            formality: config.personality.formality as ChatbotPersonality['formality'],
                            verbosity: config.personality.verbosity as ChatbotPersonality['verbosity'],
                            empathy: config.personality.empathy as ChatbotPersonality['empathy'],
                            proactivity: config.personality.proactivity as ChatbotPersonality['proactivity']
                          }
                        }
                      }))
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Intégration sur votre site
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Script à copier dans votre HTML</Label>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg overflow-auto text-[11px] font-mono border">
                        <code>{`<script src="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/chatbot-generator.js" data-bot-id="${botId}"></script>`}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                        onClick={() => {
                          const code = `<script src="${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/chatbot-generator.js" data-bot-id="${botId}"></script>`
                          navigator.clipboard.writeText(code)
                          toast.success("Copié !")
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <div className="sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="font-bold text-lg">Aperçu en temps réel</Label>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Interactif</Badge>
                </div>
                <div className="border rounded-2xl overflow-hidden bg-white dark:bg-slate-950 h-[800px] relative shadow-2xl border-primary/10">
                  <ChatbotLivePreview 
                    config={generatorConfig || {
                      chatbotId: botConfig.id || 'wikzy-premium',
                      title: botConfig.name || 'Assistant Wikzy',
                      subtitle: botConfig.description || 'Votre styliste personnel',
                      apiEndpoint: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/ai/master`,
                      position: botConfig.visualConfig.position === 'Bas droite' ? 'bottom-right' :
                               botConfig.visualConfig.position === 'Bas gauche' ? 'bottom-left' :
                               botConfig.visualConfig.position === 'Haut droite' ? 'top-right' : 
                               botConfig.visualConfig.position === 'Haut gauche' ? 'top-left' : 'bottom-right',
                      primaryColor: '#ff6f61',
                      secondaryColor: '#ffdd5b',
                      accentColor: '#ffdd5b',
                      textColor: '#1F2937',
                      backgroundColor: '#FFFFFF',
                      borderRadius: botConfig.visualConfig.borderRadius === 'Très arrondi' ? '24px' :
                                   botConfig.visualConfig.borderRadius === 'Arrondi' ? '12px' : '0px',
                      size: botConfig.visualConfig.size === 'Compact' ? 'compact' :
                           botConfig.visualConfig.size === 'Standard' ? 'standard' : 'large',
                      showTypingIndicator: true,
                      enableSound: true,
                      autoOpen: false,
                      autoOpenDelay: 2000,
                      welcomeMessage: botConfig.visualConfig.welcomeMessage || '✨ Bonjour ! Je suis Wikzy, votre styliste personnel.',
                      placeholder: botConfig.visualConfig.placeholder || 'Ex: Robe rouge, taille M...',
                      personality: botConfig.personality,
                      fontFamily: '"Poppins", sans-serif',
                      buttonSize: 72,
                      shadowEffect: 'medium',
                      animationStyle: 'gradient-pulse',
                      customIcon: null,
                      headerBackgroundColor: 'linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)',
                      headerTextColor: '#FFFFFF',
                      headerPadding: 18,
                      headerTitleFontSize: 19,
                      avatarType: 'image',
                      avatarValue: 'http://localhost:3000/styli.png',
                      buttonBackgroundColor: 'linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)',
                      buttonIconColor: '#FFFFFF',
                      closeButtonColor: '#FFFFFF',
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
                    }} 
                    botId={botId} 
                  />
                </div>
                <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-dashed text-sm text-center text-muted-foreground">
                  Testez les couleurs et les interactions directement dans l'aperçu ci-dessus.
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
