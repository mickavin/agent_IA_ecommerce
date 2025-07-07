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
  { href: "/support", label: "Support Younzee", icon: Headset }
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
        <Link href="/products" className="flex items-center gap-2.5 text-primary">
          <img src="/Logo-Younz.webp" alt="logo" className="h-10" />
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
