import { Button } from "@/components/ui/button"
import Link from "next/link"

interface FormActionsProps {
  cancelHref: string
  isSubmitting?: boolean
  submitText?: string
  cancelText?: string
}

export function FormActions({
  cancelHref,
  isSubmitting = false,
  submitText = "Enregistrer",
  cancelText = "Annuler",
}: FormActionsProps) {
  return (
    <div className="flex justify-end gap-3 mt-8">
      <Button variant="outline" asChild>
        <Link href={cancelHref || ""}>{cancelText}</Link>
      </Button>
      <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
        {isSubmitting ? "Enregistrement..." : submitText}
      </Button>
    </div>
  )
}
