"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  ArrowLeft,
  Bot,
  Palette,
  MessageSquare,
  Database,
  Save,
  Eye,
  Settings,
  Sparkles,
  Monitor,
  Smartphone,
  Download,
  Upload,
  Zap,
  Heart
} from "lucide-react"
import { ChatbotPersonality, ChatbotVisualConfig, ChatbotDataSource } from "@/lib/types"
import { ChatbotPreview } from "@/components/chatbot-preview"
import { IntelligentChatbot } from "@/components/intelligent-chatbot"
import { toast } from "sonner"
import Link from "next/link"

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
    name: "Younzee (Défaut)",
    primary: "#3B82F6",
    secondary: "#EFF6FF",
    accent: "#1E40AF",
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

// Templates de chatbot prédéfinis
const chatbotTemplates = [
  {
    name: "E-commerce Standard",
    description: "Assistant commercial pour boutique en ligne",
    personality: {
      tone: "Amical" as const,
      formality: "Tutoiement" as const,
      verbosity: "Détaillé" as const,
      empathy: "Élevée" as const,
      proactivity: "Proactif" as const
    },
    welcomeMessage: "👋 Salut ! Je suis là pour t'aider à trouver le produit parfait ! Que cherches-tu ?",
    placeholder: "Décris ce que tu cherches..."
  },
  {
    name: "Support Technique",
    description: "Assistant pour support et dépannage",
    personality: {
      tone: "Professionnel" as const,
      formality: "Vouvoiement" as const,
      verbosity: "Très détaillé" as const,
      empathy: "Élevée" as const,
      proactivity: "Réactif" as const
    },
    welcomeMessage: "Bonjour ! Je suis votre assistant technique. Comment puis-je vous aider aujourd'hui ?",
    placeholder: "Décrivez votre problème..."
  },
  {
    name: "Conseiller Mode",
    description: "Styliste virtuel et conseiller tendances",
    personality: {
      tone: "Amical" as const,
      formality: "Tutoiement" as const,
      verbosity: "Détaillé" as const,
      empathy: "Moyenne" as const,
      proactivity: "Très proactif" as const
    },
    welcomeMessage: "✨ Hey ! Ton styliste personnel est là ! Prêt(e) pour un nouveau look ?",
    placeholder: "Dis-moi ton style..."
  }
]

export default function NewBotPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile" | "tablet">("desktop")
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  
  // État du formulaire
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("En test")
  
  const [personality, setPersonality] = useState<ChatbotPersonality>({
    tone: "Amical",
    formality: "Tutoiement",
    verbosity: "Détaillé",
    empathy: "Élevée",
    proactivity: "Proactif"
  })
  
  const [visualConfig, setVisualConfig] = useState<ChatbotVisualConfig>({
    primaryColor: "#3B82F6",
    secondaryColor: "#EFF6FF",
    textColor: "#1F2937",
    backgroundColor: "#FFFFFF",
    borderRadius: "Arrondi",
    position: "Bas droite",
    size: "Standard",
    welcomeMessage: "👋 Salut ! Je suis votre assistant mode personnel ! Comment puis-je vous aider à trouver le produit parfait aujourd'hui ?",
    placeholder: "Décrivez ce que vous cherchez..."
  })
  
  const [dataSources, setDataSources] = useState<ChatbotDataSource[]>([
    { id: "1", type: "faq", name: "FAQ Générale", isEnabled: true, priority: 1 },
    { id: "2", type: "products", name: "Catalogue Produits", isEnabled: true, priority: 2 },
    { id: "3", type: "orders", name: "Commandes", isEnabled: false, priority: 3 },
    { id: "4", type: "policies", name: "Politiques", isEnabled: false, priority: 4 },
  ])

  // Configuration avancée
  const [advancedConfig, setAdvancedConfig] = useState({
    enableTypingIndicator: true,
    enableQuickReplies: true,
    responseDelay: [1000],
    enableEmojis: true,
    enableFileUpload: false,
    maxConversationLength: [50],
    workingHours: {
      enabled: false,
      start: "09:00",
      end: "18:00",
      offlineMessage: "Nous sommes actuellement fermés. Laissez-nous un message !"
    }
  })

  const applyTemplate = (templateName: string) => {
    const template = chatbotTemplates.find(t => t.name === templateName)
    if (template) {
      setPersonality(template.personality)
      setVisualConfig(prev => ({
        ...prev,
        welcomeMessage: template.welcomeMessage,
        placeholder: template.placeholder
      }))
      setDescription(template.description)
      setSelectedTemplate(templateName)
      toast.success(`Template "${templateName}" appliqué !`)
    }
  }

  const applyColorPalette = (palette: typeof colorPalettes[0]) => {
    setVisualConfig(prev => ({
      ...prev,
      primaryColor: palette.primary,
      secondaryColor: palette.secondary,
      backgroundColor: palette.background,
      textColor: palette.name === "Mode sombre" ? "#F9FAFB" : "#1F2937"
    }))
    toast.success(`Palette "${palette.name}" appliquée !`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Validation
      if (!name.trim()) {
        toast.error("Le nom du chatbot est requis")
        return
      }

      // Simulation de création avec API
      const newBot = {
        name,
        description,
        status,
        personality,
        visualConfig,
        dataSources: dataSources.filter(ds => ds.isEnabled),
        advancedConfig,
        createdAt: new Date().toISOString()
      }

      // Simulation d'appel API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success("Chatbot créé avec succès !")
      //router.push("/bots")
    } catch (error) {
      toast.error("Erreur lors de la création du chatbot")
    } finally {
      setIsLoading(false)
    }
  }

  const updateDataSource = (id: string, updates: Partial<ChatbotDataSource>) => {
    setDataSources(sources => 
      sources.map(source => 
        source.id === id ? { ...source, ...updates } : source
      )
    )
  }

  const exportTemplate = () => {
    const template = {
      name: name || "Mon Template",
      personality,
      visualConfig,
      dataSources,
      advancedConfig
    }
    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chatbot-template-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Template exporté !")
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Nouveau Chatbot Intelligent"
        description="Créez et configurez votre assistant virtuel avec IA"
        backHref="/bots"
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Exporter Template
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Templates prédéfinis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Templates Prédéfinis
                </CardTitle>
                <CardDescription>
                  Commencez rapidement avec un template optimisé
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {chatbotTemplates.map((template) => (
                    <Button
                      key={template.name}
                      variant={selectedTemplate === template.name ? "default" : "outline"}
                      className="h-auto p-4 flex flex-col items-start gap-2"
                      onClick={() => applyTemplate(template.name)}
                      type="button"
                    >
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground text-left">
                        {template.description}
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Informations générales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Informations Générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du chatbot *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Assistant Younzee"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Statut initial</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="En test">En test</SelectItem>
                        <SelectItem value="Actif">Actif</SelectItem>
                        <SelectItem value="Inactif">Inactif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez le rôle et les capacités de ce chatbot..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="design" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="personality">Personnalité</TabsTrigger>
                <TabsTrigger value="data">Sources</TabsTrigger>
                <TabsTrigger value="advanced">Avancé</TabsTrigger>
              </TabsList>

              {/* Configuration du design */}
              <TabsContent value="design">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Apparence Visuelle
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
                            type="button"
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
                            value={visualConfig.primaryColor}
                            onChange={(e) => setVisualConfig({...visualConfig, primaryColor: e.target.value})}
                            className="w-12 h-10 p-1 border rounded"
                          />
                          <Input
                            value={visualConfig.primaryColor}
                            onChange={(e) => setVisualConfig({...visualConfig, primaryColor: e.target.value})}
                            placeholder="#3B82F6"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Couleur secondaire</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={visualConfig.secondaryColor}
                            onChange={(e) => setVisualConfig({...visualConfig, secondaryColor: e.target.value})}
                            className="w-12 h-10 p-1 border rounded"
                          />
                          <Input
                            value={visualConfig.secondaryColor}
                            onChange={(e) => setVisualConfig({...visualConfig, secondaryColor: e.target.value})}
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
                          value={visualConfig.size} 
                          onValueChange={(value: any) => setVisualConfig({...visualConfig, size: value})}
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
                          value={visualConfig.position} 
                          onValueChange={(value: any) => setVisualConfig({...visualConfig, position: value})}
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

                    {/* Bordures */}
                    <div className="space-y-2">
                      <Label>Style des bordures</Label>
                      <RadioGroup 
                        value={visualConfig.borderRadius} 
                        onValueChange={(value: any) => setVisualConfig({...visualConfig, borderRadius: value})}
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
                          value={visualConfig.welcomeMessage}
                          onChange={(e) => setVisualConfig({...visualConfig, welcomeMessage: e.target.value})}
                          placeholder="Bonjour ! Comment puis-je vous aider ?"
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Placeholder de saisie</Label>
                        <Input
                          value={visualConfig.placeholder}
                          onChange={(e) => setVisualConfig({...visualConfig, placeholder: e.target.value})}
                          placeholder="Tapez votre message..."
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Configuration de la personnalité */}
              <TabsContent value="personality">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Personnalité du Chatbot
                    </CardTitle>
                    <CardDescription>
                      Définissez le ton et le style de communication
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Ton de la conversation</Label>
                        <Select 
                          value={personality.tone} 
                          onValueChange={(value: any) => setPersonality({...personality, tone: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Professionnel">Professionnel</SelectItem>
                            <SelectItem value="Décontracté">Décontracté</SelectItem>
                            <SelectItem value="Amical">Amical</SelectItem>
                            <SelectItem value="Expert">Expert</SelectItem>
                            <SelectItem value="Humoristique">Humoristique</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Formalité</Label>
                        <Select 
                          value={personality.formality} 
                          onValueChange={(value: any) => setPersonality({...personality, formality: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tutoiement">Tutoiement</SelectItem>
                            <SelectItem value="Vouvoiement">Vouvoiement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Niveau de détail</Label>
                        <Select 
                          value={personality.verbosity} 
                          onValueChange={(value: any) => setPersonality({...personality, verbosity: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Concis">Concis</SelectItem>
                            <SelectItem value="Détaillé">Détaillé</SelectItem>
                            <SelectItem value="Très détaillé">Très détaillé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Empathie</Label>
                        <Select 
                          value={personality.empathy} 
                          onValueChange={(value: any) => setPersonality({...personality, empathy: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Faible">Faible</SelectItem>
                            <SelectItem value="Moyenne">Moyenne</SelectItem>
                            <SelectItem value="Élevée">Élevée</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Proactivité</Label>
                      <Select 
                        value={personality.proactivity} 
                        onValueChange={(value: any) => setPersonality({...personality, proactivity: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Réactif">Réactif</SelectItem>
                          <SelectItem value="Proactif">Proactif</SelectItem>
                          <SelectItem value="Très proactif">Très proactif</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Détermine si le chatbot propose spontanément de l'aide ou attend les questions
                      </p>
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

              {/* Configuration avancée */}
              <TabsContent value="advanced">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Configuration Avancée
                    </CardTitle>
                    <CardDescription>
                      Options avancées pour personnaliser l'expérience
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Options de comportement */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Indicateur de frappe</Label>
                          <p className="text-sm text-muted-foreground">Affiche quand le bot "tape"</p>
                        </div>
                        <Switch
                          checked={advancedConfig.enableTypingIndicator}
                          onCheckedChange={(checked) => setAdvancedConfig(prev => ({...prev, enableTypingIndicator: checked}))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Réponses rapides</Label>
                          <p className="text-sm text-muted-foreground">Boutons de suggestions</p>
                        </div>
                        <Switch
                          checked={advancedConfig.enableQuickReplies}
                          onCheckedChange={(checked) => setAdvancedConfig(prev => ({...prev, enableQuickReplies: checked}))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Emojis</Label>
                          <p className="text-sm text-muted-foreground">Support des emojis</p>
                        </div>
                        <Switch
                          checked={advancedConfig.enableEmojis}
                          onCheckedChange={(checked) => setAdvancedConfig(prev => ({...prev, enableEmojis: checked}))}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Sliders de configuration */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Délai de réponse (ms)</Label>
                        <Slider
                          value={advancedConfig.responseDelay}
                          onValueChange={(value) => setAdvancedConfig(prev => ({...prev, responseDelay: value}))}
                          max={3000}
                          min={500}
                          step={100}
                          className="w-full"
                        />
                        <p className="text-sm text-muted-foreground">Actuel: {advancedConfig.responseDelay[0]}ms</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Longueur max conversation</Label>
                        <Slider
                          value={advancedConfig.maxConversationLength}
                          onValueChange={(value) => setAdvancedConfig(prev => ({...prev, maxConversationLength: value}))}
                          max={100}
                          min={10}
                          step={5}
                          className="w-full"
                        />
                        <p className="text-sm text-muted-foreground">Actuel: {advancedConfig.maxConversationLength[0]} messages</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Heures de travail */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Heures de travail</Label>
                          <p className="text-sm text-muted-foreground">Limite les heures actives</p>
                        </div>
                        <Switch
                          checked={advancedConfig.workingHours.enabled}
                          onCheckedChange={(checked) => setAdvancedConfig(prev => ({
                            ...prev, 
                            workingHours: {...prev.workingHours, enabled: checked}
                          }))}
                        />
                      </div>
                      
                      {advancedConfig.workingHours.enabled && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                          <div className="space-y-2">
                            <Label>Début</Label>
                            <Input
                              type="time"
                              value={advancedConfig.workingHours.start}
                              onChange={(e) => setAdvancedConfig(prev => ({
                                ...prev,
                                workingHours: {...prev.workingHours, start: e.target.value}
                              }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Fin</Label>
                            <Input
                              type="time"
                              value={advancedConfig.workingHours.end}
                              onChange={(e) => setAdvancedConfig(prev => ({
                                ...prev,
                                workingHours: {...prev.workingHours, end: e.target.value}
                              }))}
                            />
                          </div>
                          <div className="col-span-2 space-y-2">
                            <Label>Message hors horaires</Label>
                            <Textarea
                              value={advancedConfig.workingHours.offlineMessage}
                              onChange={(e) => setAdvancedConfig(prev => ({
                                ...prev,
                                workingHours: {...prev.workingHours, offlineMessage: e.target.value}
                              }))}
                              rows={2}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Settings className="h-4 w-4 mr-2 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Créer le Chatbot IA
                  </>
                )}
              </Button>
              <Button type="button" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Aperçu
              </Button>
            </div>
          </form>
        </div>

        {/* Prévisualisation améliorée */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Aperçu en Temps Réel
              </CardTitle>
              <CardDescription>
                Visualisez votre chatbot intelligent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sélecteur de device */}
              <div className="flex gap-2">
                <Button
                  variant={previewDevice === "desktop" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewDevice("desktop")}
                  type="button"
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Desktop
                </Button>
                <Button
                  variant={previewDevice === "mobile" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewDevice("mobile")}
                  type="button"
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Mobile
                </Button>
              </div>

              {/* Aperçu du chatbot avec personnalisation */}
              <div className={`${
                previewDevice === "mobile" ? "w-full max-w-sm mx-auto" : "w-full"
              } ${previewDevice === "mobile" ? "h-96" : "h-[600px]"} relative border rounded-lg overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100">
                  <ChatbotPreview
                    visualConfig={visualConfig}
                    personality={personality}
                    chatbotName={name || "Assistant"}
                    interactive={false}
                    className={previewDevice === "mobile" ? "scale-75 origin-top-left" : ""}
                  />
                </div>
              </div>

              {/* Test interactif */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">Test Intelligent</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Testez votre configuration avec l'IA réelle
                </p>
                <div className="relative h-48 border rounded-lg overflow-hidden">
                  <ChatbotPreview
                    visualConfig={visualConfig}
                    personality={personality}
                    chatbotName={name || "Assistant"}
                    interactive={true}
                    className="scale-90 origin-top-left"
                  />
                </div>
              </div>

              {/* Statistiques de config */}
              <div className="space-y-3">
                <Separator />
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Sources actives:</span>
                    <Badge variant="secondary">{dataSources.filter(ds => ds.isEnabled).length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Template:</span>
                    <Badge variant="outline">{selectedTemplate || "Personnalisé"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>IA activée:</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <Heart className="h-3 w-3 mr-1" />
                      Oui
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 