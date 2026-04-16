"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Globe,
} from "lucide-react"

// Tipagem da transação baseada no teu Prisma
interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  transactionType: string
  nature: string
  installmentsCount: number
  currentInstallment?: number
  installmentValue?: number
  isRecurring: boolean
  date: string
}

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [inputText, setInputText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Novos estados para a gestão de visualização
  const [viewMode, setViewMode] = useState<"GERAL" | "MENSAL">("GERAL")
  const [currentDate, setCurrentDate] = useState(new Date())

  // Busca os dados iniciais
  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/transactions")
      const data = await res.json()
      setTransactions(data)
    } catch (error) {
      console.error("Erro ao buscar transações:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      })

      if (res.ok) {
        setInputText("")
        fetchTransactions() // Recarrega a lista
      }
    } catch (error) {
      console.error("Erro ao registar:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Funções para navegar nos meses
  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    )
  }

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    )
  }

  // NOME DO MÊS FORMATADO
  const monthName = currentDate.toLocaleString("pt-BR", {
    month: "long",
    year: "numeric",
  })
  const capitalizedMonthName =
    monthName.charAt(0).toUpperCase() + monthName.slice(1)

  // LÓGICA DE FILTRAGEM
  const filteredTransactions = useMemo(() => {
    if (viewMode === "GERAL") return transactions

    const targetMonth = currentDate.getMonth()
    const targetYear = currentDate.getFullYear()

    return transactions.filter((tx) => {
      const txDate = new Date(tx.date)
      const txMonth = txDate.getMonth()
      const txYear = txDate.getFullYear()

      if (tx.isRecurring || tx.transactionType === "RECURRING") {
        if (txYear < targetYear) return true
        if (txYear === targetYear && txMonth <= targetMonth) return true
        return false
      }

      return txMonth === targetMonth && txYear === targetYear
    })
  }, [transactions, viewMode, currentDate])

  // CALCULAR TOTAIS
  const { income, expense, balance } = useMemo(() => {
    let inc = 0
    let exp = 0

    filteredTransactions.forEach((tx) => {
      const val =
        tx.transactionType === "INSTALLMENT" && tx.installmentValue
          ? Number(tx.installmentValue)
          : Number(tx.amount)

      if (tx.nature === "INCOME") inc += val
      else exp += val
    })

    return { income: inc, expense: exp, balance: inc - exp }
  }, [filteredTransactions])

  // LÓGICA DE SALDO GERAL ACUMULADO
  const accumulatedBalance = useMemo(() => {
    let acc = 0
    const targetMonth = currentDate.getMonth()
    const targetYear = currentDate.getFullYear()

    transactions.forEach((tx) => {
      const txDate = new Date(tx.date)
      const txMonth = txDate.getMonth()
      const txYear = txDate.getFullYear()

      const val =
        tx.transactionType === "INSTALLMENT" && tx.installmentValue
          ? Number(tx.installmentValue)
          : Number(tx.amount)

      const sign = tx.nature === "INCOME" ? 1 : -1

      if (tx.isRecurring || tx.transactionType === "RECURRING") {
        if (
          txYear < targetYear ||
          (txYear === targetYear && txMonth <= targetMonth)
        ) {
          const monthsPassed =
            (targetYear - txYear) * 12 + (targetMonth - txMonth) + 1
          acc += val * sign * monthsPassed
        }
      } else {
        if (
          txYear < targetYear ||
          (txYear === targetYear && txMonth <= targetMonth)
        ) {
          acc += val * sign
        }
      }
    })

    return acc
  }, [transactions, currentDate])

  // Cores de categorias
  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      TRANSPORTE: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10",
      ALIMENTACAO: "text-orange-500 border-orange-500/30 bg-orange-500/10",
      MORADIA: "text-blue-500 border-blue-500/30 bg-blue-500/10",
      COMPRAS: "text-purple-500 border-purple-500/30 bg-purple-500/10",
      EDUCACAO: "text-cyan-500 border-cyan-500/30 bg-cyan-500/10",
      RENDIMENTO: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
      ASSINATURAS: "text-rose-500 border-rose-500/30 bg-rose-500/10",
      OUTROS: "text-zinc-400 border-zinc-500/30 bg-zinc-500/10",
    }
    return colors[cat] || colors["OUTROS"]
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 md:p-3 bg-indigo-600/20 text-indigo-400 rounded-xl">
              <Wallet className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Shinji Okane
              </h1>
              <p className="text-zinc-400 text-xs md:text-sm">
                Analista de Despesas com IA
              </p>
            </div>
          </div>

          <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-lg shrink-0">
            <button
              onClick={() => {
                setViewMode("GERAL")
                setCurrentDate(new Date())
              }}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-all ${viewMode === "GERAL" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" /> Geral
            </button>
            <button
              onClick={() => setViewMode("MENSAL")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-all ${viewMode === "MENSAL" ? "bg-indigo-600/20 text-indigo-400 shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}
            >
              <CalendarDays className="w-3.5 h-3.5 md:w-4 md:h-4" /> Mensal
            </button>
          </div>
        </header>

        {/* NAVEGAÇÃO DO MÊS */}
        {viewMode === "MENSAL" && (
          <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-4 bg-zinc-900/50 border border-zinc-800/50 p-2 sm:py-3 sm:px-4 rounded-xl animate-in fade-in slide-in-from-top-4">
            <button
              onClick={prevMonth}
              className="p-2 bg-zinc-900 sm:bg-transparent hover:bg-zinc-800 rounded-lg sm:rounded-full transition-colors text-zinc-400 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="w-full sm:w-40 text-center font-medium text-base sm:text-lg text-zinc-200">
              {capitalizedMonthName}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 bg-zinc-900 sm:bg-transparent hover:bg-zinc-800 rounded-lg sm:rounded-full transition-colors text-zinc-400 hover:text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2 md:mb-4">
              <h3 className="text-zinc-400 text-xs md:text-sm font-medium">
                Receitas
              </h3>
              <div className="p-1.5 md:p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </div>
            <p className="text-lg md:text-3xl font-bold text-emerald-400 truncate">
              R$ {income.toFixed(2)}
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-2 md:mb-4">
              <h3 className="text-zinc-400 text-xs md:text-sm font-medium">
                Despesas
              </h3>
              <div className="p-1.5 md:p-2 bg-rose-500/10 text-rose-500 rounded-lg">
                <TrendingDown className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </div>
            <p className="text-lg md:text-3xl font-bold text-rose-400 truncate">
              R$ {expense.toFixed(2)}
            </p>
          </div>

          <div className="col-span-2 md:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 md:p-6 relative overflow-hidden ring-1 ring-indigo-500/20">
            <div className="flex justify-between items-start mb-2 md:mb-4">
              <h3 className="text-zinc-400 text-xs md:text-sm font-medium relative z-10">
                {viewMode === "GERAL" ? "Saldo Atual" : "Saldo do Mês"}
              </h3>
              <div className="p-1.5 md:p-2 bg-indigo-500/10 text-indigo-400 rounded-lg relative z-10">
                <PiggyBank className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </div>
            <p
              className={`text-2xl md:text-3xl font-bold relative z-10 ${balance >= 0 ? "text-white" : "text-rose-400"}`}
            >
              R$ {balance.toFixed(2)}
            </p>

            {viewMode === "MENSAL" && (
              <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-zinc-800/50 flex justify-between items-center relative z-10">
                <span className="text-xs md:text-sm text-zinc-400">
                  Geral Acumulado
                </span>
                <span
                  className={`text-xs md:text-sm font-bold ${accumulatedBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                >
                  R$ {accumulatedBalance.toFixed(2)}
                </span>
              </div>
            )}

            <PiggyBank className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 w-24 h-24 md:w-32 md:h-32 text-zinc-800/30 rotate-12 transition-transform group-hover:scale-110 pointer-events-none" />
          </div>
        </div>

        {/* INPUT DA IA */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 relative">
          <form onSubmit={handleSubmit} className="flex flex-col relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ex: Passagem de avião por 200 reais parcelado em 4x..."
              className="w-full bg-transparent text-white p-3 md:p-4 min-h-[80px] md:min-h-[100px] text-sm md:text-base resize-none focus:outline-none placeholder:text-zinc-600"
              disabled={isSubmitting}
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 border-t border-zinc-800/50 mt-2 gap-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
                <span className="text-[10px] md:text-xs text-zinc-500 font-medium leading-tight">
                  O Gemini classifica e grava na base de dados
                </span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !inputText.trim()}
                className="flex w-full sm:w-auto items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 md:py-2 md:px-6 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Registrar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* LISTA RESPONSIVA (Adeus Tabela) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-4 md:p-6 border-b border-zinc-800">
            <h2 className="text-base md:text-lg font-semibold text-white">
              {viewMode === "GERAL"
                ? "Registo Geral"
                : `Registos de ${capitalizedMonthName}`}
            </h2>
          </div>

          <div>
            {loading ? (
              <div className="flex items-center justify-center p-8 md:p-12 text-zinc-500 text-sm">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 md:p-12 text-zinc-500 text-center">
                <Wallet className="w-10 h-10 md:w-12 md:h-12 mb-3 opacity-20" />
                <p className="text-sm">
                  Nenhuma transação{" "}
                  {viewMode === "MENSAL" ? "neste mês" : "registada"}.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {filteredTransactions.map((tx) => {
                  const value =
                    tx.transactionType === "INSTALLMENT" && tx.installmentValue
                      ? tx.installmentValue
                      : tx.amount
                  const dateObj = new Date(tx.date)

                  return (
                    <div
                      key={tx.id}
                      className="p-4 md:px-6 md:py-4 flex flex-row items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors group"
                    >
                      {/* Lado Esquerdo */}
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <span className="font-medium text-zinc-200 text-sm md:text-base truncate">
                          {tx.description}
                        </span>

                        <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs text-zinc-500">
                          <span>{dateObj.toLocaleDateString("pt-BR")}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-700 hidden sm:block"></span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold border ${getCategoryColor(tx.category)}`}
                          >
                            {tx.category}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-zinc-700 hidden sm:block"></span>
                          <span className="text-zinc-400">
                            {tx.transactionType === "INSTALLMENT"
                              ? "🔄 Parcelada"
                              : tx.isRecurring
                                ? "⭐ Fixo/Ass."
                                : "📄 Única"}
                          </span>
                        </div>

                        {(tx.isRecurring ||
                          tx.transactionType === "RECURRING") &&
                          viewMode === "MENSAL" &&
                          dateObj.getMonth() !== currentDate.getMonth() && (
                            <div className="text-[10px] md:text-xs text-indigo-400/80 italic mt-0.5">
                              ↳ Herança de{" "}
                              {dateObj.toLocaleDateString("pt-BR", {
                                month: "long",
                              })}
                            </div>
                          )}
                      </div>

                      {/* Lado Direito */}
                      <div
                        className={`font-semibold text-sm md:text-base text-right shrink-0 ${tx.nature === "INCOME" ? "text-emerald-400" : "text-zinc-300"}`}
                      >
                        {tx.nature === "INCOME" ? "+" : "-"} R${" "}
                        {Number(value).toFixed(2)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
