"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Palette,
  Settings,
  MessageSquare,
  Eye,
  Code,
  Download,
  Copy,
  RefreshCw,
  Sparkles,
  Volume2,
  Layout,
  Zap,
  Type,
  Image as ImageIcon,
} from "lucide-react"
import { toast } from "sonner"

// Interface pour la configuration complète du chatbot-generator.js
interface ChatbotGeneratorConfig {
  chatbotId: string
  title: string
  subtitle: string
  apiEndpoint: string
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  primaryColor: string
  secondaryColor: string
  accentColor: string
  textColor: string
  backgroundColor: string
  borderRadius: string
  size: 'compact' | 'standard' | 'large'
  showTypingIndicator: boolean
  enableSound: boolean
  autoOpen: boolean
  autoOpenDelay: number
  welcomeMessage: string
  placeholder: string
  personality: {
    tone: string
    formality: string
    verbosity: string
    empathy: string
    proactivity: string
  }
  fontFamily: string
  fontSize: number
  buttonSize: number
  borderWidth: number
  borderColor: string
  headerBackgroundColor?: string
  headerTextColor?: string
  headerPadding?: number
  headerTitleFontSize?: number
  avatarType?: 'image' | 'none'
  avatarValue?: string
  buttonBackgroundColor?: string
  buttonIconColor?: string
  closeButtonColor?: string
  shadowEffect: 'none' | 'light' | 'medium' | 'strong' | 'neumorphic'
  animationStyle: string
  customIcon: string | null
  attentionText: {
    enabled: boolean
    messages: string[]
    color: string
    backgroundColor: string
    animation: string
    duration: number
    delay: number
    repeatInterval: number
    particleEffect: boolean
    trailEffect: boolean
    orbitRadius: number
    orbitSpeed: number
    orbitDirection: 'clockwise' | 'counter-clockwise'
    curveIntensity: number
  }
  theme: 'light' | 'dark' | 'auto'
  quickReplies: string[]
}

const DEFAULT_CONFIG: ChatbotGeneratorConfig = {
  chatbotId: 'wikzy-premium',
  title: 'Assistant Wikzy',
  subtitle: 'Votre styliste personnel, toujours à vos côtés',
  apiEndpoint: 'http://localhost:3000/api/ai/master',
  position: 'bottom-right',
  primaryColor: '#ff6f61',
  secondaryColor: '#ffdd5b',
  accentColor: '#ffdd5b',
  textColor: '#1F2937',
  backgroundColor: '#FFFFFF',
  borderRadius: '24px',
  size: 'standard',
  showTypingIndicator: true,
  enableSound: true,
  autoOpen: false,
  autoOpenDelay: 2000,
  welcomeMessage: '✨ Bonjour ! Je suis Wikzy, votre styliste personnel. Prêt à trouver le look parfait ? Essayez "robes", "chaussures" ou "nouveau style" !',
  placeholder: 'Ex: Robe rouge, taille M...',
  personality: {
    tone: 'Amical',
    formality: 'Tutoiement',
    verbosity: 'Détaillé',
    empathy: 'Élevée',
    proactivity: 'Proactif'
  },
  fontFamily: '"Poppins", sans-serif',
  fontSize: 15,
  buttonSize: 72,
  borderWidth: 0,
  borderColor: 'transparent',
  headerBackgroundColor: 'linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)',
  headerTextColor: '#FFFFFF',
  headerPadding: 18,
  headerTitleFontSize: 19,
  avatarType: 'image',
  avatarValue: 'http://localhost:3000/styli.png',
  buttonBackgroundColor: 'linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)',
  buttonIconColor: '#FFFFFF',
  closeButtonColor: '#FFFFFF',
  shadowEffect: 'medium',
  animationStyle: 'gradient-pulse',
  customIcon: null,
  attentionText: {
    enabled: false,
    messages: [
      'Trouvez votre style !',
      'Besoin d\'aide ? 💬',
      'Découvrez nos tendances ✨',
      'Parlons mode ! 👗',
      'Une question ? 🤔'
    ],
    color: '#FFFFFF',
    backgroundColor: 'linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)',
    animation: 'bounce',
    duration: 3000,
    delay: 3000,
    repeatInterval: 8000,
    particleEffect: false,
    trailEffect: false,
    orbitRadius: 60,
    orbitSpeed: 5,
    orbitDirection: 'clockwise',
    curveIntensity: 0
  },
  theme: 'dark',
  quickReplies: ["Je voudrais une robe blanche d'été en L", 'Propose moi des bottines marrons en 44']
}

const AVATAR_COLLECTIONS = [
  {
    name: 'Styli',
    avatars: [
      '/styli.png',
      '/styli2.png',
      '/styli3.png',
      '/styli3 (2).png',
      '/styli5.png'
    ]
  },
  {
    name: 'Beauty',
    avatars: [
      '/beauty0.png',
      '/beauty1.png',
      '/beauty2.png'
    ]
  },
  {
    name: 'Streety',
    avatars: [
      '/streety.png',
      '/streety1.png',
      '/streety2.png',
      '/streety3.png'
    ]
  },
  {
    name: 'Tech',
    avatars: [
      '/Tech.png',
      '/Tech1.png',
      '/Tech2.png',
      '/Tech3.png',
      '/Tech4.png'
    ]
  }
]

const PRESET_THEMES = [
  {
    id: 'wikzy-classic',
    name: 'Wikzy Original',
    config: {
      primaryColor: '#ffdd5b',
      secondaryColor: '#ffd700',
      accentColor: '#D97706',
      textColor: '#1F2937',
      backgroundColor: '#FFFFFF',
      borderRadius: '24px',
      borderColor: 'transparent',
      borderWidth: 0,
      fontFamily: '"Inter", sans-serif',
      fontSize: 15,
      headerBackgroundColor: '#ffdd5b',
      headerTextColor: '#1F2937',
      headerPadding: 18,
      headerTitleFontSize: 19,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#ffdd5b',
      buttonIconColor: '#1F2937',
      closeButtonColor: '#1F2937',
      shadowEffect: 'medium'
    }
  },
  {
    id: 'wikzy-sunset',
    name: 'Wikzy Sunset',
    config: {
      primaryColor: '#ff6f61',
      secondaryColor: '#ffdd5b',
      accentColor: '#ffdd5b',
      textColor: '#1F2937',
      backgroundColor: '#FFFFFF',
      borderRadius: '24px',
      borderColor: 'transparent',
      borderWidth: 0,
      fontFamily: '"Poppins", sans-serif',
      fontSize: 15,
      headerBackgroundColor: 'linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)',
      headerTextColor: '#FFFFFF',
      headerPadding: 18,
      headerTitleFontSize: 19,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: 'linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)',
      buttonIconColor: '#FFFFFF',
      closeButtonColor: '#FFFFFF',
      shadowEffect: 'medium'
    }
  },
  {
    id: 'midnight-premium',
    name: 'Midnight Premium',
    config: {
      primaryColor: '#6366F1',
      secondaryColor: '#4F46E5',
      accentColor: '#818CF8',
      textColor: '#FFFFFF',
      backgroundColor: '#111827',
      borderRadius: '12px',
      borderColor: '#312E81',
      borderWidth: 2,
      fontFamily: '"Inter", sans-serif',
      fontSize: 14,
      headerBackgroundColor: '#1E1B4B',
      headerTextColor: '#FFFFFF',
      headerPadding: 16,
      headerTitleFontSize: 18,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#6366F1',
      buttonIconColor: '#FFFFFF',
      closeButtonColor: '#FFFFFF',
      shadowEffect: 'strong'
    }
  },
  {
    id: 'luxury-rose',
    name: 'Luxury Rose',
    config: {
      primaryColor: '#E11D48',
      secondaryColor: '#FB7185',
      accentColor: '#F43F5E',
      textColor: '#4C0519',
      backgroundColor: '#FFF1F2',
      borderRadius: '20px',
      borderColor: '#FDA4AF',
      borderWidth: 1,
      fontFamily: '"Montserrat", sans-serif',
      fontSize: 15,
      headerBackgroundColor: 'linear-gradient(135deg, #E11D48 0%, #FB7185 100%)',
      headerTextColor: '#FFFFFF',
      headerPadding: 20,
      headerTitleFontSize: 20,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#E11D48',
      buttonIconColor: '#FFFFFF',
      closeButtonColor: '#FFFFFF',
      shadowEffect: 'medium'
    }
  },
  {
    id: 'forest-eco',
    name: 'Forest Eco',
    config: {
      primaryColor: '#10B981',
      secondaryColor: '#059669',
      accentColor: '#34D399',
      textColor: '#064E3B',
      backgroundColor: '#F0FDF4',
      borderRadius: '8px',
      borderColor: '#059669',
      borderWidth: 1,
      fontFamily: '"Poppins", sans-serif',
      fontSize: 15,
      headerBackgroundColor: '#059669',
      headerTextColor: '#FFFFFF',
      headerPadding: 18,
      headerTitleFontSize: 19,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#10B981',
      buttonIconColor: '#FFFFFF',
      closeButtonColor: '#FFFFFF',
      shadowEffect: 'medium'
    }
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    config: {
      primaryColor: '#00FF41',
      secondaryColor: '#0D0208',
      accentColor: '#008F11',
      textColor: '#00FF41',
      backgroundColor: '#0D0208',
      borderRadius: '0px',
      borderColor: '#00FF41',
      borderWidth: 2,
      fontFamily: '"Inter", sans-serif',
      fontSize: 14,
      headerBackgroundColor: '#000000',
      headerTextColor: '#00FF41',
      headerPadding: 14,
      headerTitleFontSize: 17,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#000000',
      buttonIconColor: '#00FF41',
      closeButtonColor: '#00FF41',
      shadowEffect: 'none'
    }
  },
  {
    id: 'sunset-ocean',
    name: 'Sunset Ocean',
    config: {
      primaryColor: '#FF6B6B',
      secondaryColor: '#4ECDC4',
      accentColor: '#FFE66D',
      textColor: '#2F2E41',
      backgroundColor: '#F7FFF7',
      borderRadius: '30px',
      borderColor: 'transparent',
      borderWidth: 0,
      fontFamily: '"Poppins", sans-serif',
      fontSize: 15,
      headerBackgroundColor: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
      headerTextColor: '#FFFFFF',
      headerPadding: 22,
      headerTitleFontSize: 20,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#FF6B6B',
      buttonIconColor: '#FFFFFF',
      closeButtonColor: '#FFFFFF',
      shadowEffect: 'medium'
    }
  },
  {
    id: 'lavender-soft',
    name: 'Lavender Soft',
    config: {
      primaryColor: '#A78BFA',
      secondaryColor: '#C4B5FD',
      accentColor: '#DDD6FE',
      textColor: '#4C1D95',
      backgroundColor: '#F5F3FF',
      borderRadius: '16px',
      borderColor: '#DDD6FE',
      borderWidth: 1,
      fontFamily: '"Inter", sans-serif',
      fontSize: 14,
      headerBackgroundColor: '#8B5CF6',
      headerTextColor: '#FFFFFF',
      headerPadding: 16,
      headerTitleFontSize: 18,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#A78BFA',
      buttonIconColor: '#FFFFFF',
      closeButtonColor: '#FFFFFF',
      shadowEffect: 'light'
    }
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    config: {
      primaryColor: '#0F172A',
      secondaryColor: '#1E293B',
      accentColor: '#38BDF8',
      textColor: '#F1F5F9',
      backgroundColor: '#020617',
      borderRadius: '8px',
      borderColor: '#1E293B',
      borderWidth: 1,
      fontFamily: '"Montserrat", sans-serif',
      fontSize: 13,
      headerBackgroundColor: 'linear-gradient(180deg, #0F172A 0%, #020617 100%)',
      headerTextColor: '#38BDF8',
      headerPadding: 12,
      headerTitleFontSize: 16,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#0F172A',
      buttonIconColor: '#38BDF8',
      closeButtonColor: '#38BDF8',
      shadowEffect: 'strong'
    }
  },
  {
    id: 'emerald-forest',
    name: 'Emerald Forest',
    config: {
      primaryColor: '#064E3B',
      secondaryColor: '#065F46',
      accentColor: '#10B981',
      textColor: '#ECFDF5',
      backgroundColor: '#022C22',
      borderRadius: '12px',
      borderColor: '#065F46',
      borderWidth: 1,
      fontFamily: '"Montserrat", sans-serif',
      fontSize: 14,
      headerBackgroundColor: '#064E3B',
      headerTextColor: '#10B981',
      headerPadding: 16,
      headerTitleFontSize: 18,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#064E3B',
      buttonIconColor: '#10B981',
      closeButtonColor: '#10B981',
      shadowEffect: 'medium'
    }
  },
  {
    id: 'royal-gold',
    name: 'Royal Gold',
    config: {
      primaryColor: '#78350F',
      secondaryColor: '#92400E',
      accentColor: '#F59E0B',
      textColor: '#FEF3C7',
      backgroundColor: '#451A03',
      borderRadius: '20px',
      borderColor: '#92400E',
      borderWidth: 1,
      fontFamily: '"Montserrat", sans-serif',
      fontSize: 15,
      headerBackgroundColor: 'linear-gradient(135deg, #78350F 0%, #451A03 100%)',
      headerTextColor: '#F59E0B',
      headerPadding: 20,
      headerTitleFontSize: 20,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#78350F',
      buttonIconColor: '#F59E0B',
      closeButtonColor: '#F59E0B',
      shadowEffect: 'strong'
    }
  },
  {
    id: 'arctic-ice',
    name: 'Arctic Ice',
    config: {
      primaryColor: '#F0F9FF',
      secondaryColor: '#BAE6FD',
      accentColor: '#0EA5E9',
      textColor: '#0C4A6E',
      backgroundColor: 'rgba(240, 249, 255, 0.8)',
      borderRadius: '16px',
      borderColor: '#7DD3FC',
      borderWidth: 1,
      fontFamily: '"Inter", sans-serif',
      fontSize: 14,
      headerBackgroundColor: '#BAE6FD',
      headerTextColor: '#0C4A6E',
      headerPadding: 16,
      headerTitleFontSize: 18,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#0EA5E9',
      buttonIconColor: '#FFFFFF',
      closeButtonColor: '#0C4A6E',
      shadowEffect: 'light'
    }
  },
  {
    id: 'midnight-rose',
    name: 'Midnight Rose',
    config: {
      primaryColor: '#831843',
      secondaryColor: '#9D174D',
      accentColor: '#F472B6',
      textColor: '#FDF2F8',
      backgroundColor: '#500724',
      borderRadius: '24px',
      borderColor: '#9D174D',
      borderWidth: 1,
      fontFamily: '"Montserrat", sans-serif',
      fontSize: 14,
      headerBackgroundColor: 'linear-gradient(135deg, #831843 0%, #500724 100%)',
      headerTextColor: '#F472B6',
      headerPadding: 18,
      headerTitleFontSize: 19,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#831843',
      buttonIconColor: '#F472B6',
      closeButtonColor: '#F472B6',
      shadowEffect: 'strong'
    }
  },
  {
    id: 'desert-sand',
    name: 'Desert Sand',
    config: {
      primaryColor: '#D97706',
      secondaryColor: '#B45309',
      accentColor: '#FBBF24',
      textColor: '#451A03',
      backgroundColor: '#FFFBEB',
      borderRadius: '12px',
      borderColor: '#FDE68A',
      borderWidth: 1,
      fontFamily: '"Poppins", sans-serif',
      fontSize: 15,
      headerBackgroundColor: '#D97706',
      headerTextColor: '#FFFFFF',
      headerPadding: 18,
      headerTitleFontSize: 19,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#D97706',
      buttonIconColor: '#FFFFFF',
      closeButtonColor: '#FFFFFF',
      shadowEffect: 'medium'
    }
  },
  {
    id: 'slate-pro',
    name: 'Slate Pro',
    config: {
      primaryColor: '#334155',
      secondaryColor: '#475569',
      accentColor: '#94A3B8',
      textColor: '#F8FAFC',
      backgroundColor: '#1E293B',
      borderRadius: '8px',
      borderColor: '#475569',
      borderWidth: 1,
      fontFamily: '"Inter", sans-serif',
      fontSize: 14,
      headerBackgroundColor: '#0F172A',
      headerTextColor: '#F8FAFC',
      headerPadding: 14,
      headerTitleFontSize: 17,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#334155',
      buttonIconColor: '#F8FAFC',
      closeButtonColor: '#F8FAFC',
      shadowEffect: 'strong'
    }
  },
  {
    id: 'mint-white',
    name: 'Mint White',
    config: {
      primaryColor: '#059669',
      secondaryColor: '#10B981',
      accentColor: '#34D399',
      textColor: '#064E3B',
      backgroundColor: '#FFFFFF',
      borderRadius: '20px',
      borderColor: '#D1FAE5',
      borderWidth: 1,
      fontFamily: '"Inter", sans-serif',
      fontSize: 14,
      headerBackgroundColor: '#ECFDF5',
      headerTextColor: '#059669',
      headerPadding: 16,
      headerTitleFontSize: 18,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#059669',
      buttonIconColor: '#FFFFFF',
      closeButtonColor: '#059669',
      shadowEffect: 'medium'
    }
  },
  {
    id: 'neon-blue',
    name: 'Neon Blue',
    config: {
      primaryColor: '#2563EB',
      secondaryColor: '#1D4ED8',
      accentColor: '#60A5FA',
      textColor: '#EFF6FF',
      backgroundColor: '#1E3A8A',
      borderRadius: '4px',
      borderColor: '#ff6f61',
      borderWidth: 2,
      fontFamily: '"Inter", sans-serif',
      fontSize: 14,
      headerBackgroundColor: '#172554',
      headerTextColor: '#60A5FA',
      headerPadding: 14,
      headerTitleFontSize: 17,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#2563EB',
      buttonIconColor: '#FFFFFF',
      closeButtonColor: '#60A5FA',
      shadowEffect: 'none'
    }
  },
  {
    id: 'soft-sakura',
    name: 'Soft Sakura',
    config: {
      primaryColor: '#DB2777',
      secondaryColor: '#BE185D',
      accentColor: '#F9A8D4',
      textColor: '#831843',
      backgroundColor: '#FFF1F2',
      borderRadius: '30px',
      borderColor: '#FBCFE8',
      borderWidth: 1,
      fontFamily: '"Poppins", sans-serif',
      fontSize: 14,
      headerBackgroundColor: 'linear-gradient(135deg, #DB2777 0%, #F472B6 100%)',
      headerTextColor: '#FFFFFF',
      headerPadding: 20,
      headerTitleFontSize: 19,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#DB2777',
      buttonIconColor: '#FFFFFF',
      closeButtonColor: '#FFFFFF',
      shadowEffect: 'medium'
    }
  },
  {
    id: 'coffee-luxury',
    name: 'Coffee Luxury',
    config: {
      primaryColor: '#451A03',
      secondaryColor: '#78350F',
      accentColor: '#B45309',
      textColor: '#FEF3C7',
      backgroundColor: '#FFFBEB',
      borderRadius: '12px',
      borderColor: '#D97706',
      borderWidth: 1,
      fontFamily: '"Poppins", sans-serif',
      fontSize: 15,
      headerBackgroundColor: '#451A03',
      headerTextColor: '#FEF3C7',
      headerPadding: 18,
      headerTitleFontSize: 19,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#451A03',
      buttonIconColor: '#FEF3C7',
      closeButtonColor: '#FEF3C7',
      shadowEffect: 'strong'
    }
  },
  {
    id: 'ocean-deep',
    name: 'Ocean Deep',
    config: {
      primaryColor: '#0E7490',
      secondaryColor: '#155E75',
      accentColor: '#22D3EE',
      textColor: '#ECFEFF',
      backgroundColor: '#083344',
      borderRadius: '20px',
      borderColor: '#155E75',
      borderWidth: 1,
      fontFamily: '"Poppins", sans-serif',
      fontSize: 14,
      headerBackgroundColor: 'linear-gradient(180deg, #0E7490 0%, #083344 100%)',
      headerTextColor: '#22D3EE',
      headerPadding: 18,
      headerTitleFontSize: 19,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#0E7490',
      buttonIconColor: '#FFFFFF',
      closeButtonColor: '#22D3EE',
      shadowEffect: 'strong'
    }
  },
  {
    id: 'classic-mono',
    name: 'Classic Mono',
    config: {
      primaryColor: '#111827',
      secondaryColor: '#1F2937',
      accentColor: '#6B7280',
      textColor: '#111827',
      backgroundColor: '#F9FAFB',
      borderRadius: '0px',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      fontFamily: '"Inter", sans-serif',
      fontSize: 15,
      headerBackgroundColor: '#FFFFFF',
      headerTextColor: '#111827',
      headerPadding: 14,
      headerTitleFontSize: 18,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#111827',
      buttonIconColor: '#FFFFFF',
      closeButtonColor: '#111827',
      shadowEffect: 'none'
    }
  },
  {
    id: 'ruby-wine',
    name: 'Ruby Wine',
    config: {
      primaryColor: '#991B1B',
      secondaryColor: '#7F1D1D',
      accentColor: '#F87171',
      textColor: '#FEF2F2',
      backgroundColor: '#450A0A',
      borderRadius: '12px',
      borderColor: '#7F1D1D',
      borderWidth: 1,
      fontFamily: '"Montserrat", sans-serif',
      fontSize: 14,
      headerBackgroundColor: 'linear-gradient(135deg, #991B1B 0%, #450A0A 100%)',
      headerTextColor: '#FFFFFF',
      headerPadding: 18,
      headerTitleFontSize: 19,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#991B1B',
      buttonIconColor: '#FFFFFF',
      closeButtonColor: '#FFFFFF',
      shadowEffect: 'strong'
    }
  },
  {
    id: 'electric-cyber',
    name: 'Electric Cyber',
    config: {
      primaryColor: '#7C3AED',
      secondaryColor: '#C026D3',
      accentColor: '#22D3EE',
      textColor: '#F5F3FF',
      backgroundColor: '#0F172A',
      borderRadius: '4px',
      borderColor: '#7C3AED',
      borderWidth: 1,
      fontFamily: '"Inter", sans-serif',
      fontSize: 14,
      headerBackgroundColor: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 100%)',
      headerTextColor: '#FFFFFF',
      headerPadding: 16,
      headerTitleFontSize: 18,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#7C3AED',
      buttonIconColor: '#22D3EE',
      closeButtonColor: '#FFFFFF',
      shadowEffect: 'strong'
    }
  },
  {
    id: 'organic-earth',
    name: 'Organic Earth',
    config: {
      primaryColor: '#78350F',
      secondaryColor: '#D97706',
      accentColor: '#65A30D',
      textColor: '#451A03',
      backgroundColor: '#FDFCF0',
      borderRadius: '30px',
      borderColor: '#D97706',
      borderWidth: 1,
      fontFamily: '"Poppins", sans-serif',
      fontSize: 15,
      headerBackgroundColor: '#78350F',
      headerTextColor: '#FDFCF0',
      headerPadding: 20,
      headerTitleFontSize: 19,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#78350F',
      buttonIconColor: '#FDFCF0',
      closeButtonColor: '#FDFCF0',
      shadowEffect: 'medium'
    }
  },
  {
    id: 'nordic-minimal',
    name: 'Nordic Minimal',
    config: {
      primaryColor: '#334155',
      secondaryColor: '#94A3B8',
      accentColor: '#CBD5E1',
      textColor: '#1E293B',
      backgroundColor: '#FFFFFF',
      borderRadius: '8px',
      borderColor: '#E2E8F0',
      borderWidth: 1,
      fontFamily: '"Inter", sans-serif',
      fontSize: 14,
      headerBackgroundColor: '#F8FAFC',
      headerTextColor: '#1E293B',
      headerPadding: 14,
      headerTitleFontSize: 17,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#FFFFFF',
      buttonIconColor: '#334155',
      closeButtonColor: '#334155',
      shadowEffect: 'light'
    }
  },
  {
    id: 'tropical-wave',
    name: 'Tropical Wave',
    config: {
      primaryColor: '#0EA5E9',
      secondaryColor: '#10B981',
      accentColor: '#FDE047',
      textColor: '#0C4A6E',
      backgroundColor: '#F0F9FF',
      borderRadius: '24px',
      borderColor: 'transparent',
      borderWidth: 0,
      fontFamily: '"Poppins", sans-serif',
      fontSize: 15,
      headerBackgroundColor: 'linear-gradient(135deg, #0EA5E9 0%, #10B981 100%)',
      headerTextColor: '#FFFFFF',
      headerPadding: 18,
      headerTitleFontSize: 19,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#0EA5E9',
      buttonIconColor: '#FFFFFF',
      closeButtonColor: '#FFFFFF',
      shadowEffect: 'medium'
    }
  },
  {
    id: 'golden-sand',
    name: 'Golden Sand',
    config: {
      primaryColor: '#B45309',
      secondaryColor: '#D97706',
      accentColor: '#F59E0B',
      textColor: '#451A03',
      backgroundColor: '#FFFBEB',
      borderRadius: '40px',
      borderColor: 'transparent',
      borderWidth: 0,
      fontFamily: '"Poppins", sans-serif',
      fontSize: 15,
      headerBackgroundColor: '#F59E0B',
      headerTextColor: '#FFFFFF',
      headerPadding: 24,
      headerTitleFontSize: 21,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#F59E0B',
      buttonIconColor: '#FFFFFF',
      closeButtonColor: '#FFFFFF',
      shadowEffect: 'medium'
    }
  },
  {
    id: 'forest-night',
    name: 'Forest Night',
    config: {
      primaryColor: '#064E3B',
      secondaryColor: '#065F46',
      accentColor: '#34D399',
      textColor: '#ECFDF5',
      backgroundColor: '#022C22',
      borderRadius: '16px',
      borderColor: '#065F46',
      borderWidth: 1,
      fontFamily: '"Inter", sans-serif',
      fontSize: 14,
      headerBackgroundColor: '#064E3B',
      headerTextColor: '#34D399',
      headerPadding: 16,
      headerTitleFontSize: 18,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#064E3B',
      buttonIconColor: '#34D399',
      closeButtonColor: '#34D399',
      shadowEffect: 'strong'
    }
  },
  {
    id: 'cosmic-nebula',
    name: 'Cosmic Nebula',
    config: {
      primaryColor: '#7E22CE',
      secondaryColor: '#DB2777',
      accentColor: '#F472B6',
      textColor: '#F5F3FF',
      backgroundColor: '#2E1065',
      borderRadius: '24px',
      borderColor: 'transparent',
      borderWidth: 0,
      fontFamily: '"Montserrat", sans-serif',
      fontSize: 14,
      headerBackgroundColor: 'linear-gradient(135deg, #7E22CE 0%, #DB2777 100%)',
      headerTextColor: '#FFFFFF',
      headerPadding: 20,
      headerTitleFontSize: 19,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: 'linear-gradient(135deg, #7E22CE 0%, #DB2777 100%)',
      buttonIconColor: '#FFFFFF',
      closeButtonColor: '#FFFFFF',
      shadowEffect: 'strong'
    }
  },
  {
    id: 'eco-safari',
    name: 'Eco Safari',
    config: {
      primaryColor: '#84CC16',
      secondaryColor: '#4D7C0F',
      accentColor: '#BEF264',
      textColor: '#1A2E05',
      backgroundColor: '#F7FEE7',
      borderRadius: '12px',
      borderColor: '#4D7C0F',
      borderWidth: 1,
      fontFamily: '"Poppins", sans-serif',
      fontSize: 15,
      headerBackgroundColor: '#4D7C0F',
      headerTextColor: '#F7FEE7',
      headerPadding: 18,
      headerTitleFontSize: 18,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#84CC16',
      buttonIconColor: '#FFFFFF',
      closeButtonColor: '#F7FEE7',
      shadowEffect: 'medium'
    }
  },
  {
    id: 'vibrant-techno',
    name: 'Vibrant Techno',
    config: {
      primaryColor: '#F02D7D',
      secondaryColor: '#3B82F6',
      accentColor: '#2DD4BF',
      textColor: '#FFFFFF',
      backgroundColor: '#0F172A',
      borderRadius: '4px',
      borderColor: '#F02D7D',
      borderWidth: 2,
      fontFamily: '"Inter", sans-serif',
      fontSize: 14,
      headerBackgroundColor: 'linear-gradient(90deg, #F02D7D 0%, #3B82F6 100%)',
      headerTextColor: '#FFFFFF',
      headerPadding: 16,
      headerTitleFontSize: 18,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#F02D7D',
      buttonIconColor: '#FFFFFF',
      closeButtonColor: '#FFFFFF',
      shadowEffect: 'strong'
    }
  },
  {
    id: 'frozen-aurora',
    name: 'Frozen Aurora',
    config: {
      primaryColor: '#2DD4BF',
      secondaryColor: '#0EA5E9',
      accentColor: '#A5F3FC',
      textColor: '#083344',
      backgroundColor: '#ECFEFF',
      borderRadius: '30px',
      borderColor: 'transparent',
      borderWidth: 0,
      fontFamily: '"Poppins", sans-serif',
      fontSize: 15,
      headerBackgroundColor: 'linear-gradient(135deg, #2DD4BF 0%, #0EA5E9 100%)',
      headerTextColor: '#FFFFFF',
      headerPadding: 22,
      headerTitleFontSize: 20,
      avatarType: 'image',
      avatarValue: 'http://localhost:3000/styli.png',
      buttonBackgroundColor: '#2DD4BF',
      buttonIconColor: '#FFFFFF',
      closeButtonColor: '#FFFFFF',
      shadowEffect: 'medium'
    }
  }
]

interface ChatbotGeneratorCustomizerProps {
  initialConfig?: Partial<ChatbotGeneratorConfig>
  onConfigChange?: (config: ChatbotGeneratorConfig) => void
  onExport?: (config: ChatbotGeneratorConfig) => void
}

export function ChatbotGeneratorCustomizer({
  initialConfig,
  onConfigChange,
  onExport
}: ChatbotGeneratorCustomizerProps) {
  const [config, setConfig] = useState<ChatbotGeneratorConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig
  })
  const [activeTab, setActiveTab] = useState('general')
  const [showCodePreview, setShowCodePreview] = useState(false)
  const configRef = useRef(config)
  const isInitialMount = useRef(true)

  // Mettre à jour la ref à chaque changement de config
  useEffect(() => {
    configRef.current = config
  }, [config])

  // Éviter les appels inutiles lors du montage initial
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    // Utiliser setTimeout pour éviter les boucles infinies
    const timeoutId = setTimeout(() => {
      onConfigChange?.(configRef.current)
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [config])

  const updateConfig = (updates: Partial<ChatbotGeneratorConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      
      // Harmoniser automatiquement les couleurs des messages d'attention
      // si les couleurs principales ou le header changent
      if (updates.primaryColor || updates.headerBackgroundColor || updates.secondaryColor) {
        newConfig.attentionText = {
          ...newConfig.attentionText,
          backgroundColor: updates.headerBackgroundColor || updates.primaryColor || newConfig.primaryColor,
          color: updates.headerTextColor || newConfig.headerTextColor || '#FFFFFF'
        };
      }
      
      return newConfig;
    })
  }

  const updatePersonality = (key: keyof ChatbotGeneratorConfig['personality'], value: string) => {
    setConfig(prev => ({
      ...prev,
      personality: { ...prev.personality, [key]: value }
    }))
  }

  const updateAttentionText = (updates: Partial<ChatbotGeneratorConfig['attentionText']>) => {
    setConfig(prev => ({
      ...prev,
      attentionText: { ...prev.attentionText, ...updates }
    }))
  }

  const resetToDefaults = () => {
    setConfig(DEFAULT_CONFIG)
    toast.success("Configuration réinitialisée aux valeurs par défaut")
  }

  const generateJavaScriptCode = () => {
    return `window.wikzyChatbotConfig = ${JSON.stringify(config, null, 2)};`
  }

  const copyToClipboard = () => {
    const code = generateJavaScriptCode()
    navigator.clipboard.writeText(code)
    toast.success("Code copié dans le presse-papiers !")
  }

  const exportConfig = () => {
    const configJson = JSON.stringify(config, null, 2)
    const blob = new Blob([configJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chatbot-config-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Configuration exportée !")
    onExport?.(config)
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Personnalisation du Chatbot</h2>
          <p className="text-muted-foreground">
            Configurez tous les paramètres du chatbot-generator.js
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button variant="outline" onClick={exportConfig}>
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Dialog open={showCodePreview} onOpenChange={setShowCodePreview}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Code className="h-4 w-4 mr-2" />
                Voir le code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Code JavaScript généré</DialogTitle>
                <DialogDescription>
                  Copiez ce code pour intégrer votre configuration
                </DialogDescription>
              </DialogHeader>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                  <code>{generateJavaScriptCode()}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copier
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="appearance">Apparence</TabsTrigger>
          <TabsTrigger value="personality">Personnalité</TabsTrigger>
          <TabsTrigger value="behavior">Comportement</TabsTrigger>
          <TabsTrigger value="attention">Attention</TabsTrigger>
          <TabsTrigger value="advanced">Avancé</TabsTrigger>
        </TabsList>

        {/* Onglet Général */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>
                Configuration de base du chatbot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ID du chatbot</Label>
                  <Input
                    value={config.chatbotId}
                    onChange={(e) => updateConfig({ chatbotId: e.target.value })}
                    placeholder="wikzy-premium"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Endpoint API</Label>
                  <Input
                    value={config.apiEndpoint}
                    onChange={(e) => updateConfig({ apiEndpoint: e.target.value })}
                    placeholder="http://localhost:3000/api/ai/master"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  value={config.title}
                  onChange={(e) => updateConfig({ title: e.target.value })}
                  placeholder="Assistant Wikzy"
                />
              </div>
              <div className="space-y-2">
                <Label>Sous-titre</Label>
                <Input
                  value={config.subtitle}
                  onChange={(e) => updateConfig({ subtitle: e.target.value })}
                  placeholder="Votre styliste personnel, toujours à vos côtés"
                />
              </div>
              <div className="space-y-2">
                <Label>Message de bienvenue</Label>
                <Textarea
                  value={config.welcomeMessage}
                  onChange={(e) => updateConfig({ welcomeMessage: e.target.value })}
                  rows={3}
                  placeholder="✨ Bonjour ! Je suis Wikzy..."
                />
              </div>
              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                  value={config.placeholder}
                  onChange={(e) => updateConfig({ placeholder: e.target.value })}
                  placeholder="Ex: Robe rouge, taille M..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Apparence */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Thèmes prédéfinis
              </CardTitle>
              <CardDescription>
                Choisissez un thème pour appliquer instantanément un style complet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PRESET_THEMES.map((theme) => (
                  <Button
                    key={theme.id}
                    variant="outline"
                    className={`h-auto p-4 flex flex-col gap-3 items-start text-left border-2 ${
                      // Ici on pourrait ajouter une logique pour détecter si le thème est actif
                      ""
                    }`}
                    onClick={() => updateConfig(theme.config)}
                  >
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.config.primaryColor }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.config.secondaryColor }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.config.accentColor }} />
                    </div>
                    <span className="text-xs font-bold">{theme.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Couleurs et style
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Couleur principale</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={config.primaryColor}
                      onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                      placeholder="#ffdd5b"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Couleur secondaire</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.secondaryColor}
                      onChange={(e) => updateConfig({ secondaryColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={config.secondaryColor}
                      onChange={(e) => updateConfig({ secondaryColor: e.target.value })}
                      placeholder="#ffd700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Couleur d'accent</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.accentColor}
                      onChange={(e) => updateConfig({ accentColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={config.accentColor}
                      onChange={(e) => updateConfig({ accentColor: e.target.value })}
                      placeholder="#ff6f61"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Couleur du texte</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.textColor}
                      onChange={(e) => updateConfig({ textColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={config.textColor}
                      onChange={(e) => updateConfig({ textColor: e.target.value })}
                      placeholder="#1F2937"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Couleur de fond</Label>
                  <Input
                    value={config.backgroundColor}
                    onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                    placeholder="rgba(255, 255, 255, 0.9)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Couleur des bordures</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.borderColor}
                      onChange={(e) => updateConfig({ borderColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={config.borderColor}
                      onChange={(e) => updateConfig({ borderColor: e.target.value })}
                      placeholder="#E5E7EB"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fond du Header</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.headerBackgroundColor?.startsWith('linear') ? '#ffdd5b' : config.headerBackgroundColor}
                      onChange={(e) => updateConfig({ headerBackgroundColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={config.headerBackgroundColor}
                      onChange={(e) => updateConfig({ headerBackgroundColor: e.target.value })}
                      placeholder="#ffdd5b ou linear-gradient(...)"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Texte du Header</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.headerTextColor}
                      onChange={(e) => updateConfig({ headerTextColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={config.headerTextColor}
                      onChange={(e) => updateConfig({ headerTextColor: e.target.value })}
                      placeholder="#1F2937"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Fond du Bouton d'ouverture</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.buttonBackgroundColor?.startsWith('linear') ? '#ffdd5b' : config.buttonBackgroundColor}
                      onChange={(e) => updateConfig({ buttonBackgroundColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={config.buttonBackgroundColor}
                      onChange={(e) => updateConfig({ buttonBackgroundColor: e.target.value })}
                      placeholder="#ffdd5b ou linear-gradient(...)"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Icône du Bouton d'ouverture</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.buttonIconColor}
                      onChange={(e) => updateConfig({ buttonIconColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={config.buttonIconColor}
                      onChange={(e) => updateConfig({ buttonIconColor: e.target.value })}
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Couleur du Bouton de fermeture</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={config.closeButtonColor}
                      onChange={(e) => updateConfig({ closeButtonColor: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={config.closeButtonColor}
                      onChange={(e) => updateConfig({ closeButtonColor: e.target.value })}
                      placeholder="#1F2937"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-sm">Header et Avatar</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Taille du Header (Padding: {config.headerPadding}px)</Label>
                    <Slider
                      value={[config.headerPadding || 18]}
                      onValueChange={([value]) => updateConfig({ headerPadding: value })}
                      min={8}
                      max={40}
                      step={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Taille du titre ({config.headerTitleFontSize}px)</Label>
                    <Slider
                      value={[config.headerTitleFontSize || 19]}
                      onValueChange={([value]) => updateConfig({ headerTitleFontSize: value })}
                      min={12}
                      max={32}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type d'avatar</Label>
                    <Select
                      value={config.avatarType || 'image'}
                      onValueChange={(value: 'image' | 'none') => updateConfig({ avatarType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Image (URL)</SelectItem>
                        <SelectItem value="none">Aucun</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {config.avatarType === 'image' && (
                    <div className="col-span-2 space-y-4">
                      <div className="space-y-2">
                        <Label>URL de l'image</Label>
                        <Input
                          value={config.avatarValue}
                          onChange={(e) => updateConfig({ avatarValue: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Avatars prédéfinis</Label>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {AVATAR_COLLECTIONS.map((collection) => (
                            <div key={collection.name} className="space-y-2">
                              <h5 className="text-xs font-semibold">{collection.name}</h5>
                              <div className="grid grid-cols-5 gap-2">
                                {collection.avatars.map((avatarUrl) => (
                                  <button
                                    key={avatarUrl}
                                    className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all hover:scale-105 ${
                                      config.avatarValue === avatarUrl || config.avatarValue?.includes(avatarUrl)
                                        ? 'border-primary shadow-md ring-2 ring-primary/20' 
                                        : 'border-transparent bg-muted hover:border-muted-foreground/30'
                                    }`}
                                    onClick={() => updateConfig({ avatarValue: `${typeof window !== 'undefined' ? window.location.origin : ''}${avatarUrl}` })}
                                  >
                                    <img 
                                      src={avatarUrl} 
                                      alt={`${collection.name} avatar`} 
                                      className="w-full h-full object-cover"
                                    />
                                    {(config.avatarValue === avatarUrl || config.avatarValue?.includes(avatarUrl)) && (
                                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                        <div className="bg-primary text-white rounded-full p-0.5">
                                          <Sparkles className="h-3 w-3" />
                                        </div>
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Arrondi des bordures</Label>
                  <Input
                    value={config.borderRadius}
                    onChange={(e) => updateConfig({ borderRadius: e.target.value })}
                    placeholder="24px"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Épaisseur des bordures ({config.borderWidth}px)</Label>
                  <Slider
                    value={[config.borderWidth]}
                    onValueChange={([value]) => updateConfig({ borderWidth: value })}
                    min={0}
                    max={10}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Police de caractères</Label>
                  <Input
                    value={config.fontFamily}
                    onChange={(e) => updateConfig({ fontFamily: e.target.value })}
                    placeholder='"Inter", sans-serif'
                  />
                </div>
                <div className="space-y-2">
                  <Label>Taille de police ({config.fontSize}px)</Label>
                  <Slider
                    value={[config.fontSize]}
                    onValueChange={([value]) => updateConfig({ fontSize: value })}
                    min={12}
                    max={20}
                    step={1}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select
                    value={config.position}
                    onValueChange={(value: ChatbotGeneratorConfig['position']) => 
                      updateConfig({ position: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bas droite</SelectItem>
                      <SelectItem value="bottom-left">Bas gauche</SelectItem>
                      <SelectItem value="top-right">Haut droite</SelectItem>
                      <SelectItem value="top-left">Haut gauche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Taille</Label>
                  <Select
                    value={config.size}
                    onValueChange={(value: ChatbotGeneratorConfig['size']) => 
                      updateConfig({ size: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Effet d'ombre</Label>
                  <Select
                    value={config.shadowEffect}
                    onValueChange={(value: ChatbotGeneratorConfig['shadowEffect']) => 
                      updateConfig({ shadowEffect: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      <SelectItem value="light">Léger</SelectItem>
                      <SelectItem value="medium">Moyen</SelectItem>
                      <SelectItem value="strong">Fort</SelectItem>
                      <SelectItem value="neumorphic">Neumorphic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Style d'animation</Label>
                  <Input
                    value={config.animationStyle}
                    onChange={(e) => updateConfig({ animationStyle: e.target.value })}
                    placeholder="gradient-pulse"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Police</Label>
                  <Input
                    value={config.fontFamily}
                    onChange={(e) => updateConfig({ fontFamily: e.target.value })}
                    placeholder='"Inter", sans-serif'
                  />
                </div>
                <div className="space-y-2">
                  <Label>Taille du bouton ({config.buttonSize}px)</Label>
                  <Slider
                    value={[config.buttonSize]}
                    onValueChange={([value]) => updateConfig({ buttonSize: value })}
                    min={48}
                    max={120}
                    step={4}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Thème</Label>
                <RadioGroup
                  value={config.theme}
                  onValueChange={(value: ChatbotGeneratorConfig['theme']) => 
                    updateConfig({ theme: value })
                  }
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light">Clair</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark">Sombre</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="auto" />
                    <Label htmlFor="auto">Automatique</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Personnalité */}
        <TabsContent value="personality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Personnalité du chatbot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Ton</Label>
                <Select
                  value={config.personality.tone}
                  onValueChange={(value) => updatePersonality('tone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Amical">Amical</SelectItem>
                    <SelectItem value="Professionnel">Professionnel</SelectItem>
                    <SelectItem value="Décontracté">Décontracté</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                    <SelectItem value="Humoristique">Humoristique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Formalité</Label>
                <RadioGroup
                  value={config.personality.formality}
                  onValueChange={(value) => updatePersonality('formality', value)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Tutoiement" id="tu" />
                    <Label htmlFor="tu">Tutoiement</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Vouvoiement" id="vous" />
                    <Label htmlFor="vous">Vouvoiement</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Verbosité</Label>
                <Select
                  value={config.personality.verbosity}
                  onValueChange={(value) => updatePersonality('verbosity', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Concis">Concis</SelectItem>
                    <SelectItem value="Détaillé">Détaillé</SelectItem>
                    <SelectItem value="Très détaillé">Très détaillé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Empathie</Label>
                <Select
                  value={config.personality.empathy}
                  onValueChange={(value) => updatePersonality('empathy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Faible">Faible</SelectItem>
                    <SelectItem value="Moyenne">Moyenne</SelectItem>
                    <SelectItem value="Élevée">Élevée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Proactivité</Label>
                <Select
                  value={config.personality.proactivity}
                  onValueChange={(value) => updatePersonality('proactivity', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Réactif">Réactif</SelectItem>
                    <SelectItem value="Proactif">Proactif</SelectItem>
                    <SelectItem value="Très proactif">Très proactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Comportement */}
        <TabsContent value="behavior" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Comportement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Indicateur de frappe</Label>
                  <p className="text-sm text-muted-foreground">
                    Afficher "en train d'écrire..."
                  </p>
                </div>
                <Switch
                  checked={config.showTypingIndicator}
                  onCheckedChange={(checked) => updateConfig({ showTypingIndicator: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sons activés</Label>
                  <p className="text-sm text-muted-foreground">
                    Activer les effets sonores
                  </p>
                </div>
                <Switch
                  checked={config.enableSound}
                  onCheckedChange={(checked) => updateConfig({ enableSound: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ouverture automatique</Label>
                  <p className="text-sm text-muted-foreground">
                    Ouvrir le chatbot automatiquement
                  </p>
                </div>
                <Switch
                  checked={config.autoOpen}
                  onCheckedChange={(checked) => updateConfig({ autoOpen: checked })}
                />
              </div>
              {config.autoOpen && (
                <div className="space-y-2">
                  <Label>Délai d'ouverture automatique ({config.autoOpenDelay}ms)</Label>
                  <Slider
                    value={[config.autoOpenDelay]}
                    onValueChange={([value]) => updateConfig({ autoOpenDelay: value })}
                    min={0}
                    max={10000}
                    step={500}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Réponses rapides</Label>
                <Textarea
                  value={config.quickReplies.join('\n')}
                  onChange={(e) => updateConfig({ 
                    quickReplies: e.target.value.split('\n').filter(r => r.trim()) 
                  })}
                  rows={4}
                  placeholder="Une réponse par ligne"
                />
                <p className="text-sm text-muted-foreground">
                  Une réponse rapide par ligne
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Attention */}
        <TabsContent value="attention" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Messages d'attention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Activer les messages d'attention</Label>
                  <p className="text-sm text-muted-foreground">
                    Afficher des messages flottants pour attirer l'attention
                  </p>
                </div>
                <Switch
                  checked={config.attentionText.enabled}
                  onCheckedChange={(checked) => updateAttentionText({ enabled: checked })}
                />
              </div>

              {config.attentionText.enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Messages</Label>
                    <Textarea
                      value={config.attentionText.messages.join('\n')}
                      onChange={(e) => updateAttentionText({ 
                        messages: e.target.value.split('\n').filter(m => m.trim()) 
                      })}
                      rows={5}
                      placeholder="Un message par ligne"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Couleur du texte</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={config.attentionText.color}
                          onChange={(e) => updateAttentionText({ color: e.target.value })}
                          className="w-16 h-10"
                        />
                        <Input
                          value={config.attentionText.color}
                          onChange={(e) => updateAttentionText({ color: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Animation</Label>
                      <Select
                        value={config.attentionText.animation}
                        onValueChange={(value) => updateAttentionText({ animation: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fade">Fondu</SelectItem>
                          <SelectItem value="slide">Glissement</SelectItem>
                          <SelectItem value="bounce">Rebond</SelectItem>
                          <SelectItem value="glow">Lueur</SelectItem>
                          <SelectItem value="pop">Pop</SelectItem>
                          <SelectItem value="wave">Vague</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Durée ({config.attentionText.duration}ms)</Label>
                      <Slider
                        value={[config.attentionText.duration]}
                        onValueChange={([value]) => updateAttentionText({ duration: value })}
                        min={1000}
                        max={10000}
                        step={500}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Délai ({config.attentionText.delay}ms)</Label>
                      <Slider
                        value={[config.attentionText.delay]}
                        onValueChange={([value]) => updateAttentionText({ delay: value })}
                        min={0}
                        max={10000}
                        step={500}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Intervalle de répétition ({config.attentionText.repeatInterval}ms)</Label>
                      <Slider
                        value={[config.attentionText.repeatInterval]}
                        onValueChange={([value]) => updateAttentionText({ repeatInterval: value })}
                        min={2000}
                        max={30000}
                        step={1000}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Effet de particules</Label>
                    </div>
                    <Switch
                      checked={config.attentionText.particleEffect}
                      onCheckedChange={(checked) => updateAttentionText({ particleEffect: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Effet de traînée</Label>
                    </div>
                    <Switch
                      checked={config.attentionText.trailEffect}
                      onCheckedChange={(checked) => updateAttentionText({ trailEffect: checked })}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Avancé */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Configuration avancée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Icône personnalisée (HTML)</Label>
                <Textarea
                  value={config.customIcon || ''}
                  onChange={(e) => updateConfig({ customIcon: e.target.value || null })}
                  rows={3}
                  placeholder='<img src="..." alt="..." />'
                />
                <p className="text-sm text-muted-foreground">
                  Code HTML pour une icône personnalisée (laisser vide pour l'icône par défaut)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Aperçu de la configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Aperçu de la configuration
          </CardTitle>
          <CardDescription>
            Résumé de toutes les configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Badge variant="outline" className="mb-2">Général</Badge>
                <p><strong>ID:</strong> {config.chatbotId}</p>
                <p><strong>Titre:</strong> {config.title}</p>
                <p><strong>Position:</strong> {config.position}</p>
                <p><strong>Taille:</strong> {config.size}</p>
              </div>
              <div>
                <Badge variant="outline" className="mb-2">Couleurs</Badge>
                <div className="flex gap-2 items-center">
                  <div 
                    className="w-4 h-4 rounded border" 
                    style={{ backgroundColor: config.primaryColor }}
                  />
                  <span className="text-xs">Principal: {config.primaryColor}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <div 
                    className="w-4 h-4 rounded border" 
                    style={{ backgroundColor: config.accentColor }}
                  />
                  <span className="text-xs">Accent: {config.accentColor}</span>
                </div>
              </div>
            </div>
            <Separator />
            <div className="text-sm">
              <Badge variant="outline" className="mb-2">Personnalité</Badge>
              <p><strong>Ton:</strong> {config.personality.tone}</p>
              <p><strong>Formalité:</strong> {config.personality.formality}</p>
              <p><strong>Verbosité:</strong> {config.personality.verbosity}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

