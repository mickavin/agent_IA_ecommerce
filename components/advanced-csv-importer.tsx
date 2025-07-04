"use client"

import React, { useState, useRef, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Download, Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { AdvancedCSVImportService, type ImportResult, type ImportOptions } from '@/lib/services/csv-import.service'

interface AdvancedCSVImporterProps {
  onImportComplete?: (result: ImportResult) => void
  availableTypes?: ('products' | 'orders' | 'clients')[]
}

export function AdvancedCSVImporter({ 
  onImportComplete,
  availableTypes = ['products', 'orders', 'clients']
}: AdvancedCSVImporterProps) {
  const [selectedType, setSelectedType] = useState<'products' | 'orders' | 'clients'>('products')
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    skipDuplicates: true,
    validateData: true,
    batchSize: 500
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setImportResult(null)
    } else {
      toast.error("Fichier invalide")
    }
  }

  const handleImport = async () => {
    console.log('handleImport')
    if (!file) return
    console.log('file', file)
    setIsImporting(true)
    setImportResult(null)

    try {
      let result: ImportResult

      switch (selectedType) {
        case 'products':
          result = await AdvancedCSVImportService.importProducts(file, importOptions)
          break
        case 'orders':
          result = await AdvancedCSVImportService.importOrders(file, importOptions)
          break
        case 'clients':
          result = await AdvancedCSVImportService.importClients(file, importOptions)
          break
        default:
          throw new Error('Type d\'import non supporté')
      }
      console.log('result', result)
      setImportResult(result)
      
      if (result.success) {
        toast.success(`${result.imported} éléments importés avec succès.`)
        onImportComplete?.(result)
      } else {
        toast.error("Import échoué")
      }
      
    } catch (error) {
      toast.error(`Une erreur est survenue : ${error}`)
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    let template = ''
    let filename = ''

    switch (selectedType) {
      case 'products':
        template = AdvancedCSVImportService.getProductTemplate()
        filename = 'template_produits.csv'
        break
      case 'orders':
        template = AdvancedCSVImportService.getOrderTemplate()
        filename = 'template_commandes.csv'
        break
      case 'clients':
        template = AdvancedCSVImportService.getClientTemplate()
        filename = 'template_clients.csv'
        break
    }

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const resetImport = () => {
    setFile(null)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import avancé de données CSV
          </CardTitle>
          <CardDescription>
            Importez vos données depuis un fichier CSV avec validation et options avancées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as any)}>
          

            <div className="mt-6 space-y-4">
              {/* Options d'import */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="skip-duplicates"
                    checked={importOptions.skipDuplicates}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, skipDuplicates: checked }))
                    }
                  />
                  <Label htmlFor="skip-duplicates">Ignorer les doublons</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="validate-data"
                    checked={importOptions.validateData}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, validateData: checked }))
                    }
                  />
                  <Label htmlFor="validate-data">Valider les données</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Label htmlFor="batch-size">Taille de lot:</Label>
                  <Input
                    id="batch-size"
                    type="number"
                    min="10"
                    max="1000"
                    value={importOptions.batchSize}
                    onChange={(e) => 
                      setImportOptions(prev => ({ ...prev, batchSize: parseInt(e.target.value) || 100 }))
                    }
                    className="w-20"
                  />
                </div>
              </div>

              {/* Sélection de fichier */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Sélectionner un fichier CSV
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={downloadTemplate}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger le template
                  </Button>

                  {file && (
                    <Button
                      variant="ghost"
                      onClick={resetImport}
                      disabled={isImporting}
                    >
                      Réinitialiser
                    </Button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {file && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <Badge variant="secondary">
                      {(file.size / 1024).toFixed(1)} KB
                    </Badge>
                  </div>
                )}
              </div>

              {/* Bouton d'import */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {selectedType === 'products' && 'Importez vos produits avec tailles, couleurs et variantes'}
                  {selectedType === 'orders' && 'Importez vos commandes avec informations client'}
                  {selectedType === 'clients' && 'Importez vos clients avec historique et préférences'}
                </div>
                
                <Button
                  onClick={handleImport}
                  disabled={!file || isImporting}
                  className="flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Importer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Résultats d'import */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Résultats de l'import
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.imported}
                </div>
                <div className="text-sm text-muted-foreground">Importés</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {importResult.duplicates}
                </div>
                <div className="text-sm text-muted-foreground">Doublons</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.skipped}
                </div>
                <div className="text-sm text-muted-foreground">Ignorés</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importResult.errors.length}
                </div>
                <div className="text-sm text-muted-foreground">Erreurs</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">Erreurs rencontrées :</div>
                    <div className="max-h-32 overflow-y-auto">
                      {importResult.errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="text-sm text-red-600">
                          • {error}
                        </div>
                      ))}
                      {importResult.errors.length > 10 && (
                        <div className="text-sm text-muted-foreground">
                          ... et {importResult.errors.length - 10} autres erreurs
                        </div>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 