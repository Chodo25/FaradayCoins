export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          course: string | null
          role: "student" | "teacher" | "admin"
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          course?: string | null
          role: "student" | "teacher" | "admin"
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          course?: string | null
          role?: "student" | "teacher" | "admin"
          created_at?: string
        }
      }
      balances: {
        Row: {
          id: string
          user_id: string
          coins: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          coins?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          coins?: number
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          description: string | null
          transaction_type: "add" | "subtract" | "redeem"
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          description?: string | null
          transaction_type: "add" | "subtract" | "redeem"
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          description?: string | null
          transaction_type?: "add" | "subtract" | "redeem"
          created_by?: string | null
          created_at?: string
        }
      }
      rewards: {
        Row: {
          id: string
          name: string
          description: string | null
          cost: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          cost: number
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          cost?: number
          active?: boolean
          created_at?: string
        }
      }
      reward_redemptions: {
        Row: {
          id: string
          user_id: string
          reward_id: string
          redeemed_at: string
          status: "pending" | "approved" | "rejected"
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          reward_id: string
          redeemed_at?: string
          status?: "pending" | "approved" | "rejected"
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          reward_id?: string
          redeemed_at?: string
          status?: "pending" | "approved" | "rejected"
          notes?: string | null
        }
      }
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type Insertable<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type Updatable<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]
