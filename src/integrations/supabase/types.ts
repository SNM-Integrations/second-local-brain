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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_settings: {
        Row: {
          created_at: string
          id: string
          model: string
          system_prompt: string
          temperature: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          model?: string
          system_prompt?: string
          temperature?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          model?: string
          system_prompt?: string
          temperature?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          end_time: string
          google_calendar_id: string | null
          google_event_id: string | null
          id: string
          is_synced: boolean
          location: string | null
          organization_id: string | null
          project_id: string | null
          start_time: string
          title: string
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["resource_visibility"]
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          end_time: string
          google_calendar_id?: string | null
          google_event_id?: string | null
          id?: string
          is_synced?: boolean
          location?: string | null
          organization_id?: string | null
          project_id?: string | null
          start_time: string
          title: string
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["resource_visibility"]
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          end_time?: string
          google_calendar_id?: string | null
          google_event_id?: string | null
          id?: string
          is_synced?: boolean
          location?: string | null
          organization_id?: string | null
          project_id?: string | null
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["resource_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          user_id?: string
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
      companies: {
        Row: {
          assigned_to: string | null
          company_type: Database["public"]["Enums"]["company_type"]
          created_at: string
          employees: number | null
          id: string
          industry: string | null
          name: string
          notes: string | null
          organization_id: string | null
          revenue: string | null
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["resource_visibility"]
          website: string | null
        }
        Insert: {
          assigned_to?: string | null
          company_type?: Database["public"]["Enums"]["company_type"]
          created_at?: string
          employees?: number | null
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          organization_id?: string | null
          revenue?: string | null
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["resource_visibility"]
          website?: string | null
        }
        Update: {
          assigned_to?: string | null
          company_type?: Database["public"]["Enums"]["company_type"]
          created_at?: string
          employees?: number | null
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          organization_id?: string | null
          revenue?: string | null
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["resource_visibility"]
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          assigned_to: string | null
          call_started_at: string | null
          call_status: string | null
          city: string | null
          company: string | null
          company_id: string | null
          contact_type: Database["public"]["Enums"]["contact_type"]
          created_at: string
          email: string | null
          end_date: string | null
          estimated_hours: number | null
          id: string
          job_description: string | null
          last_call_at: string | null
          last_call_duration: number | null
          name: string
          notes: string | null
          organization_id: string | null
          personal_number: string | null
          phone: string | null
          role: string | null
          rot_rut_info: string | null
          seventime_customer_id: string | null
          seventime_workorder_id: string | null
          start_date: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["resource_visibility"]
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          call_started_at?: string | null
          call_status?: string | null
          city?: string | null
          company?: string | null
          company_id?: string | null
          contact_type?: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          email?: string | null
          end_date?: string | null
          estimated_hours?: number | null
          id?: string
          job_description?: string | null
          last_call_at?: string | null
          last_call_duration?: number | null
          name: string
          notes?: string | null
          organization_id?: string | null
          personal_number?: string | null
          phone?: string | null
          role?: string | null
          rot_rut_info?: string | null
          seventime_customer_id?: string | null
          seventime_workorder_id?: string | null
          start_date?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["resource_visibility"]
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          call_started_at?: string | null
          call_status?: string | null
          city?: string | null
          company?: string | null
          company_id?: string | null
          contact_type?: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          email?: string | null
          end_date?: string | null
          estimated_hours?: number | null
          id?: string
          job_description?: string | null
          last_call_at?: string | null
          last_call_duration?: number | null
          name?: string
          notes?: string | null
          organization_id?: string | null
          personal_number?: string | null
          phone?: string | null
          role?: string | null
          rot_rut_info?: string | null
          seventime_customer_id?: string | null
          seventime_workorder_id?: string | null
          start_date?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["resource_visibility"]
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          title: string | null
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["resource_visibility"]
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["resource_visibility"]
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["resource_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          assigned_to: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          expected_close_date: string | null
          id: string
          notes: string | null
          organization_id: string | null
          project_id: string | null
          stage: string
          title: string
          updated_at: string
          user_id: string
          value: number | null
          visibility: Database["public"]["Enums"]["resource_visibility"]
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          project_id?: string | null
          stage?: string
          title: string
          updated_at?: string
          user_id: string
          value?: number | null
          visibility?: Database["public"]["Enums"]["resource_visibility"]
        }
        Update: {
          assigned_to?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          project_id?: string | null
          stage?: string
          title?: string
          updated_at?: string
          user_id?: string
          value?: number | null
          visibility?: Database["public"]["Enums"]["resource_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      google_auth_tokens: {
        Row: {
          access_token: string
          created_at: string
          display_name: string | null
          expires_at: string
          google_email: string | null
          id: string
          organization_id: string | null
          refresh_token: string
          scopes: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          display_name?: string | null
          expires_at: string
          google_email?: string | null
          id?: string
          organization_id?: string | null
          refresh_token: string
          scopes?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          display_name?: string | null
          expires_at?: string
          google_email?: string | null
          id?: string
          organization_id?: string | null
          refresh_token?: string
          scopes?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_auth_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_settings: {
        Row: {
          created_at: string
          id: string
          integration_type: string
          organization_id: string | null
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          integration_type: string
          organization_id?: string | null
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          integration_type?: string
          organization_id?: string | null
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          calendar_event_id: string | null
          created_at: string
          end_time: string | null
          id: string
          participants: string[] | null
          start_time: string
          status: string
          summary: string | null
          title: string
          transcript: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calendar_event_id?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          participants?: string[] | null
          start_time?: string
          status?: string
          summary?: string | null
          title: string
          transcript?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calendar_event_id?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          participants?: string[] | null
          start_time?: string
          status?: string
          summary?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_calendar_event_id_fkey"
            columns: ["calendar_event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      note_connections: {
        Row: {
          created_at: string
          id: string
          similarity_score: number | null
          source_note_id: string
          target_note_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          similarity_score?: number | null
          source_note_id: string
          target_note_id: string
        }
        Update: {
          created_at?: string
          id?: string
          similarity_score?: number | null
          source_note_id?: string
          target_note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_connections_source_note_id_fkey"
            columns: ["source_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_connections_target_note_id_fkey"
            columns: ["target_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_embeddings: {
        Row: {
          created_at: string
          embedding: string | null
          id: string
          note_id: string
        }
        Insert: {
          created_at?: string
          embedding?: string | null
          id?: string
          note_id: string
        }
        Update: {
          created_at?: string
          embedding?: string | null
          id?: string
          note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_embeddings_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: true
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          audio_url: string | null
          category_id: string | null
          content: string
          created_at: string
          drive_file_id: string | null
          folder_path: string[] | null
          formatted_content: string | null
          id: string
          is_folder: boolean | null
          meeting_id: string | null
          mime_type: string | null
          note_type: Database["public"]["Enums"]["note_type"]
          organization_id: string | null
          parent_note_id: string | null
          transcript: string | null
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["resource_visibility"]
        }
        Insert: {
          audio_url?: string | null
          category_id?: string | null
          content: string
          created_at?: string
          drive_file_id?: string | null
          folder_path?: string[] | null
          formatted_content?: string | null
          id?: string
          is_folder?: boolean | null
          meeting_id?: string | null
          mime_type?: string | null
          note_type?: Database["public"]["Enums"]["note_type"]
          organization_id?: string | null
          parent_note_id?: string | null
          transcript?: string | null
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["resource_visibility"]
        }
        Update: {
          audio_url?: string | null
          category_id?: string | null
          content?: string
          created_at?: string
          drive_file_id?: string | null
          folder_path?: string[] | null
          formatted_content?: string | null
          id?: string
          is_folder?: boolean | null
          meeting_id?: string | null
          mime_type?: string | null
          note_type?: Database["public"]["Enums"]["note_type"]
          organization_id?: string | null
          parent_note_id?: string | null
          transcript?: string | null
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["resource_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "notes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_parent_note_id_fkey"
            columns: ["parent_note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
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
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_documents: {
        Row: {
          content: string | null
          created_at: string
          drive_file_id: string | null
          file_path: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          project_id: string
          type: Database["public"]["Enums"]["document_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          drive_file_id?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          project_id: string
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          drive_file_id?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          project_id?: string
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          assigned_to: string | null
          color: string | null
          company_id: string | null
          created_at: string
          description: string | null
          drive_folder_id: string | null
          drive_folder_name: string | null
          drive_last_synced_at: string | null
          id: string
          name: string
          organization_id: string | null
          status: string
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["resource_visibility"]
        }
        Insert: {
          assigned_to?: string | null
          color?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          drive_folder_id?: string | null
          drive_folder_name?: string | null
          drive_last_synced_at?: string | null
          id?: string
          name: string
          organization_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["resource_visibility"]
        }
        Update: {
          assigned_to?: string | null
          color?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          drive_folder_id?: string | null
          drive_folder_name?: string | null
          drive_last_synced_at?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["resource_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      slack_conversations: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          slack_channel_id: string
          slack_thread_ts: string | null
          slack_workspace_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          slack_channel_id: string
          slack_thread_ts?: string | null
          slack_workspace_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          slack_channel_id?: string
          slack_thread_ts?: string | null
          slack_workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slack_conversations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      slack_user_mappings: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          slack_user_id: string
          slack_username: string | null
          slack_workspace_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          slack_user_id: string
          slack_username?: string | null
          slack_workspace_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          slack_user_id?: string
          slack_username?: string | null
          slack_workspace_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slack_user_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category_id: string | null
          completed: boolean
          created_at: string
          description: string | null
          due_date: string | null
          google_event_id: string | null
          id: string
          meeting_id: string | null
          notification_settings: string[] | null
          notifications_sent: string[] | null
          organization_id: string | null
          parent_task_id: string | null
          priority: string
          project_id: string | null
          title: string
          updated_at: string
          user_id: string
          visibility: Database["public"]["Enums"]["resource_visibility"]
        }
        Insert: {
          assigned_to?: string | null
          category_id?: string | null
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          google_event_id?: string | null
          id?: string
          meeting_id?: string | null
          notification_settings?: string[] | null
          notifications_sent?: string[] | null
          organization_id?: string | null
          parent_task_id?: string | null
          priority?: string
          project_id?: string | null
          title: string
          updated_at?: string
          user_id: string
          visibility?: Database["public"]["Enums"]["resource_visibility"]
        }
        Update: {
          assigned_to?: string | null
          category_id?: string | null
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          google_event_id?: string | null
          id?: string
          meeting_id?: string | null
          notification_settings?: string[] | null
          notifications_sent?: string[] | null
          organization_id?: string | null
          parent_task_id?: string | null
          priority?: string
          project_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: Database["public"]["Enums"]["resource_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization: { Args: { org_name: string }; Returns: string }
      get_user_org_ids: { Args: { _user_id: string }; Returns: string[] }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      match_notes: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
          user_id_param: string
        }
        Returns: {
          category_id: string
          category_name: string
          content: string
          id: string
          similarity: number
        }[]
      }
    }
    Enums: {
      company_type: "lead" | "client"
      contact_type: "contact" | "lead"
      document_type: "file" | "document"
      note_type: "original" | "extracted"
      org_role: "owner" | "admin" | "member"
      resource_visibility: "personal" | "organization"
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
      company_type: ["lead", "client"],
      contact_type: ["contact", "lead"],
      document_type: ["file", "document"],
      note_type: ["original", "extracted"],
      org_role: ["owner", "admin", "member"],
      resource_visibility: ["personal", "organization"],
    },
  },
} as const
