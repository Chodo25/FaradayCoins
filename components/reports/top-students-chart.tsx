"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface TopStudentsChartProps {
  course: string
}

export function TopStudentsChart({ course }: TopStudentsChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [course])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch students with their balances
      let query = supabase
        .from("users")
        .select(`
          full_name,
          course,
          balances (coins)
        `)
        .eq("role", "student")

      if (course !== "all") {
        query = query.eq("course", course)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      // Format data for chart
      const formattedData = data
        .map((student) => {
          const coins = student.balances && student.balances.length > 0 ? student.balances[0].coins : 0
          return {
            name: student.full_name,
            coins,
            course: student.course || "No asignado",
          }
        })
        .sort((a, b) => b.coins - a.coins)
        .slice(0, 10) // Get top 10 students

      setData(formattedData)
      setLoading(false)
    } catch (error: any) {
      toast({
        title: "Error al cargar datos",
        description: error.message,
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{
          top: 5,
          right: 30,
          left: 100,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="name" width={100} />
        <Tooltip formatter={(value) => [`${value} FC`, "Monedas"]} />
        <Legend />
        <Bar dataKey="coins" fill="#facc15" name="Faraday Coins" />
      </BarChart>
    </ResponsiveContainer>
  )
}
