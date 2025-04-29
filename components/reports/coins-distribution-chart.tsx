"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface CoinsDistributionChartProps {
  course: string
}

export function CoinsDistributionChart({ course }: CoinsDistributionChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  useEffect(() => {
    fetchData()
  }, [course])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch balances with user info
      let query = supabase.from("balances").select("coins, users!inner(role, course)").eq("users.role", "student")

      if (course !== "all") {
        query = query.eq("users.course", course)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      // Group coins into ranges
      const ranges = [
        { name: "0-20 FC", min: 0, max: 20, value: 0 },
        { name: "21-50 FC", min: 21, max: 50, value: 0 },
        { name: "51-100 FC", min: 51, max: 100, value: 0 },
        { name: "101-200 FC", min: 101, max: 200, value: 0 },
        { name: "200+ FC", min: 201, max: Number.POSITIVE_INFINITY, value: 0 },
      ]

      data.forEach((item) => {
        const coins = item.coins
        const range = ranges.find((r) => coins >= r.min && coins <= r.max)
        if (range) {
          range.value++
        }
      })

      // Filter out ranges with zero value
      const filteredRanges = ranges.filter((range) => range.value > 0)

      setData(filteredRanges)
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
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={true}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value} estudiantes`, "Cantidad"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
