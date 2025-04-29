"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface TransactionsOverTimeChartProps {
  course: string
}

export function TransactionsOverTimeChart({ course }: TransactionsOverTimeChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [course])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch transactions with user info
      let query = supabase
        .from("transactions")
        .select("amount, transaction_type, created_at, users!inner(role, course)")
        .eq("users.role", "student")
        .order("created_at", { ascending: true })

      if (course !== "all") {
        query = query.eq("users.course", course)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      // Group transactions by month
      const groupedByMonth: Record<string, { adds: number; subtracts: number; redeems: number }> = {}

      data.forEach((transaction) => {
        const date = new Date(transaction.created_at)
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`

        if (!groupedByMonth[monthYear]) {
          groupedByMonth[monthYear] = { adds: 0, subtracts: 0, redeems: 0 }
        }

        if (transaction.transaction_type === "add") {
          groupedByMonth[monthYear].adds += 1
        } else if (transaction.transaction_type === "subtract") {
          groupedByMonth[monthYear].subtracts += 1
        } else if (transaction.transaction_type === "redeem") {
          groupedByMonth[monthYear].redeems += 1
        }
      })

      // Convert to array for chart
      const chartData = Object.keys(groupedByMonth).map((month) => ({
        month,
        Añadidas: groupedByMonth[month].adds,
        Descontadas: groupedByMonth[month].subtracts,
        Canjeadas: groupedByMonth[month].redeems,
      }))

      setData(chartData)
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
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Añadidas" stroke="#4ade80" activeDot={{ r: 8 }} />
        <Line type="monotone" dataKey="Descontadas" stroke="#f87171" />
        <Line type="monotone" dataKey="Canjeadas" stroke="#60a5fa" />
      </LineChart>
    </ResponsiveContainer>
  )
}
