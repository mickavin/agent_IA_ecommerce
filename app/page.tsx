"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  
  useEffect(() => {
    console.log("Redirection côté client vers /dashboard")
    router.push("/dashboard")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen w-full">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirection en cours...</h1>
        <p>Vous allez être redirigé vers le dashboard.</p>
      </div>
    </div>
  )
}
