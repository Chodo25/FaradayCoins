import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

// Use the provided Supabase credentials
const supabaseUrl = "https://pgtpyopvowlkrpiuyuue.supabase.co"
const supabaseServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBndHB5b3B2b3dsa3JwaXV5dXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3ODM5MDgsImV4cCI6MjA2MTM1OTkwOH0.q0rQZytvW_0MTkZY-iz3ppYi3tL2OAQ_G7nJuQzPJ0Q"

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(supabaseUrl, supabaseServiceKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
    auth: {
      persistSession: true,
      // Usamos un storage key único para el cliente del servidor
      storageKey: "faraday-coins-server-key",
    },
  })
}
