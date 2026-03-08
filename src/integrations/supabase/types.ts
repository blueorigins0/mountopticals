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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      brands: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
          variation_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
          variation_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          banner_image: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          show_on_homepage: boolean | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          banner_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          show_on_homepage?: boolean | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          banner_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          show_on_homepage?: boolean | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          admin_id: string | null
          buyer_id: string
          created_at: string
          id: string
          is_active: boolean | null
          last_message_at: string | null
          subject: string | null
        }
        Insert: {
          admin_id?: string | null
          buyer_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          subject?: string | null
        }
        Update: {
          admin_id?: string | null
          buyer_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_message_at?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          auto_apply: boolean | null
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_order_amount: number | null
          starts_at: string | null
          updated_at: string
          usage_limit: number | null
          used_count: number | null
        }
        Insert: {
          auto_apply?: boolean | null
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Update: {
          auto_apply?: boolean | null
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Relationships: []
      }
      delivery_pincodes: {
        Row: {
          city: string | null
          created_at: string
          delivery_days: number
          id: string
          is_active: boolean | null
          is_cod_available: boolean | null
          pincode: string
          state: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          delivery_days?: number
          id?: string
          is_active?: boolean | null
          is_cod_available?: boolean | null
          pincode: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          delivery_days?: number
          id?: string
          is_active?: boolean | null
          is_cod_available?: boolean | null
          pincode?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          badge_label: string | null
          created_at: string
          cta_link: string | null
          cta_text: string | null
          id: string
          image_url: string
          is_active: boolean | null
          show_button: boolean | null
          show_text: boolean | null
          sort_order: number | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          badge_label?: string | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          show_button?: boolean | null
          show_text?: boolean | null
          sort_order?: number | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          badge_label?: string | null
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          show_button?: boolean | null
          show_text?: boolean | null
          sort_order?: number | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          background_image: string | null
          category_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          product_limit: number | null
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          background_image?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          product_limit?: number | null
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          background_image?: string | null
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          product_limit?: number | null
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homepage_sections_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string
          order_id: string
          paid_at: string | null
          pdf_url: string | null
          status: string | null
          tax: number | null
          total: number
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          order_id: string
          paid_at?: string | null
          pdf_url?: string | null
          status?: string | null
          tax?: number | null
          total: number
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          order_id?: string
          paid_at?: string | null
          pdf_url?: string | null
          status?: string | null
          tax?: number | null
          total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string | null
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
          quantity: number
          total_price: number
          unit_price: number
          variation_details: string | null
          variation_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
          variation_details?: string | null
          variation_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          variation_details?: string | null
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          buyer_type: Database["public"]["Enums"]["app_role"]
          created_at: string
          id: string
          notes: string | null
          order_number: string
          shipping: number | null
          shipping_address: Json | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          tax: number | null
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          billing_address?: Json | null
          buyer_type: Database["public"]["Enums"]["app_role"]
          created_at?: string
          id?: string
          notes?: string | null
          order_number?: string
          shipping?: number | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          tax?: number | null
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          billing_address?: Json | null
          buyer_type?: Database["public"]["Enums"]["app_role"]
          created_at?: string
          id?: string
          notes?: string | null
          order_number?: string
          shipping?: number | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          tax?: number | null
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_attribute_types: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      product_attribute_values: {
        Row: {
          attribute_type_id: string
          created_at: string
          id: string
          label: string
          product_id: string
          show_on_page: boolean | null
          sort_order: number | null
          value_image: string | null
          value_text: string
        }
        Insert: {
          attribute_type_id: string
          created_at?: string
          id?: string
          label: string
          product_id: string
          show_on_page?: boolean | null
          sort_order?: number | null
          value_image?: string | null
          value_text: string
        }
        Update: {
          attribute_type_id?: string
          created_at?: string
          id?: string
          label?: string
          product_id?: string
          show_on_page?: boolean | null
          sort_order?: number | null
          value_image?: string | null
          value_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attribute_values_attribute_type_id_fkey"
            columns: ["attribute_type_id"]
            isOneToOne: false
            referencedRelation: "product_attribute_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attribute_values_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_custom_tabs: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          product_id: string
          sort_order: number | null
          tab_content: string
          tab_title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          product_id: string
          sort_order?: number | null
          tab_content: string
          tab_title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          product_id?: string
          sort_order?: number | null
          tab_content?: string
          tab_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_custom_tabs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_offers: {
        Row: {
          badge_label: string
          category_id: string | null
          created_at: string
          description: string
          details_url: string | null
          discount_amount: number | null
          id: string
          is_active: boolean | null
          min_order_amount: number | null
          offer_type: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          badge_label: string
          category_id?: string | null
          created_at?: string
          description: string
          details_url?: string | null
          discount_amount?: number | null
          id?: string
          is_active?: boolean | null
          min_order_amount?: number | null
          offer_type: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          badge_label?: string
          category_id?: string | null
          created_at?: string
          description?: string
          details_url?: string | null
          discount_amount?: number | null
          id?: string
          is_active?: boolean | null
          min_order_amount?: number | null
          offer_type?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_offers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          created_at: string
          id: string
          is_approved: boolean | null
          is_verified: boolean | null
          product_id: string
          rating: number
          review_text: string | null
          reviewer_name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_verified?: boolean | null
          product_id: string
          rating: number
          review_text?: string | null
          reviewer_name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_approved?: boolean | null
          is_verified?: boolean | null
          product_id?: string
          rating?: number
          review_text?: string | null
          reviewer_name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          color: string | null
          color_image: string | null
          created_at: string
          guest_price: number
          id: string
          is_active: boolean | null
          product_id: string
          retail_moq: number | null
          retail_price: number
          shop_moq: number | null
          shop_price: number
          size: string | null
          sku: string | null
          stock_quantity: number | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          color?: string | null
          color_image?: string | null
          created_at?: string
          guest_price?: number
          id?: string
          is_active?: boolean | null
          product_id: string
          retail_moq?: number | null
          retail_price: number
          shop_moq?: number | null
          shop_price: number
          size?: string | null
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          color?: string | null
          color_image?: string | null
          created_at?: string
          guest_price?: number
          id?: string
          is_active?: boolean | null
          product_id?: string
          retail_moq?: number | null
          retail_price?: number
          shop_moq?: number | null
          shop_price?: number
          size?: string | null
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          ar_fit_scale: number
          ar_fit_tilt_multiplier: number
          ar_fit_y_offset: number
          ar_flip_front_back: boolean
          ar_image: string | null
          ar_model_url: string | null
          brand_id: string | null
          category_id: string | null
          created_at: string
          description: string | null
          features: string[] | null
          gst_percentage: number | null
          guest_price: number
          has_variations: boolean | null
          height: number | null
          id: string
          images: string[] | null
          is_active: boolean | null
          length: number | null
          meta_description: string | null
          meta_title: string | null
          name: string
          regular_price: number
          retail_moq: number
          retail_price: number
          shipping_class: string | null
          shop_moq: number
          shop_price: number
          short_description: string | null
          sku: string | null
          slug: string
          stock_quantity: number | null
          tags: string[] | null
          tax_class: string | null
          updated_at: string
          weight: number | null
          width: number | null
        }
        Insert: {
          ar_fit_scale?: number
          ar_fit_tilt_multiplier?: number
          ar_fit_y_offset?: number
          ar_flip_front_back?: boolean
          ar_image?: string | null
          ar_model_url?: string | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          gst_percentage?: number | null
          guest_price?: number
          has_variations?: boolean | null
          height?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          length?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          regular_price?: number
          retail_moq?: number
          retail_price: number
          shipping_class?: string | null
          shop_moq?: number
          shop_price: number
          short_description?: string | null
          sku?: string | null
          slug: string
          stock_quantity?: number | null
          tags?: string[] | null
          tax_class?: string | null
          updated_at?: string
          weight?: number | null
          width?: number | null
        }
        Update: {
          ar_fit_scale?: number
          ar_fit_tilt_multiplier?: number
          ar_fit_y_offset?: number
          ar_flip_front_back?: boolean
          ar_image?: string | null
          ar_model_url?: string | null
          brand_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          gst_percentage?: number | null
          guest_price?: number
          has_variations?: boolean | null
          height?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          length?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          regular_price?: number
          retail_moq?: number
          retail_price?: number
          shipping_class?: string | null
          shop_moq?: number
          shop_price?: number
          short_description?: string | null
          sku?: string | null
          slug?: string
          stock_quantity?: number | null
          tags?: string[] | null
          tax_class?: string | null
          updated_at?: string
          weight?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string | null
          gst_number: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_banners: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean | null
          link: string | null
          offer_text: string | null
          sort_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean | null
          link?: string | null
          offer_text?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean | null
          link?: string | null
          offer_text?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      rfq_cart_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          session_id: string | null
          updated_at: string
          user_id: string | null
          variation_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          quantity?: number
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
          variation_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          session_id?: string | null
          updated_at?: string
          user_id?: string | null
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfq_cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_cart_items_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_items: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
          quoted_price: number | null
          rfq_id: string
          target_price: number | null
          variation_details: string | null
          variation_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_image?: string | null
          product_name: string
          quantity: number
          quoted_price?: number | null
          rfq_id: string
          target_price?: number | null
          variation_details?: string | null
          variation_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
          quoted_price?: number | null
          rfq_id?: string
          target_price?: number | null
          variation_details?: string | null
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfq_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_items_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfq_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_items_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_requests: {
        Row: {
          admin_notes: string | null
          attachments: string[] | null
          bulk_discount: number | null
          buyer_type: Database["public"]["Enums"]["app_role"] | null
          category: string | null
          company_name: string | null
          created_at: string
          delivery_timeline: string | null
          email: string
          full_name: string
          gst_amount: number | null
          gst_number: string | null
          id: string
          message: string | null
          payment_terms: string | null
          phone: string | null
          product_id: string | null
          product_name: string
          quantity: number
          quotation_pdf_url: string | null
          quoted_at: string | null
          quoted_price: number | null
          rfq_number: string
          shipping_cost: number | null
          status: Database["public"]["Enums"]["rfq_status"] | null
          target_price: number | null
          total_amount: number | null
          unit_price: number | null
          updated_at: string
          user_id: string | null
          validity_days: number | null
        }
        Insert: {
          admin_notes?: string | null
          attachments?: string[] | null
          bulk_discount?: number | null
          buyer_type?: Database["public"]["Enums"]["app_role"] | null
          category?: string | null
          company_name?: string | null
          created_at?: string
          delivery_timeline?: string | null
          email: string
          full_name: string
          gst_amount?: number | null
          gst_number?: string | null
          id?: string
          message?: string | null
          payment_terms?: string | null
          phone?: string | null
          product_id?: string | null
          product_name: string
          quantity: number
          quotation_pdf_url?: string | null
          quoted_at?: string | null
          quoted_price?: number | null
          rfq_number: string
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["rfq_status"] | null
          target_price?: number | null
          total_amount?: number | null
          unit_price?: number | null
          updated_at?: string
          user_id?: string | null
          validity_days?: number | null
        }
        Update: {
          admin_notes?: string | null
          attachments?: string[] | null
          bulk_discount?: number | null
          buyer_type?: Database["public"]["Enums"]["app_role"] | null
          category?: string | null
          company_name?: string | null
          created_at?: string
          delivery_timeline?: string | null
          email?: string
          full_name?: string
          gst_amount?: number | null
          gst_number?: string | null
          id?: string
          message?: string | null
          payment_terms?: string | null
          phone?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          quotation_pdf_url?: string | null
          quoted_at?: string | null
          quoted_price?: number | null
          rfq_number?: string
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["rfq_status"] | null
          target_price?: number | null
          total_amount?: number | null
          unit_price?: number | null
          updated_at?: string
          user_id?: string | null
          validity_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rfq_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_buyer_type: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "shop" | "retail"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
      rfq_status: "pending" | "quoted" | "accepted" | "rejected" | "expired"
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
      app_role: ["admin", "shop", "retail"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      rfq_status: ["pending", "quoted", "accepted", "rejected", "expired"],
    },
  },
} as const
