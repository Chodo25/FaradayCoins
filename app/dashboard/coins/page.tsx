"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Zap, Clock } from "lucide-react"
import type { Tables } from "@/types/supabase"
import { DemoModeBanner } from "@/components/demo-mode-banner"

export default function CoinsPage() {
  const [user, setUser] = useState<any>(null)
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<Tables<"transactions">[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          return
        }

        setUser(session.user)

        // Fetch balance - SIMPLIFIED to avoid recursion
        try {
          const { data: balanceData, error: balanceError } = await supabase
            .from("balances")
            .select("coins")
            .eq("user_id", session.user.id)
            .maybeSingle()

          if (balanceError) {
            console.error("Error fetching balance:", balanceError)
            setError(`Error fetching balance: ${balanceError.message}`)
          } else if (balanceData) {
            setBalance(balanceData.coins)
          }
        } catch (balanceError: any) {
          console.error("Exception fetching balance:", balanceError)
          setError(`Exception fetching balance: ${balanceError.message}`)
        }

        // Fetch all transactions - SIMPLIFIED to avoid recursion
        try {
          const { data: transactionsData, error: transactionsError } = await supabase
            .from("transactions")
            .select("*")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false })

          if (transactionsError) {
            console.error("Error fetching transactions:", transactionsError)
          } else {
            setTransactions(transactionsData || [])
          }
        } catch (transactionsError: any) {
          console.error("Exception fetching transactions:", transactionsError)
        }

        setLoading(false)
      } catch (error: any) {
        console.error("Error in fetchData:", error)
        setError(`Error in fetchData: ${error.message}`)
        setLoading(false)
      }
    }

    fetchData()

    // Set up real-time subscription for balance updates - SIMPLIFIED
    const balanceSubscription = supabase
      .channel("balance-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "balances",
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          setBalance(payload.new.coins)
        },
      )
      .subscribe()

    // Set up real-time subscription for transaction updates - SIMPLIFIED
    const transactionSubscription = supabase
      .channel("transaction-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          setTransactions((prev) => [payload.new, ...prev])
        },
      )
      .subscribe()

    return () => {
      balanceSubscription.unsubscribe()
      transactionSubscription.unsubscribe()
    }
  }, [user?.id])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {error && <DemoModeBanner error={error} />}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis Monedas</h1>
          <p className="text-muted-foreground">Administra tus Faraday Coins y revisa tu historial de transacciones</p>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">Saldo Actual</CardTitle>
            <Zap className="h-6 w-6 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{balance} FC</div>
            <p className="text-sm text-muted-foreground">Faraday Coins disponibles para canjear</p>
          </CardContent>
        </Card>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="received">Recibidas</TabsTrigger>
            <TabsTrigger value="spent">Gastadas</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Todas las Transacciones</CardTitle>
                <CardDescription>Historial completo de movimientos de tus Faraday Coins</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`rounded-full p-2 ${
                              transaction.transaction_type === "add"
                                ? "bg-green-100"
                                : transaction.transaction_type === "subtract"
                                  ? "bg-red-100"
                                  : "bg-blue-100"
                            }`}
                          >
                            {transaction.transaction_type === "add" ? (
                              <Zap className="h-4 w-4 text-green-500" />
                            ) : transaction.transaction_type === "subtract" ? (
                              <Zap className="h-4 w-4 text-red-500" />
                            ) : (
                              <Zap className="h-4 w-4 text-blue-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {transaction.transaction_type === "add"
                                ? "Monedas recibidas"
                                : transaction.transaction_type === "subtract"
                                  ? "Monedas descontadas"
                                  : "Canje de recompensa"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.description || "Sin descripción"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <p
                            className={`text-sm font-medium ${
                              transaction.transaction_type === "add" ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {transaction.transaction_type === "add" ? "+" : "-"}
                            {transaction.amount} FC
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(transaction.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No hay transacciones para mostrar</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="received">
            <Card>
              <CardHeader>
                <CardTitle>Monedas Recibidas</CardTitle>
                <CardDescription>Historial de Faraday Coins que has recibido</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.filter((t) => t.transaction_type === "add").length > 0 ? (
                  <div className="space-y-4">
                    {transactions
                      .filter((t) => t.transaction_type === "add")
                      .map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="rounded-full p-2 bg-green-100">
                              <Zap className="h-4 w-4 text-green-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Monedas recibidas</p>
                              <p className="text-xs text-muted-foreground">
                                {transaction.description || "Sin descripción"}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <p className="text-sm font-medium text-green-500">+{transaction.amount} FC</p>
                            <p className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {new Date(transaction.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No has recibido monedas aún</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="spent">
            <Card>
              <CardHeader>
                <CardTitle>Monedas Gastadas</CardTitle>
                <CardDescription>Historial de Faraday Coins que has gastado o canjeado</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.filter((t) => t.transaction_type === "subtract" || t.transaction_type === "redeem")
                  .length > 0 ? (
                  <div className="space-y-4">
                    {transactions
                      .filter((t) => t.transaction_type === "subtract" || t.transaction_type === "redeem")
                      .map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className={`rounded-full p-2 ${
                                transaction.transaction_type === "subtract" ? "bg-red-100" : "bg-blue-100"
                              }`}
                            >
                              <Zap className="h-4 w-4 text-red-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {transaction.transaction_type === "subtract"
                                  ? "Monedas descontadas"
                                  : "Canje de recompensa"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {transaction.description || "Sin descripción"}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <p className="text-sm font-medium text-red-500">-{transaction.amount} FC</p>
                            <p className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {new Date(transaction.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No has gastado monedas aún</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
