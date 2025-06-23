"use client"
import { Button } from "@/components/ui/button"
import { Bell, UserCircle, Menu } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"

export function Header() {
  const { toggleSidebar } = useSidebar()

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-background/80 px-6 backdrop-blur-md">
      <div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:hidden text-foreground hover:text-primary"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-full text-foreground hover:text-primary">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full text-foreground hover:text-primary">
          <UserCircle className="h-6 w-6" />
          <span className="sr-only">Profil utilisateur</span>
        </Button>
      </div>
    </header>
  )
}
