import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient()
    const adminEmail = "admin@supadmin.com"
    const adminPassword = "Amerie24Orion"

    // Verificar si el usuario ya existe en Auth
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      throw new Error(`Error al listar usuarios: ${authError.message}`)
    }

    const adminUser = authData.users.find((user) => user.email === adminEmail)

    if (!adminUser) {
      // Crear el usuario administrador en Auth
      const { data: newAuthData, error: newAuthError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
      })

      if (newAuthError) {
        throw new Error(`Error al crear usuario administrador: ${newAuthError.message}`)
      }

      if (!newAuthData.user) {
        throw new Error("No se pudo crear el usuario administrador")
      }

      // Crear el perfil de administrador en la tabla users
      const { error: userError } = await supabase.from("users").insert({
        id: newAuthData.user.id,
        email: adminEmail,
        full_name: "Administrador del Sistema",
        role: "admin",
      })

      if (userError) {
        throw new Error(`Error al crear perfil de administrador: ${userError.message}`)
      }

      // Crear balance inicial (por consistencia)
      const { error: balanceError } = await supabase.from("balances").insert({
        user_id: newAuthData.user.id,
        coins: 0,
      })

      if (balanceError) {
        console.warn(`Advertencia: Error al crear balance de administrador: ${balanceError.message}`)
      }

      return NextResponse.json({
        success: true,
        message: "Usuario administrador creado correctamente",
        userId: newAuthData.user.id,
      })
    }

    // Verificar si el usuario existe en la tabla users
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("email", adminEmail)
      .maybeSingle()

    if (userError) {
      console.warn(`Advertencia: Error al buscar usuario en la base de datos: ${userError.message}`)
    }

    if (!userData) {
      // Crear el perfil de administrador en la tabla users
      const { error: insertError } = await supabase.from("users").insert({
        id: adminUser.id,
        email: adminEmail,
        full_name: "Administrador del Sistema",
        role: "admin",
      })

      if (insertError) {
        throw new Error(`Error al crear perfil de administrador: ${insertError.message}`)
      }

      // Crear balance inicial
      const { error: balanceError } = await supabase.from("balances").insert({
        user_id: adminUser.id,
        coins: 0,
      })

      if (balanceError) {
        console.warn(`Advertencia: Error al crear balance de administrador: ${balanceError.message}`)
      }

      return NextResponse.json({
        success: true,
        message: "Perfil de administrador creado correctamente",
        userId: adminUser.id,
      })
    } else if (userData.role !== "admin") {
      // Actualizar el rol a administrador
      const { error: updateError } = await supabase.from("users").update({ role: "admin" }).eq("id", userData.id)

      if (updateError) {
        throw new Error(`Error al actualizar rol de administrador: ${updateError.message}`)
      }

      return NextResponse.json({
        success: true,
        message: "Rol de administrador actualizado correctamente",
        userId: userData.id,
      })
    }

    // Actualizar la contraseña del administrador por si ha cambiado
    const { error: updatePasswordError } = await supabase.auth.admin.updateUserById(adminUser.id, {
      password: adminPassword,
    })

    if (updatePasswordError) {
      console.warn(`Advertencia: Error al actualizar contraseña: ${updatePasswordError.message}`)
    }

    return NextResponse.json({
      success: true,
      message: "El usuario administrador ya existe y está configurado correctamente",
      userId: adminUser.id,
    })
  } catch (error: any) {
    console.error("Error en setup-admin:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
