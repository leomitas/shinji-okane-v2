"use client"

import React, { useState, useEffect } from "react"
import {
  Wallet,
  CreditCard,
  Repeat,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Loader2,
  Sparkles,
  Send,
} from "lucide-react"

interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  transactionType: string
  nature: string
  date: string
  installmentValue?: number
}

export default function Home() {
  const [inputText, setInputText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch("/api/transactions")
        if (res.ok) {
          const data = await res.json()
          setTransactions(data)
        }
      } catch (err) {
        console.error("Erro ao carregar transações", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchTransactions()
  }, [])

  const handleAnalyze = async () => {
    if (!inputText.trim()) return

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro na requisição")
      }

      setTransactions((prev) =>
        [...result.data, ...prev].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      )
      setInputText("")
    } catch (err) {
      console.error(err)
      setError(
        "Não foi possível analisar a tua transação. Tenta ser mais específico!",
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const summary = transactions.reduce(
    (acc, curr) => {
      const value =
        curr.transactionType === "INSTALLMENT" && curr.installmentValue
          ? curr.installmentValue
          : curr.amount

      if (curr.nature === "INCOME") acc.income += value
      else acc.expense += value
      return acc
    },
    { income: 0, expense: 0 },
  )

  const balance = summary.income - summary.expense

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      EDUCACAO: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      TRANSPORTE: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      MORADIA: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      COMPRAS: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      ALIMENTACAO: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      RENDIMENTO: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      ASSINATURAS: "bg-pink-500/10 text-pink-500 border-pink-500/20",
      OUTROS: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
    }
    return colors[category] || colors.OUTROS
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-zinc-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-xl">
              <Wallet className="w-8 h-8 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-linear-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Shinji Okane
              </h1>
              <p className="text-zinc-500 text-sm">
                Analista de Despesas com IA
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-medium">Receitas</span>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-emerald-500">
              {formatCurrency(summary.income)}
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-medium">Despesas</span>
              <div className="p-2 bg-rose-500/10 rounded-lg">
                <TrendingDown className="w-5 h-5 text-rose-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-rose-500">
              {formatCurrency(summary.expense)}
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <PiggyBank className="w-32 h-32" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <span className="text-zinc-400 font-medium">Saldo Atual</span>
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Wallet className="w-5 h-5 text-indigo-500" />
              </div>
            </div>
            <p
              className={`text-3xl font-bold relative z-10 ${balance >= 0 ? "text-zinc-100" : "text-rose-500"}`}
            >
              {formatCurrency(balance)}
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 relative focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all shadow-xl">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleAnalyze()
              }
            }}
            placeholder="Ex: Comprei uma passagem de avião por 200 reais parcelado em 4 vezes..."
            className="w-full bg-transparent resize-none p-4 outline-none text-zinc-200 placeholder:text-zinc-600 min-h-25"
          />
          <div className="flex items-center justify-between p-2 border-t border-zinc-800/50">
            <div className="flex items-center gap-2 text-xs text-zinc-500 px-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>
                O Gemini irá classificar e gravar na BD automaticamente
              </span>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={isProcessing || !inputText.trim()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Analisando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" /> Registar
                </>
              )}
            </button>
          </div>
        </div>
        {error && <p className="text-rose-500 text-sm mt-2">{error}</p>}

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="text-lg font-semibold">Registo Geral (Supabase)</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/50 text-zinc-500 text-sm border-b border-zinc-800">
                  <th className="p-4 font-medium">Data / Descrição</th>
                  <th className="p-4 font-medium">Categoria</th>
                  <th className="p-4 font-medium">Tipo</th>
                  <th className="p-4 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-sm">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-zinc-500 flex items-center justify-center gap-2"
                    >
                      <Loader2 className="w-5 h-5 animate-spin" /> Carregando do
                      Supabase...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-zinc-500">
                      Nenhuma transação registada. Começa por escrever acima!
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-zinc-800/20 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-medium text-zinc-200">
                          {t.description}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {new Date(t.date).toLocaleDateString("pt-BR")}
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getCategoryColor(t.category)}`}
                        >
                          {t.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          {t.transactionType === "SINGLE" && (
                            <CreditCard className="w-4 h-4" />
                          )}
                          {t.transactionType === "INSTALLMENT" && (
                            <Repeat className="w-4 h-4" />
                          )}
                          {t.transactionType === "RECURRING" && (
                            <Repeat className="w-4 h-4 text-pink-400" />
                          )}
                          <span className="text-xs">
                            {t.transactionType === "SINGLE" && "Única"}
                            {t.transactionType === "INSTALLMENT" && "Parcelada"}
                            {t.transactionType === "RECURRING" && "Assinatura"}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`p-4 text-right font-medium ${t.nature === "INCOME" ? "text-emerald-500" : "text-zinc-200"}`}
                      >
                        {t.nature === "INCOME" ? "+" : "-"}
                        {formatCurrency(
                          t.transactionType === "INSTALLMENT" &&
                            t.installmentValue
                            ? t.installmentValue
                            : t.amount,
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
