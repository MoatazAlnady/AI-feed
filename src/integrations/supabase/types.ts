export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          author: string
          category: string
          content: string
          created_at: string | null
          email: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          published_at: string | null
          status: string | null
          tags: string[] | null
          title: string
          type: string | null
          updated_at: string | null
          user_id: string | null
          video_url: string | null
          views: number | null
        }
        Insert: {
          author: string
          category: string
          content: string
          created_at?: string | null
          email: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
          views?: number | null
        }
        Update: {
          author?: string
          category?: string
          content?: string
          created_at?: string | null
          email?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_tags: {
        Row: {
          created_at: string | null
          id: string
          project_candidate_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_candidate_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_candidate_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_tags_project_candidate_id_fkey"
            columns: ["project_candidate_id"]
            isOneToOne: false
            referencedRelation: "project_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "project_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          participant_1_id: string
          participant_2_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          participant_1_id: string
          participant_2_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          participant_1_id?: string
          participant_2_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_participant_1_id_fkey"
            columns: ["participant_1_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_2_id_fkey"
            columns: ["participant_2_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      country_codes: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          id: string
          phone_code: string
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          id?: string
          phone_code: string
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          id?: string
          phone_code?: string
        }
        Relationships: []
      }
      employer_projects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          applicants: number
          application_url: string
          city: string
          company: string
          country: string
          created_at: string | null
          description: string
          experience: string
          id: string
          location: string
          requirements: string
          salary: string | null
          slots: number
          title: string
          type: string
          updated_at: string | null
          user_id: string
          work_mode: string
        }
        Insert: {
          applicants?: number
          application_url: string
          city: string
          company: string
          country: string
          created_at?: string | null
          description: string
          experience: string
          id?: string
          location: string
          requirements: string
          salary?: string | null
          slots?: number
          title: string
          type: string
          updated_at?: string | null
          user_id: string
          work_mode: string
        }
        Update: {
          applicants?: number
          application_url?: string
          city?: string
          company?: string
          country?: string
          created_at?: string | null
          description?: string
          experience?: string
          id?: string
          location?: string
          requirements?: string
          salary?: string | null
          slots?: number
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
          work_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_content: {
        Row: {
          click_count: number | null
          content: string
          created_at: string
          created_by: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          open_count: number | null
          recipient_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          click_count?: number | null
          content: string
          created_at?: string
          created_by: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          open_count?: number | null
          recipient_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          click_count?: number | null
          content?: string
          created_at?: string
          created_by?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          open_count?: number | null
          recipient_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_content_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          admin_user_id: string
          created_at: string
          features_enabled: Json
          id: string
          max_users: number
          name: string
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          features_enabled?: Json
          id?: string
          max_users?: number
          name: string
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          features_enabled?: Json
          id?: string
          max_users?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          likes: number | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          likes?: number | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          likes?: number | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          likes: number | null
          link_url: string | null
          shares: number | null
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          likes?: number | null
          link_url?: string | null
          shares?: number | null
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          likes?: number | null
          link_url?: string | null
          shares?: number | null
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      pricing_plans: {
        Row: {
          billing_interval: string
          created_at: string
          currency: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          max_users: number | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          billing_interval?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_users?: number | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          billing_interval?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_users?: number | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      project_candidates: {
        Row: {
          candidate_id: string
          created_at: string | null
          id: string
          notes: string | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_candidates_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_candidates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "employer_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tags: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_posts: {
        Row: {
          created_at: string
          id: string
          original_post_id: string
          share_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_post_id: string
          share_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          original_post_id?: string
          share_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_posts_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          content_key: string
          content_type: string
          content_value: Json
          created_at: string
          description: string | null
          id: string
          updated_at: string
        }
        Insert: {
          content_key: string
          content_type?: string
          content_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          content_key?: string
          content_type?: string
          content_value?: Json
          created_at?: string
          description?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tool_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tool_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_edit_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          requested_changes: Json
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          tool_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          requested_changes?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tool_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          requested_changes?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tool_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_edit_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_edit_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          category_id: string | null
          cons: string[] | null
          created_at: string | null
          description: string
          features: string[] | null
          id: string
          name: string
          pricing: string
          pros: string[] | null
          status: string | null
          subcategory: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          website: string
        }
        Insert: {
          category_id?: string | null
          cons?: string[] | null
          created_at?: string | null
          description: string
          features?: string[] | null
          id?: string
          name: string
          pricing?: string
          pros?: string[] | null
          status?: string | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          website: string
        }
        Update: {
          category_id?: string | null
          cons?: string[] | null
          created_at?: string | null
          description?: string
          features?: string[] | null
          id?: string
          name?: string
          pricing?: string
          pros?: string[] | null
          status?: string | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          website?: string
        }
        Relationships: [
          {
            foreignKeyName: "tools_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tool_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tools_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          account_type: string | null
          admin_access_level: string | null
          age: number | null
          ai_nexus_top_voice: boolean | null
          articles_written: number | null
          bio: string | null
          birth_date: string | null
          city: string | null
          company: string | null
          contact_visible: boolean | null
          country: string | null
          created_at: string | null
          full_name: string | null
          gender: string | null
          github: string | null
          id: string
          interests: string[] | null
          job_title: string | null
          languages: Json | null
          linkedin: string | null
          location: string | null
          newsletter_subscription: boolean | null
          notification_preferences: Json | null
          organization_id: string | null
          phone: string | null
          phone_country_code: string | null
          profile_photo: string | null
          tools_submitted: number | null
          total_engagement: number | null
          total_reach: number | null
          twitter: string | null
          updated_at: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          account_type?: string | null
          admin_access_level?: string | null
          age?: number | null
          ai_nexus_top_voice?: boolean | null
          articles_written?: number | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          company?: string | null
          contact_visible?: boolean | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          gender?: string | null
          github?: string | null
          id: string
          interests?: string[] | null
          job_title?: string | null
          languages?: Json | null
          linkedin?: string | null
          location?: string | null
          newsletter_subscription?: boolean | null
          notification_preferences?: Json | null
          organization_id?: string | null
          phone?: string | null
          phone_country_code?: string | null
          profile_photo?: string | null
          tools_submitted?: number | null
          total_engagement?: number | null
          total_reach?: number | null
          twitter?: string | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          account_type?: string | null
          admin_access_level?: string | null
          age?: number | null
          ai_nexus_top_voice?: boolean | null
          articles_written?: number | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          company?: string | null
          contact_visible?: boolean | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          gender?: string | null
          github?: string | null
          id?: string
          interests?: string[] | null
          job_title?: string | null
          languages?: Json | null
          linkedin?: string | null
          location?: string | null
          newsletter_subscription?: boolean | null
          notification_preferences?: Json | null
          organization_id?: string | null
          phone?: string | null
          phone_country_code?: string | null
          profile_photo?: string | null
          tools_submitted?: number | null
          total_engagement?: number | null
          total_reach?: number | null
          twitter?: string | null
          updated_at?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_tool_edit_request: {
        Args: { request_id_param: string; admin_notes_param?: string }
        Returns: undefined
      }
      create_tool_edit_request: {
        Args: {
          tool_id_param: string
          name_param: string
          description_param: string
          category_id_param: string
          subcategory_param: string
          website_param: string
          pricing_param: string
          features_param: string[]
          pros_param: string[]
          cons_param: string[]
          tags_param: string[]
        }
        Returns: string
      }
      get_pending_edit_requests: {
        Args: { limit_param?: number; offset_param?: number }
        Returns: {
          id: string
          tool_id: string
          tool_name: string
          user_id: string
          user_name: string
          name: string
          description: string
          category_id: string
          category_name: string
          subcategory: string
          website: string
          pricing: string
          features: string[]
          pros: string[]
          cons: string[]
          tags: string[]
          created_at: string
        }[]
      }
      reject_tool_edit_request: {
        Args: { request_id_param: string; admin_notes_param: string }
        Returns: undefined
      }
      update_trending_tools: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_trending_tools_weekly: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
