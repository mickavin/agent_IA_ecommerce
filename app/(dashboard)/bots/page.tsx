"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Bot,
  Plus,
  Search,
  MoreHorizontal,
  Play,
  Pause,
  Settings,
  Copy,
  Trash2,
  Eye,
  MessageCircle,
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  Activity,
  Code,
  ExternalLink,
} from "lucide-react"
import { Chatbot, ChatbotStatus } from "@/lib/types"
import Link from "next/link"
import { supabase } from "@/lib/supabase"






// Données de test pour les chatbots
const mockChatbots: Chatbot[] = [
  {
    id: "1",
    name: "Assistant Younzee",
    description: "Chatbot principal pour l'assistance clientèle",
    status: "Actif",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20",
    isDefault: true,
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
    dataSources: [
      { id: "1", type: "faq", name: "FAQ Générale", isEnabled: true, priority: 1 },
      { id: "2", type: "products", name: "Catalogue Produits", isEnabled: true, priority: 2 },
    ],
    conversationsCount: 1247,
    avgResponseTime: 850,
    satisfactionRate: 87
  },
  {
    id: "2", 
    name: "Support Technique",
    description: "Spécialisé dans l'assistance technique",
    status: "En test",
    createdAt: "2024-01-10",
    updatedAt: "2024-01-18",
    personality: {
      tone: "Expert",
      formality: "Vouvoiement", 
      verbosity: "Très détaillé",
      empathy: "Moyenne",
      proactivity: "Réactif"
    },
    visualConfig: {
      primaryColor: "#10B981",
      secondaryColor: "#ECFDF5",
      textColor: "#1F2937",
      backgroundColor: "#FFFFFF",
      borderRadius: "Très arrondi",
      position: "Bas gauche",
      size: "Compact",
      welcomeMessage: "Bonjour, je suis votre assistant technique.",
      placeholder: "Décrivez votre problème..."
    },
    dataSources: [
      { id: "3", type: "custom", name: "Base Technique", isEnabled: true, priority: 1 },
    ],
    conversationsCount: 342,
    avgResponseTime: 1200,
    satisfactionRate: 92
  }
]

const statusColors: Record<ChatbotStatus, string> = {
  "Actif": "bg-green-100 text-green-800",
  "Inactif": "bg-gray-100 text-gray-800", 
  "En test": "bg-yellow-100 text-yellow-800",
  "Maintenance": "bg-red-100 text-red-800"
}

export default function BotsPage() {
  const [chatbots, setChatbots] = useState<Chatbot[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("tous")


  const getChatbots = async () => {
    if (!supabase) {
      console.error('Supabase n\'est pas initialisé')
      return []
    }
    const { data: chatbots, error } = await supabase.from('chatbots').select('*')
    if (error) {
      console.error('Erreur lors de la récupération des chatbots:', error)
    }
    return chatbots

  }
  useEffect(() => {
    getChatbots().then((chatbots) => {
      setChatbots(chatbots || [])
    })
  }, [])


  const filteredChatbots = chatbots.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bot.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "tous" || bot.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalConversations = chatbots.reduce((sum, bot) => sum + bot.conversationsCount, 0)
  const avgSatisfaction = chatbots.reduce((sum, bot) => sum + bot.satisfactionRate, 0) / chatbots.length
  const activeBots = chatbots.filter(bot => bot.status === "Actif").length


  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Gestion des Assistants IA"
        description="Créez, configurez et gérez vos assistants virtuels"
      >
        <Link href="/bots/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Assistant IA
          </Button>
        </Link>
      </PageHeader>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assistants IA Actifs</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBots}</div>
            <p className="text-xs text-muted-foreground">
              sur {chatbots.length} assistants IA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations Totales</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(Math.random() * 1000) || totalConversations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction Moyenne</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(Math.random() * 100) || avgSatisfaction.toFixed(0)}%</div>
            <Progress value={avgSatisfaction} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps de Réponse Moyen</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.9s</div>
            <p className="text-xs text-muted-foreground">
              -5% cette semaine
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher un assistant IA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les statuts</SelectItem>
            <SelectItem value="Actif">Actif</SelectItem>
            <SelectItem value="Inactif">Inactif</SelectItem>
            <SelectItem value="En test">En test</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste des chatbots */}
      <Card>
        <CardHeader>
          <CardTitle>Vos Assistants IA Younzee</CardTitle>
          <CardDescription>
            Gérez la configuration et les performances de vos assistants virtuels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assistant IA</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Conversations</TableHead>
                <TableHead>Satisfaction</TableHead>
                <TableHead>Temps de réponse</TableHead>
                <TableHead>Dernière mise à jour</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChatbots.map((chatbot) => (
                <TableRow key={chatbot.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={mockChatbots[0].visualConfig.avatar} />
                        <AvatarFallback style={{ backgroundColor: mockChatbots[0].visualConfig.primaryColor }}>
                          <Bot className="h-4 w-4 text-white" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{chatbot.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {chatbot.description}
                        </div>
                        {chatbot.isDefault && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Par défaut
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[chatbot.status]}>
                      {chatbot.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{Math.floor(Math.random() * 1000) || mockChatbots[0].conversationsCount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{Math.floor(Math.random() * 100) || mockChatbots[0].satisfactionRate}%</span>
                      <Progress value={chatbot.satisfactionRate} className="w-12 h-2" />
                    </div>
                  </TableCell>
                  <TableCell>{Math.floor(Math.random() * 1000) || mockChatbots[0].avgResponseTime}ms</TableCell>
                  <TableCell>{new Date(chatbot.updatedAt || new Date()).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/bots/${chatbot.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir les détails
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/bots/${chatbot.id}/edit`}>
                            <Settings className="h-4 w-4 mr-2" />
                            Configurer
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/bots/${chatbot.id}/test`}>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Tester
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/bots/${chatbot.id}/embed`}>
                            <Code className="h-4 w-4 mr-2" />
                            Intégrer (iframe)
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => window.open(`/widget/${chatbot.id}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Voir le widget
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Dupliquer
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 