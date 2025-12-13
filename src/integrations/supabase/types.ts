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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          target_table: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          target_table?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          target_table?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
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
          share_count: number | null
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
          share_count?: number | null
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
          share_count?: number | null
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
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      connection_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          recipient_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          recipient_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          recipient_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          created_at: string
          id: string
          user_1_id: string
          user_2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_1_id: string
          user_2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_1_id?: string
          user_2_id?: string
        }
        Relationships: []
      }
      conversation_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string | null
          id: string
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string | null
          id?: string
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
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
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          cover_image: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_private: boolean | null
          member_count: number | null
          name: string
          updated_at: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      interests: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
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
          share_count: number | null
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
          share_count?: number | null
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
          share_count?: number | null
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
      mentions: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          mentioned_user_id: string
          mentioner_user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          mentioned_user_id: string
          mentioner_user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          mentioned_user_id?: string
          mentioner_user_id?: string
        }
        Relationships: []
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
      newsletter_delivery_log: {
        Row: {
          created_at: string | null
          id: string
          issue_id: string | null
          sent_at: string | null
          status: string | null
          subscriber_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          issue_id?: string | null
          sent_at?: string | null
          status?: string | null
          subscriber_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          issue_id?: string | null
          sent_at?: string | null
          status?: string | null
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_delivery_log_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "newsletter_issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_delivery_log_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_issue_items: {
        Row: {
          blurb_snapshot: string
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          issue_id: string | null
          sort_order: number | null
          title_snapshot: string
          url_snapshot: string
        }
        Insert: {
          blurb_snapshot: string
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          issue_id?: string | null
          sort_order?: number | null
          title_snapshot: string
          url_snapshot: string
        }
        Update: {
          blurb_snapshot?: string
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          issue_id?: string | null
          sort_order?: number | null
          title_snapshot?: string
          url_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_issue_items_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "newsletter_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_issue_recipients: {
        Row: {
          issue_id: string
          subscriber_id: string
        }
        Insert: {
          issue_id: string
          subscriber_id: string
        }
        Update: {
          issue_id?: string
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_issue_recipients_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "newsletter_issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_issue_recipients_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_issues: {
        Row: {
          created_at: string | null
          frequency: string
          id: string
          intro_text: string | null
          outro_text: string | null
          scheduled_for: string | null
          status: string | null
          subject: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          frequency: string
          id?: string
          intro_text?: string | null
          outro_text?: string | null
          scheduled_for?: string | null
          status?: string | null
          subject?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          frequency?: string
          id?: string
          intro_text?: string | null
          outro_text?: string | null
          scheduled_for?: string | null
          status?: string | null
          subject?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      newsletter_subscriber_interests: {
        Row: {
          interest_id: string
          subscriber_id: string
        }
        Insert: {
          interest_id: string
          subscriber_id: string
        }
        Update: {
          interest_id?: string
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_subscriber_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_subscriber_interests_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string | null
          email: string
          frequency: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          frequency: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          frequency?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
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
      post_views: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown
          post_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown
          post_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown
          post_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          likes: number | null
          link_url: string | null
          reach_score: number | null
          share_count: number | null
          shares: number | null
          updated_at: string | null
          user_id: string
          video_url: string | null
          view_count: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          likes?: number | null
          link_url?: string | null
          reach_score?: number | null
          share_count?: number | null
          shares?: number | null
          updated_at?: string | null
          user_id: string
          video_url?: string | null
          view_count?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          likes?: number | null
          link_url?: string | null
          reach_score?: number | null
          share_count?: number | null
          shares?: number | null
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
          view_count?: number | null
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
      reports: {
        Row: {
          admin_notes: string | null
          content_id: string
          content_type: string
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          content_id: string
          content_type: string
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          permission_key: string
          role_id: number
        }
        Insert: {
          created_at?: string
          permission_key: string
          role_id: number
        }
        Update: {
          created_at?: string
          permission_key?: string
          role_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
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
      shares: {
        Row: {
          content_id: string
          content_type: string | null
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type?: string | null
          created_at?: string
          id?: string
          target_id: string
          target_type?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string | null
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
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
      sub_categories: {
        Row: {
          category_id: string
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
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
      tool_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          status: string
          title: string | null
          tool_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          status?: string
          title?: string | null
          tool_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          status?: string
          title?: string | null
          tool_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tools: {
        Row: {
          average_rating: number | null
          category_id: string | null
          cons: string[] | null
          created_at: string | null
          description: string
          features: string[] | null
          free_plan: string | null
          id: string
          is_dark_logo: boolean | null
          is_light_logo: boolean | null
          link_ci: string | null
          logo_url: string | null
          name: string
          name_ci: string | null
          pricing: string
          pros: string[] | null
          review_count: number | null
          share_count: number | null
          status: string | null
          sub_category_ids: string[] | null
          subcategory: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          website: string
        }
        Insert: {
          average_rating?: number | null
          category_id?: string | null
          cons?: string[] | null
          created_at?: string | null
          description: string
          features?: string[] | null
          free_plan?: string | null
          id?: string
          is_dark_logo?: boolean | null
          is_light_logo?: boolean | null
          link_ci?: string | null
          logo_url?: string | null
          name: string
          name_ci?: string | null
          pricing?: string
          pros?: string[] | null
          review_count?: number | null
          share_count?: number | null
          status?: string | null
          sub_category_ids?: string[] | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          website: string
        }
        Update: {
          average_rating?: number | null
          category_id?: string | null
          cons?: string[] | null
          created_at?: string | null
          description?: string
          features?: string[] | null
          free_plan?: string | null
          id?: string
          is_dark_logo?: boolean | null
          is_light_logo?: boolean | null
          link_ci?: string | null
          logo_url?: string | null
          name?: string
          name_ci?: string | null
          pricing?: string
          pros?: string[] | null
          review_count?: number | null
          share_count?: number | null
          status?: string | null
          sub_category_ids?: string[] | null
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          website?: string
        }
        Relationships: [
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
          avatar_url: string | null
          banned_features: Json | null
          bio: string | null
          birth_date: string | null
          city: string | null
          company: string | null
          contact_visible: boolean | null
          country: string | null
          cover_photo: string | null
          created_at: string | null
          display_name: string | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          gender: string | null
          github: string | null
          handle: string | null
          headline: string | null
          id: string
          interests: string[] | null
          is_banned: boolean
          job_title: string | null
          languages: Json | null
          linkedin: string | null
          location: string | null
          newsletter_frequency: string | null
          newsletter_subscription: boolean | null
          notification_preferences: Json | null
          organization_id: string | null
          phone: string | null
          phone_country_code: string | null
          profile_photo: string | null
          role_id: number
          tools_submitted: number | null
          total_engagement: number | null
          total_reach: number | null
          twitter: string | null
          updated_at: string | null
          verified: boolean | null
          visibility: string | null
          website: string | null
        }
        Insert: {
          account_type?: string | null
          admin_access_level?: string | null
          age?: number | null
          ai_nexus_top_voice?: boolean | null
          articles_written?: number | null
          avatar_url?: string | null
          banned_features?: Json | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          company?: string | null
          contact_visible?: boolean | null
          country?: string | null
          cover_photo?: string | null
          created_at?: string | null
          display_name?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          gender?: string | null
          github?: string | null
          handle?: string | null
          headline?: string | null
          id: string
          interests?: string[] | null
          is_banned?: boolean
          job_title?: string | null
          languages?: Json | null
          linkedin?: string | null
          location?: string | null
          newsletter_frequency?: string | null
          newsletter_subscription?: boolean | null
          notification_preferences?: Json | null
          organization_id?: string | null
          phone?: string | null
          phone_country_code?: string | null
          profile_photo?: string | null
          role_id?: number
          tools_submitted?: number | null
          total_engagement?: number | null
          total_reach?: number | null
          twitter?: string | null
          updated_at?: string | null
          verified?: boolean | null
          visibility?: string | null
          website?: string | null
        }
        Update: {
          account_type?: string | null
          admin_access_level?: string | null
          age?: number | null
          ai_nexus_top_voice?: boolean | null
          articles_written?: number | null
          avatar_url?: string | null
          banned_features?: Json | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          company?: string | null
          contact_visible?: boolean | null
          country?: string | null
          cover_photo?: string | null
          created_at?: string | null
          display_name?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          gender?: string | null
          github?: string | null
          handle?: string | null
          headline?: string | null
          id?: string
          interests?: string[] | null
          is_banned?: boolean
          job_title?: string | null
          languages?: Json | null
          linkedin?: string | null
          location?: string | null
          newsletter_frequency?: string | null
          newsletter_subscription?: boolean | null
          notification_preferences?: Json | null
          organization_id?: string | null
          phone?: string | null
          phone_country_code?: string | null
          profile_photo?: string | null
          role_id?: number
          tools_submitted?: number | null
          total_engagement?: number | null
          total_reach?: number | null
          twitter?: string | null
          updated_at?: string | null
          verified?: boolean | null
          visibility?: string | null
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
          {
            foreignKeyName: "user_profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_usage: {
        Row: {
          connection_requests_sent: number
          created_at: string
          id: string
          messages_sent: number
          month_year: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_requests_sent?: number
          created_at?: string
          id?: string
          messages_sent?: number
          month_year: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_requests_sent?: number
          created_at?: string
          id?: string
          messages_sent?: number
          month_year?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      tool_ratings_v: {
        Row: {
          avg_rating: number | null
          reviews_count: number | null
          tool_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_pending_tool: {
        Args: { admin_notes_param?: string; tool_id_param: string }
        Returns: undefined
      }
      approve_tool_edit_request: {
        Args: { admin_notes_param?: string; request_id_param: string }
        Returns: undefined
      }
      are_users_connected: {
        Args: { user1_id: string; user2_id: string }
        Returns: boolean
      }
      backfill_user_handles: { Args: never; Returns: undefined }
      calculate_post_reach_score: {
        Args: { post_id_param: string }
        Returns: number
      }
      create_tool_edit_request: {
        Args: {
          category_id_param: string
          cons_param: string[]
          description_param: string
          features_param: string[]
          name_param: string
          pricing_param: string
          pros_param: string[]
          subcategory_param: string
          tags_param: string[]
          tool_id_param: string
          website_param: string
        }
        Returns: string
      }
      find_or_create_dm: { Args: { other_user_id: string }; Returns: string }
      generate_unique_handle: {
        Args: { base_name: string; user_id: string }
        Returns: string
      }
      get_pending_edit_requests: {
        Args: { limit_param?: number; offset_param?: number }
        Returns: {
          category_id: string
          category_name: string
          cons: string[]
          created_at: string
          description: string
          features: string[]
          id: string
          name: string
          pricing: string
          pros: string[]
          subcategory: string
          tags: string[]
          tool_id: string
          tool_name: string
          user_id: string
          user_name: string
          website: string
        }[]
      }
      get_pending_tools: {
        Args: { limit_param?: number; offset_param?: number }
        Returns: {
          category_id: string
          category_name: string
          cons: string[]
          created_at: string
          description: string
          features: string[]
          id: string
          name: string
          pricing: string
          pros: string[]
          subcategory: string
          tags: string[]
          user_id: string
          user_name: string
          website: string
        }[]
      }
      get_profile_by_handle_or_id: {
        Args: { identifier: string }
        Returns: {
          ai_nexus_top_voice: boolean
          articles_written: number
          bio: string
          company: string
          contact_visible: boolean
          cover_photo: string
          full_name: string
          github: string
          handle: string
          id: string
          interests: string[]
          job_title: string
          linkedin: string
          location: string
          profile_photo: string
          tools_submitted: number
          total_engagement: number
          total_reach: number
          twitter: string
          verified: boolean
          visibility: string
          website: string
        }[]
      }
      get_public_profiles_by_ids: {
        Args: { ids: string[] }
        Returns: {
          ai_nexus_top_voice: boolean
          full_name: string
          handle: string
          id: string
          interests: string[]
          job_title: string
          profile_photo: string
          verified: boolean
        }[]
      }
      get_public_profiles_count: { Args: { search?: string }; Returns: number }
      get_public_user_profiles: {
        Args: { limit_param?: number; offset_param?: number; search?: string }
        Returns: {
          ai_nexus_top_voice: boolean
          bio: string
          city: string
          company: string
          country: string
          full_name: string
          github: string
          id: string
          interests: string[]
          job_title: string
          languages: Json
          linkedin: string
          location: string
          profile_photo: string
          total_engagement: number
          total_reach: number
          twitter: string
          verified: boolean
          website: string
        }[]
      }
      get_top_creators: {
        Args: { limit_param?: number }
        Returns: {
          ai_nexus_top_voice: boolean
          full_name: string
          handle: string
          id: string
          job_title: string
          profile_photo: string
          total_engagement: number
          verified: boolean
        }[]
      }
      get_user_connections_count: {
        Args: { user_id_param: string }
        Returns: number
      }
      get_user_permissions: {
        Args: { user_id_param: string }
        Returns: string[]
      }
      has_permission: {
        Args: { permission_key_param: string; user_id_param: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_following: {
        Args: { follower_uuid: string; following_uuid: string }
        Returns: boolean
      }
      is_user_banned_from_feature: {
        Args: { feature_param: string; user_id_param: string }
        Returns: boolean
      }
      recalc_post_shares: { Args: never; Returns: undefined }
      reject_pending_tool: {
        Args: { admin_notes_param: string; tool_id_param: string }
        Returns: undefined
      }
      reject_tool_edit_request: {
        Args: { admin_notes_param: string; request_id_param: string }
        Returns: undefined
      }
      sync_user_profile_stats: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      track_post_view: {
        Args: {
          ip_address_param?: unknown
          post_id_param: string
          user_agent_param?: string
          user_id_param?: string
        }
        Returns: boolean
      }
      update_tool_rating: {
        Args: { tool_id_param: string }
        Returns: undefined
      }
      update_trending_tools: { Args: never; Returns: undefined }
      update_trending_tools_weekly: { Args: never; Returns: undefined }
      update_user_ban_features: {
        Args: {
          admin_user_id: string
          features_to_ban: string[]
          target_user_id: string
        }
        Returns: boolean
      }
      user_can_access_conversation: {
        Args: { conversation_uuid: string; user_uuid: string }
        Returns: boolean
      }
      user_profile_exists: { Args: { user_id_param: string }; Returns: boolean }
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
