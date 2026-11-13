"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Bot,
  Settings,
  MessageCircle,
  Code,
  ExternalLink,
  Eye,
  BarChart3,
  Clock,
  TrendingUp,
  Users,
  Database,
  Palette,
  Brain,
  ArrowLeft,
  Copy,
  Trash2,
  Edit,
  Play
} from "lucide-react"
import { Chatbot, ChatbotStatus } from "@/lib/types"
import { ChatbotService } from "@/lib/services/chatbot.service"
import Link from "next/link"
import { toast } from "sonner"

const statusColors: Record<ChatbotStatus, string> = {
  "Actif": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Inactif": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  "En test": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "Maintenance": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
}

export default function BotDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const botId = params?.id as string | undefined

  const [chatbot, setChatbot] = useState<Chatbot | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!botId) {
      router.push("/bots")
      return
    }

    const fetchChatbot = async () => {
      try {
        setLoading(true)
        const data = await ChatbotService.getById(botId)
        
        if (!data) {
          toast.error("Chatbot non trouvé")
          router.push("/bots")
          return
        }

        setChatbot(data)
      } catch (error) {
        console.error("Erreur lors de la récupération du chatbot:", error)
        toast.error("Erreur lors du chargement du chatbot")
        router.push("/bots")
      } finally {
        setLoading(false)
      }
    }

    fetchChatbot()
  }, [botId, router])

  const handleDelete = async () => {
    if (!chatbot || !confirm(`Êtes-vous sûr de vouloir supprimer "${chatbot.name}" ? Cette action est irréversible.`)) {
      return
    }

    try {
      setDeleting(true)
      await ChatbotService.delete(chatbot.id)
      toast.success("Chatbot supprimé avec succès")
      router.push("/bots")
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast.error("Erreur lors de la suppression du chatbot")
    } finally {
      setDeleting(false)
    }
  }

  const handleCopyId = () => {
    if (chatbot?.id) {
      navigator.clipboard.writeText(chatbot.id)
      toast.success("ID copié dans le presse-papiers")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Bot className="h-12 w-12 animate-pulse mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Chargement du chatbot...</p>
        </div>
      </div>
    )
  }

  if (!chatbot) {
    return null
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title={chatbot.name}
        description={chatbot.description}
      >
        <div className="flex gap-2">
          <Link href="/bots">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <Link href={`/bots/${chatbot.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </Link>
          <Link href={`/bots/${chatbot.id}/test`}>
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Tester
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Informations principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={statusColors[chatbot.status]}>
              {chatbot.status}
            </Badge>
            {chatbot.isDefault && (
              <Badge variant="secondary" className="ml-2">
                Par défaut
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chatbot.conversationsCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total des conversations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chatbot.satisfactionRate.toFixed(1)}%</div>
            <Progress value={chatbot.satisfactionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Détails complets */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="personality">Personnalité</TabsTrigger>
          <TabsTrigger value="visual">Apparence</TabsTrigger>
          <TabsTrigger value="data">Sources de données</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-mono">{chatbot.id}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyId}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm mt-1">{chatbot.description || "Aucune description"}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Créé le</p>
                  <p className="text-sm mt-1">
                    {new Date(chatbot.createdAt).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dernière mise à jour</p>
                  <p className="text-sm mt-1">
                    {new Date(chatbot.updatedAt).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performances</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Temps de réponse moyen</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-bold">{chatbot.avgResponseTime}ms</span>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min((chatbot.avgResponseTime / 2000) * 100, 100)} 
                    className="h-2"
                  />
                </div>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Taux de satisfaction</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-bold">{chatbot.satisfactionRate.toFixed(1)}%</span>
                    </div>
                  </div>
                  <Progress value={chatbot.satisfactionRate} className="h-2" />
                </div>
                <Separator />
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Conversations totales</p>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-bold">{chatbot.conversationsCount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="personality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Personnalité du chatbot
              </CardTitle>
              <CardDescription>
                Configuration de la personnalité et du comportement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Ton</p>
                  <Badge variant="outline">{chatbot.personality.tone}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Formalité</p>
                  <Badge variant="outline">{chatbot.personality.formality}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Verbosité</p>
                  <Badge variant="outline">{chatbot.personality.verbosity}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Empathie</p>
                  <Badge variant="outline">{chatbot.personality.empathy}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Proactivité</p>
                  <Badge variant="outline">{chatbot.personality.proactivity}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Configuration visuelle
              </CardTitle>
              <CardDescription>
                Apparence et design du widget
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Couleur principale</p>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: chatbot.visualConfig.primaryColor }}
                    />
                    <span className="text-sm font-mono">{chatbot.visualConfig.primaryColor}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Couleur secondaire</p>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: chatbot.visualConfig.secondaryColor }}
                    />
                    <span className="text-sm font-mono">{chatbot.visualConfig.secondaryColor}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Position</p>
                  <Badge variant="outline">{chatbot.visualConfig.position}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Taille</p>
                  <Badge variant="outline">{chatbot.visualConfig.size}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Bordures</p>
                  <Badge variant="outline">{chatbot.visualConfig.borderRadius}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Message de bienvenue</p>
                  <p className="text-sm mt-1">{chatbot.visualConfig.welcomeMessage}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Sources de données
              </CardTitle>
              <CardDescription>
                Sources configurées pour ce chatbot
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chatbot.dataSources && chatbot.dataSources.length > 0 ? (
                <div className="space-y-2">
                  {chatbot.dataSources.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={source.isEnabled ? "default" : "secondary"}>
                          {source.type}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">{source.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Priorité: {source.priority}
                          </p>
                        </div>
                      </div>
                      {source.isEnabled ? (
                        <Badge className="bg-green-100 text-green-800">Activé</Badge>
                      ) : (
                        <Badge variant="secondary">Désactivé</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune source de données configurée</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
                <CardDescription>
                  Accès rapide aux fonctionnalités principales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/bots/${chatbot.id}/edit`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurer le chatbot
                  </Button>
                </Link>
                <Link href={`/bots/${chatbot.id}/test`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Tester le chatbot
                  </Button>
                </Link>
                <Link href={`/bots/${chatbot.id}/embed`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Code className="h-4 w-4 mr-2" />
                    Code d'intégration
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open(`/widget/${chatbot.id}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Voir le widget
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions dangereuses</CardTitle>
                <CardDescription>
                  Actions irréversibles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? "Suppression..." : "Supprimer le chatbot"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}


