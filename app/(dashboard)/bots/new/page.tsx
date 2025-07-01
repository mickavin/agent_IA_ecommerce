"use client"

import { useState, useEffect } from "react"
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
  Download,
  Heart,
  Smile,
  Users,
  Brain,
  Target,
  } from "lucide-react"
import { ChatbotPersonality, ChatbotVisualConfig, ChatbotDataSource, ChatbotStatus } from "@/lib/types"
import { ChatbotPreview } from "@/components/chatbot-preview"
import { toast } from "sonner"
import Link from "next/link"
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
  const [status, setStatus] = useState<ChatbotStatus>("En test")
  
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
    { id: "3", type: "orders", name: "Commandes", isEnabled: true, priority: 3 },
    { id: "4", type: "policies", name: "Politiques", isEnabled: true, priority: 4 },
  ])

  // Configuration avancée
  const [advancedConfig, setAdvancedConfig] = useState({
    enableTypingIndicator: true,
    enableQuickReplies: true,
    responseDelay: 1000,
    enableEmojis: true,
    enableFileUpload: false,
    enableReadReceipts: false,
    maxConversationLength: 50,
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
      console.log("newBotss")
      // Préparation des données pour la création du chatbot (format DB)
      const newBot = {
        name,
        description,
        status,
        is_default: false,
        personality,
        visual_config: visualConfig,
        data_sources: dataSources.filter(ds => ds.isEnabled),
        conversations_count: 0,
        avg_response_time: 0,
        satisfaction_rate: 0,
      }

      // Création du chatbot via le service
      const createdBot = await ChatbotService.create(newBot)
      
      if (createdBot) {
        toast.success("Chatbot créé avec succès !")
        router.push("/bots")
      }
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
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/bots" className="hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Retour aux bots
        </Link>
      </div>

      {/* En-tête */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bot className="h-7 w-7 text-blue-600" />
            Créer un nouveau bot
          </h1>
          <p className="text-muted-foreground">
            Configurez votre assistant IA personnalisé
          </p>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Configuration du bot
            </CardTitle>
            <CardDescription>
              Définissez les paramètres de base de votre assistant IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nom du bot</label>
                <input 
                  type="text" 
                  placeholder="Ex: Assistant Younzee"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  placeholder="Décrivez les fonctionnalités de votre bot..."
                  className="w-full mt-1 px-3 py-2 border rounded-md h-20"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type de bot</label>
                <select className="w-full mt-1 px-3 py-2 border rounded-md">
                  <option>Support client</option>
                  <option>Recommandation produits</option>
                  <option>FAQ automatique</option>
                  <option>Assistant vente</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aperçu</CardTitle>
            <CardDescription>
              Prévisualisation de votre bot en action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium">Assistant Younzee</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="bg-blue-100 p-2 rounded">
                  Bonjour ! Je suis votre assistant Younzee. Comment puis-je vous aider aujourd'hui ?
                </div>
                <div className="text-muted-foreground text-right">
                  Tapez votre message...
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          Créer le bot
        </Button>
        <Button variant="outline" asChild>
          <Link href="/bots">Annuler</Link>
        </Button>
      </div>
    </div>
  )
} 