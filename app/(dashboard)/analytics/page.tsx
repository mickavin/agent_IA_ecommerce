"use client"
/**
 * Analytics Page - Services IA E-commerce
 * 
 * POLITIQUE DE CONFIDENTIALITÉ:
 * - Identification clients UNIQUEMENT par adresse IP + ID anonyme
 * - Format ID: [PREFIX]_[SHOP_ID]_[12_DIGITS_RANDOM]
 * - AUCUNE donnée personnelle: pas de nom, email, téléphone, adresse postale
 * - Respect total de l'anonymisation des utilisateurs
 */
import { Bar, Line, Pie } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler, // For area under line chart if needed
} from "chart.js"
// import ChartDataLabels from "chartjs-plugin-datalabels"; // Optional: for better labels on charts

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// Données anonymisées - aucune information personnelle importée

// Données mockées pour les services IA e-commerce
const mockAIServices = [
  { name: "Chatbot Standard", unitsSold: 145, revenue: 29000, conversionRate: 12.5 },
  { name: "Assistant IA Avancé", unitsSold: 89, revenue: 53400, conversionRate: 18.2 },
  { name: "Recommandation Produits", unitsSold: 203, revenue: 40600, conversionRate: 8.7 },
  { name: "Analyse Sentiment Client", unitsSold: 67, revenue: 20100, conversionRate: 15.3 },
  { name: "Chatbot Multilingue", unitsSold: 124, revenue: 37200, conversionRate: 22.1 },
]

const mockChatbotInteractions = [
  { month: "Oct", totalInteractions: 15420, avgResponseTime: 1.2, satisfactionScore: 4.3 },
  { month: "Nov", totalInteractions: 18750, avgResponseTime: 1.1, satisfactionScore: 4.5 },
  { month: "Déc", totalInteractions: 22340, avgResponseTime: 0.9, satisfactionScore: 4.6 },
  { month: "Jan", totalInteractions: 25680, avgResponseTime: 0.8, satisfactionScore: 4.7 },
  { month: "Fév", totalInteractions: 28920, avgResponseTime: 0.7, satisfactionScore: 4.8 },
  { month: "Mar", totalInteractions: 32150, avgResponseTime: 0.6, satisfactionScore: 4.9 },
]

const mockConversionFunnel = [
  { stage: "Visiteurs Site", value: 100000, percentage: 100 },
  { stage: "Interaction Chatbot", value: 35000, percentage: 35 },
  { stage: "Questions Produits", value: 18500, percentage: 18.5 },
  { stage: "Ajout Panier", value: 12800, percentage: 12.8 },
  { stage: "Commande", value: 8900, percentage: 8.9 },
]

const mockClientROI = [
  { clientType: "Petit E-commerce", avgROI: 240, count: 45 },
  { clientType: "E-commerce Moyen", avgROI: 320, count: 28 },
  { clientType: "Grande Enseigne", avgROI: 480, count: 15 },
  { clientType: "Marketplace", avgROI: 380, count: 22 },
]

const mockAnonymousClients = [
  { clientId: "EC_001_847293651084", ipAddress: "192.168.1.45", sessionDuration: 12.5, interactions: 23 },
  { clientId: "EC_002_593847261739", ipAddress: "10.0.0.156", sessionDuration: 8.2, interactions: 15 },
  { clientId: "SM_003_847592638471", ipAddress: "172.16.0.89", sessionDuration: 15.7, interactions: 31 },
  { clientId: "LG_004_739485762938", ipAddress: "203.0.113.42", sessionDuration: 22.1, interactions: 45 },
  { clientId: "MP_005_584729374658", ipAddress: "198.51.100.73", sessionDuration: 18.9, interactions: 38 },
]

const mockActiveSessionsData = [
  { timeSlot: "00h-02h", activeIPs: 12, uniqueClients: 8 },
  { timeSlot: "02h-04h", activeIPs: 6, uniqueClients: 4 },
  { timeSlot: "04h-06h", activeIPs: 3, uniqueClients: 2 },
  { timeSlot: "06h-08h", activeIPs: 18, uniqueClients: 12 },
  { timeSlot: "08h-10h", activeIPs: 45, uniqueClients: 32 },
  { timeSlot: "10h-12h", activeIPs: 78, uniqueClients: 56 },
  { timeSlot: "12h-14h", activeIPs: 89, uniqueClients: 67 },
  { timeSlot: "14h-16h", activeIPs: 95, uniqueClients: 73 },
  { timeSlot: "16h-18h", activeIPs: 103, uniqueClients: 82 },
  { timeSlot: "18h-20h", activeIPs: 87, uniqueClients: 69 },
  { timeSlot: "20h-22h", activeIPs: 67, uniqueClients: 54 },
  { timeSlot: "22h-24h", activeIPs: 34, uniqueClients: 28 },
]

const mockPopularSearches = [
  { term: "livraison gratuite", frequency: 2450, conversions: 890 },
  { term: "retour produit", frequency: 1820, conversions: 420 },
  { term: "taille guide", frequency: 1650, conversions: 780 },
  { term: "promotion", frequency: 2180, conversions: 1240 },
  { term: "stock disponible", frequency: 1290, conversions: 650 },
]

const mockTopProducts = [
  { name: "iPhone 15 Pro", unitsSold: 1247, revenue: 1870500, category: "Smartphone" },
  { name: "MacBook Air M3", unitsSold: 892, revenue: 1338000, category: "Ordinateur" },
  { name: "AirPods Pro 2", unitsSold: 2156, revenue: 646800, category: "Audio" },
]

const mockTopSearchedProducts = [
  { name: "Samsung Galaxy S24", searches: 3420, clicks: 2890, conversionRate: 12.8 },
  { name: "PlayStation 5", searches: 2890, clicks: 2234, conversionRate: 8.5 },
  { name: "iPad Pro M4", searches: 2670, clicks: 2134, conversionRate: 15.2 },
]

const mockCartMetrics = {
  averageCartValue: 127.50,
  abandonedCarts: 1423,
  totalCarts: 4567,
  abandonmentRate: 31.2
}

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  // ChartDataLabels // Register if using
)

// Helper for HSL colors from Tailwind theme
const HSL_PRIMARY = "hsl(0, 45%, 74.1%)" // Or rose
const HSL_SECONDARY = "hsl(210, 31%, 16.7%)" // Bleu nuit
const HSL_FOREGROUND = "hsl(0, 0%, 97.3%)"
const HSL_MUTED_FOREGROUND = "hsl(0, 0%, 62.7%)"
const HSL_BORDER = "hsl(210, 31%, 13%)"
const HSL_BACKGROUND_POPOVER = "hsl(240, 0%, 10.2%)" // popover background

// --- Chart Data Transformations ---
const aiServicesRevenueChartData = {
  labels: mockAIServices.map((s) => s.name),
  datasets: [
    {
      label: "Revenus (€)",
      data: mockAIServices.map((s) => s.revenue),
      backgroundColor: HSL_PRIMARY,
      borderColor: HSL_PRIMARY,
      borderRadius: 4,
      barThickness: 30,
    },
  ],
}

const chatbotInteractionsChartData = {
  labels: mockChatbotInteractions.map((d) => d.month),
  datasets: [
    {
      label: "Interactions Totales",
      data: mockChatbotInteractions.map((d) => d.totalInteractions),
      backgroundColor: "hsl(142, 71%, 45%)",
      borderColor: "hsl(142, 71%, 45%)",
      borderRadius: 4,
      yAxisID: "y",
    },
    {
      label: "Score Satisfaction",
      data: mockChatbotInteractions.map((d) => d.satisfactionScore * 1000), // Scale for visibility
      backgroundColor: "hsl(48, 96%, 53%)",
      borderColor: "hsl(48, 96%, 53%)",
      borderRadius: 4,
      yAxisID: "y1",
    },
  ],
}

const conversionFunnelChartData = {
  labels: mockConversionFunnel.map((s) => s.stage),
  datasets: [
    {
      label: "Utilisateurs",
      data: mockConversionFunnel.map((s) => s.value),
      backgroundColor: [
        "hsl(142, 71%, 45%)",
        "hsl(173, 80%, 40%)",
        "hsl(48, 96%, 53%)",
        "hsl(25, 84%, 50%)",
        "hsl(221, 83%, 53%)",
      ],
      borderColor: HSL_BACKGROUND_POPOVER,
      borderWidth: 2,
    },
  ],
}

const clientROIChartData = {
  labels: mockClientROI.map((c) => c.clientType),
  datasets: [
    {
      label: "ROI Moyen (%)",
      data: mockClientROI.map((c) => c.avgROI),
      backgroundColor: "hsl(173, 80%, 40%)",
      borderColor: "hsl(173, 80%, 40%)",
      borderRadius: 4,
      barThickness: 25,
    },
  ],
}

const popularSearchesChartData = {
  labels: mockPopularSearches.map((s) => s.term),
  datasets: [
    {
      label: "Recherches",
      data: mockPopularSearches.map((s) => s.frequency),
      backgroundColor: "hsl(25, 84%, 50%)",
      borderColor: "hsl(25, 84%, 50%)",
      borderRadius: 4,
      barThickness: 20,
    },
    {
      label: "Conversions",
      data: mockPopularSearches.map((s) => s.conversions),
      backgroundColor: "hsl(142, 71%, 45%)",
      borderColor: "hsl(142, 71%, 45%)",
      borderRadius: 4,
      barThickness: 20,
    },
  ],
}

const topProductsChartData = {
  labels: mockTopProducts.map((p) => p.name),
  datasets: [
    {
      label: "Unités Vendues",
      data: mockTopProducts.map((p) => p.unitsSold),
      backgroundColor: "hsl(262, 83%, 58%)",
      borderColor: "hsl(262, 83%, 58%)",
      borderRadius: 4,
      barThickness: 25,
    },
  ],
}

const topSearchedProductsChartData = {
  labels: mockTopSearchedProducts.map((p) => p.name),
  datasets: [
    {
      label: "Recherches",
      data: mockTopSearchedProducts.map((p) => p.searches),
      backgroundColor: "hsl(200, 95%, 50%)",
      borderColor: "hsl(200, 95%, 50%)",
      borderRadius: 4,
      barThickness: 25,
    },
    {
      label: "Clics",
      data: mockTopSearchedProducts.map((p) => p.clicks),
      backgroundColor: "hsl(160, 100%, 37%)",
      borderColor: "hsl(160, 100%, 37%)",
      borderRadius: 4,
      barThickness: 25,
    },
  ],
}

const activeSessionsChartData = {
  labels: mockActiveSessionsData.map((s) => s.timeSlot),
  datasets: [
    {
      label: "IPs Actives",
      data: mockActiveSessionsData.map((s) => s.activeIPs),
      backgroundColor: "hsl(280, 100%, 70%)",
      borderColor: "hsl(280, 100%, 70%)",
      borderRadius: 4,
      barThickness: 20,
    },
    {
      label: "Clients Uniques",
      data: mockActiveSessionsData.map((s) => s.uniqueClients),
      backgroundColor: "hsl(195, 100%, 50%)",
      borderColor: "hsl(195, 100%, 50%)",
      borderRadius: 4,
      barThickness: 20,
    },
  ],
}

// --- Chart Options ---
const commonChartOptions = (titleText: string, yLabelCallback?: (value: any) => string) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
      labels: {
        color: HSL_MUTED_FOREGROUND,
        font: { size: 12 },
      },
    },
    title: {
      display: false, // Using CardTitle instead
      text: titleText,
      color: HSL_FOREGROUND,
      font: { size: 16 },
    },
    tooltip: {
      backgroundColor: HSL_BACKGROUND_POPOVER,
      titleColor: HSL_FOREGROUND,
      bodyColor: HSL_FOREGROUND,
      borderColor: HSL_PRIMARY,
      borderWidth: 1,
      padding: 10,
      callbacks: {
        label: (context: any) => {
          let label = context.dataset.label || ""
          if (label) {
            label += ": "
          }
          if (context.parsed.y !== null && context.dataset.data) {
            label += new Intl.NumberFormat("fr-FR", {
              style: context.dataset.label?.includes("€") ? "currency" : undefined,
              currency: context.dataset.label?.includes("€") ? "EUR" : undefined,
            }).format(context.parsed.y)
          } else if (context.parsed !== null && context.dataset.data) {
            // For Pie chart
            label = `${context.label}: ${new Intl.NumberFormat("fr-FR").format(context.parsed)}`
          }
          return label
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: HSL_MUTED_FOREGROUND,
        font: { size: 12 },
      },
      border: {
        color: HSL_BORDER,
      },
    },
    y: {
      grid: {
        color: HSL_BORDER,
        borderDash: [3, 3],
      },
      ticks: {
        color: HSL_MUTED_FOREGROUND,
        font: { size: 12 },
        callback: yLabelCallback || ((value: any) => (typeof value === "number" ? value.toLocaleString() : value)),
      },
      border: {
        display: false,
      },
    },
  },
})

const horizontalBarChartOptions = (titleText: string) => ({
  ...commonChartOptions(titleText),
  indexAxis: "y" as const, // For horizontal bar chart
  scales: {
    x: {
      ...commonChartOptions(titleText).scales.x,
      grid: { color: HSL_BORDER, borderDash: [3, 3] },
      border: { display: false },
    },
    y: {
      ...commonChartOptions(titleText).scales.y,
      grid: { display: false },
      border: { color: HSL_BORDER },
    },
  },
})

const pieChartOptions = (titleText: string) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        color: HSL_MUTED_FOREGROUND,
        font: { size: 12 },
        padding: 20,
      },
    },
    title: {
      display: false,
      text: titleText,
      color: HSL_FOREGROUND,
      font: { size: 16 },
    },
    tooltip: {
      backgroundColor: HSL_BACKGROUND_POPOVER,
      titleColor: HSL_FOREGROUND,
      bodyColor: HSL_FOREGROUND,
      borderColor: HSL_PRIMARY,
      borderWidth: 1,
      padding: 10,
      callbacks: {
        label: (context: any) => {
          let label = context.label || ""
          if (label) {
            label += ": "
          }
          const value = context.parsed
          if (value !== null) {
            label += new Intl.NumberFormat("fr-FR").format(value)
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            label += ` (${percentage}%)`
          }
          return label
        },
      },
    },
    // datalabels: { // If using chartjs-plugin-datalabels
    //   color: HSL_FOREGROUND,
    //   formatter: (value: any, context: any) => {
    //     const percentage = ((value / context.chart.getDatasetMeta(0).total) * 100).toFixed(1) + '%';
    //     return percentage;
    //   },
    //   font: {
    //     weight: 'bold',
    //     size: 12,
    //   },
    // },
  },
})

export default function AnalyticsPage() {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
          Analytics - Services IA E-commerce
        </h1>
      </div>
 {/* Section des métriques clés */}
 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Conversion Global</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">8.9%</div>
            <p className="text-xs text-muted-foreground">+2.1% depuis le mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps de Réponse Moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">0.6s</div>
            <p className="text-xs text-muted-foreground">-0.3s d'amélioration</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction Moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">4.9/5</div>
            <p className="text-xs text-muted-foreground">+0.4 points ce trimestre</p>
          </CardContent>
        </Card>

                 <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Sessions Anonymes</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-primary">110</div>
             <p className="text-xs text-muted-foreground">+12 nouvelles ce mois</p>
           </CardContent>
         </Card>
       </div>

       {/* Métriques panier */}
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-primary">{mockCartMetrics.averageCartValue.toFixed(2)}€</div>
             <p className="text-xs text-muted-foreground">+8.5% depuis le mois dernier</p>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Paniers Abandonnés</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-primary">{mockCartMetrics.abandonedCarts}</div>
             <p className="text-xs text-muted-foreground">{mockCartMetrics.abandonmentRate}% du total</p>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Taux d'Abandon</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-primary">{mockCartMetrics.abandonmentRate}%</div>
             <p className="text-xs text-muted-foreground">-2.1% d'amélioration</p>
           </CardContent>
         </Card>

         <Card>
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Paniers Totaux</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold text-primary">{mockCartMetrics.totalCarts}</div>
             <p className="text-xs text-muted-foreground">+15% ce mois</p>
           </CardContent>
         </Card>
       </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Revenus par Service IA</CardTitle>
            <CardDescription>Performance financière de nos solutions d'intelligence artificielle.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <Bar
                data={aiServicesRevenueChartData}
                options={horizontalBarChartOptions("Revenus Services IA") as any}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interactions Chatbot</CardTitle>
            <CardDescription>Évolution mensuelle des interactions et satisfaction client.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <Bar
                data={chatbotInteractionsChartData}
                options={{
                  ...commonChartOptions("Interactions Chatbot"),
                  scales: {
                    ...commonChartOptions("Interactions Chatbot").scales,
                    y: {
                      ...commonChartOptions("Interactions Chatbot").scales.y,
                      type: "linear",
                      display: true,
                      position: "left",
                    },
                    y1: {
                      type: "linear",
                      display: true,
                      position: "right",
                      grid: { drawOnChartArea: false },
                      ticks: {
                        color: HSL_MUTED_FOREGROUND,
                        callback: (value: any) => `${(Number(value) / 1000).toFixed(1)}★`,
                      },
                    },
                  },
                } as any}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entonnoir de Conversion</CardTitle>
            <CardDescription>Parcours utilisateur du visiteur à la commande via nos IA.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="h-[300px] w-full max-w-xs">
              <Pie data={conversionFunnelChartData} options={pieChartOptions("Entonnoir de Conversion") as any} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ROI Clients par Segment</CardTitle>
            <CardDescription>Retour sur investissement moyen de nos services IA par type de client.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <Bar
                data={clientROIChartData}
                options={commonChartOptions("ROI Clients", (value) => `${value}%`) as any}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recherches Populaires & Conversions</CardTitle>
            <CardDescription>Les requêtes les plus fréquentes traitées par nos chatbots et leur taux de conversion.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <Bar
                data={popularSearchesChartData}
                options={
                  {
                    ...commonChartOptions("Recherches Populaires"),
                    scales: {
                      ...commonChartOptions("Recherches Populaires").scales,
                      x: {
                        ...commonChartOptions("Recherches Populaires").scales.x,
                        ticks: {
                          ...commonChartOptions("Recherches Populaires").scales.x?.ticks,
                          maxRotation: 45,
                          minRotation: 45,
                          autoSkip: false,
                          font: { size: 10 },
                        },
                      },
                    },
                  } as any
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sessions Actives par Heure</CardTitle>
            <CardDescription>Répartition des adresses IP actives et clients uniques par tranche horaire.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <Bar
                data={activeSessionsChartData}
                options={commonChartOptions("Sessions Actives") as any}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Top Produits */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 3 - Produits les Plus Vendus</CardTitle>
            <CardDescription>Classement des produits par nombre d'unités vendues ce mois.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <Bar
                data={topProductsChartData}
                options={commonChartOptions("Top Produits Vendus") as any}
              />
            </div>
            <div className="mt-4 space-y-2">
              {mockTopProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium">{product.name}</span>
                    <span className="text-muted-foreground">({product.category})</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{product.unitsSold} unités</div>
                    <div className="text-xs text-muted-foreground">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(product.revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 3 - Produits les Plus Recherchés</CardTitle>
            <CardDescription>Produits avec le plus d'interactions via nos chatbots IA.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <Bar
                data={topSearchedProductsChartData}
                options={commonChartOptions("Top Produits Recherchés") as any}
              />
            </div>
            <div className="mt-4 space-y-2">
              {mockTopSearchedProducts.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{product.searches} recherches</div>
                    <div className="text-xs text-muted-foreground">
                      {product.clicks} clics • {product.conversionRate}% conversion
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Clients Anonymes */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sessions Clients Anonymes</CardTitle>
            <CardDescription>Identification des clients par ID anonyme et adresse IP uniquement (aucune donnée personnelle).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium">ID Client Anonyme</th>
                    <th className="text-left py-2 px-3 font-medium">Adresse IP</th>
                    <th className="text-left py-2 px-3 font-medium">Durée Session (min)</th>
                    <th className="text-left py-2 px-3 font-medium">Interactions IA</th>
                    <th className="text-left py-2 px-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {mockAnonymousClients.map((client) => (
                    <tr key={client.clientId} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 px-3">
                        <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                          {client.clientId}
                        </code>
                      </td>
                      <td className="py-2 px-3">
                        <code className="text-muted-foreground font-mono text-xs">
                          {client.ipAddress}
                        </code>
                      </td>
                      <td className="py-2 px-3">{client.sessionDuration}</td>
                      <td className="py-2 px-3">{client.interactions}</td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              <p>Format ID: [PREFIX]_[SHOP_ID]_[12_DIGITS_RANDOM]</p>
              <p>• EC = E-commerce Standard • SM = Small/Medium • LG = Large Enterprise • MP = Marketplace</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
