"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Download, Cloud, AlertCircle } from "lucide-react"

interface CSVInfo {
  generated: boolean
  filename: string
  downloadUrl?: string
  s3Url?: string
  stats: {
    productsCount: number
    variantsCount: number
    csvSize: number
  }
  error?: string
}

interface CSVExportInfoProps {
  csvInfo: CSVInfo | null
  onClose?: () => void
}

export function CSVExportInfo({ csvInfo, onClose }: CSVExportInfoProps) {
  if (!csvInfo?.generated) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          CSV généré automatiquement
        </CardTitle>
        <CardDescription>
          Les données Shopify ont été exportées au format CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <strong>Fichier:</strong> {csvInfo.filename}
          </div>
          <div>
            <strong>Produits:</strong> {csvInfo.stats.productsCount}
          </div>
          <div>
            <strong>Variants:</strong> {csvInfo.stats.variantsCount}
          </div>
          <div>
            <strong>Taille:</strong> {(csvInfo.stats.csvSize / 1024).toFixed(1)} KB
          </div>
        </div>
        
        <div className="flex gap-2">
          {csvInfo.downloadUrl && (
            <Button asChild size="sm">
              <a href={csvInfo.downloadUrl} download={csvInfo.filename}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger CSV
              </a>
            </Button>
          )}
          
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Masquer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 