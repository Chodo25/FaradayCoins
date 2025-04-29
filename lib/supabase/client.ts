import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Usamos un patrón singleton para asegurarnos de que solo haya una instancia del cliente
let supabaseInstance: ReturnType<typeof createClient> | null = null

// Use environment variables with fallback to hardcoded values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://pgtpyopvowlkrpiuyuue.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBndHB5b3B2b3dsa3JwaXV5dXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3ODM5MDgsImV4cCI6MjA2MTM1OTkwOH0.q0rQZytvW_0MTkZY-iz3ppYi3tL2OAQ_G7nJuQzPJ0Q"

// Create the Supabase client
export const supabase = getSupabaseClient()

// Función para obtener o crear el cliente de Supabase
function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      // Usamos un storage key único para evitar conflictos
      storageKey: "faraday-coins-storage-key",
    },
  })

  return supabaseInstance
}
