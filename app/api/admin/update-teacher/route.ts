import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient()
    const email = "m.chiodini25@gmail.com"

    // First, find the user by email
    const { data: userData, error: userError } = await supabase.from("users").select("id").eq("email", email).single()

    if (userError) {
      if (userError.code === "PGRST116") {
        // User not found, we need to check if they exist in auth but not in our users table
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

        if (authError) {
          throw new Error(`Error checking auth users: ${authError.message}`)
        }

        const authUser = authData.users.find((user) => user.email === email)

        if (!authUser) {
          throw new Error(`User with email ${email} not found in authentication system`)
        }

        // User exists in auth but not in our users table, create a record
        const { error: insertError } = await supabase.from("users").insert({
          id: authUser.id,
          email: email,
          full_name: "M. Chiodini", // Use a better name
          role: "teacher",
        })

        if (insertError) {
          throw new Error(`Error creating user record: ${insertError.message}`)
        }

        // Create initial balance record
        const { error: balanceError } = await supabase.from("balances").insert({
          user_id: authUser.id,
          coins: 0,
        })

        if (balanceError) {
          throw new Error(`Error creating balance record: ${balanceError.message}`)
        }

        return NextResponse.json({ success: true, message: `User ${email} created with role teacher` })
      } else {
        throw new Error(`Error finding user: ${userError.message}`)
      }
    }

    // User found, update their role
    const { error: updateError } = await supabase.from("users").update({ role: "teacher" }).eq("id", userData.id)

    if (updateError) {
      throw new Error(`Error updating user role: ${updateError.message}`)
    }

    return NextResponse.json({ success: true, message: `User ${email} role updated to teacher` })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
