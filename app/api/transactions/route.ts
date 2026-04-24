import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

const prisma = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
      take: 50,
    })
    return NextResponse.json(transactions)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })
    }

    await prisma.transaction.delete({
      where: { id: id },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro ao deletar:', err)
    return NextResponse.json(
      { error: 'Erro ao apagar transação' },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Texto é obrigatório' },
        { status: 400 },
      )
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction:
        'És um analista financeiro de IA para o sistema Shinji Okane. Extrai as informações da transação em formato JSON estrito.',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            description: {
              type: SchemaType.STRING,
              description: 'Descrição curta',
            },
            amount: { type: SchemaType.NUMBER, description: 'Valor total' },
            category: {
              type: SchemaType.STRING,
              format: 'enum',
              enum: [
                'EDUCACAO',
                'TRANSPORTE',
                'MORADIA',
                'COMPRAS',
                'OUTROS',
                'ALIMENTACAO',
                'RENDIMENTO',
                'ASSINATURAS',
              ],
            },
            transactionType: {
              type: SchemaType.STRING,
              format: 'enum',
              enum: ['SINGLE', 'INSTALLMENT', 'RECURRING'],
            },
            installmentsCount: {
              type: SchemaType.INTEGER,
              description: 'Número de parcelas (1 se SINGLE ou RECURRING)',
            },
            installmentValue: {
              type: SchemaType.NUMBER,
              description: 'Valor de cada parcela (apenas se INSTALLMENT)',
            },
            nature: {
              type: SchemaType.STRING,
              format: 'enum',
              enum: ['INCOME', 'EXPENSE'],
            },
          },
          required: [
            'description',
            'amount',
            'category',
            'transactionType',
            'installmentsCount',
            'nature',
          ],
        },
      },
    })

    const result = await model.generateContent(
      `Analisa esta transação: "${text}"`,
    )
    const aiResponse = result.response.text()

    const cleanJson = aiResponse.replace(/```json\n?|```/g, '').trim()
    const data = JSON.parse(cleanJson)

    const transactionsToSave = []
    const groupId = crypto.randomUUID()

    if (data.transactionType === 'INSTALLMENT' && data.installmentsCount > 1) {
      for (let i = 1; i <= data.installmentsCount; i++) {
        const futureDate = new Date()
        futureDate.setMonth(futureDate.getMonth() + (i - 1))

        transactionsToSave.push({
          id: crypto.randomUUID(),
          description: `${data.description} (${i}/${data.installmentsCount})`,
          amount: data.amount,
          category: data.category,
          transactionType: data.transactionType,
          nature: data.nature,
          installmentsCount: data.installmentsCount,
          currentInstallment: i,
          installmentId: groupId,
          installmentValue:
            data.installmentValue || data.amount / data.installmentsCount,
          date: futureDate,
        })
      }
    } else {
      transactionsToSave.push({
        id: crypto.randomUUID(),
        description: data.description,
        amount: data.amount,
        category: data.category,
        transactionType: data.transactionType,
        nature: data.nature,
        isRecurring: data.transactionType === 'RECURRING',
        recurrenceId: data.transactionType === 'RECURRING' ? groupId : null,
        date: new Date(),
      })
    }

    await prisma.transaction.createMany({
      data: transactionsToSave,
    })

    return NextResponse.json(
      { success: true, data: transactionsToSave },
      { status: 201 },
    )
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar transação' },
      { status: 500 },
    )
  }
}
