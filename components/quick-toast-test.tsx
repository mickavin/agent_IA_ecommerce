"use client"

import { Button } from "@/components/ui/button"
import { toast } from 'sonner'

export function QuickToastTest() {
  return (
    <div className="flex gap-2 p-4">
      <Button onClick={() => toast.success('Toast SUCCESS fonctionne ! ✅')}>
        Test Success
      </Button>
      <Button onClick={() => toast.error('Toast ERROR fonctionne ! ❌')} variant="destructive">
        Test Error  
      </Button>
      <Button onClick={() => toast.info('Toast INFO fonctionne ! ℹ️')} variant="outline">
        Test Info
      </Button>
      <Button onClick={() => toast('Toast BASIC fonctionne ! 🎉')} variant="secondary">
        Test Basic
      </Button>
    </div>
  )
} 