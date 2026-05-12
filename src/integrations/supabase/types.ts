export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          category: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          category?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          category?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          audit_date: string
          auditor_firm: string | null
          auditor_name: string
          created_at: string
          created_by: string | null
          grams_verified: number
          id: string
          notes: string | null
          report_url: string | null
          updated_at: string
          vault_id: string | null
        }
        Insert: {
          audit_date?: string
          auditor_firm?: string | null
          auditor_name: string
          created_at?: string
          created_by?: string | null
          grams_verified?: number
          id?: string
          notes?: string | null
          report_url?: string | null
          updated_at?: string
          vault_id?: string | null
        }
        Update: {
          audit_date?: string
          auditor_firm?: string | null
          auditor_name?: string
          created_at?: string
          created_by?: string | null
          grams_verified?: number
          id?: string
          notes?: string | null
          report_url?: string | null
          updated_at?: string
          vault_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      card_waitlist: {
        Row: {
          country: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          notes: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_no: string
          created_at: string
          grams: number
          id: string
          order_id: string | null
          user_id: string
          vault_id: string | null
        }
        Insert: {
          certificate_no: string
          created_at?: string
          grams: number
          id?: string
          order_id?: string | null
          user_id: string
          vault_id?: string | null
        }
        Update: {
          certificate_no?: string
          created_at?: string
          grams?: number
          id?: string
          order_id?: string | null
          user_id?: string
          vault_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_id: string
          sender_role: string
          status: string
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_id: string
          sender_role: string
          status?: string
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_role?: string
          status?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          admin_unread: number
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string | null
          updated_at: string
          user_id: string
          user_unread: number
        }
        Insert: {
          admin_unread?: number
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          updated_at?: string
          user_id: string
          user_unread?: number
        }
        Update: {
          admin_unread?: number
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          updated_at?: string
          user_id?: string
          user_unread?: number
        }
        Relationships: []
      }
      config_activity_logs: {
        Row: {
          action_summary: string | null
          action_type: string
          config_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          performed_by: string | null
        }
        Insert: {
          action_summary?: string | null
          action_type: string
          config_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
        }
        Update: {
          action_summary?: string | null
          action_type?: string
          config_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_activity_logs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "system_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      config_backups: {
        Row: {
          backup_payload: Json | null
          backup_type: string | null
          created_at: string | null
          created_by: string | null
          data: Json
          id: string
          name: string
        }
        Insert: {
          backup_payload?: Json | null
          backup_type?: string | null
          created_at?: string | null
          created_by?: string | null
          data: Json
          id?: string
          name: string
        }
        Update: {
          backup_payload?: Json | null
          backup_type?: string | null
          created_at?: string | null
          created_by?: string | null
          data?: Json
          id?: string
          name?: string
        }
        Relationships: []
      }
      config_versions: {
        Row: {
          change_summary: string | null
          changed_by: string | null
          config_id: string | null
          created_at: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          value: Json
        }
        Insert: {
          change_summary?: string | null
          changed_by?: string | null
          config_id?: string | null
          created_at?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          value: Json
        }
        Update: {
          change_summary?: string | null
          changed_by?: string | null
          config_id?: string | null
          created_at?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "config_versions_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "system_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      couriers: {
        Row: {
          active: boolean
          base_fee_usd: number
          created_at: string
          deleted_at: string | null
          id: string
          logo_url: string | null
          name: string
          regions: string[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_fee_usd?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          regions?: string[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_fee_usd?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          regions?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      crypto_addresses: {
        Row: {
          active: boolean
          address: string
          asset: string
          created_at: string
          id: string
          memo: string | null
          network: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address: string
          asset: string
          created_at?: string
          id?: string
          memo?: string | null
          network: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string
          asset?: string
          created_at?: string
          id?: string
          memo?: string | null
          network?: string
          updated_at?: string
        }
        Relationships: []
      }
      crypto_deposits: {
        Row: {
          admin_notes: string | null
          amount: number
          amount_usd: number
          asset: string
          created_at: string
          from_address: string | null
          id: string
          network: string
          processed_at: string | null
          processing_lock: boolean
          proof_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tx_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          amount_usd: number
          asset: string
          created_at?: string
          from_address?: string | null
          id?: string
          network: string
          processed_at?: string | null
          processing_lock?: boolean
          proof_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tx_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          amount_usd?: number
          asset?: string
          created_at?: string
          from_address?: string | null
          id?: string
          network?: string
          processed_at?: string | null
          processing_lock?: boolean
          proof_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tx_hash?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crypto_providers: {
        Row: {
          active: boolean
          created_at: string
          deleted_at: string | null
          id: string
          logo_url: string | null
          name: string
          priority: number
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          priority?: number
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          priority?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      crypto_withdrawals: {
        Row: {
          admin_notes: string | null
          amount_usd: number
          asset: string
          created_at: string
          id: string
          memo: string | null
          network: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          to_address: string
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount_usd: number
          asset: string
          created_at?: string
          id?: string
          memo?: string | null
          network: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          to_address: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount_usd?: number
          asset?: string
          created_at?: string
          id?: string
          memo?: string | null
          network?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          to_address?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          active: boolean
          answer: string
          category: string
          created_at: string
          id: string
          priority: number
          question: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          answer: string
          category: string
          created_at?: string
          id?: string
          priority?: number
          question: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          answer?: string
          category?: string
          created_at?: string
          id?: string
          priority?: number
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      gold_price_alerts: {
        Row: {
          active: boolean
          created_at: string
          direction: string
          id: string
          target_price_per_gram: number
          triggered_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          direction: string
          id?: string
          target_price_per_gram: number
          triggered_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          direction?: string
          id?: string
          target_price_per_gram?: number
          triggered_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gold_price_history: {
        Row: {
          id: string
          price_per_gram: number
          recorded_at: string
        }
        Insert: {
          id?: string
          price_per_gram: number
          recorded_at?: string
        }
        Update: {
          id?: string
          price_per_gram?: number
          recorded_at?: string
        }
        Relationships: []
      }
      gold_products: {
        Row: {
          active: boolean
          created_at: string
          deleted_at: string | null
          id: string
          image_url: string | null
          name: string
          premium_pct: number
          updated_at: string
          weight_grams: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          name: string
          premium_pct?: number
          updated_at?: string
          weight_grams: number
        }
        Update: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
          premium_pct?: number
          updated_at?: string
          weight_grams?: number
        }
        Relationships: []
      }
      holdings: {
        Row: {
          created_at: string
          grams: number
          id: string
          updated_at: string
          user_id: string
          vault_id: string | null
        }
        Insert: {
          created_at?: string
          grams?: number
          id?: string
          updated_at?: string
          user_id: string
          vault_id?: string | null
        }
        Update: {
          created_at?: string
          grams?: number
          id?: string
          updated_at?: string
          user_id?: string
          vault_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "holdings_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      jewelry_categories: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      jewelry_price_audits: {
        Row: {
          change_kind: string
          changed_by: string | null
          created_at: string
          id: string
          new_making_charge_type: string | null
          new_making_charge_value: number | null
          new_stock: number | null
          notes: string | null
          old_making_charge_type: string | null
          old_making_charge_value: number | null
          old_stock: number | null
          product_id: string
          product_name: string
        }
        Insert: {
          change_kind: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_making_charge_type?: string | null
          new_making_charge_value?: number | null
          new_stock?: number | null
          notes?: string | null
          old_making_charge_type?: string | null
          old_making_charge_value?: number | null
          old_stock?: number | null
          product_id: string
          product_name: string
        }
        Update: {
          change_kind?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_making_charge_type?: string | null
          new_making_charge_value?: number | null
          new_stock?: number | null
          notes?: string | null
          old_making_charge_type?: string | null
          old_making_charge_value?: number | null
          old_stock?: number | null
          product_id?: string
          product_name?: string
        }
        Relationships: []
      }
      jewelry_products: {
        Row: {
          active: boolean
          category_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          gallery_urls: string[]
          id: string
          making_charge_type: Database["public"]["Enums"]["making_charge_type"]
          making_charge_value: number
          name: string
          purity: Database["public"]["Enums"]["jewelry_purity"]
          sku: string
          slug: string
          stock_quantity: number
          thumbnail_url: string | null
          updated_at: string
          weight_grams: number
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          gallery_urls?: string[]
          id?: string
          making_charge_type?: Database["public"]["Enums"]["making_charge_type"]
          making_charge_value?: number
          name: string
          purity: Database["public"]["Enums"]["jewelry_purity"]
          sku: string
          slug: string
          stock_quantity?: number
          thumbnail_url?: string | null
          updated_at?: string
          weight_grams: number
        }
        Update: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          gallery_urls?: string[]
          id?: string
          making_charge_type?: Database["public"]["Enums"]["making_charge_type"]
          making_charge_value?: number
          name?: string
          purity?: Database["public"]["Enums"]["jewelry_purity"]
          sku?: string
          slug?: string
          stock_quantity?: number
          thumbnail_url?: string | null
          updated_at?: string
          weight_grams?: number
        }
        Relationships: [
          {
            foreignKeyName: "jewelry_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "jewelry_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_submissions: {
        Row: {
          address: string
          created_at: string
          document_type: string
          document_url: string
          full_name: string
          id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          document_type: string
          document_url: string
          full_name: string
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          document_type?: string
          document_url?: string
          full_name?: string
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_sku: string
          purity: Database["public"]["Enums"]["jewelry_purity"]
          quantity: number
          thumbnail_url: string | null
          unit_price_usd: number
          weight_grams: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_sku: string
          purity: Database["public"]["Enums"]["jewelry_purity"]
          quantity: number
          thumbnail_url?: string | null
          unit_price_usd: number
          weight_grams: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string
          purity?: Database["public"]["Enums"]["jewelry_purity"]
          quantity?: number
          thumbnail_url?: string | null
          unit_price_usd?: number
          weight_grams?: number
        }
        Relationships: [
          {
            foreignKeyName: "jewelry_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "jewelry_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          courier_id: string | null
          created_at: string
          delivery_address: string | null
          delivery_country: string | null
          delivery_full_name: string | null
          delivery_phone: string | null
          gold_rate_usd_per_gram: number | null
          grams: number | null
          id: string
          insurance_tier: string | null
          notes: string | null
          payment_method: string | null
          payment_proof_status: string | null
          payment_proof_tx_hash: string | null
          payment_proof_url: string | null
          product_id: string | null
          quantity: number
          serial_number: string | null
          shipping_usd: number | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_usd: number | null
          total_usd: number
          tracking_number: string | null
          type: Database["public"]["Enums"]["order_type"]
          unit_price_usd: number | null
          updated_at: string
          user_id: string
          vault_id: string | null
        }
        Insert: {
          courier_id?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_country?: string | null
          delivery_full_name?: string | null
          delivery_phone?: string | null
          gold_rate_usd_per_gram?: number | null
          grams?: number | null
          id?: string
          insurance_tier?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_proof_status?: string | null
          payment_proof_tx_hash?: string | null
          payment_proof_url?: string | null
          product_id?: string | null
          quantity?: number
          serial_number?: string | null
          shipping_usd?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_usd?: number | null
          total_usd: number
          tracking_number?: string | null
          type: Database["public"]["Enums"]["order_type"]
          unit_price_usd?: number | null
          updated_at?: string
          user_id: string
          vault_id?: string | null
        }
        Update: {
          courier_id?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_country?: string | null
          delivery_full_name?: string | null
          delivery_phone?: string | null
          gold_rate_usd_per_gram?: number | null
          grams?: number | null
          id?: string
          insurance_tier?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_proof_status?: string | null
          payment_proof_tx_hash?: string | null
          payment_proof_url?: string | null
          product_id?: string | null
          quantity?: number
          serial_number?: string | null
          shipping_usd?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_usd?: number | null
          total_usd?: number
          tracking_number?: string | null
          type?: Database["public"]["Enums"]["order_type"]
          unit_price_usd?: number | null
          updated_at?: string
          user_id?: string
          vault_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "gold_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          kyc_status: string
          notify_email: boolean
          notify_in_app: boolean
          phone: string | null
          suspended: boolean
          updated_at: string
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          kyc_status?: string
          notify_email?: boolean
          notify_in_app?: boolean
          phone?: string | null
          suspended?: boolean
          updated_at?: string
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          kyc_status?: string
          notify_email?: boolean
          notify_in_app?: boolean
          phone?: string | null
          suspended?: boolean
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      support_activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          ticket_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          ticket_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_activity_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_agents: {
        Row: {
          active_tickets: number | null
          created_at: string | null
          department_id: string | null
          id: string
          last_seen_at: string | null
          max_tickets: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          active_tickets?: number | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          last_seen_at?: string | null
          max_tickets?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          active_tickets?: number | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          last_seen_at?: string | null
          max_tickets?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_agents_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "support_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          message_id: string | null
          ticket_id: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          message_id?: string | null
          ticket_id?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string | null
          ticket_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "support_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_departments: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: Database["public"]["Enums"]["support_department_type"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: Database["public"]["Enums"]["support_department_type"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: Database["public"]["Enums"]["support_department_type"]
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
          sender_id: string
          sender_role: string
          ticket_id: string
          type: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          sender_id: string
          sender_role: string
          ticket_id: string
          type?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          sender_id?: string
          sender_role?: string
          ticket_id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_notifications: {
        Row: {
          body: string
          created_at: string | null
          id: string
          message_id: string | null
          read_at: string | null
          ticket_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          message_id?: string | null
          read_at?: string | null
          ticket_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          message_id?: string | null
          read_at?: string | null
          ticket_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_notifications_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "support_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          created_at: string | null
          department_id: string | null
          feedback: string | null
          id: string
          last_message_at: string | null
          metadata: Json | null
          priority: Database["public"]["Enums"]["support_priority"] | null
          rating: number | null
          status: Database["public"]["Enums"]["support_ticket_status"] | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string | null
          department_id?: string | null
          feedback?: string | null
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["support_priority"] | null
          rating?: number | null
          status?: Database["public"]["Enums"]["support_ticket_status"] | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string | null
          department_id?: string | null
          feedback?: string | null
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["support_priority"] | null
          rating?: number | null
          status?: Database["public"]["Enums"]["support_ticket_status"] | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "support_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "support_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_configs: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          description: string | null
          environment: string | null
          id: string
          is_critical: boolean | null
          is_secret: boolean | null
          is_seedable: boolean | null
          is_system: boolean | null
          key: string
          status: string | null
          updated_at: string | null
          updated_by: string | null
          value: Json
          version: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          environment?: string | null
          id?: string
          is_critical?: boolean | null
          is_secret?: boolean | null
          is_seedable?: boolean | null
          is_system?: boolean | null
          key: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value: Json
          version?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          description?: string | null
          environment?: string | null
          id?: string
          is_critical?: boolean | null
          is_secret?: boolean | null
          is_seedable?: boolean | null
          is_system?: boolean | null
          key?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value: Json
          version?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vault_inventory: {
        Row: {
          id: string
          product_id: string
          quantity: number
          vault_id: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity?: number
          vault_id: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "gold_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_inventory_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      vaults: {
        Row: {
          active: boolean
          capacity_grams: number
          country: string | null
          courier_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          location: string
          name: string
          region: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          capacity_grams?: number
          country?: string | null
          courier_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          location: string
          name: string
          region?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          capacity_grams?: number
          country?: string | null
          courier_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          location?: string
          name?: string
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount_usd: number
          created_at: string
          description: string | null
          id: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
        }
        Insert: {
          amount_usd: number
          created_at?: string
          description?: string | null
          id?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
        }
        Update: {
          amount_usd?: number
          created_at?: string
          description?: string | null
          id?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          type?: Database["public"]["Enums"]["wallet_tx_type"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance_usd: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_usd?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_usd?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_crypto_deposit: {
        Args: { _admin_notes?: string; _deposit_id: string }
        Returns: Json
      }
      bulk_update_jewelry_making_charge: {
        Args: {
          _new_type: string
          _new_value: number
          _notes?: string
          _product_ids: string[]
        }
        Returns: Json
      }
      bulk_update_jewelry_order_status: {
        Args: {
          _new_status: Database["public"]["Enums"]["order_status"]
          _order_ids: string[]
          _tracking_number?: string
        }
        Returns: Json
      }
      bulk_update_jewelry_stock: {
        Args: {
          _mode?: string
          _new_stock: number
          _notes?: string
          _product_ids: string[]
        }
        Returns: Json
      }
      cancel_jewelry_order: { Args: { _order_id: string }; Returns: Json }
      check_gold_price_alerts: {
        Args: { _current_price: number }
        Returns: number
      }
      check_rpc_existence: { Args: { rpc_name: string }; Returns: boolean }
      ensure_system_configs:
        | { Args: never; Returns: Json }
        | { Args: { configs: Json }; Returns: Json }
      execute_digital_gold_trade: {
        Args: { _action: string; _amount_usd: number; _price_per_gram: number }
        Returns: Json
      }
      handle_kyc_review: {
        Args: { _notes?: string; _status: string; _submission_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      pay_jewelry_order_with_wallet: {
        Args: { _order_id: string }
        Returns: Json
      }
      place_gold_order: {
        Args: {
          _delivery_address: string
          _price_per_gram: number
          _product_id: string
          _quantity: number
          _type: string
          _vault_id: string
        }
        Returns: Json
      }
      place_jewelry_order: {
        Args: {
          _courier_id: string
          _delivery_address: string
          _delivery_country: string
          _delivery_full_name: string
          _delivery_phone: string
          _gold_rate: number
          _items: Json
          _notes?: string
        }
        Returns: Json
      }
      reject_crypto_deposit: {
        Args: { _admin_notes?: string; _deposit_id: string }
        Returns: Json
      }
      request_crypto_withdrawal: {
        Args: {
          _amount_usd: number
          _asset: string
          _network: string
          _to_address: string
        }
        Returns: Json
      }
      review_crypto_withdrawal: {
        Args: {
          _admin_notes?: string
          _decision: string
          _tx_hash?: string
          _withdrawal_id: string
        }
        Returns: Json
      }
      review_jewelry_payment_proof: {
        Args: { _admin_note?: string; _decision: string; _order_id: string }
        Returns: Json
      }
      set_jewelry_payment_method: {
        Args: { _method: string; _order_id: string }
        Returns: undefined
      }
      submit_jewelry_payment_proof: {
        Args: { _order_id: string; _proof_url: string; _tx_hash?: string }
        Returns: Json
      }
      submit_kyc: {
        Args: {
          _address: string
          _document_type: string
          _document_url: string
          _full_name: string
          _selfie_url: string
        }
        Returns: Json
      }
      update_gold_order_status: {
        Args: {
          _insurance_tier?: string
          _order_id: string
          _serial_number?: string
          _status?: Database["public"]["Enums"]["order_status"]
          _vault_id?: string
        }
        Returns: Json
      }
      update_jewelry_order_status: {
        Args: {
          _order_id: string
          _status: Database["public"]["Enums"]["order_status"]
          _tracking_number?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      jewelry_purity: "18k" | "22k" | "24k"
      making_charge_type: "fixed" | "percent"
      order_status:
        | "pending"
        | "confirmed"
        | "allocated"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "paid"
        | "processing"
      order_type: "vault" | "delivery" | "digital" | "jewelry"
      support_department_type:
        | "payments"
        | "vaults"
        | "shipping"
        | "jewelry"
        | "KYC"
        | "investments"
        | "technical_support"
      support_priority: "low" | "medium" | "high" | "urgent" | "VIP"
      support_ticket_status:
        | "pending"
        | "active"
        | "in_progress"
        | "escalated"
        | "resolved"
        | "closed"
      wallet_tx_type: "deposit" | "withdraw" | "purchase" | "sale" | "topup"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      jewelry_purity: ["18k", "22k", "24k"],
      making_charge_type: ["fixed", "percent"],
      order_status: [
        "pending",
        "confirmed",
        "allocated",
        "shipped",
        "delivered",
        "cancelled",
        "paid",
        "processing",
      ],
      order_type: ["vault", "delivery", "digital", "jewelry"],
      support_department_type: [
        "payments",
        "vaults",
        "shipping",
        "jewelry",
        "KYC",
        "investments",
        "technical_support",
      ],
      support_priority: ["low", "medium", "high", "urgent", "VIP"],
      support_ticket_status: [
        "pending",
        "active",
        "in_progress",
        "escalated",
        "resolved",
        "closed",
      ],
      wallet_tx_type: ["deposit", "withdraw", "purchase", "sale", "topup"],
    },
  },
} as const
