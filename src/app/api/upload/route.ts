import { NextRequest, NextResponse } from 'next/server'
import pdf from 'pdf-parse'
import {
  extractRequirementsFromTable,
  parseTableFromText,
  extractDeviceParameters
} from '@/lib/pdf-parser'
import { analyzeDeviceWithAI, isOpenAIConfigured } from '@/lib/openai-analyzer'
import { saveRequirements, saveDevicePDF } from '@/lib/storage'
import { RequirementsData } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'requirements' | 'device'
    const useAI = formData.get('useAI') === 'true'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Brak pliku' },
        { status: 400 }
      )
    }

    if (!file.name.endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: 'Tylko pliki PDF są akceptowane' },
        { status: 400 }
      )
    }

    // Parsuj PDF
    const buffer = Buffer.from(await file.arrayBuffer())
    const pdfData = await pdf(buffer)
    const text = pdfData.text

    if (type === 'requirements') {
      // Parsuj tabelę wymagań
      const rows = parseTableFromText(text)
      const { requirements, deviceColumns } = extractRequirementsFromTable(rows)

      if (requirements.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Nie znaleziono wymagań w PDF. Użyj presetu "Terminale mobilne" zamiast uploadu.'
        }, { status: 400 })
      }

      const data: RequirementsData = {
        nazwa_tabeli: 'Terminale mobilne',
        parametry: requirements,
        urzadzenia: deviceColumns
      }

      await saveRequirements(data)

      return NextResponse.json({
        success: true,
        message: `Załadowano ${requirements.length} wymagań`,
        data: {
          count: requirements.length,
          deviceColumns,
          requirements
        }
      })

    } else if (type === 'device') {
      const id = file.name.replace('.pdf', '').replace(/\s+/g, '_')
      let parameters: any[] = []
      let aiUsed = false
      let deviceName = id
      let producent = ''

      // Próbuj AI analizy jeśli włączone i skonfigurowane
      if (useAI && isOpenAIConfigured()) {
        console.log('Using OpenAI to analyze device catalog...')
        const aiResult = await analyzeDeviceWithAI(text)

        if (aiResult && aiResult.parametry.length > 0) {
          parameters = aiResult.parametry
          deviceName = aiResult.nazwa_urzadzenia || id
          producent = aiResult.producent || ''
          aiUsed = true
          console.log(`AI extracted ${parameters.length} parameters`)
        }
      }

      // Fallback do podstawowej ekstrakcji
      if (parameters.length === 0) {
        parameters = extractDeviceParameters(text)
      }

      // Zapisz dane urządzenia (tekst + wyekstrahowane parametry)
      const deviceData = JSON.stringify({
        text,
        parameters,
        deviceName,
        producent,
        aiUsed
      })
      await saveDevicePDF(id, file.name, deviceData)

      return NextResponse.json({
        success: true,
        message: aiUsed
          ? `AI przeanalizował kartę katalogową: ${deviceName} (${parameters.length} parametrów)`
          : `Wgrano kartę katalogową: ${file.name} (${parameters.length} parametrów)`,
        data: {
          id,
          name: file.name,
          deviceName,
          producent,
          parametersFound: parameters.length,
          aiUsed,
          parameters: parameters.slice(0, 10) // Preview pierwszych 10
        }
      })

    } else {
      return NextResponse.json(
        { success: false, error: 'Nieprawidłowy typ pliku' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Błąd przetwarzania pliku' },
      { status: 500 }
    )
  }
}
