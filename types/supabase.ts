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
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          type: 'company' | 'team'
          domain: string | null
          settings: Json | null
          description: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type?: 'company' | 'team'
          domain?: string | null
          settings?: Json | null
          description?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'company' | 'team'
          domain?: string | null
          settings?: Json | null
          description?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_organizations: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          role: string
          joined_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          role: string
          joined_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          role?: string
          joined_at?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_organizations_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      project_users: {
        Row: {
          id: string
          user_id: string
          project_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          role: string
          joined_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          role?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_users_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_users_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      buckets: {
        Row: {
          id: string
          name: string
          type: string
          color: string
          order: number
          user_id: string
          organization_id: string
          project_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          color?: string
          order?: number
          user_id: string
          organization_id: string
          project_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          color?: string
          order?: number
          user_id?: string
          organization_id?: string
          project_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buckets_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buckets_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buckets_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          priority: string
          status: string
          due_date: string | null
          category: string | null
          notes: string | null
          assigned_to: string | null
          started_at: string | null
          completed_at: string | null
          completed_by: string | null
          user_id: string
          organization_id: string
          project_id: string | null
          bucket_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          priority: string
          status: string
          due_date?: string | null
          category?: string | null
          notes?: string | null
          assigned_to?: string | null
          started_at?: string | null
          completed_at?: string | null
          completed_by?: string | null
          user_id: string
          organization_id: string
          project_id?: string | null
          bucket_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          priority?: string
          status?: string
          due_date?: string | null
          category?: string | null
          notes?: string | null
          assigned_to?: string | null
          started_at?: string | null
          completed_at?: string | null
          completed_by?: string | null
          user_id?: string
          organization_id?: string
          project_id?: string | null
          bucket_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_bucket_id_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_completed_by_fkey"
            columns: ["completed_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notes: {
        Row: {
          id: string
          title: string
          content: string
          category: string
          tags: string[]
          is_pinned: boolean
          user_id: string
          organization_id: string
          project_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          category: string
          tags: string[]
          is_pinned?: boolean
          user_id: string
          organization_id: string
          project_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          category?: string
          tags?: string[]
          is_pinned?: boolean
          user_id?: string
          organization_id?: string
          project_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      invitations: {
        Row: {
          id: string
          email: string
          organization_id: string
          role: string
          token: string
          expires_at: string
          accepted_at: string | null
          invited_by: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          organization_id: string
          role: string
          token: string
          expires_at: string
          accepted_at?: string | null
          invited_by: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          organization_id?: string
          role?: string
          token?: string
          expires_at?: string
          accepted_at?: string | null
          invited_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
