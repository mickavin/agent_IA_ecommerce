"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { AdvancedCSVImportService, type ImportResult, type ImportOptions } from '@/lib/services/csv-import.service'

interface FAQCSVImporterProps {
  onImportComplete?: (result: ImportResult) => void
}

export function FAQCSVImporter({ onImportComplete }: FAQCSVImporterProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    skipDuplicates: true,
    validateData: true,
    batchSize: 100
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile)
        setImportResult(null)
      } else {
        toast.error('Veuillez sélectionner un fichier CSV')
      }
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error('Veuillez sélectionner un fichier CSV')
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      const result = await AdvancedCSVImportService.importFAQ(file, importOptions)
      setImportResult(result)

      if (result.success) {
        toast.success(`${result.imported} FAQ importées avec succès`)
        if (result.duplicates > 0) {
          toast.info(`${result.duplicates} doublons ignorés`)
        }
        if (result.skipped > 0) {
          toast.warning(`${result.skipped} lignes ignorées`)
        }
        onImportComplete?.(result)
      } else {
        toast.error('Erreur lors de l\'import', {
          description: result.errors[0] || 'Erreur inconnue'
        })
      }
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`)
      setImportResult({
        success: false,
        imported: 0,
        errors: [error.message],
        duplicates: 0,
        skipped: 0
      })
    } finally {
      setIsImporting(false)
    }
  }

  const downloadTemplate = () => {
    const template = AdvancedCSVImportService.getFAQTemplate()
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'template_faq.csv'
    link.click()
    URL.revokeObjectURL(link.href)
    toast.success('Template téléchargé')
  }

  const resetImport = () => {
    setFile(null)
    setImportResult(null)
    const fileInput = document.getElementById('faq-csv-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Import CSV des FAQ
        </CardTitle>
        <CardDescription>
          Importez des questions FAQ depuis un fichier CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Options d'import */}
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <Label className="text-sm font-medium">Options d'import</Label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={importOptions.skipDuplicates}
                onChange={(e) => setImportOptions({ ...importOptions, skipDuplicates: e.target.checked })}
                className="rounded"
              />
              Ignorer les doublons
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={importOptions.validateData}
                onChange={(e) => setImportOptions({ ...importOptions, validateData: e.target.checked })}
                className="rounded"
              />
              Valider les données avant import
            </label>
          </div>
        </div>

        {/* Sélection de fichier */}
        <div className="space-y-2">
          <Label htmlFor="faq-csv-upload">Fichier CSV</Label>
          <div className="flex gap-2">
            <Input
              id="faq-csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={isImporting}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={downloadTemplate}
              disabled={isImporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
          </div>
          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>

        {/* Résultats */}
        {importResult && (
          <Alert className={importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <div className="flex items-start gap-2">
              {importResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">
                      {importResult.success ? 'Import réussi' : 'Import échoué'}
                    </div>
                    <div className="text-sm space-y-1">
                      <div>✅ Importées: {importResult.imported}</div>
                      {importResult.duplicates > 0 && (
                        <div>⚠️ Doublons: {importResult.duplicates}</div>
                      )}
                      {importResult.skipped > 0 && (
                        <div>⏭️ Ignorées: {importResult.skipped}</div>
                      )}
                      {importResult.errors.length > 0 && (
                        <div className="mt-2">
                          <div className="font-medium text-red-600">Erreurs:</div>
                          <ul className="list-disc list-inside text-xs space-y-1">
                            {importResult.errors.slice(0, 5).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                            {importResult.errors.length > 5 && (
                              <li>... et {importResult.errors.length - 5} autres erreurs</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleImport}
            disabled={!file || isImporting}
            className="flex-1"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Import en cours...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importer
              </>
            )}
          </Button>
          {file && (
            <Button
              variant="outline"
              onClick={resetImport}
              disabled={isImporting}
            >
              Réinitialiser
            </Button>
          )}
        </div>

        {/* Aide */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">Format CSV attendu:</div>
              <div className="text-xs space-y-1">
                <div>• <strong>question</strong> (requis) - La question FAQ</div>
                <div>• <strong>answer</strong> (requis) - La réponse détaillée</div>
                <div>• <strong>category</strong> - Commandes, Livraison, Retours, Paiements, Produits, Compte, Technique</div>
                <div>• <strong>status</strong> - Publié, Brouillon, Archivé (défaut: Brouillon)</div>
                <div>• <strong>tags</strong> - Tags séparés par des virgules</div>
                <div>• <strong>is_highlighted</strong> - true/false (défaut: false)</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


