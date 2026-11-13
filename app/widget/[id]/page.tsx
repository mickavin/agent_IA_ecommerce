"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"

export default function WidgetPage() {
  const params = useParams()
  const botId = params?.id as string

  useEffect(() => {
    if (!botId) return

    // Injecter le script du chatbot
    const script = document.createElement("script")
    script.src = "/chatbot-generator.js"
    script.setAttribute("data-bot-id", botId)
    script.async = true
    
    // Configurer pour que le widget s'ouvre automatiquement dans l'iframe
    window.wikzyChatbotConfig = {
      autoOpen: true,
      standalone: true
    }

    document.head.appendChild(script)

    return () => {
      // Nettoyage si nécessaire
      const container = document.querySelector(".wikzy-chatbot-container")
      if (container) container.remove()
    }
  }, [botId])

  return (
    <div className="w-full h-screen bg-transparent flex items-center justify-center">
      {/* Le widget sera injecté ici par le script */}
      <div id="wikzy-widget-root"></div>
      
      <style jsx global>{`
        body {
          background: transparent !important;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        
        /* Ajustements pour que le widget prenne toute la place dans l'iframe si nécessaire */
        .wikzy-chatbot-window {
          position: fixed !important;
          bottom: 0 !important;
          right: 0 !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 0 !important;
          margin: 0 !important;
          display: flex !important;
        }
        
        .wikzy-chatbot-button {
          display: none !important;
        }
        
        .wikzy-chatbot-close {
          display: none !important;
        }
      `}</style>
    </div>
  )
}

