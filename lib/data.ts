// @ts-nocheck
/**
 * DONNÉES MOCKÉES ANONYMISÉES
 * 
 * POLITIQUE DE CONFIDENTIALITÉ:
 * - Remplacement de tous les noms/prénoms par des IDs anonymes [PREFIX]_[SHOP_ID]_[12_DIGITS_RANDOM]
 * - Remplacement de tous les emails par des adresses IP
 * - Suppression de toutes les adresses postales, numéros de téléphone
 * - Anonymisation de toutes les informations personnelles identifiables
 */
import type {
  Product,
  Order,
  StockItem,
  StockMovement,
  SupportTicket,
  SupplierDelivery,
  CustomerDelivery,
  SalesByCategory,
  TopSellingProduct,
  OrderStatusDistribution,
  StockEvolution,
  SupportTicketByType,
} from "./types"

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "T-Shirt Élégance Noire",
    thumbnailUrl: "/placeholder.svg?height=64&width=64",
    stock: 150,
    price: 49.99,
    category: "Hauts",
    gender: "Homme",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Noir", "Blanc"],
    status: "Actif",
    description:
      "Un t-shirt noir classique et élégant, parfait pour toutes les occasions. Fabriqué en coton de haute qualité.",
    images: ["/placeholder.svg?height=400&width=300", "/placeholder.svg?height=400&width=300"],
  },
  {
    id: "2",
    name: "Robe Soirée Rose Poudré",
    thumbnailUrl: "/placeholder.svg?height=64&width=64",
    stock: 75,
    price: 129.99,
    category: "Robes",
    gender: "Femme",
    sizes: ["XS", "S", "M"],
    colors: ["Rose Poudré"],
    status: "Actif",
  },
  {
    id: "3",
    name: "Jean Slim Bleu Nuit",
    thumbnailUrl: "/placeholder.svg?height=64&width=64",
    stock: 200,
    price: 89.9,
    category: "Pantalons",
    gender: "Unisexe",
    sizes: ["28", "30", "32", "34"],
    colors: ["Bleu Nuit"],
    status: "Actif",
  },
  {
    id: "4",
    name: "Veste Cuir Urbaine",
    thumbnailUrl: "/placeholder.svg?height=64&width=64",
    stock: 0,
    price: 249.0,
    category: "Vestes",
    gender: "Homme",
    sizes: ["M", "L", "XL"],
    colors: ["Noir"],
    status: "Rupture de stock",
  },
  {
    id: "5",
    name: "Chemisier Soie Ivoire",
    thumbnailUrl: "/placeholder.svg?height=64&width=64",
    stock: 60,
    price: 99.5,
    category: "Hauts",
    gender: "Femme",
    sizes: ["S", "M", "L"],
    colors: ["Ivoire", "Noir"],
    status: "Actif",
  },
  {
    id: "6",
    name: "Sneakers Minimalistes Blanches",
    thumbnailUrl: "/placeholder.svg?height=64&width=64",
    stock: 120,
    price: 119.0,
    category: "Chaussures",
    gender: "Unisexe",
    sizes: ["39", "40", "41", "42", "43"],
    colors: ["Blanc"],
    status: "Actif",
  },
]

export const mockOrders: Order[] = [
  {
    id: "ORD001",
    customerName: "EC_001_847293651084",
    customerEmail: "192.168.1.45",
    date: "2024-05-15",
    status: "Livrée",
    totalAmount: 179.98,
    itemsCount: 2,
    shippingAddress: "Zone livraison anonymisée",
    billingAddress: "Zone facturation anonymisée",
    notes: "Session VIP, options spéciales demandées.",
  },
  {
    id: "ORD002",
    customerName: "SM_002_593847261739",
    customerEmail: "10.0.0.156",
    date: "2024-05-16",
    status: "En préparation",
    totalAmount: 89.9,
    itemsCount: 1,
  },
  {
    id: "ORD003",
    customerName: "LG_003_847592638471",
    customerEmail: "172.16.0.89",
    date: "2024-05-16",
    status: "Expédiée",
    totalAmount: 249.0,
    itemsCount: 1,
  },
  {
    id: "ORD004",
    customerName: "EC_004_739485762938",
    customerEmail: "203.0.113.42",
    date: "2024-05-17",
    status: "Payée",
    totalAmount: 49.99,
    itemsCount: 1,
  },
  {
    id: "ORD005",
    customerName: "MP_005_584729374658",
    customerEmail: "198.51.100.73",
    date: "2024-05-18",
    status: "Annulée",
    totalAmount: 129.99,
    itemsCount: 1,
  },
]

export const mockStockItems: StockItem[] = [
  {
    id: "SI001",
    productId: "1",
    productName: "T-Shirt Élégance Noire",
    thumbnailUrl: "/placeholder.svg?height=40&width=40",
    location: "Entrepôt Principal",
    quantity: 120,
    reorderThreshold: 30,
    lastMovementDate: "2024-06-15",
  },
  {
    id: "SI002",
    productId: "2",
    productName: "Robe Soirée Rose Poudré",
    thumbnailUrl: "/placeholder.svg?height=40&width=40",
    location: "Boutique Paris",
    quantity: 25,
    reorderThreshold: 10,
    lastMovementDate: "2024-06-10",
  },
  {
    id: "SI003",
    productId: "3",
    productName: "Jean Slim Bleu Nuit",
    thumbnailUrl: "/placeholder.svg?height=40&width=40",
    location: "Entrepôt Principal",
    quantity: 180,
    reorderThreshold: 50,
    lastMovementDate: "2024-06-16",
  },
  {
    id: "SI004",
    productId: "4",
    productName: "Veste Cuir Urbaine",
    thumbnailUrl: "/placeholder.svg?height=40&width=40",
    location: "Stock Tampon",
    quantity: 5, // Low stock
    reorderThreshold: 15,
    lastMovementDate: "2024-05-20",
  },
]

export const mockStockMovements: StockMovement[] = [
  {
    id: "SM001",
    stockItemId: "SI001",
    productName: "T-Shirt Élégance Noire",
    type: "Entrée",
    quantityChanged: 50,
    reason: "Réception fournisseur Alpha",
    date: "2024-06-15",
    user: "Admin",
  },
  {
    id: "SM002",
    stockItemId: "SI002",
    productName: "Robe Soirée Rose Poudré",
    type: "Sortie",
    quantityChanged: -5,
    reason: "Vente boutique #B0123",
    date: "2024-06-10",
    user: "Vendeur Paris",
  },
  {
    id: "SM003",
    stockItemId: "SI003",
    productName: "Jean Slim Bleu Nuit",
    type: "Ajustement",
    quantityChanged: -2,
    reason: "Inventaire - Perte",
    date: "2024-06-16",
    user: "Admin",
  },
]

export const mockSupportTickets: SupportTicket[] = [
  {
    id: "TIC001",
    orderId: "ORD001",
    customerName: "EC_001_847293651084",
    customerEmail: "192.168.1.45",
    subject: "Article défectueux à la livraison",
    status: "Ouvert",
    priority: "Haute",
    creationDate: "2024-06-14",
    lastUpdate: "2024-06-15",
    assignedTo: "Service Client",
    description:
      "La session a reçu le t-shirt avec une couture défaite sur la manche. Photo jointe via interface. Demande un échange.",
    attachments: ["/placeholder.svg?height=100&width=150"],
    resolution: "Nouveau t-shirt envoyé le 16/06. Ancien article à retourner avec étiquette prépayée.",
  },
  {
    id: "TIC002",
    customerName: "SM_002_593847261739",
    customerEmail: "10.0.0.156",
    subject: "Question sur la taille d'un produit",
    status: "En cours",
    priority: "Moyenne",
    creationDate: "2024-06-15",
    lastUpdate: "2024-06-16",
    assignedTo: "Support N1",
  },
  {
    id: "TIC003",
    orderId: "ORD005",
    customerName: "MP_005_584729374658",
    customerEmail: "198.51.100.73",
    subject: "Demande de remboursement commande annulée",
    status: "Résolu",
    priority: "Basse",
    creationDate: "2024-06-10",
    lastUpdate: "2024-06-12",
  },
]

export const mockSupplierDeliveries: SupplierDelivery[] = [
  {
    id: "SD001",
    supplierName: "Fournisseur Alpha",
    purchaseOrderId: "PO2024-050",
    expectedDate: "2024-06-20",
    status: "En transit",
    itemCount: 250,
    trackingNumber: "TRKFSUP001XYZ",
    notes: "Palette #3 contient les articles fragiles.",
    items: [
      { productId: "1", productName: "T-Shirt Élégance Noire", quantity: 100, unitPrice: 25.0 },
      { productId: "3", productName: "Jean Slim Bleu Nuit", quantity: 150, unitPrice: 45.0 },
    ],
  },
  {
    id: "SD002",
    supplierName: "Atelier Création Mode",
    purchaseOrderId: "PO2024-051",
    expectedDate: "2024-06-18",
    status: "Arrivée (à vérifier)",
    itemCount: 80,
  },
]

export const mockCustomerDeliveries: CustomerDelivery[] = [
  {
    id: "CD001",
    orderId: "ORD003",
    customerName: "LG_003_847592638471",
    shippingDate: "2024-05-17",
    carrier: "Colissimo",
    trackingNumber: "6C12345678901",
    status: "En transit",
    estimatedDeliveryDate: "2024-05-19",
    items: [{ productId: "4", productName: "Veste Cuir Urbaine", quantity: 1 }],
    deliveryNotes: "Instructions de livraison anonymisées.",
  },
  {
    id: "CD002",
    orderId: "ORD001",
    customerName: "EC_001_847293651084",
    shippingDate: "2024-05-16",
    carrier: "Chronopost",
    trackingNumber: "XY987654321FR",
    status: "Livrée",
    estimatedDeliveryDate: "2024-05-17",
  },
]

// --- Données pour Statistiques Améliorées ---
export const mockSalesByCategory: SalesByCategory[] = [
  { category: "Hauts", sales: 45000 },
  { category: "Robes", sales: 75000 },
  { category: "Pantalons", sales: 60000 },
  { category: "Vestes", sales: 30000 },
  { category: "Chaussures", sales: 50000 },
  { category: "Accessoires", sales: 25000 },
]

export const mockTopSellingProducts: TopSellingProduct[] = [
  { name: "Robe Soirée Rose Poudré", unitsSold: 120 },
  { name: "Jean Slim Bleu Nuit", unitsSold: 95 },
  { name: "T-Shirt Élégance Noire", unitsSold: 80 },
  { name: "Sneakers Minimalistes Blanches", unitsSold: 70 },
  { name: "Chemisier Soie Ivoire", unitsSold: 60 },
]

export const mockOrderStatusDistribution: OrderStatusDistribution[] = [
  { status: "Payée", count: 25 },
  { status: "En préparation", count: 15 },
  { status: "Expédiée", count: 40 },
  { status: "Livrée", count: 150 },
  { status: "Annulée", count: 10 },
]

export const mockStockEvolution: StockEvolution[] = [
  { date: "2024-01-01", totalStockValue: 120000 },
  { date: "2024-02-01", totalStockValue: 115000 },
  { date: "2024-03-01", totalStockValue: 130000 },
  { date: "2024-04-01", totalStockValue: 125000 },
  { date: "2024-05-01", totalStockValue: 140000 },
  { date: "2024-06-01", totalStockValue: 135000 },
]

export const mockSupportTicketsByType: SupportTicketByType[] = [
  { type: "Article défectueux", count: 15 },
  { type: "Retard de livraison", count: 8 },
  { type: "Erreur de taille/couleur", count: 12 },
  { type: "Demande de remboursement", count: 20 },
  { type: "Question produit", count: 5 },
]

// Données de tickets techniques IA pour le back office
export const mockIATickets = [
  {
    id: "IA-001",
    chatbotId: "1",
    title: "Temps de réponse anormalement élevé",
    category: "Performance" as const,
    status: "Ouvert" as const,
    priority: "Haute" as const,
    lastUpdate: "2024-01-20",
    creationDate: "2024-01-20",
    assignedTo: "Équipe Technique",
    description: "Le chatbot met plus de 10 secondes à répondre aux requêtes depuis ce matin. Impact sur l'expérience utilisateur.",
    stepsToReproduce: "1. Ouvrir le chatbot\n2. Poser n'importe quelle question\n3. Observer le délai de réponse",
    expectedBehavior: "Réponse en moins de 2 secondes",
    actualBehavior: "Réponse en 10-15 secondes",
    environment: "Production - Version 2.3.1",
    impactedUsers: 450,
    technicalNotes: ["Pic de charge observé à 10h30", "Logs montrent timeout base de données"],
    errorCode: "TIMEOUT_DB_001"
  },
  {
    id: "IA-002", 
    chatbotId: "2",
    title: "Réponses incorrectes sur les politiques de retour",
    category: "Erreur Réponse" as const,
    status: "En cours" as const,
    priority: "Moyenne" as const,
    lastUpdate: "2024-01-19",
    creationDate: "2024-01-18",
    assignedTo: "Équipe IA",
    description: "Le chatbot donne des informations erronées concernant les délais de retour (dit 14 jours au lieu de 30).",
    stepsToReproduce: "1. Demander 'Quel est votre politique de retour ?'\n2. Vérifier la réponse donnée",
    expectedBehavior: "Indiquer 30 jours pour les retours",
    actualBehavior: "Indique 14 jours",
    environment: "Production - Chatbot Principal",
    impactedUsers: 120,
    technicalNotes: ["Base de connaissances mise à jour le 15/01", "Problème de synchronisation détecté"],
    resolution: "Mise à jour de la base de connaissances et resynchronisation effectuée"
  },
  {
    id: "IA-003",
    chatbotId: "1", 
    title: "Widget ne s'affiche pas sur mobile",
    category: "Bug Technique" as const,
    status: "Résolu" as const,
    priority: "Critique" as const,
    lastUpdate: "2024-01-17",
    creationDate: "2024-01-15",
    assignedTo: "Développement Frontend",
    description: "Le widget de chat n'apparaît pas sur les appareils mobiles iOS Safari depuis la dernière mise à jour.",
    stepsToReproduce: "1. Ouvrir le site sur iPhone Safari\n2. Chercher le widget de chat\n3. Constater qu'il n'apparaît pas",
    expectedBehavior: "Widget visible et fonctionnel sur mobile",
    actualBehavior: "Widget invisible sur iOS Safari",
    environment: "Production - iOS Safari 16+",
    impactedUsers: 800,
    technicalNotes: ["Problème CSS viewport", "Conflit avec nouvelle version Safari"],
    resolution: "Correction du CSS et test de compatibilité mobile effectué"
  },
  {
    id: "IA-004",
    chatbotId: "3",
    title: "Intégration Shopify défaillante",
    category: "Intégration" as const, 
    status: "En attente" as const,
    priority: "Haute" as const,
    lastUpdate: "2024-01-19",
    creationDate: "2024-01-19",
    assignedTo: "Équipe Intégrations",
    description: "L'API Shopify retourne des erreurs 500 lors de la récupération des informations produits.",
    stepsToReproduce: "1. Configurer intégration Shopify\n2. Demander infos sur un produit\n3. Observer l'erreur",
    expectedBehavior: "Récupération des données produit",
    actualBehavior: "Erreur 500 API Shopify",
    environment: "Production - API Shopify v2024-01",
    impactedUsers: 200,
    errorCode: "SHOPIFY_API_500"
  },
  {
    id: "IA-005",
    title: "Demande d'amélioration : Support multilingue",
    category: "Amélioration" as const,
    status: "Ouvert" as const, 
    priority: "Basse" as const,
    lastUpdate: "2024-01-18",
    creationDate: "2024-01-18",
    assignedTo: "Product Manager",
    description: "Demande client pour ajouter le support de l'espagnol et de l'italien aux chatbots existants.",
    expectedBehavior: "Chatbot capable de répondre en ES et IT",
    actualBehavior: "Chatbot uniquement en français",
    environment: "Fonctionnalité à développer",
    technicalNotes: ["Évaluation faisabilité en cours", "Budget à définir"]
  }
]

// Données de chat anonymisées - utiliser les conversations anonymes à la place