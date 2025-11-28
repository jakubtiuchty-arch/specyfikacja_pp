import { NextRequest, NextResponse } from 'next/server'
import pdf from 'pdf-parse'
import {
  extractRequirementsFromTable,
  parseTableFromText,
  extractDeviceParameters
} from '@/lib/pdf-parser'
import { saveRequirements, saveDevicePDF } from '@/lib/storage'
import { RequirementsData } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'requirements' | 'device'

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
          error: 'Nie znaleziono wymagań w PDF. Upewnij się, że plik zawiera tabelę z kolumnami "Parametr" i "Wymagania minimalne"'
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
      // Zapisz tekst PDF urządzenia
      const id = file.name.replace('.pdf', '').replace(/\s+/g, '_')
      await saveDevicePDF(id, file.name, text)

      // Wstępnie wyciągnij parametry
      const parameters = extractDeviceParameters(text)

      return NextResponse.json({
        success: true,
        message: `Wgrano kartę katalogową: ${file.name}`,
        data: {
          id,
          name: file.name,
          parametersFound: parameters.length
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
