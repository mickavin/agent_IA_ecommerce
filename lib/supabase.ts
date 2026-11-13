import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Vérification des variables d'environnement
if (!supabaseUrl) {
  console.warn('NEXT_PUBLIC_SUPABASE_URL manquante')
}

if (!supabaseAnonKey) {
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY manquante')
}

// Client Supabase avec fallback
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Fonction utilitaire pour vérifier si Supabase est disponible
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey)
}

// Types pour la base de données Supabase
export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          product_title: string | null
          description: string | null
          handle: string | null
          thumbnail_url: string | null
          stock: number
          price: number
          category: string | null
          gender: string | null
          size: string | null
          color: string | null
          sizes: string[]
          colors: string[]
          status: string
          images: string[]
          variant_title: string | null
          url: string | null
          available_for_sale: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          product_title?: string | null
          description?: string | null
          handle?: string | null
          thumbnail_url?: string | null
          stock?: number
          price: number
          category?: string | null
          gender?: string | null
          size?: string | null
          color?: string | null
          sizes?: string[]
          colors?: string[]
          status?: string
          images?: string[],
          url?: string | null,
          variant_title?: string | null
          available_for_sale?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          product_title?: string | null
          description?: string | null
          handle?: string | null
          thumbnail_url?: string | null
          stock?: number
          price?: number
          category?: string | null
          gender?: string | null
          size?: string | null
          color?: string | null
          sizes?: string[]
          colors?: string[]
          status?: string
          images?: string[]
          url?: string | null,
          variant_title?: string | null
          available_for_sale?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_name: string
          customer_email: string
          date: string
          status: string
          total_amount: number
          items_count: number
          shipping_address: string | null
          billing_address: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          customer_email: string
          date: string
          status: string
          total_amount: number
          items_count: number
          shipping_address?: string | null
          billing_address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          customer_email?: string
          date?: string
          status?: string
          total_amount?: number
          items_count?: number
          shipping_address?: string | null
          billing_address?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          birth_date: string | null
          registration_date: string
          last_order_date: string | null
          total_orders: number
          total_spent: number
          average_order_value: number
          segment: string
          status: string
          preferences: any
          loyalty_points: number
          notes: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          birth_date?: string | null
          registration_date?: string
          last_order_date?: string | null
          total_orders?: number
          total_spent?: number
          average_order_value?: number
          segment?: string
          status?: string
          preferences?: any
          loyalty_points?: number
          notes?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          birth_date?: string | null
          registration_date?: string
          last_order_date?: string | null
          total_orders?: number
          total_spent?: number
          average_order_value?: number
          segment?: string
          status?: string
          preferences?: any
          loyalty_points?: number
          notes?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      stock_items: {
        Row: {
          id: string
          product_id: string
          product_name: string
          thumbnail_url: string
          location: string
          quantity: number
          reorder_threshold: number
          last_movement_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          product_name: string
          thumbnail_url: string
          location: string
          quantity: number
          reorder_threshold: number
          last_movement_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          product_name?: string
          thumbnail_url?: string
          location?: string
          quantity?: number
          reorder_threshold?: number
          last_movement_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      support_tickets: {
        Row: {
          id: string
          order_id: string | null
          customer_name: string
          customer_email: string
          subject: string
          status: string
          priority: string
          creation_date: string
          last_update: string
          assigned_to: string | null
          description: string | null
          attachments: string[]
          resolution: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          customer_name: string
          customer_email: string
          subject: string
          status: string
          priority: string
          creation_date: string
          last_update: string
          assigned_to?: string | null
          description?: string | null
          attachments?: string[]
          resolution?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          customer_name?: string
          customer_email?: string
          subject?: string
          status?: string
          priority?: string
          creation_date?: string
          last_update?: string
          assigned_to?: string | null
          description?: string | null
          attachments?: string[]
          resolution?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chatbots: {
        Row: {
          id: string
          name: string
          description: string
          status: string
          is_default: boolean
          personality: any
          visual_config: any
          data_sources: any[]
          conversations_count: number
          avg_response_time: number
          satisfaction_rate: number
          created_at: string
          updated_at: string
          index?: number
        }
        Insert: {
          id?: string
          name: string
          description?: string
          status?: string
          is_default?: boolean
          personality?: any
          visual_config?: any
          data_sources?: any[]
          conversations_count?: number
          avg_response_time?: number
          satisfaction_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          status?: string
          is_default?: boolean
          personality?: any
          visual_config?: any
          data_sources?: any[]
          conversations_count?: number
          avg_response_time?: number
          satisfaction_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
      widget_configurations: {
        Row: {
          id: string
          chatbot_id: string
          name: string
          description: string | null
          theme: any
          layout: any
          behavior: any
          messages: any
          advanced_config: any
          integrations: any
          allowed_domains: string[]
          is_active: boolean
          is_public: boolean
          installation_count: number
          last_used_at: string | null
          version: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chatbot_id: string
          name: string
          description?: string | null
          theme?: any
          layout?: any
          behavior?: any
          messages?: any
          advanced_config?: any
          integrations?: any
          allowed_domains?: string[]
          is_active?: boolean
          is_public?: boolean
          installation_count?: number
          last_used_at?: string | null
          version?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chatbot_id?: string
          name?: string
          description?: string | null
          theme?: any
          layout?: any
          behavior?: any
          messages?: any
          advanced_config?: any
          integrations?: any
          allowed_domains?: string[]
          is_active?: boolean
          is_public?: boolean
          installation_count?: number
          last_used_at?: string | null
          version?: string
          created_at?: string
          updated_at?: string
        }
      }
      widget_assets: {
        Row: {
          id: string
          widget_config_id: string
          asset_type: string
          asset_name: string
          file_url: string
          file_size: number | null
          mime_type: string | null
          alt_text: string | null
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          widget_config_id: string
          asset_type: string
          asset_name: string
          file_url: string
          file_size?: number | null
          mime_type?: string | null
          alt_text?: string | null
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          widget_config_id?: string
          asset_type?: string
          asset_name?: string
          file_url?: string
          file_size?: number | null
          mime_type?: string | null
          alt_text?: string | null
          is_default?: boolean
          created_at?: string
        }
      }
      widget_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          preview_image: string | null
          config_template: any
          is_premium: boolean
          usage_count: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category?: string
          preview_image?: string | null
          config_template: any
          is_premium?: boolean
          usage_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          preview_image?: string | null
          config_template?: any
          is_premium?: boolean
          usage_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'] 