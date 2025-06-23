"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CSVImportService } from '@/lib/services/csv-import.service'
import { toast } from '@/components/ui/use-toast'

interface CSVImportProps {
  type: 'products' | 'clients'
  onSuccess?: () => void
}

export function CSVImport({ type, onSuccess }: CSVImportProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      if (type === 'products') {
        await CSVImportService.importProducts(file)
      } else {
        await CSVImportService.importClients(file)
      }
      
      toast({
        title: "Import réussi",
        description: `Les données ont été importées avec succès.`
      })
      
      onSuccess?.()
    } catch (error) {
      toast({
        title: "Erreur d'import",
        description: "Une erreur est survenue lors de l'import des données.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        disabled={isLoading}
        className="hidden"
        id="csv-upload"
      />
      <Button
        onClick={() => document.getElementById('csv-upload')?.click()}
        disabled={isLoading}
      >
        {isLoading ? 'Import en cours...' : `Importer des ${type} (CSV)`}
      </Button>
    </div>
  )
} 