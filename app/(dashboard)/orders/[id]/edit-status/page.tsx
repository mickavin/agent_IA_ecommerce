"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Save, 
  ArrowLeft, 
  Package, 
  User, 
  CreditCard, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Mail,
  MessageSquare,
  History,
  RefreshCw,
  MapPin
} from "lucide-react"
import { Order, OrderStatus } from "@/lib/types"
import { toast } from "sonner"

const statusConfig = {
  "Payée": {
    color: "bg-green-100 text-green-800",
    icon: CreditCard,
    description: "Paiement confirmé, commande en préparation",
    progress: 25
  },
  "En préparation": {
    color: "bg-blue-100 text-blue-800",
    icon: Package,
    description: "Commande en cours de préparation",
    progress: 50
  },
  "Expédiée": {
    color: "bg-purple-100 text-purple-800",
    icon: Truck,
    description: "Commande expédiée, en transit",
    progress: 75
  },
  "Livrée": {
    color: "bg-emerald-100 text-emerald-800",
    icon: CheckCircle,
    description: "Commande livrée avec succès",
    progress: 100
  },
  "Annulée": {
    color: "bg-red-100 text-red-800",
    icon: AlertTriangle,
    description: "Commande annulée",
    progress: 0
  }
}

const statusFlow: OrderStatus[] = ["Payée", "En préparation", "Expédiée", "Livrée"]

export default function EditOrderStatusPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  // Vérification de l'ID
  if (!orderId) {
    //router.push("/orders")
    return null
  }

  const [isLoading, setIsLoading] = useState(false)
  const [sendNotification, setSendNotification] = useState(true)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Données factices pour l'exemple
  const [order, setOrder] = useState<Order>({
    id: orderId,
    customerName: "EC_006_927384651094",
    customerEmail: "192.168.2.78",
    date: "2024-01-20",
    status: "En préparation",
    totalAmount: 145.50,
    itemsCount: 3,
    shippingAddress: "Zone livraison anonymisée",
    billingAddress: "Zone facturation anonymisée",
    notes: "Livraison en point relais demandée"
  })

  const [newStatus, setNewStatus] = useState<OrderStatus>(order.status)
  const [statusNote, setStatusNote] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [estimatedDelivery, setEstimatedDelivery] = useState("")

  const getCurrentStatusIndex = () => {
    return statusFlow.indexOf(order.status)
  }

  const getNewStatusIndex = () => {
    return statusFlow.indexOf(newStatus)
  }

  const isStatusRegression = () => {
    const currentIndex = getCurrentStatusIndex()
    const newIndex = getNewStatusIndex()
    return newIndex < currentIndex && newStatus !== "Annulée"
  }

  const getStatusSteps = () => {
    const currentIndex = getCurrentStatusIndex()
    const newIndex = getNewStatusIndex()
    
    return statusFlow.map((status, index) => ({
      status,
      isCompleted: index <= Math.max(currentIndex, newIndex),
      isCurrent: status === newStatus,
      isPending: index > Math.max(currentIndex, newIndex)
    }))
  }

  const handleStatusChange = (status: OrderStatus) => {
    setNewStatus(status)
    
    // Réinitialiser les champs spécifiques selon le statut
    if (status === "Expédiée") {
      setTrackingNumber("")
      setEstimatedDelivery("")
    }
  }

  const handleSave = async () => {
    if (isStatusRegression()) {
      setShowConfirmDialog(true)
      return
    }
    
    await saveOrder()
  }

  const saveOrder = async () => {
    setIsLoading(true)
    try {
      // Simulation de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mise à jour de l'ordre
      setOrder(prev => ({ ...prev, status: newStatus }))
      
      toast.success(`Statut de la commande mis à jour : ${newStatus}`)
      
      if (sendNotification) {
        toast.success("Email de notification envoyé au client")
      }
      
      //router.push(`/orders/${orderId}`)
    } catch (error) {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setIsLoading(false)
      setShowConfirmDialog(false)
    }
  }

  const canAdvanceToNext = () => {
    const currentIndex = getCurrentStatusIndex()
    return currentIndex < statusFlow.length - 1
  }

  const getNextStatus = (): OrderStatus | null => {
    const currentIndex = getCurrentStatusIndex()
    return currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null
  }

  const advanceToNext = () => {
    const nextStatus = getNextStatus()
    if (nextStatus) {
      setNewStatus(nextStatus)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title={`Modifier le statut - Commande ${order.id}`}
        description={`${order.customerName} - ${order.totalAmount.toFixed(2)}€`}
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {}}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration du statut */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Progression de la commande
              </CardTitle>
              <CardDescription>
                Statut actuel: <Badge className={statusConfig[order.status].color}>
                  {order.status}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Indicateur de progression */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Progression</span>
                  <span className="text-sm text-muted-foreground">
                    {statusConfig[newStatus].progress}%
                  </span>
                </div>
                <Progress value={statusConfig[newStatus].progress} className="h-2" />
              </div>

              {/* Étapes de statut */}
              <div className="space-y-4">
                {getStatusSteps().map((step, index) => {
                  const IconComponent = statusConfig[step.status].icon
                  return (
                    <div key={step.status} className="flex items-center gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        step.isCurrent ? 'bg-blue-500 text-white' :
                        step.isCompleted ? 'bg-green-500 text-white' :
                        'bg-gray-200 text-gray-500'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${step.isCurrent ? 'text-blue-600' : ''}`}>
                          {step.status}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {statusConfig[step.status].description}
                        </div>
                      </div>
                      {step.status === newStatus && step.status !== order.status && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          Nouveau
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Modifier le statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sélection rapide */}
              {canAdvanceToNext() && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Passer à l'étape suivante</div>
                      <div className="text-sm text-muted-foreground">
                        {getNextStatus()}
                      </div>
                    </div>
                    <Button onClick={advanceToNext} variant="outline">
                      Avancer
                    </Button>
                  </div>
                </div>
              )}

              {/* Sélection manuelle du statut */}
              <div className="space-y-3">
                <Label>Nouveau statut</Label>
                <RadioGroup 
                  value={newStatus} 
                  onValueChange={(value: OrderStatus) => handleStatusChange(value)}
                >
                  {Object.entries(statusConfig).map(([status, config]) => {
                    const IconComponent = config.icon
                    return (
                      <div key={status} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value={status} id={status} />
                        <div className="flex items-center gap-3 flex-1">
                          <IconComponent className="h-4 w-4 text-gray-500" />
                          <div>
                            <Label htmlFor={status} className="font-medium cursor-pointer">
                              {status}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {config.description}
                            </p>
                          </div>
                        </div>
                        <Badge className={config.color}>
                          {config.progress}%
                        </Badge>
                      </div>
                    )
                  })}
                </RadioGroup>
              </div>

              {/* Champs spécifiques selon le statut */}
              {newStatus === "Expédiée" && (
                <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium">Informations d'expédition</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tracking">Numéro de suivi</Label>
                      <Input
                        id="tracking"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Ex: CH123456789FR"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estimated">Livraison estimée</Label>
                      <Input
                        id="estimated"
                        type="date"
                        value={estimatedDelivery}
                        onChange={(e) => setEstimatedDelivery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Note de changement de statut */}
              <div className="space-y-2">
                <Label htmlFor="note">Note de changement (optionnel)</Label>
                <Textarea
                  id="note"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Ajoutez une note sur ce changement de statut..."
                  rows={3}
                />
              </div>

              {/* Options de notification */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notifier le client</Label>
                    <p className="text-sm text-muted-foreground">
                      Envoyer une notification à l'adresse IP {order.customerEmail}
                    </p>
                  </div>
                  <Switch
                    checked={sendNotification}
                    onCheckedChange={setSendNotification}
                  />
                </div>
              </div>

              {/* Avertissement pour régression */}
              {isStatusRegression() && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Attention : Vous êtes sur le point de faire revenir cette commande à un statut antérieur.
                    Cette action pourrait créer de la confusion pour le client.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Informations de la commande */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Nom</Label>
                <p className="text-sm text-muted-foreground mt-1 font-mono">{order.customerName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-muted-foreground mt-1 font-mono">{order.customerEmail}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Montant total</Label>
                <p className="text-sm font-medium text-green-600 mt-1">{order.totalAmount.toFixed(2)}€</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Articles</Label>
                <p className="text-sm text-muted-foreground mt-1">{order.itemsCount} articles</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Adresses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Livraison</Label>
                <p className="text-sm text-muted-foreground mt-1">{order.shippingAddress}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Facturation</Label>
                <p className="text-sm text-muted-foreground mt-1">{order.billingAddress}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique des statuts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="text-sm font-medium">Commande payée</div>
                    <div className="text-xs text-muted-foreground">20 jan. 2024 - 14:30</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="text-sm font-medium">En préparation</div>
                    <div className="text-xs text-muted-foreground">21 jan. 2024 - 09:15</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <div className="text-sm text-muted-foreground">Prochaine étape</div>
                    <div className="text-xs text-muted-foreground">En attente</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Contacter le client
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Ajouter une note
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                Voir les articles
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de confirmation pour régression */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le changement de statut</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de faire revenir cette commande de "{order.status}" à "{newStatus}".
              Cette action est inhabituelle et pourrait créer de la confusion.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Annuler
            </Button>
            <Button onClick={saveOrder} disabled={isLoading}>
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
