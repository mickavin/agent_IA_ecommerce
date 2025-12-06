"use client"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Code,
  Globe,
  Smartphone,
  Monitor,
  Shield,
  Zap,
  CheckCircle,
  ExternalLink,
  Copy,
  Download,
  MessageSquare,
  Settings,
  Palette,
  Play
} from "lucide-react"
import Link from "next/link"

export default function IntegrationPage() {
  const integrationSteps = [
    {
      step: 1,
      title: "Configurez votre chatbot",
      description: "Créez et personnalisez votre assistant IA selon vos besoins",
      icon: Settings,
      href: "/bots/new"
    },
    {
      step: 2,
      title: "Générez le code d'intégration",
      description: "Obtenez le code iframe personnalisé pour votre site",
      icon: Code,
      href: "/bots"
    },
    {
      step: 3,
      title: "Intégrez sur votre site",
      description: "Copiez-collez le code HTML sur votre site web",
      icon: Globe,
      href: "#"
    },
    {
      step: 4,
      title: "Testez et optimisez",
      description: "Vérifiez le fonctionnement et ajustez si nécessaire",
      icon: Play,
      href: "#"
    }
  ]

  const supportedPlatforms = [
    { name: "HTML/CSS", icon: "🌐", description: "Site web statique ou dynamique" },
    { name: "WordPress", icon: "📝", description: "Blog ou site WordPress" },
    { name: "Shopify", icon: "🛒", description: "Boutique e-commerce" },
    { name: "Wix", icon: "✨", description: "Site créé avec Wix" },
    { name: "React/Vue", icon: "⚛️", description: "Application JavaScript" },
    { name: "Webflow", icon: "🎨", description: "Site no-code" }
  ]

  const features = [
    { name: "Intégration en 2 minutes", icon: Zap, color: "text-yellow-500" },
    { name: "Personnalisation complète", icon: Palette, color: "text-purple-500" },
    { name: "Responsive design", icon: Smartphone, color: "text-blue-500" },
    { name: "Sécurisé HTTPS", icon: Shield, color: "text-green-500" },
    { name: "Compatible tous navigateurs", icon: Globe, color: "text-orange-500" },
    { name: "Analytics intégrées", icon: MessageSquare, color: "text-pink-500" }
  ]

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const exampleCode = `<!-- Code d'exemple d'intégration Wikzy -->
<iframe 
  src="https://yoursite.com/widget/1?primaryColor=%233B82F6&position=bottom-right"
  width="350"
  height="500"
  frameborder="0"
  allow="microphone"
  style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12);"
  title="Assistant Wikzy"
></iframe>`

  return (
    <div className="flex flex-col gap-8">
      <PageHeader 
        title="Intégration Chatbot"
        description="Intégrez facilement vos chatbots sur n'importe quel site web avec notre système iframe"
      >
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/bots">
              <Code className="h-4 w-4 mr-2" />
              Commencer l'intégration
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/widget/1" target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir le widget
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/widget-demo.html" target="_blank">
              <Download className="h-4 w-4 mr-2" />
              Page de démo
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Fonctionnalités principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => (
          <Card key={feature.name} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gray-50`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="font-medium">{feature.name}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Guide d'intégration en 4 étapes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Intégration en 4 étapes simples
          </CardTitle>
          <CardDescription>
            Suivez ce guide pour intégrer votre chatbot en moins de 5 minutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {integrationSteps.map((item) => (
              <div key={item.step} className="relative">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <item.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {item.step}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  {(item.href !== "#" && item.href !== undefined) && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={item?.href || ""}>
                        Commencer
                      </Link>
                    </Button>
                  )}
                </div>
                {item.step < 4 && (
                  <div className="hidden lg:block absolute top-6 left-12 w-full h-0.5 bg-gray-200 -z-10"></div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plateformes supportées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Plateformes supportées
          </CardTitle>
          <CardDescription>
            Notre système d'iframe fonctionne sur toutes les plateformes web modernes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {supportedPlatforms.map((platform) => (
              <div key={platform.name} className="text-center space-y-2 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="text-2xl">{platform.icon}</div>
                <div>
                  <h3 className="font-medium text-sm">{platform.name}</h3>
                  <p className="text-xs text-muted-foreground">{platform.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exemple de code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-green-500" />
            Exemple de code d'intégration
          </CardTitle>
          <CardDescription>
            Voici à quoi ressemble le code d'intégration généré automatiquement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{exampleCode}</code>
            </pre>
            <Button
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => copyToClipboard(exampleCode)}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copier
            </Button>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-100 rounded">
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Code personnalisé pour chaque chatbot</p>
                <p>Chaque chatbot génère son propre code d'intégration avec ses paramètres de personnalisation (couleurs, position, taille, etc.)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Options avancées */}
      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="securite">Sécurité</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Options de configuration</CardTitle>
              <CardDescription>
                Personnalisez l'apparence et le comportement de votre widget
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Apparence</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Couleurs personnalisables (primaire, fond, texte)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Tailles : compact, standard, large
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Positions : 4 coins de l'écran
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Messages et placeholders personnalisés
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Comportement</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Ouverture automatique ou sur clic
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Sons de notification activables
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Minimisation et maximisation
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Branding Wikzy optionnel
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="securite" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Sécurité et protection
              </CardTitle>
              <CardDescription>
                Votre chatbot et vos données sont protégés par nos mesures de sécurité avancées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Protection des données</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      Chiffrement HTTPS obligatoire
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      Isolation iframe sécurisée
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      Conformité RGPD européenne
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      Anonymisation des conversations
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Contrôle d'accès</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      Domaines autorisés configurables
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      Protection contre le hotlinking
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      Limitation de débit automatique
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      Monitoring des tentatives d'abus
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                Analytics et suivi
              </CardTitle>
              <CardDescription>
                Suivez les performances de votre chatbot intégré en temps réel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">1,247</div>
                  <div className="text-sm text-muted-foreground">Conversations totales</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">94%</div>
                  <div className="text-sm text-muted-foreground">Taux de satisfaction</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">0.8s</div>
                  <div className="text-sm text-muted-foreground">Temps de réponse moyen</div>
                </div>
              </div>
              <div className="text-center">
                <Button asChild>
                  <Link href="/analytics">
                    Voir toutes les analytics
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Call to action final */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Zap className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold">Prêt à intégrer votre chatbot ?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Commencez dès maintenant et ajoutez un assistant IA intelligent à votre site web en quelques minutes seulement.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button size="lg" asChild>
                <Link href="/bots">
                  <Code className="h-5 w-5 mr-2" />
                  Générer le code d'intégration
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/widget/1" target="_blank">
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Voir la démo live
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 