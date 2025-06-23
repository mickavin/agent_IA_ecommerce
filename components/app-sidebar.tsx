"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
} from "lucide-react"

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bots", label: "Assistants IA", icon: Bot },
  { href: "/products", label: "Produits", icon: Package },
  { href: "/conversations", label: "Conversations", icon: MessageCircle },
  //{ href: "/reviews", label: "Avis & Commentaires", icon: Star },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/orders", label: "Commandes", icon: ShoppingCart },
  { href: "/faq", label: "FAQ", icon: MessageCircleQuestion },
  { href: "/analytics", label: "Statistiques", icon: BarChartBig },
]

const secondaryNavItems = [{ href: "/settings", label: "Paramètres", icon: Settings }, { href: "/support", label: "Support Younzee", icon: Headset }]

export function AppSidebar() {
  const pathname = usePathname()

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
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.href === "/dashboard" ? pathname === item.href : (pathname?.startsWith(item?.href || "") || false)}
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
