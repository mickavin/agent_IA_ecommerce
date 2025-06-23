"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Import dynamique du CSVImporter pour éviter les erreurs SSR
const CSVImporter = dynamic(
  () => import("csv-import-react").then((mod) => ({ default: mod.CSVImporter })),
  {
    ssr: false,
    loading: () => <div>Chargement de l'importeur CSV...</div>
  }
)

interface CSVImporterWrapperProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: any) => void
  language?: string
  primaryColor?: string
  darkMode?: boolean
  template: {
    columns: Array<{
      name: string
      key: string
      required?: boolean
      description?: string
      suggested_mappings?: string[]
      data_type?: string
    }>
  }
}

export function CSVImporterWrapper({
  isOpen,
  onClose,
  onComplete,
  language = "fr",
  primaryColor = "#FFDD5B",
  darkMode = true,
  template
}: CSVImporterWrapperProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <CSVImporter
      language={language}
      primaryColor={primaryColor}
      modalIsOpen={isOpen}
      modalOnCloseTriggered={onClose}
      
      darkMode={darkMode}
      onComplete={onComplete}
      template={template}
    />
  )
} 