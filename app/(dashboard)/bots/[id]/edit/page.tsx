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
import { Chatbot, ChatbotPersonality, ChatbotVisualConfig, ChatbotDataSource } from "@/lib/types"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { ChatbotService } from "@/lib/services/chatbot.service"


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
    name: "Rose moderne",
    primary: "#EC4899",
    secondary: "#FCE7F3",
    accent: "#BE185D",
    background: "#FDF2F8"
  },
  {
    name: "Mode sombre",
    primary: "#6366F1",
    secondary: "#1F2937",
    accent: "#4F46E5",
    background: "#111827"
  }
]

// Animations prédéfinies
const animations = [
  { name: "Aucune", value: "none" },
  { name: "Fondu", value: "fade" },
  { name: "Glissement", value: "slide" },
  { name: "Zoom", value: "zoom" },
  { name: "Rebond", value: "bounce" },
  { name: "Pulsation", value: "pulse" }
]

// Effets sonores
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

  if (!botId) {
    router.push("/bots")
    return null
  }

  // États pour la configuration du chatbot
  const [botConfig, setBotConfig] = useState<Chatbot>({
    id: botId,
    name: "Assistant Younzee",
    description: "Chatbot principal pour l'assistance clientèle",
    status: "En test",
    isDefault: false,
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
      welcomeMessage: "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
      placeholder: "Tapez votre message..."
    },
    dataSources: [],
    conversationsCount: 0,
    avgResponseTime: 850,
    satisfactionRate: 87
  })

  // États pour les fonctionnalités avancées
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile" | "tablet">("desktop")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Configuration avancée du design
  const [advancedConfig, setAdvancedConfig] = useState({
    animation: "fade",
    soundEffect: "soft-notification",
    enableTypingIndicator: true,
    enableReadReceipts: true,
    enableQuickReplies: true,
    maxConversationLength: 50,
    responseDelay: 1000,
    customCSS: "",
    customAvatar: "",
    brandLogo: "",
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
    customGreetings: [] as string[],
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

  const updateDataSource = (id: string, updates: Partial<ChatbotDataSource>) => {
    setDataSources(prev => prev.map(source => source.id === id ? { ...source, ...updates } : source))
  }

  useEffect(() => {
    const fetchBotConfig = async () => {
      try {
        const data = await ChatbotService.getById(botId)
        
        if (data) {
          console.log('data', data)
          setBotConfig(data)
        } else {
          toast.error("Chatbot non trouvé")
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du chatbot:', error)
        toast.error("Erreur lors du chargement du chatbot")
      }
    }
    fetchBotConfig()
  }, [botId])

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
        backgroundColor: palette.background,
        textColor: palette.name === "Mode sombre" ? "#F9FAFB" : "#1F2937"
      }
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      // Conversion du format UI vers le format DB pour la mise à jour
      const updateData = {
        name: botConfig.name,
        description: botConfig.description,
        status: botConfig.status,
        is_default: botConfig.isDefault,
        personality: botConfig.personality,
        visual_config: botConfig.visualConfig,
        data_sources: botConfig.dataSources,
        conversations_count: botConfig.conversationsCount,
        avg_response_time: botConfig.avgResponseTime,
        satisfaction_rate: botConfig.satisfactionRate
      }
      
      const updatedBot = await ChatbotService.update(botId, updateData)
      
      if (updatedBot) {
        setBotConfig(updatedBot)
        console.log('updatedBot', updatedBot)
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title={`Configuration de ${botConfig.name}`}
        description="Personnalisez l'apparence, le comportement et les fonctionnalités de votre chatbot"
      >
        <div className="flex gap-2">
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
        {/* Configuration */}
        <div className="space-y-6">
          <Tabs defaultValue="personality" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {/*<TabsTrigger value="design">Design</TabsTrigger>*/}
              <TabsTrigger value="personality">Personnalité</TabsTrigger>
                <TabsTrigger value="data">Données</TabsTrigger>
                <TabsTrigger value="behavior">Comportement</TabsTrigger>
                <TabsTrigger value="advanced">Avancé</TabsTrigger>
            </TabsList>

            {/* Onglet Design */}
            <TabsContent value="design" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Apparence visuelle
                  </CardTitle>
                  <CardDescription>
                    Personnalisez l'aspect visuel de votre chatbot
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Palettes de couleurs */}
                  <div className="space-y-3">
                    <Label>Palettes de couleurs prédéfinies</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {colorPalettes.map((palette) => (
                        <Button
                          key={palette.name}
                          variant="outline"
                          className="h-auto p-3 flex flex-col items-start gap-2"
                          onClick={() => applyColorPalette(palette)}
                        >
                          <div className="flex gap-1">
                            <div 
                              className="w-4 h-4 rounded-full border" 
                              style={{ backgroundColor: palette.primary }}
                            />
                            <div 
                              className="w-4 h-4 rounded-full border" 
                              style={{ backgroundColor: palette.secondary }}
                            />
                            <div 
                              className="w-4 h-4 rounded-full border" 
                              style={{ backgroundColor: palette.accent }}
                            />
                          </div>
                          <span className="text-sm">{palette.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Couleurs personnalisées */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Couleur principale</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={botConfig.visualConfig.primaryColor}
                          onChange={(e) => updateVisualConfig("primaryColor", e.target.value)}
                          className="w-12 h-10 p-1 border rounded"
                        />
                        <Input
                          value={botConfig.visualConfig.primaryColor}
                          onChange={(e) => updateVisualConfig("primaryColor", e.target.value)}
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Couleur secondaire</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={botConfig.visualConfig.secondaryColor}
                          onChange={(e) => updateVisualConfig("secondaryColor", e.target.value)}
                          className="w-12 h-10 p-1 border rounded"
                        />
                        <Input
                          value={botConfig.visualConfig.secondaryColor}
                          onChange={(e) => updateVisualConfig("secondaryColor", e.target.value)}
                          placeholder="#EFF6FF"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Taille et position */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Taille</Label>
                      <Select 
                        value={botConfig.visualConfig.size} 
                        onValueChange={(value) => updateVisualConfig("size", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Compact">Compact (72x96)</SelectItem>
                          <SelectItem value="Standard">Standard (80x500)</SelectItem>
                          <SelectItem value="Large">Large (96x600)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Select 
                        value={botConfig.visualConfig.position} 
                        onValueChange={(value) => updateVisualConfig("position", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Bas droite">Bas droite</SelectItem>
                          <SelectItem value="Bas gauche">Bas gauche</SelectItem>
                          <SelectItem value="Flottant centre">Flottant centre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Bordures et forme */}
                  <div className="space-y-2">
                    <Label>Style des bordures</Label>
                    <RadioGroup 
                      value={botConfig.visualConfig.borderRadius} 
                      onValueChange={(value) => updateVisualConfig("borderRadius", value)}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Carré" id="square" />
                        <Label htmlFor="square">Carré</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Arrondi" id="rounded" />
                        <Label htmlFor="rounded">Arrondi</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Très arrondi" id="very-rounded" />
                        <Label htmlFor="very-rounded">Très arrondi</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Messages */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Message de bienvenue</Label>
                      <Textarea
                        value={botConfig.visualConfig.welcomeMessage}
                        onChange={(e) => updateVisualConfig("welcomeMessage", e.target.value)}
                        placeholder="Bonjour ! Comment puis-je vous aider ?"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Placeholder de saisie</Label>
                      <Input
                        value={botConfig.visualConfig.placeholder}
                        onChange={(e) => updateVisualConfig("placeholder", e.target.value)}
                        placeholder="Tapez votre message..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Personnalité */}
            <TabsContent value="personality" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Personnalité du chatbot
                  </CardTitle>
                  <CardDescription>
                    Définissez le ton et le style de communication
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Ton */}
                  <div className="space-y-3">
                    <Label>Ton de communication</Label>
                    <Select 
                      value={botConfig.personality.tone} 
                      onValueChange={(value) => updatePersonality("tone", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Professionnel">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Professionnel
                          </div>
                        </SelectItem>
                        <SelectItem value="Décontracté">
                          <div className="flex items-center gap-2">
                            <Smile className="h-4 w-4" />
                            Décontracté
                          </div>
                        </SelectItem>
                        <SelectItem value="Amical">
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            Amical
                          </div>
                        </SelectItem>
                        <SelectItem value="Expert">
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            Expert
                          </div>
                        </SelectItem>
                        <SelectItem value="Humoristique">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Humoristique
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Formalité */}
                  <div className="space-y-3">
                    <Label>Niveau de formalité</Label>
                    <RadioGroup 
                      value={botConfig.personality.formality} 
                      onValueChange={(value) => updatePersonality("formality", value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Tutoiement" id="tu" />
                        <Label htmlFor="tu">Tutoiement (tu/te)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Vouvoiement" id="vous" />
                        <Label htmlFor="vous">Vouvoiement (vous)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Verbosité */}
                  <div className="space-y-3">
                    <Label>Niveau de détail des réponses</Label>
                    <Select 
                      value={botConfig.personality.verbosity} 
                      onValueChange={(value) => updatePersonality("verbosity", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Concis">Concis - Réponses courtes</SelectItem>
                        <SelectItem value="Détaillé">Détaillé - Réponses équilibrées</SelectItem>
                        <SelectItem value="Très détaillé">Très détaillé - Réponses complètes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Empathie */}
                  <div className="space-y-3">
                    <Label>Niveau d'empathie</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[
                          botConfig.personality.empathy === "Faible" ? 1 : 
                          botConfig.personality.empathy === "Moyenne" ? 2 : 3
                        ]}
                        onValueChange={(value) => {
                          const empathyLevel = value[0] === 1 ? "Faible" : 
                                             value[0] === 2 ? "Moyenne" : "Élevée"
                          updatePersonality("empathy", empathyLevel)
                        }}
                        max={3}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Faible</span>
                        <span>Moyenne</span>
                        <span>Élevée</span>
                      </div>
                    </div>
                  </div>

                  {/* Proactivité */}
                  <div className="space-y-3">
                    <Label>Proactivité</Label>
                    <Select 
                      value={botConfig.personality.proactivity} 
                      onValueChange={(value) => updatePersonality("proactivity", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Réactif">Réactif - Répond seulement aux questions</SelectItem>
                        <SelectItem value="Proactif">Proactif - Propose des suggestions</SelectItem>
                        <SelectItem value="Très proactif">Très proactif - Guide activement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
              {/* Sources de données */}
              <TabsContent value="data">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Sources de Données IA
                    </CardTitle>
                    <CardDescription>
                      Configurez les sources d'information du chatbot
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dataSources.map((source) => (
                        <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={source.isEnabled}
                              onCheckedChange={(checked) => updateDataSource(source.id, { isEnabled: checked })}
                            />
                            <div>
                              <div className="font-medium">{source.name}</div>
                              <div className="text-sm text-muted-foreground">Type: {source.type}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Priorité:</Label>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={source.priority}
                              onChange={(e) => updateDataSource(source.id, { priority: parseInt(e.target.value) })}
                              className="w-16"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            {/* Onglet Comportement */}
            <TabsContent value="behavior" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Comportement et fonctionnalités
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Options de comportement */}
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

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Emojis</Label>
                        <p className="text-sm text-muted-foreground">
                          Autoriser l'utilisation d'emojis
                        </p>
                      </div>
                      <Switch
                        checked={advancedConfig.enableEmojis}
                        onCheckedChange={(checked) => 
                          setAdvancedConfig(prev => ({ ...prev, enableEmojis: checked }))
                        }
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Délai de réponse */}
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

                  {/* Longueur max des conversations */}
                  <div className="space-y-2">
                    <Label>Nombre maximum de messages par conversation</Label>
                    <Input
                      type="number"
                      min={10}
                      max={200}
                      value={advancedConfig.maxConversationLength}
                      onChange={(e) => 
                        setAdvancedConfig(prev => ({ 
                          ...prev, 
                          maxConversationLength: parseInt(e.target.value) || 50 
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Avancé */}
            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Configuration avancée
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Animations */}
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

                  {/* Effets sonores */}
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
                            <div className="flex items-center gap-2">
                              <Volume2 className="h-4 w-4" />
                              {sound.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* CSS personnalisé */}
                  <div className="space-y-2">
                    <Label>CSS personnalisé</Label>
                    <Textarea
                      value={advancedConfig.customCSS}
                      onChange={(e) => 
                        setAdvancedConfig(prev => ({ ...prev, customCSS: e.target.value }))
                      }
                      placeholder="/* Votre CSS personnalisé ici */"
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* Heures d'ouverture */}
                  <Accordion type="single" collapsible>
                    <AccordionItem value="hours">
                      <AccordionTrigger>Heures d'ouverture</AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Activer les heures d'ouverture</Label>
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
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Heure d'ouverture</Label>
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
                              <div className="space-y-2">
                                <Label>Heure de fermeture</Label>
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
                            <div className="space-y-2">
                              <Label>Message hors horaires</Label>
                              <Textarea
                                value={advancedConfig.workingHours.offlineMessage}
                                onChange={(e) => 
                                  setAdvancedConfig(prev => ({ 
                                    ...prev, 
                                    workingHours: { ...prev.workingHours, offlineMessage: e.target.value }
                                  }))
                                }
                                rows={2}
                              />
                            </div>
                          </>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Aperçu */}
        {/*<div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Aperçu en temps réel
              </CardTitle>
              <CardDescription>
                Visualisez les modifications en direct
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button
                  variant={previewDevice === "desktop" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewDevice("desktop")}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Desktop
                </Button>
                <Button
                  variant={previewDevice === "tablet" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewDevice("tablet")}
                >
                  <Tablet className="h-4 w-4 mr-2" />
                  Tablet
                </Button>
                <Button
                  variant={previewDevice === "mobile" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewDevice("mobile")}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Mobile
                </Button>
              </div>

              <div className={`relative border rounded-lg overflow-hidden ${
                previewDevice === "mobile" ? "w-full max-w-sm mx-auto" :
                previewDevice === "tablet" ? "w-full max-w-md mx-auto" :
                "w-full"
              } ${previewDevice === "mobile" ? "h-96" : "h-[600px]"}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
                  <ChatbotPreview
                    visualConfig={botConfig.visualConfig}
                    personality={botConfig.personality}
                    chatbotName={botConfig.name}
                    interactive={false}
                    className={previewDevice === "mobile" ? "scale-75 origin-top-left" : ""}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Test interactif
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Test du chatbot</DialogTitle>
                      <DialogDescription>
                        Testez votre chatbot en mode interactif
                      </DialogDescription>
                    </DialogHeader>
                    <div className="h-96 relative">
                      <ChatbotPreview
                        visualConfig={botConfig.visualConfig}
                        personality={botConfig.personality}
                        chatbotName={botConfig.name}
                        interactive={true}
                      />
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" size="sm" onClick={() => setIsDarkMode(!isDarkMode)}>
                  {isDarkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  {isDarkMode ? "Mode clair" : "Mode sombre"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analyse de configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Personnalisation</span>
                  <span className="font-medium">85%</span>
                </div>
                <Progress value={85} />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Fonctionnalités activées</span>
                  <span className="font-medium">7/10</span>
                </div>
                <Progress value={70} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Score d'accessibilité</span>
                  <span className="font-medium">92%</span>
                </div>
                <Progress value={92} />
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Configuration recommandée pour l'e-commerce
                </div>
              </div>
            </CardContent>
          </Card>
        </div>*/}
      </div>
    </div>
  )
}