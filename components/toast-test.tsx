"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from 'sonner'

export function ToastTest() {
  const testToasts = () => {
    // Test différents types de toasts
    toast.success('✅ Toast success fonctionne !', {
      description: 'Ce toast indique une action réussie'
    })
    
    setTimeout(() => {
      toast.error('❌ Toast error fonctionne !', {
        description: 'Ce toast indique une erreur'
      })
    }, 1000)
    
    setTimeout(() => {
      toast.info('ℹ️ Toast info fonctionne !', {
        description: 'Ce toast donne une information'
      })
    }, 2000)
    
    setTimeout(() => {
      toast.warning('⚠️ Toast warning fonctionne !', {
        description: 'Ce toast indique un avertissement'
      })
    }, 3000)
    
    setTimeout(() => {
      toast('🎉 Toast normal fonctionne !', {
        description: 'Ce toast est basique'
      })
    }, 4000)
  }

  const testCustomToast = () => {
    toast('🚀 Toast personnalisé', {
      description: 'Avec actions et durée personnalisée',
      action: {
        label: 'Action',
        onClick: () => toast.success('Action exécutée !')
      },
      duration: 10000
    })
  }

  const testPromiseToast = () => {
    const promise = new Promise((resolve) => {
      setTimeout(resolve, 3000)
    })

    toast.promise(promise, {
      loading: '⏳ Chargement en cours...',
      success: '✅ Opération terminée !',
      error: '❌ Erreur lors de l\'opération'
    })
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Test des Toasts Sonner
        </CardTitle>
        <CardDescription>
          Testez les différents types de notifications toast
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={testToasts} className="w-full">
            🎯 Tester tous les types
          </Button>
          
          <Button onClick={testCustomToast} variant="outline" className="w-full">
            🎨 Toast personnalisé
          </Button>
          
          <Button onClick={testPromiseToast} variant="secondary" className="w-full">
            ⏳ Toast Promise
          </Button>
          
          <Button 
            onClick={() => toast.dismiss()} 
            variant="destructive" 
            className="w-full"
          >
            🗑️ Effacer tous les toasts
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Test réussi si :</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Les toasts apparaissent en haut à droite</li>
            <li>Ils ont les bonnes couleurs selon le type</li>
            <li>Ils se ferment automatiquement</li>
            <li>Les actions fonctionnent</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 