'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { ColorPicker } from '@/components/ui/color-picker'
import { 
  Palette, 
  Layout, 
  Settings, 
  MessageSquare, 
  Zap, 
  Eye, 
  Save, 
  Copy,
  Trash2,
  Download,
  Upload,
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  WidgetConfiguration, 
  WidgetConfigurationInput, 
  WidgetTemplate, 
  Chatbot,
  WidgetTheme,
  WidgetLayout,
  WidgetBehavior,
  WidgetMessages,
  WidgetAdvancedConfig
} from '@/lib/types'
import { 
  WidgetConfigurationService, 
  WidgetTemplateService, 
  ChatbotService,
  WidgetPreviewService
} from '@/lib/services/api.service'

interface WidgetCustomizationProps {
  configId?: string
  chatbotId?: string
  onSave?: (config: WidgetConfiguration) => void
  onCancel?: () => void
}

export default function WidgetCustomization({ 
  configId, 
  chatbotId, 
  onSave, 
  onCancel 
}: WidgetCustomizationProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<WidgetConfigurationInput>({
    name: '',
    description: '',
    chatbotId: chatbotId || '',
    theme: {
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      accentColor: '#f59e0b',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      borderColor: '#e5e7eb',
      shadowColor: 'rgba(0,0,0,0.1)',
      borderRadius: '8',
      fontFamily: 'Inter, sans-serif',
      fontSize: '14'
    },
    layout: {
      position: 'bottom-right',
      offsetX: 20,
      offsetY: 20,
      width: 350,
      height: 500,
      minimized: false,
      showOnMobile: true,
      showOnDesktop: true,
      zIndex: 9999
    },
    behavior: {
      autoOpen: false,
      autoOpenDelay: 3000,
      showWelcomeMessage: true,
      enableNotifications: true,
      soundEnabled: false,
      enableTypingIndicator: true,
      maxMessages: 100,
      sessionTimeout: 1800
    },
    messages: {
      welcomeMessage: 'Bonjour ! Comment puis-je vous aider ?',
      placeholderText: 'Tapez votre message...',
      sendButtonText: 'Envoyer',
      minimizeTooltip: 'Réduire',
      closeTooltip: 'Fermer',
      offlineMessage: 'Nous sommes actuellement hors ligne.',
      errorMessage: 'Une erreur est survenue. Veuillez réessayer.',
      typingIndicator: 'En train d\'écrire...',
      poweredByText: 'Propulsé par Wikzy'
    },
    advancedConfig: {
      allowFileUpload: false,
      allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      maxFileSize: 5242880,
      enableEmojis: true,
      enableMarkdown: false,
      showTimestamps: true,
      showAvatars: true,
      enableFeedback: true,
      collectUserEmail: false, // DÉSACTIVÉ DÉFINITIVEMENT - Politique d'anonymisation
      gdprCompliant: true,
      customCSS: ''
    },
    integrations: {
      googleAnalytics: null,
      facebookPixel: null,
      customTracking: null,
      webhookUrl: null,
      apiEndpoints: []
    },
    allowedDomains: [],
    isActive: true,
    isPublic: false,
    version: '1.0.0'
  })

  const [templates, setTemplates] = useState<WidgetTemplate[]>([])
  const [chatbots, setChatbots] = useState<Chatbot[]>([])
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [activeTab, setActiveTab] = useState('theme')

  // Charger les données initiales
  useEffect(() => {
    loadInitialData()
  }, [configId])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [templatesData, chatbotsData] = await Promise.all([
        WidgetTemplateService.getAll(1, 20),
        ChatbotService.getAll(1, 50)
      ])

      setTemplates(templatesData.data)
      setChatbots(chatbotsData.data)

      // Charger la configuration existante si configId est fourni
      if (configId) {
        const existingConfig = await WidgetConfigurationService.getById(configId)
        setConfig({
          name: existingConfig.name,
          description: existingConfig.description,
          chatbotId: existingConfig.chatbotId,
          theme: existingConfig.theme,
          layout: existingConfig.layout,
          behavior: existingConfig.behavior,
          messages: existingConfig.messages,
          advancedConfig: existingConfig.advancedConfig,
          integrations: existingConfig.integrations,
          allowedDomains: existingConfig.allowedDomains,
          isActive: existingConfig.isActive,
          isPublic: existingConfig.isPublic,
          version: existingConfig.version
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config.name.trim()) {
      toast.error('Le nom du widget est requis')
      return
    }

    if (!config.chatbotId) {
      toast.error('Veuillez sélectionner un chatbot')
      return
    }

    setSaving(true)
    try {
      let savedConfig: WidgetConfiguration

      if (configId) {
        savedConfig = await WidgetConfigurationService.update(configId, config)
        toast.success('Configuration sauvegardée avec succès')
      } else {
        savedConfig = await WidgetConfigurationService.create(config)
        toast.success('Configuration créée avec succès')
      }

      onSave?.(savedConfig)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async () => {
    if (!configId) {
      toast.error('Veuillez d\'abord sauvegarder la configuration')
      return
    }

    try {
      const preview = await WidgetPreviewService.generatePreview(configId)
      setPreviewUrl(preview.previewUrl)
      window.open(preview.previewUrl, '_blank')
    } catch (error) {
      console.error('Erreur lors de la prévisualisation:', error)
      toast.error('Erreur lors de la génération de la prévisualisation')
    }
  }

  const applyTemplate = async (templateId: string) => {
    try {
      const template = await WidgetTemplateService.getById(templateId)
      
      setConfig(prev => ({
        ...prev,
        ...template.configTemplate,
        name: prev.name, // Garder le nom existant
        chatbotId: prev.chatbotId // Garder le chatbot sélectionné
      }))

      toast.success('Template appliqué avec succès')
    } catch (error) {
      console.error('Erreur lors de l\'application du template:', error)
      toast.error('Erreur lors de l\'application du template')
    }
  }

  const resetToDefaults = () => {
    setConfig(prev => ({
      ...prev,
      theme: {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        accentColor: '#f59e0b',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        borderColor: '#e5e7eb',
        shadowColor: 'rgba(0,0,0,0.1)',
        borderRadius: '8',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14'
      }
    }))
    toast.success('Configuration réinitialisée')
  }

  const updateTheme = (updates: Partial<WidgetTheme>) => {
    setConfig(prev => ({
      ...prev,
      theme: { ...prev.theme, ...updates }
    }))
  }

  const updateLayout = (updates: Partial<WidgetLayout>) => {
    setConfig(prev => ({
      ...prev,
      layout: { ...prev.layout, ...updates }
    }))
  }

  const updateBehavior = (updates: Partial<WidgetBehavior>) => {
    setConfig(prev => ({
      ...prev,
      behavior: { ...prev.behavior, ...updates }
    }))
  }

  const updateMessages = (updates: Partial<WidgetMessages>) => {
    setConfig(prev => ({
      ...prev,
      messages: { ...prev.messages, ...updates }
    }))
  }

  const updateAdvancedConfig = (updates: Partial<WidgetAdvancedConfig>) => {
    setConfig(prev => ({
      ...prev,
      advancedConfig: { ...prev.advancedConfig, ...updates }
    }))
  }

  const applyPresetTheme = (presetTheme: WidgetTheme) => {
    setConfig(prev => ({
      ...prev,
      theme: presetTheme
    }))
    toast.success('Thème appliqué avec succès!')
  }

  const exportConfig = () => {
    const configJson = JSON.stringify(config, null, 2)
    const blob = new Blob([configJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'widget-config.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Configuration exportée!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {configId ? 'Modifier la configuration' : 'Nouvelle configuration'}
          </h1>
          <p className="text-gray-600">
            Personnalisez l'apparence et le comportement de votre widget de chat
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={!configId}>
            <Eye className="w-4 h-4 mr-2" />
            Prévisualiser
          </Button>
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
          <Button onClick={onCancel} variant="outline">
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>
                Configuration de base du widget
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom du widget</Label>
                  <Input
                    id="name"
                    value={config.name}
                    onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Mon widget personnalisé"
                  />
                </div>
                <div>
                  <Label htmlFor="chatbot">Chatbot associé</Label>
                  <Select
                    value={config.chatbotId}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, chatbotId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un chatbot" />
                    </SelectTrigger>
                    <SelectContent>
                      {chatbots.map((chatbot) => (
                        <SelectItem key={chatbot.id} value={chatbot.id}>
                          {chatbot.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={config.description || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description de votre widget..."
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.isActive}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label>Widget actif</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.isPublic}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isPublic: checked }))}
                  />
                  <Label>Public</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Onglets de configuration */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="theme" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Thème
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Mise en page
              </TabsTrigger>
              <TabsTrigger value="behavior" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Comportement
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Avancé
              </TabsTrigger>
            </TabsList>

            {/* Onglet Thème */}
            <TabsContent value="theme">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration du thème</CardTitle>
                  <CardDescription>
                    Personnalisez les couleurs et l'apparence
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Couleur principale</Label>
                      <ColorPicker
                        value={config.theme.primaryColor}
                        onChange={(color) => updateTheme({ primaryColor: color })}
                      />
                    </div>
                    <div>
                      <Label>Couleur secondaire</Label>
                      <ColorPicker
                        value={config.theme.secondaryColor}
                        onChange={(color) => updateTheme({ secondaryColor: color })}
                      />
                    </div>
                    <div>
                      <Label>Couleur d'accent</Label>
                      <ColorPicker
                        value={config.theme.accentColor}
                        onChange={(color) => updateTheme({ accentColor: color })}
                      />
                    </div>
                    <div>
                      <Label>Couleur de fond</Label>
                      <ColorPicker
                        value={config.theme.backgroundColor}
                        onChange={(color) => updateTheme({ backgroundColor: color })}
                      />
                    </div>
                    <div>
                      <Label>Couleur du texte</Label>
                      <ColorPicker
                        value={config.theme.textColor}
                        onChange={(color) => updateTheme({ textColor: color })}
                      />
                    </div>
                    <div>
                      <Label>Couleur des bordures</Label>
                      <ColorPicker
                        value={config.theme.borderColor}
                        onChange={(color) => updateTheme({ borderColor: color })}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="borderRadius">Arrondi des bordures ({config.theme.borderRadius}px)</Label>
                      <Slider
                        value={[parseInt(config.theme.borderRadius)]}
                        onValueChange={([value]) => updateTheme({ borderRadius: value.toString() })}
                        max={20}
                        min={0}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fontSize">Taille de police ({config.theme.fontSize}px)</Label>
                      <Slider
                        value={[parseInt(config.theme.fontSize)]}
                        onValueChange={([value]) => updateTheme({ fontSize: value.toString() })}
                        max={20}
                        min={10}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="fontFamily">Police de caractères</Label>
                    <Select
                      value={config.theme.fontFamily}
                      onValueChange={(value) => updateTheme({ fontFamily: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                        <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                        <SelectItem value="Open Sans, sans-serif">Open Sans</SelectItem>
                        <SelectItem value="Lato, sans-serif">Lato</SelectItem>
                        <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Mise en page */}
            <TabsContent value="layout">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration de la mise en page</CardTitle>
                  <CardDescription>
                    Position et dimensions du widget
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="position">Position</Label>
                      <Select
                        value={config.layout.position}
                        onValueChange={(value: any) => updateLayout({ position: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bottom-right">Bas droite</SelectItem>
                          <SelectItem value="bottom-left">Bas gauche</SelectItem>
                          <SelectItem value="top-right">Haut droite</SelectItem>
                          <SelectItem value="top-left">Haut gauche</SelectItem>
                          <SelectItem value="center">Centre</SelectItem>
                          <SelectItem value="floating">Flottant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="zIndex">Z-Index ({config.layout.zIndex})</Label>
                      <Slider
                        value={[config.layout.zIndex]}
                        onValueChange={([value]) => updateLayout({ zIndex: value })}
                        max={99999}
                        min={1000}
                        step={100}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="width">Largeur ({config.layout.width}px)</Label>
                      <Slider
                        value={[config.layout.width]}
                        onValueChange={([value]) => updateLayout({ width: value })}
                        max={600}
                        min={250}
                        step={10}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Hauteur ({config.layout.height}px)</Label>
                      <Slider
                        value={[config.layout.height]}
                        onValueChange={([value]) => updateLayout({ height: value })}
                        max={800}
                        min={300}
                        step={10}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="offsetX">Décalage horizontal ({config.layout.offsetX}px)</Label>
                      <Slider
                        value={[config.layout.offsetX]}
                        onValueChange={([value]) => updateLayout({ offsetX: value })}
                        max={100}
                        min={0}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="offsetY">Décalage vertical ({config.layout.offsetY}px)</Label>
                      <Slider
                        value={[config.layout.offsetY]}
                        onValueChange={([value]) => updateLayout({ offsetY: value })}
                        max={100}
                        min={0}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.layout.showOnMobile}
                        onCheckedChange={(checked) => updateLayout({ showOnMobile: checked })}
                      />
                      <Label>Afficher sur mobile</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.layout.showOnDesktop}
                        onCheckedChange={(checked) => updateLayout({ showOnDesktop: checked })}
                      />
                      <Label>Afficher sur desktop</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Comportement */}
            <TabsContent value="behavior">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration du comportement</CardTitle>
                  <CardDescription>
                    Paramètres d'interaction et de fonctionnement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.behavior.autoOpen}
                        onCheckedChange={(checked) => updateBehavior({ autoOpen: checked })}
                      />
                      <Label>Ouverture automatique</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.behavior.showWelcomeMessage}
                        onCheckedChange={(checked) => updateBehavior({ showWelcomeMessage: checked })}
                      />
                      <Label>Afficher message de bienvenue</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.behavior.enableNotifications}
                        onCheckedChange={(checked) => updateBehavior({ enableNotifications: checked })}
                      />
                      <Label>Notifications activées</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.behavior.soundEnabled}
                        onCheckedChange={(checked) => updateBehavior({ soundEnabled: checked })}
                      />
                      <Label>Sons activés</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.behavior.enableTypingIndicator}
                        onCheckedChange={(checked) => updateBehavior({ enableTypingIndicator: checked })}
                      />
                      <Label>Indicateur de frappe</Label>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="autoOpenDelay">Délai d'ouverture auto ({config.behavior.autoOpenDelay}ms)</Label>
                      <Slider
                        value={[config.behavior.autoOpenDelay]}
                        onValueChange={([value]) => updateBehavior({ autoOpenDelay: value })}
                        max={10000}
                        min={1000}
                        step={500}
                        className="mt-2"
                        disabled={!config.behavior.autoOpen}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sessionTimeout">Timeout de session ({config.behavior.sessionTimeout}s)</Label>
                      <Slider
                        value={[config.behavior.sessionTimeout]}
                        onValueChange={([value]) => updateBehavior({ sessionTimeout: value })}
                        max={7200}
                        min={300}
                        step={300}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="maxMessages">Messages max par session ({config.behavior.maxMessages})</Label>
                    <Slider
                      value={[config.behavior.maxMessages]}
                      onValueChange={([value]) => updateBehavior({ maxMessages: value })}
                      max={500}
                      min={10}
                      step={10}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Messages */}
            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <CardTitle>Messages personnalisés</CardTitle>
                  <CardDescription>
                    Personnalisez tous les textes affichés dans le widget
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="welcomeMessage">Message de bienvenue</Label>
                      <Textarea
                        id="welcomeMessage"
                        value={config.messages.welcomeMessage}
                        onChange={(e) => updateMessages({ welcomeMessage: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="placeholderText">Texte placeholder</Label>
                      <Input
                        id="placeholderText"
                        value={config.messages.placeholderText}
                        onChange={(e) => updateMessages({ placeholderText: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sendButtonText">Texte bouton Envoyer</Label>
                      <Input
                        id="sendButtonText"
                        value={config.messages.sendButtonText}
                        onChange={(e) => updateMessages({ sendButtonText: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="typingIndicator">Indicateur de frappe</Label>
                      <Input
                        id="typingIndicator"
                        value={config.messages.typingIndicator}
                        onChange={(e) => updateMessages({ typingIndicator: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minimizeTooltip">Tooltip réduire</Label>
                      <Input
                        id="minimizeTooltip"
                        value={config.messages.minimizeTooltip}
                        onChange={(e) => updateMessages({ minimizeTooltip: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="closeTooltip">Tooltip fermer</Label>
                      <Input
                        id="closeTooltip"
                        value={config.messages.closeTooltip}
                        onChange={(e) => updateMessages({ closeTooltip: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="offlineMessage">Message hors ligne</Label>
                      <Textarea
                        id="offlineMessage"
                        value={config.messages.offlineMessage}
                        onChange={(e) => updateMessages({ offlineMessage: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="errorMessage">Message d'erreur</Label>
                      <Textarea
                        id="errorMessage"
                        value={config.messages.errorMessage}
                        onChange={(e) => updateMessages({ errorMessage: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="poweredByText">Texte "Propulsé par"</Label>
                    <Input
                      id="poweredByText"
                      value={config.messages.poweredByText}
                      onChange={(e) => updateMessages({ poweredByText: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Avancé */}
            <TabsContent value="advanced">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration avancée</CardTitle>
                  <CardDescription>
                    Paramètres techniques et intégrations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.advancedConfig.allowFileUpload}
                        onCheckedChange={(checked) => updateAdvancedConfig({ allowFileUpload: checked })}
                      />
                      <Label>Autoriser l'upload de fichiers</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.advancedConfig.enableEmojis}
                        onCheckedChange={(checked) => updateAdvancedConfig({ enableEmojis: checked })}
                      />
                      <Label>Activer les emojis</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.advancedConfig.enableMarkdown}
                        onCheckedChange={(checked) => updateAdvancedConfig({ enableMarkdown: checked })}
                      />
                      <Label>Support Markdown</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.advancedConfig.showTimestamps}
                        onCheckedChange={(checked) => updateAdvancedConfig({ showTimestamps: checked })}
                      />
                      <Label>Afficher horodatage</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.advancedConfig.showAvatars}
                        onCheckedChange={(checked) => updateAdvancedConfig({ showAvatars: checked })}
                      />
                      <Label>Afficher avatars</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.advancedConfig.enableFeedback}
                        onCheckedChange={(checked) => updateAdvancedConfig({ enableFeedback: checked })}
                      />
                      <Label>Système de feedback</Label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={config.advancedConfig.gdprCompliant}
                        onCheckedChange={(checked) => updateAdvancedConfig({ gdprCompliant: checked })}
                      />
                      <Label>Conformité RGPD - Anonymisation totale</Label>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>⚠️ Politique de confidentialité :</strong><br/>
                        Aucune donnée personnelle n'est collectée. Identification par IP et ID anonyme uniquement.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label htmlFor="customCSS">CSS personnalisé</Label>
                    <Textarea
                      id="customCSS"
                      value={config.advancedConfig.customCSS}
                      onChange={(e) => updateAdvancedConfig({ customCSS: e.target.value })}
                      rows={6}
                      placeholder="/* Votre CSS personnalisé ici */"
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="webhookUrl">URL Webhook</Label>
                      <Input
                        id="webhookUrl"
                        value={config.integrations.webhookUrl || ''}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          integrations: { ...prev.integrations, webhookUrl: e.target.value || null }
                        }))}
                        placeholder="https://votre-site.com/webhook"
                      />
                    </div>
                    <div>
                      <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
                      <Input
                        id="googleAnalytics"
                        value={config.integrations.googleAnalytics || ''}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          integrations: { ...prev.integrations, googleAnalytics: e.target.value || null }
                        }))}
                        placeholder="GA-XXXXXXXXX-X"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Panneau latéral - Templates */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Templates disponibles</CardTitle>
              <CardDescription>
                Appliquez un template prédéfini
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => applyTemplate(template.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-gray-500">{template.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Aperçu en temps réel */}
          <Card>
            <CardHeader>
              <CardTitle>Aperçu</CardTitle>
              <CardDescription>
                Prévisualisation du widget
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="border rounded-lg p-4 bg-gray-50 min-h-[200px] flex items-center justify-center"
                style={{
                  backgroundColor: config.theme.backgroundColor,
                  color: config.theme.textColor,
                  fontFamily: config.theme.fontFamily,
                  fontSize: `${config.theme.fontSize}px`
                }}
              >
                <div 
                  className="border p-4 rounded shadow-lg max-w-[250px] w-full"
                  style={{
                    borderColor: config.theme.borderColor,
                    borderRadius: `${config.theme.borderRadius}px`,
                    boxShadow: `${config.theme.shadowColor} 0 4px 12px`
                  }}
                >
                  <div className="space-y-2">
                    <div 
                      className="p-2 rounded text-sm"
                      style={{ backgroundColor: config.theme.primaryColor, color: 'white' }}
                    >
                      {config.messages.welcomeMessage}
                    </div>
                    <div className="flex">
                      <input 
                        placeholder={config.messages.placeholderText}
                        className="flex-1 p-2 border rounded text-sm"
                        style={{ borderColor: config.theme.borderColor }}
                        disabled
                      />
                      <button 
                        className="ml-2 px-3 py-2 rounded text-sm"
                        style={{ backgroundColor: config.theme.accentColor, color: 'white' }}
                        disabled
                      >
                        {config.messages.sendButtonText}
                      </button>
                    </div>
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