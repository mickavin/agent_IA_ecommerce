"use client"
/**
 * Nouveau Ticket Technique IA
 * 
 * Formulaire pour créer un ticket technique relatif aux
 * assistants IA : bugs, performances, intégrations, etc.
 */
import { useState } from "react"
import type React from "react"

import { PageHeader } from "@/components/page-header"
import { FormActions } from "@/components/form-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { IATicketPriority, IATicketStatus, IATicketCategory } from "@/lib/types"

const priorities: IATicketPriority[] = ["Basse", "Moyenne", "Haute", "Critique"]
const categories: IATicketCategory[] = ["Performance", "Erreur Réponse", "Bug Technique", "Intégration", "Configuration", "Amélioration", "Maintenance"]
const initialStatus: IATicketStatus = "Ouvert"

// Mock data pour les chatbots
const mockChatbots = [
  { id: "1", name: "Chatbot Principal E-commerce" },
  { id: "2", name: "Assistant Support Client" }, 
  { id: "3", name: "Chatbot Multilingue" },
  { id: "4", name: "Assistant Produits" }
]

export default function NewSupportTicketPage() {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<IATicketCategory>("Bug Technique")
  const [chatbotId, setChatbotId] = useState<string>("none")
  const [priority, setPriority] = useState<IATicketPriority>("Moyenne")
  const [description, setDescription] = useState("")
  const [stepsToReproduce, setStepsToReproduce] = useState("")
  const [expectedBehavior, setExpectedBehavior] = useState("")
  const [actualBehavior, setActualBehavior] = useState("")
  const [environment, setEnvironment] = useState("")
  const [impactedUsers, setImpactedUsers] = useState<number>(0)
  const [errorCode, setErrorCode] = useState("")
  const [assignedTo, setAssignedTo] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement form submission logic
    console.log({ 
      title, 
      category, 
      chatbotId: chatbotId === "none" ? undefined : chatbotId,
      priority, 
      description, 
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      environment,
      impactedUsers,
      errorCode,
      assignedTo,
      status: initialStatus 
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <PageHeader title="Nouveau Ticket Technique IA" backHref="/support" />
      
      <Card>
        <CardHeader>
          <CardTitle>Informations Générales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">Titre du Ticket *</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Temps de réponse élevé sur le chatbot principal"
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Catégorie *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as IATicketCategory)} required>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priorité *</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as IATicketPriority)} required>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((prio) => (
                  <SelectItem key={prio} value={prio}>
                    {prio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="chatbotId">Chatbot Concerné</Label>
            <Select value={chatbotId} onValueChange={setChatbotId}>
              <SelectTrigger id="chatbotId">
                <SelectValue placeholder="Sélectionner un chatbot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Non spécifique</SelectItem>
                {mockChatbots.map((bot) => (
                  <SelectItem key={bot.id} value={bot.id}>
                    {bot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assigné à</Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger id="assignedTo">
                <SelectValue placeholder="Sélectionner une équipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Équipe Technique">Équipe Technique</SelectItem>
                <SelectItem value="Équipe IA">Équipe IA</SelectItem>
                <SelectItem value="Développement Frontend">Développement Frontend</SelectItem>
                <SelectItem value="Équipe Intégrations">Équipe Intégrations</SelectItem>
                <SelectItem value="Product Manager">Product Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Détails Techniques</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="description">Description du Problème *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Décrivez le problème rencontré..."
              required
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stepsToReproduce">Étapes pour Reproduire</Label>
              <Textarea
                id="stepsToReproduce"
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                rows={4}
                placeholder="1. Étape 1&#10;2. Étape 2&#10;3. ..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment">Environnement</Label>
              <Input
                id="environment"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                placeholder="ex: Production - Version 2.3.1"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="expectedBehavior">Comportement Attendu</Label>
              <Textarea
                id="expectedBehavior"
                value={expectedBehavior}
                onChange={(e) => setExpectedBehavior(e.target.value)}
                rows={3}
                placeholder="Ce qui devrait normalement se passer..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="actualBehavior">Comportement Réel</Label>
              <Textarea
                id="actualBehavior"
                value={actualBehavior}
                onChange={(e) => setActualBehavior(e.target.value)}
                rows={3}
                placeholder="Ce qui se passe réellement..."
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="errorCode">Code d'Erreur (si applicable)</Label>
              <Input
                id="errorCode"
                value={errorCode}
                onChange={(e) => setErrorCode(e.target.value)}
                placeholder="ex: TIMEOUT_DB_001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="impactedUsers">Utilisateurs Impactés (estimation)</Label>
              <Input
                id="impactedUsers"
                type="number"
                value={impactedUsers}
                onChange={(e) => setImpactedUsers(Number(e.target.value))}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachments">Captures d'Écran / Logs</Label>
            <Input id="attachments" type="file" multiple accept="image/*,.log,.txt" />
            <p className="text-xs text-muted-foreground">
              Ajoutez des captures d'écran, logs d'erreur ou tout document pertinent.
            </p>
          </div>
        </CardContent>
      </Card>

      <FormActions cancelHref="/support" submitText="Créer Ticket Technique" />
    </form>
  )
}
