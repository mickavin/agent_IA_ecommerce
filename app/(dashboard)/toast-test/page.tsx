import { ToastTest } from "@/components/toast-test"

export default function ToastTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Test des Toasts</h1>
          <p className="text-muted-foreground">
            Page de test pour vérifier que le système de notifications fonctionne correctement
          </p>
        </div>
        
        <ToastTest />
      </div>
    </div>
  )
} 