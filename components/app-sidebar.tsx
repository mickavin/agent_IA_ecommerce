"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar"
import {
  Package,
  ShoppingCart,
  Headset,
  Truck,
  BarChartBig,
  Settings,
  LogOut,
  Palette,
  Archive,
  LayoutDashboard,
  MessageCircle,
  Star,
  Bot,
  Users,
  History,
  Mail,
  MessageCircleQuestion,
  Instagram,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { 
    label: "Assistants IA", 
    icon: Bot, 
    subItems: [
      { href: "/bots", label: "Liste des bots" },
      { href: "/bots/new", label: "Créer un bot" },
    ]
  },
  { 
    label: "Produits", 
    icon: Package, 
    subItems: [
      { href: "/products", label: "Produits source" }, 
      { href: "/products-enriched", label: "Produits enrichis" },
    ] 
  },
  { href: "/conversations", label: "Conversations", icon: MessageCircle },
  { 
    label: "Clients", 
    icon: Users, 
    href: "/clients"
  },
  { 
    label: "Commandes", 
    icon: ShoppingCart, 
    href: "/orders"
  },
  { href: "/faq", label: "FAQ", icon: MessageCircleQuestion },
  { 
    label: "Statistiques", 
    icon: BarChartBig, 
    href: "/analytics"
  },
]

const secondaryNavItems = [
  { href: "/settings", label: "Paramètres", icon: Settings }, 
  { href: "/support", label: "Support Wikzy", icon: Headset }
]

export function AppSidebar() {
  const pathname = usePathname()
  const [openSubMenus, setOpenSubMenus] = useState<string[]>([])

  // Fonction pour basculer l'ouverture d'un sous-menu
  const toggleSubMenu = (label: string) => {
    setOpenSubMenus(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  // Fonction pour vérifier si un élément ou ses sous-éléments sont actifs
  const isItemActive = (item: any) => {
    if (item.href) {
      return item.href === "/dashboard" 
        ? pathname === item.href 
        : pathname?.startsWith(item.href)
    }
    if (item.subItems) {
      return item.subItems.some((subItem: any) => pathname?.startsWith(subItem.href))
    }
    return false
  }

  // Fonction pour vérifier si un sous-menu doit être ouvert par défaut
  const shouldSubMenuBeOpen = (item: any) => {
    if (item.subItems) {
      return item.subItems.some((subItem: any) => pathname?.startsWith(subItem.href))
    }
    return false
  }

  // Ouvrir automatiquement les sous-menus qui contiennent la page active
  useState(() => {
    const activeSubMenus = mainNavItems
      .filter(item => item.subItems && shouldSubMenuBeOpen(item))
      .map(item => item.label)
    
    if (activeSubMenus.length > 0) {
      setOpenSubMenus(activeSubMenus)
    }
  })

  return (
    <Sidebar collapsible="icon" className="border-r border-border/60 bg-background">
      {" "}
      {/* Ensure bg for sidebar */}
      <SidebarHeader className="p-4 flex items-center justify-center group-data-[collapsible=icon]:justify-center">
        <Link 
          href="/products" 
          className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center group relative"
        >
          <div className="relative inline-block">
            {/* Effet de glow en arrière-plan */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 blur-lg rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            
            {/* Badge décoratif */}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full opacity-80 group-data-[collapsible=icon]:hidden animate-pulse" />
            
            {/* Texte principal avec gradient animé */}
            <span 
              className="relative text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-primary bg-clip-text text-transparent group-data-[collapsible=icon]:text-xl group-hover:from-primary group-hover:via-primary group-hover:to-primary/80 transition-all duration-300"
              style={{ 
                fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
                letterSpacing: '-0.03em',
                fontWeight: 800,
                //textShadow: '0 0 20px hsl(var(--primary) / 0.3)',
                //filter: 'drop-shadow(0 2px 4px hsl(var(--primary) / 0.2))'
              }}
            >
              <span className="text-white">Wik</span>zy
            </span>
            
            {/* Ligne décorative animée */}
            <div className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent rounded-full opacity-70 group-data-[collapsible=icon]:hidden group-hover:opacity-100 transition-opacity duration-300" 
              style={{
                //boxShadow: '0 0 8px hsl(var(--primary) / 0.5)'
              }}
            />
            
            {/* Effet de brillance au hover 
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-10000 group-data-[collapsible=icon]:hidden" />
          */}
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-grow p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden px-2 pb-1">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href || item.label}>
                  {/* Élément principal */}
                  {item.subItems ? (
                    // Élément avec sous-menu
                    <>
                      <SidebarMenuButton
                        onClick={() => toggleSubMenu(item.label)}
                        isActive={isItemActive(item)}
                        tooltip={{ children: item.label, side: "right", align: "center" }}
                        className="justify-start cursor-pointer"
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden flex-1">{item.label}</span>
                        <div className="group-data-[collapsible=icon]:hidden">
                          {openSubMenus.includes(item.label) || shouldSubMenuBeOpen(item) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </SidebarMenuButton>
                      
                      {/* Sous-menu */}
                      {(openSubMenus.includes(item.label) || shouldSubMenuBeOpen(item)) && (
                        <SidebarMenuSub className="group-data-[collapsible=icon]:hidden">
                          {item.subItems.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.href}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname?.startsWith(subItem.href)}
                              >
                                <Link href={subItem.href}>
                                  <span style={{ fontWeight: item.href == subItem.href ? "bold" : "normal" }}>{subItem.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </>
                  ) : (
                    // Élément simple sans sous-menu
                  <SidebarMenuButton
                    asChild
                      isActive={isItemActive(item)}
                    tooltip={{ children: item.label, side: "right", align: "center" }}
                    className="justify-start"
                  >
                      <Link href={item.href || ""}>
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2 border-t border-border/60">
        <SidebarMenu>
          {secondaryNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname?.startsWith(item.href) || false}
                tooltip={{ children: item.label, side: "right", align: "center" }}
                className="justify-start"
              >
                <Link href={item?.href || ""}>
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={{ children: "Déconnexion", side: "right", align: "center" }}
              className="justify-start"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Déconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
