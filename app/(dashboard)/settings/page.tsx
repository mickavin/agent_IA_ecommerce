"use client"
/**
 * Paramètres Assistant IA - Configuration Complète
 */
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Settings, Bot, Link, Shield, Bell, Zap, BookOpen, Save, RotateCcw, Eye,
  Globe, MessageSquare, Database, Mail, AlertTriangle
} from "lucide-react"

export default function SettingsPage() {
  // États pour la configuration
  const [companyName, setCompanyName] = useState("Mon E-commerce")
  const [timezone, setTimezone] = useState("Europe/Paris")
  const [defaultLanguage, setDefaultLanguage] = useState("fr")
  const [aiModel, setAiModel] = useState("gpt-4")
  const [temperature, setTemperature] = useState([0.1])
  const [maxTokens, setMaxTokens] = useState([500])
  const [confidenceThreshold, setConfidenceThreshold] = useState([0.8])
  const [fallbackToHuman, setFallbackToHuman] = useState(true)
  const [chatbotName, setChatbotName] = useState("Assistant IA")
  const [welcomeMessage, setWelcomeMessage] = useState("Bonjour ! Comment puis-je vous aider aujourd'hui ?")
  const [chatbotColor, setChatbotColor] = useState("#3B82F6")
  const [chatbotPosition, setChatbotPosition] = useState("bottom-right")
  const [shopifyIntegration, setShopifyIntegration] = useState(true)
  const [shopifyApiKey, setShopifyApiKey] = useState("")
  const [gdprCompliance, setGdprCompliance] = useState(true)
  const [dataRetention, setDataRetention] = useState("30")
  const [adminEmail, setAdminEmail] = useState("admin@example.com")
  const [errorAlerts, setErrorAlerts] = useState(true)
  const [cacheEnabled, setCacheEnabled] = useState(true)
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState([60])
  const [autoUpdate, setAutoUpdate] = useState(true)
  const [knowledgeBaseUrl, setKnowledgeBaseUrl] = useState("")

  const handleSave = () => {
    console.log("Saving settings...")
  }

  const handleReset = () => {
    console.log("Resetting to defaults...")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            <Settings className="inline-block mr-2 h-8 w-8" />
            Configuration Assistant IA
          </h1>
          <p className="text-muted-foreground">Gérez tous les paramètres de votre solution d'assistant IA</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Enregistrer
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="general" className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Général</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-1">
            <Bot className="h-4 w-4" />
            <span className="hidden sm:inline">IA</span>
          </TabsTrigger>
          <TabsTrigger value="chatbot" className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Chatbot</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-1">
            <Link className="h-4 w-4" />
            <span className="hidden sm:inline">Intégrations</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Sécurité</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-1">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Base</span>
          </TabsTrigger>
        </TabsList>

        {/* Configuration Générale */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="mr-2 h-5 w-5" />
                Informations Générales
              </CardTitle>
              <CardDescription>Paramètres de base de votre entreprise et solution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nom de l'Entreprise</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Mon E-commerce"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuseau Horaire</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Paris">Europe/Paris (GMT+1)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo (GMT+9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage">Langue par Défaut</Label>
                  <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">🇫🇷 Français</SelectItem>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                      <SelectItem value="es">🇪🇸 Español</SelectItem>
                      <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyLogo">Logo de l'Entreprise</Label>
                  <Input id="companyLogo" type="file" accept="image/*" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration IA */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="mr-2 h-5 w-5" />
                Paramètres du Moteur IA
              </CardTitle>
              <CardDescription>Configuration avancée de l'intelligence artificielle</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="aiModel">Modèle IA</Label>
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4 (Recommandé)</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="claude-3">Claude 3</SelectItem>
                      <SelectItem value="custom">Modèle Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="fallbackToHuman"
                    checked={fallbackToHuman}
                    onCheckedChange={setFallbackToHuman}
                  />
                  <Label htmlFor="fallbackToHuman">Transfert vers Agent Humain</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Créativité (Température)</Label>
                    <Badge variant="outline">{temperature[0]}</Badge>
                  </div>
                  <Slider
                    value={temperature}
                    onValueChange={setTemperature}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    0 = Réponses précises, 1 = Réponses créatives
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Longueur Max Réponse (Tokens)</Label>
                    <Badge variant="outline">{maxTokens[0]}</Badge>
                  </div>
                  <Slider
                    value={maxTokens}
                    onValueChange={setMaxTokens}
                    max={1000}
                    min={50}
                    step={50}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Seuil de Confiance</Label>
                    <Badge variant="outline">{Math.round(confidenceThreshold[0] * 100)}%</Badge>
                  </div>
                  <Slider
                    value={confidenceThreshold}
                    onValueChange={setConfidenceThreshold}
                    max={1}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    En dessous de ce seuil, l'IA propose un transfert vers un humain
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Chatbot */}
        <TabsContent value="chatbot" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Interface Chatbot
              </CardTitle>
              <CardDescription>Personnalisation de l'apparence et du comportement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="chatbotName">Nom du Chatbot</Label>
                  <Input
                    id="chatbotName"
                    value={chatbotName}
                    onChange={(e) => setChatbotName(e.target.value)}
                    placeholder="Assistant IA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chatbotPosition">Position sur le Site</Label>
                  <Select value={chatbotPosition} onValueChange={setChatbotPosition}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bas à Droite</SelectItem>
                      <SelectItem value="bottom-left">Bas à Gauche</SelectItem>
                      <SelectItem value="top-right">Haut à Droite</SelectItem>
                      <SelectItem value="top-left">Haut à Gauche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chatbotColor">Couleur Principale</Label>
                  <div className="flex gap-2">
                    <Input
                      id="chatbotColor"
                      type="color"
                      value={chatbotColor}
                      onChange={(e) => setChatbotColor(e.target.value)}
                      className="w-20"
                    />
                    <Input
                      value={chatbotColor}
                      onChange={(e) => setChatbotColor(e.target.value)}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Message de Bienvenue</Label>
                <Textarea
                  id="welcomeMessage"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={3}
                  placeholder="Bonjour ! Comment puis-je vous aider aujourd'hui ?"
                />
              </div>

              <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Aperçu en temps réel disponible dans l'onglet Widgets</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Intégrations */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Link className="mr-2 h-5 w-5" />
                Intégrations Externes
              </CardTitle>
              <CardDescription>Connexions avec vos outils et plateformes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                      <Database className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Shopify</p>
                      <p className="text-sm text-muted-foreground">Synchronisation produits et commandes</p>
                    </div>
                  </div>
                  <Switch
                    checked={shopifyIntegration}
                    onCheckedChange={setShopifyIntegration}
                  />
                </div>

                {shopifyIntegration && (
                  <div className="ml-11 space-y-2">
                    <Label htmlFor="shopifyApiKey">Clé API Shopify</Label>
                    <Input
                      id="shopifyApiKey"
                      type="password"
                      value={shopifyApiKey}
                      onChange={(e) => setShopifyApiKey(e.target.value)}
                      placeholder="shpat_xxxxxxxxxxxxx"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                      <Mail className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Email Marketing</p>
                      <p className="text-sm text-muted-foreground">Intégration avec vos campagnes email</p>
                    </div>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">Google Analytics</p>
                      <p className="text-sm text-muted-foreground">Suivi des interactions et conversions</p>
                    </div>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sécurité */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Sécurité & Conformité
              </CardTitle>
              <CardDescription>Protection des données et respect des réglementations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Conformité RGPD</p>
                    <p className="text-sm text-muted-foreground">Respect du règlement européen sur la protection des données</p>
                  </div>
                  <Switch
                    checked={gdprCompliance}
                    onCheckedChange={setGdprCompliance}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dataRetention">Rétention des Données (jours)</Label>
                    <Select value={dataRetention} onValueChange={setDataRetention}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 jours</SelectItem>
                        <SelectItem value="30">30 jours</SelectItem>
                        <SelectItem value="90">90 jours</SelectItem>
                        <SelectItem value="365">1 an</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Chiffrement des Données</p>
                    <p className="text-sm text-muted-foreground">Chiffrement AES-256 de toutes les données sensibles</p>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Logs d'Audit</p>
                    <p className="text-sm text-muted-foreground">Enregistrement de toutes les actions administratives</p>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Alertes & Notifications
              </CardTitle>
              <CardDescription>Configuration des alertes et rapports automatiques</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email Administrateur</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@exemple.com"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">Alertes d'Erreur</p>
                      <p className="text-sm text-muted-foreground">Notification immédiate en cas de dysfonctionnement</p>
                    </div>
                  </div>
                  <Switch
                    checked={errorAlerts}
                    onCheckedChange={setErrorAlerts}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Zap className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">Alertes de Performance</p>
                      <p className="text-sm text-muted-foreground">Notification si temps de réponse supérieur à 5 secondes</p>
                    </div>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Rapports Hebdomadaires</p>
                      <p className="text-sm text-muted-foreground">Statistiques d'usage et de performance</p>
                    </div>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2 h-5 w-5" />
                Optimisation & Performance
              </CardTitle>
              <CardDescription>Paramètres techniques pour optimiser les performances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Cache Intelligent</p>
                  <p className="text-sm text-muted-foreground">Mise en cache des réponses fréquentes pour améliorer la vitesse</p>
                </div>
                <Switch
                  checked={cacheEnabled}
                  onCheckedChange={setCacheEnabled}
                />
              </div>

              <Separator />

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Limite de Requêtes par Minute</Label>
                    <Badge variant="outline">{rateLimitPerMinute[0]} req/min</Badge>
                  </div>
                  <Slider
                    value={rateLimitPerMinute}
                    onValueChange={setRateLimitPerMinute}
                    max={200}
                    min={10}
                    step={10}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Timeout de Réponse (secondes)</Label>
                    <Badge variant="outline">30s</Badge>
                  </div>
                  <Slider
                    value={[30]}
                    onValueChange={() => {}}
                    max={60}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Base de Connaissances */}
        <TabsContent value="knowledge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Base de Connaissances
              </CardTitle>
              <CardDescription>Gestion du contenu et des sources de données</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="knowledgeBaseUrl">URL Base de Connaissances</Label>
                <Input
                  id="knowledgeBaseUrl"
                  value={knowledgeBaseUrl}
                  onChange={(e) => setKnowledgeBaseUrl(e.target.value)}
                  placeholder="https://help.monsite.com"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Mise à Jour Automatique</p>
                    <p className="text-sm text-muted-foreground">Synchronisation automatique du contenu toutes les 24h</p>
                  </div>
                  <Switch
                    checked={autoUpdate}
                    onCheckedChange={setAutoUpdate}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Validation de Contenu</p>
                    <p className="text-sm text-muted-foreground">Vérification automatique de la qualité des réponses</p>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Sources Actuelles:</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Catalogue produits (2,450 items)</li>
                      <li>• FAQ (87 questions)</li>
                      <li>• Politiques de retour</li>
                      <li>• Guide d'expédition</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
