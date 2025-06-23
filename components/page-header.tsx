import type React from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PageHeaderProps {
  title: string
  description?: string
  backHref?: string
  children?: React.ReactNode // For action buttons like "Save"
}

export function PageHeader({ title, description, backHref, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {backHref && (
          <Button variant="outline" size="icon" asChild>
            <Link href={backHref || ""}>
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Retour</span>
            </Link>
          </Button>
        )}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children && <div className="flex gap-2 flex-shrink-0">{children}</div>}
    </div>
  )
}
