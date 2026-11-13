'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Copy, 
  Eye, 
  Trash2, 
  Power, 
  PowerOff,
  Code,
  Download,
  Settings,
  Bot,
  Palette,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import WidgetCustomization from '@/components/widget-customization'
import { 
  WidgetConfiguration, 
  WidgetStats,
  WidgetPreview
} from '@/lib/types'
import { 
  WidgetConfigurationService, 
  WidgetPreviewService 
} from '@/lib/services/api.service'

export default function WidgetsPage() {
  const [loading, setLoading] = useState(true)
  const [widgets, setWidgets] = useState<WidgetConfiguration[]>([])
  const [stats, setStats] = useState<WidgetStats | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCustomization, setShowCustomization] = useState(false)
  const [editingWidget, setEditingWidget] = useState<string | null>(null)
  const [showCodeDialog, setShowCodeDialog] = useState<string | null>(null)
  const [embedCode, setEmbedCode] = useState<WidgetPreview | null>(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 12

  useEffect(() => {
    loadWidgets()
    loadStats()
  }, [currentPage, searchTerm])

  const loadWidgets = async () => {
    setLoading(true)
    try {
      const response = await WidgetConfigurationService.getAll(
        currentPage, 
        pageSize, 
        searchTerm
      )
      setWidgets(response.data)
      setTotalPages(response.totalPages)
    } catch (error) {
      console.error('Erreur lors du chargement des widgets:', error)
      toast.error('Erreur lors du chargement des widgets')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await WidgetConfigurationService.getStats()
      setStats(statsData)
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    }
  }

  const handleCreateWidget = () => {
    setEditingWidget(null)
    setShowCustomization(true)
  }

  const handleEditWidget = (widgetId: string) => {
    setEditingWidget(widgetId)
    setShowCustomization(true)
  }

  const handleDuplicateWidget = async (widget: WidgetConfiguration) => {
    try {
      await WidgetConfigurationService.duplicate(widget.id, `${widget.name} (Copie)`)
      toast.success('Widget dupliqué avec succès')
      loadWidgets()
    } catch (error) {
      console.error('Erreur lors de la duplication:', error)
      toast.error('Erreur lors de la duplication')
    }
  }

  const handleToggleActive = async (widget: WidgetConfiguration) => {
    try {
      if (widget.isActive) {
        await WidgetConfigurationService.deactivate(widget.id)
        toast.success('Widget désactivé')
      } else {
        await WidgetConfigurationService.activate(widget.id)
        toast.success('Widget activé')
      }
      loadWidgets()
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error)
      toast.error('Erreur lors du changement de statut')
    }
  }

  const handleDeleteWidget = async (widgetId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce widget ?')) {
      return
    }

    try {
      await WidgetConfigurationService.delete(widgetId)
      toast.success('Widget supprimé avec succès')
      loadWidgets()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleShowCode = async (widgetId: string) => {
    try {
      const preview = await WidgetPreviewService.generatePreview(widgetId)
      setEmbedCode(preview)
      setShowCodeDialog(widgetId)
    } catch (error) {
      console.error('Erreur lors de la génération du code:', error)
      toast.error('Erreur lors de la génération du code')
    }
  }

  const handlePreview = async (widgetId: string) => {
    try {
      const preview = await WidgetPreviewService.generatePreview(widgetId)
      window.open(preview.previewUrl, '_blank')
    } catch (error) {
      console.error('Erreur lors de la prévisualisation:', error)
      toast.error('Erreur lors de la prévisualisation')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Code copié dans le presse-papiers')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusBadge = (widget: WidgetConfiguration) => {
    if (widget.isActive) {
      return <Badge className="bg-green-100 text-green-800">Actif</Badge>
    } else {
      return <Badge variant="secondary">Inactif</Badge>
    }
  }

  if (showCustomization) {
    return (
      <WidgetCustomization
        configId={editingWidget || undefined}
        onSave={() => {
          setShowCustomization(false)
          loadWidgets()
        }}
        onCancel={() => setShowCustomization(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Widgets"
        description="Créez et gérez vos widgets de chat personnalisés"
      />

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Widgets</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalConfigurations}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Widgets Actifs</CardTitle>
              <Power className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeConfigurations}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Installations</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInstallations}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Template Populaire</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {stats.popularTemplates[0]?.templateName || 'Aucun'}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.popularTemplates[0]?.usageCount || 0} utilisations
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Barre d'actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des widgets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
        </div>
        
        <Button onClick={handleCreateWidget}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Widget
        </Button>
      </div>

      {/* Liste des widgets */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded"></div>
                  <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : widgets.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun widget trouvé
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Aucun widget ne correspond à votre recherche.' : 'Commencez par créer votre premier widget.'}
            </p>
            {!searchTerm && (
              <Button onClick={handleCreateWidget}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un widget
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map((widget) => (
            <Card key={widget.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{widget.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEditWidget(widget.id)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateWidget(widget)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePreview(widget.id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Prévisualiser
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShowCode(widget.id)}>
                        <Code className="w-4 h-4 mr-2" />
                        Code d'intégration
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleToggleActive(widget)}>
                        {widget.isActive ? (
                          <>
                            <PowerOff className="w-4 h-4 mr-2" />
                            Désactiver
                          </>
                        ) : (
                          <>
                            <Power className="w-4 h-4 mr-2" />
                            Activer
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteWidget(widget.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>
                  {widget.description || 'Aucune description'}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Statut:</span>
                    {getStatusBadge(widget)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Installations:</span>
                    <span className="text-sm font-mono">{widget.installationCount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Dernière utilisation:</span>
                    <span className="text-sm font-mono">
                      {widget.lastUsedAt ? formatDate(widget.lastUsedAt) : 'Jamais'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Créé le:</span>
                    <span className="text-sm font-mono">{formatDate(widget.createdAt)}</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => handlePreview(widget.id)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Prévisualiser
                </Button>
                <Button size="sm" onClick={() => handleEditWidget(widget.id)}>
                  <Palette className="w-4 h-4 mr-2" />
                  Personnaliser
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Précédent
          </Button>
          
          <span className="text-sm text-gray-500">
            Page {currentPage} sur {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Suivant
          </Button>
        </div>
      )}

      {/* Dialog pour le code d'intégration */}
      <Dialog open={!!showCodeDialog} onOpenChange={() => setShowCodeDialog(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Code d'intégration</DialogTitle>
          </DialogHeader>
          
          {embedCode && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Code HTML (iframe)</h4>
                <div className="bg-gray-100 p-3 rounded-md">
                  <pre className="text-sm overflow-x-auto">{embedCode.embedCode}</pre>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => copyToClipboard(embedCode.embedCode)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copier
                </Button>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Code JavaScript</h4>
                <div className="bg-gray-100 p-3 rounded-md">
                  <pre className="text-sm overflow-x-auto">{embedCode.jsCode}</pre>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => copyToClipboard(embedCode.jsCode)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copier
                </Button>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">CSS personnalisé</h4>
                <div className="bg-gray-100 p-3 rounded-md">
                  <pre className="text-sm overflow-x-auto">{embedCode.cssCode}</pre>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => copyToClipboard(embedCode.cssCode)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 