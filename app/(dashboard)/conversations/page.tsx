"use client"
/**
 * Conversations Page - Services IA E-commerce
 * 
 * POLITIQUE DE CONFIDENTIALITÉ:
 * - Identification clients UNIQUEMENT par adresse IP + ID anonyme
 * - Format ID: [PREFIX]_[SHOP_ID]_[12_DIGITS_RANDOM]
 * - AUCUNE donnée personnelle: pas de nom, email, téléphone, adresse postale
 * - Respect total de l'anonymisation des utilisateurs
 */

import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MessageCircle,
  Search,
  MoreHorizontal,
  Eye,
  Archive,
  Star,
  Clock,
  Users,
  TrendingUp,
  Bot,
  User,
} from "lucide-react"
import { Conversation, MessageSentiment } from "@/lib/types"

// Données de test anonymisées pour les conversations
const mockConversations: Conversation[] = [
  {
    id: "1",
    chatbotId: "1",
    userId: "EC_001_847293651084",
    sessionId: "session1",
    startedAt: "2024-01-20T10:30:00Z",
    endedAt: "2024-01-20T10:45:00Z",
    status: "Fermée",
    satisfaction: 5,
    sentiment: "Positive",
    resolvedIssue: true,
    tags: ["Commande", "Livraison"],
    clientInfo: {
      anonymousId: "EC_001_847293651084",
      ipAddress: "192.168.1.45",
      device: "Desktop",
      browser: "Chrome"
    },
    messages: [
      {
        id: "msg1",
        content: "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
        type: "bot",
        timestamp: "2024-01-20T10:30:00Z"
      },
      {
        id: "msg2",
        content: "Bonjour, je voudrais connaître le statut de ma commande",
        type: "user",
        timestamp: "2024-01-20T10:30:30Z"
      }
    ]
  },
  {
    id: "2",
    chatbotId: "1",
    sessionId: "session2",
    startedAt: "2024-01-20T14:15:00Z",
    status: "Active",
    sentiment: "Neutre",
    resolvedIssue: false,
    tags: ["Produit", "Taille"],
    clientInfo: {
      anonymousId: "SM_003_847592638471",
      ipAddress: "172.16.0.89",
      device: "Mobile",
      browser: "Safari"
    },
    messages: [
      {
        id: "msg3",
        content: "Salut ! Que puis-je faire pour toi ?",
        type: "bot",
        timestamp: "2024-01-20T14:15:00Z"
      }
    ]
  },
  {
    id: "3",
    chatbotId: "1",
    sessionId: "session3",
    startedAt: "2024-01-20T16:20:00Z",
    endedAt: "2024-01-20T16:35:00Z",
    status: "Fermée",
    satisfaction: 4,
    sentiment: "Positive",
    resolvedIssue: true,
    tags: ["Support", "Retour"],
    clientInfo: {
      anonymousId: "LG_004_739485762938",
      ipAddress: "203.0.113.42",
      device: "Tablet",
      browser: "Firefox"
    },
    messages: [
      {
        id: "msg4",
        content: "Bonjour ! Comment puis-je vous aider ?",
        type: "bot",
        timestamp: "2024-01-20T16:20:00Z"
      }
    ]
  },
  {
    id: "4",
    chatbotId: "1",
    sessionId: "session4",
    startedAt: "2024-01-20T18:10:00Z",
    status: "Active",
    sentiment: "Neutre",
    resolvedIssue: false,
    tags: ["Question", "Prix"],
    clientInfo: {
      anonymousId: "MP_005_584729374658",
      ipAddress: "198.51.100.73",
      device: "Mobile",
      browser: "Chrome"
    },
    messages: [
      {
        id: "msg5",
        content: "Salut ! Je peux t'aider avec quelque chose ?",
        type: "bot",
        timestamp: "2024-01-20T18:10:00Z"
      }
    ]
  }
]

const sentimentColors: Record<MessageSentiment, string> = {
  "Positive": "bg-green-100 text-green-800",
  "Neutre": "bg-gray-100 text-gray-800",
  "Négative": "bg-red-100 text-red-800"
}

export default function ConversationsPage() {
  const [conversations] = useState<Conversation[]>(mockConversations)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("toutes")
  const [sentimentFilter, setSentimentFilter] = useState<string>("tous")

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.clientInfo?.anonymousId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.clientInfo?.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "toutes" || conv.status === statusFilter
    const matchesSentiment = sentimentFilter === "tous" || conv.sentiment === sentimentFilter
    return matchesSearch && matchesStatus && matchesSentiment
  })

  const totalConversations = conversations.length
  const activeConversations = conversations.filter(conv => conv.status === "Active").length
  const averageSatisfaction = conversations
    .filter(conv => conv.satisfaction)
    .reduce((sum, conv) => sum + (conv.satisfaction || 0), 0) / 
    conversations.filter(conv => conv.satisfaction).length || 0
  const resolvedRate = (conversations.filter(conv => conv.resolvedIssue).length / conversations.length) * 100

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Conversations"
        description="Suivez et analysez les interactions avec vos assistants IA"
      />

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversations}</div>
            <p className="text-xs text-muted-foreground">
              +15% cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations Actives</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeConversations}</div>
            <p className="text-xs text-muted-foreground">
              En cours maintenant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction Moyenne</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageSatisfaction.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">
              +0.2 ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Résolution</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              +5% ce mois
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher par ID anonyme, IP ou tag..."
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
            <SelectItem value="toutes">Toutes les conversations</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Fermée">Fermée</SelectItem>
            <SelectItem value="Abandonnée">Abandonnée</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par sentiment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les sentiments</SelectItem>
            <SelectItem value="Positive">Positive</SelectItem>
            <SelectItem value="Neutre">Neutre</SelectItem>
            <SelectItem value="Négative">Négative</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste des conversations */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des Conversations</CardTitle>
          <CardDescription>
            Toutes les interactions entre vos clients et vos chatbots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Anonyme</TableHead>
                <TableHead>Assistant IA</TableHead>
                <TableHead>Début</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Sentiment</TableHead>
                <TableHead>Satisfaction</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConversations.map((conversation) => (
                <TableRow key={conversation.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-xs font-mono">
                          {conversation.clientInfo?.anonymousId || "Session anonyme"}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {conversation.clientInfo?.ipAddress}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {conversation.clientInfo?.device} • {conversation.clientInfo?.browser}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Assistant Younzee</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(conversation.startedAt).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {conversation.endedAt ? 
                          `${Math.round((new Date(conversation.endedAt).getTime() - new Date(conversation.startedAt).getTime()) / (1000 * 60))}min` :
                          "En cours"
                        }
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {conversation.messages.length} messages
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={sentimentColors[conversation.sentiment]}>
                      {conversation.sentiment}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {conversation.satisfaction ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-sm">{conversation.satisfaction}/5</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Non évaluée</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={conversation.status === "Active" ? "default" : "secondary"}>
                      {conversation.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Voir la conversation
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          Archiver
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