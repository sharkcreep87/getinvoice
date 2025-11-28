export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'user'
          subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'user'
          subscription_tier?: 'free' | 'basic' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'user'
          subscription_tier?: 'free' | 'basic' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          phone: string | null
          company: string | null
          address: string | null
          city: string | null
          state: string | null
          zip: string | null
          country: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          phone?: string | null
          company?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          country?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          phone?: string | null
          company?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          country?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          customer_id: string
          invoice_number: string
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          issue_date: string
          due_date: string
          subtotal: number
          tax_rate: number
          tax_amount: number
          discount_amount: number
          total: number
          notes: string | null
          terms: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          customer_id: string
          invoice_number: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          issue_date: string
          due_date: string
          subtotal: number
          tax_rate?: number
          tax_amount?: number
          discount_amount?: number
          total: number
          notes?: string | null
          terms?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          customer_id?: string
          invoice_number?: string
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          issue_date?: string
          due_date?: string
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          discount_amount?: number
          total?: number
          notes?: string | null
          terms?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          description: string
          quantity: number
          unit_price: number
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          description?: string
          quantity?: number
          unit_price?: number
          amount?: number
          created_at?: string
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          tier: 'free' | 'basic' | 'pro' | 'enterprise'
          price: number
          billing_period: 'monthly' | 'yearly'
          features: Json
          max_customers: number
          max_invoices_per_month: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          tier: 'free' | 'basic' | 'pro' | 'enterprise'
          price: number
          billing_period: 'monthly' | 'yearly'
          features: Json
          max_customers: number
          max_invoices_per_month: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          tier?: 'free' | 'basic' | 'pro' | 'enterprise'
          price?: number
          billing_period?: 'monthly' | 'yearly'
          features?: Json
          max_customers?: number
          max_invoices_per_month?: number
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
