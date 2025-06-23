"use client"
/**
 * Détails Ticket Technique IA
 * 
 * Page de détail pour visualiser et modifier un ticket technique
 * relatif aux assistants IA et chatbots
 */
import { useState, useEffect } from "react"
import type React from "react"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { mockIATickets } from "@/lib/data"
import type { IATicket, IATicketStatus, IATicketPriority, IATicketCategory } from "@/lib/types"
import { MessageSquare, Paperclip, Bot, CalendarDays, CheckCircle, XCircle, AlertTriangle, Settings, Code } from "lucide-react"

const statuses: IATicketStatus[] = ["Ouvert", "En cours", "En attente", "Résolu", "Fermé"]
const priorities: IATicketPriority[] = ["Basse", "Moyenne", "Haute", "Critique"]

export default function SupportTicketDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params?.id as string

  const [ticket, setTicket] = useState<IATicket | null>(null)
  const [reply, setReply] = useState("")
  const [newStatus, setNewStatus] = useState<IATicketStatus | "">("")
  const [newPriority, setNewPriority] = useState<IATicketPriority | "">("")

  useEffect(() => {
    const foundTicket = mockIATickets.find((t) => t.id === ticketId)
    if (foundTicket) {
      setTicket(foundTicket)
      setNewStatus(foundTicket.status)
      setNewPriority(foundTicket.priority)
    } else {
      router.push("/support")
    }
  }, [ticketId, router])

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement reply submission
    console.log("Reply:", reply)
    setReply("")
  }

  const handleStatusPriorityUpdate = () => {
    // TODO: Implement status/priority update
    console.log("Update Status/Priority:", { newStatus, newPriority })
  }

  const getStatusBadgeVariant = (status: IATicketStatus) => {
    if (status === "Ouvert") return "bg-red-500/20 text-red-400 border-red-500/30"
    if (status === "En cours") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    if (status === "En attente") return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    if (status === "Résolu") return "bg-green-500/20 text-green-400 border-green-500/30"
    if (status === "Fermé") return "bg-slate-500/20 text-slate-400 border-slate-500/30"
    return "secondary"
  }

  const getPriorityBadgeVariant = (priority: IATicketPriority) => {
    if (priority === "Critique") return "destructive"
    if (priority === "Haute") return "bg-orange-500/20 text-orange-400 border-orange-500/30"
    if (priority === "Moyenne") return "bg-sky-500/20 text-sky-400 border-sky-500/30"
    return "secondary" // Basse
  }

  const getCategoryBadgeVariant = (category: IATicketCategory) => {
    if (category === "Bug Technique") return "bg-red-500/20 text-red-400 border-red-500/30"
    if (category === "Performance") return "bg-orange-500/20 text-orange-400 border-orange-500/30"
    if (category === "Erreur Réponse") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    if (category === "Intégration") return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    if (category === "Configuration") return "bg-purple-500/20 text-purple-400 border-purple-500/30"
    if (category === "Amélioration") return "bg-green-500/20 text-green-400 border-green-500/30"
    return "bg-slate-500/20 text-slate-400 border-slate-500/30" // Maintenance
  }

  if (!ticket) {
    return <div className="text-center py-10">Chargement du ticket...</div>
  }

      return (
      <div>
        <PageHeader 
          title={`Ticket IA: ${ticket.id}`}
          description={ticket.title} 
          backHref="/support"
        >
        {ticket.status !== "Fermé" && ticket.status !== "Résolu" && (
          <Button
            variant="outline"
            onClick={() => {
              /* TODO: Mark as resolved */ console.log("Mark as resolved")
            }}
          >
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Marquer Résolu
          </Button>
        )}
        {ticket.status !== "Fermé" && (
          <Button
            variant="destructive"
            onClick={() => {
              /* TODO: Close ticket */ console.log("Close ticket")
            }}
          >
            <XCircle className="mr-2 h-4 w-4" /> Clôturer
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description & Détails Techniques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Description du Problème</h4>
                <p className="text-muted-foreground whitespace-pre-line">
                  {ticket.description}
                </p>
              </div>

              {ticket.stepsToReproduce && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Étapes pour Reproduire</h4>
                  <p className="text-muted-foreground whitespace-pre-line text-sm">
                    {ticket.stepsToReproduce}
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                {ticket.expectedBehavior && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-green-600">Comportement Attendu</h4>
                    <p className="text-muted-foreground whitespace-pre-line text-sm bg-green-50 p-3 rounded">
                      {ticket.expectedBehavior}
                    </p>
                  </div>
                )}

                {ticket.actualBehavior && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-red-600">Comportement Réel</h4>
                    <p className="text-muted-foreground whitespace-pre-line text-sm bg-red-50 p-3 rounded">
                      {ticket.actualBehavior}
                    </p>
                  </div>
                )}
              </div>

              {ticket.technicalNotes && ticket.technicalNotes.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Notes Techniques</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {ticket.technicalNotes.map((note, index) => (
                      <li key={index} className="flex items-start">
                        <Code className="h-3 w-3 mr-2 mt-1 flex-shrink-0" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {ticket.attachments && ticket.attachments.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Captures d'Écran / Logs:</h4>
                  <div className="flex flex-wrap gap-2">
                    {ticket.attachments.map((att, index) => (
                      <Link
                        key={index}
                        href={att || ""}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <Paperclip className="h-4 w-4" /> Fichier {index + 1}
                        <Image
                          src={att || "/placeholder.svg"}
                          alt={`Attachment ${index + 1}`}
                          width={80}
                          height={60}
                          className="rounded border ml-2 object-cover"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {ticket.status !== "Fermé" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="mr-2 h-5 w-5 text-primary" /> Ajouter une Note Technique
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleReplySubmit} className="space-y-4">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Ajoutez une note technique, une solution ou un commentaire..."
                    rows={5}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!reply.trim()}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Ajouter Note
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Historique & Résolution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">L'historique des notes techniques et modifications apparaîtra ici.</p>
              {ticket.resolution && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium text-sm mb-1 text-green-600">Solution Appliquée:</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line bg-green-50 p-3 rounded">
                    {ticket.resolution}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5 text-primary" /> Informations Techniques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Catégorie</Label>
                <Badge variant="outline" className={`text-sm w-full justify-center py-1 mt-1 ${getCategoryBadgeVariant(ticket.category)}`}>
                  {ticket.category}
                </Badge>
              </div>
              {ticket.chatbotId && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Chatbot Concerné</Label>
                  <p className="text-sm font-medium">ID: {ticket.chatbotId}</p>
                </div>
              )}
              {ticket.errorCode && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Code d'Erreur</Label>
                  <p className="text-sm font-mono text-red-600">{ticket.errorCode}</p>
                </div>
              )}
              {ticket.environment && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Environnement</Label>
                  <p className="text-sm">{ticket.environment}</p>
                </div>
              )}
              {ticket.impactedUsers && ticket.impactedUsers > 0 && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Utilisateurs Impactés</Label>
                  <p className="text-sm font-medium text-orange-600">{ticket.impactedUsers.toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarDays className="mr-2 h-5 w-5 text-primary" /> Statut & Priorité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs">Statut Actuel</Label>
                <Badge
                  variant="outline"
                  className={`text-sm w-full justify-center py-1 ${getStatusBadgeVariant(ticket.status)}`}
                >
                  {ticket.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Priorité Actuelle</Label>
                <Badge
                  variant="outline"
                  className={`text-sm w-full justify-center py-1 ${getPriorityBadgeVariant(ticket.priority)}`}
                >
                  {ticket.priority}
                </Badge>
              </div>

              {ticket.status !== "Fermé" && ticket.status !== "Résolu" && (
                <>
                  <div className="pt-2 border-t">
                    <Label htmlFor="newStatus">Changer Statut</Label>
                    <Select value={newStatus} onValueChange={(v) => setNewStatus(v as IATicketStatus)}>
                      <SelectTrigger id="newStatus">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="newPriority">Changer Priorité</Label>
                    <Select value={newPriority} onValueChange={(v) => setNewPriority(v as IATicketPriority)}>
                      <SelectTrigger id="newPriority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleStatusPriorityUpdate} className="w-full mt-2">
                    Mettre à Jour
                  </Button>
                </>
              )}
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p>
                  Créé le:{" "}
                  {new Date(ticket.creationDate).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p>
                  Dernière MàJ:{" "}
                  {new Date(ticket.lastUpdate).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {ticket.assignedTo && <p>Assigné à: {ticket.assignedTo}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
