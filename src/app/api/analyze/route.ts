import { NextRequest, NextResponse } from 'next/server'
import { getRequirements, getDevicePDF, listDevices, saveReport } from '@/lib/storage'
import { extractDeviceParameters } from '@/lib/pdf-parser'
import { compareParameter, findMatchingParam } from '@/lib/comparator'
import { AnalysisReport, ComparisonResult } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceId, analyzeAll } = body

    const requirements = await getRequirements()
    if (!requirements || requirements.parametry.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Najpierw wgraj plik z wymaganiami minimalnymi'
      }, { status: 400 })
    }

    if (analyzeAll) {
      // Analizuj wszystkie urządzenia
      const devices = await listDevices()
      const reports: AnalysisReport[] = []

      for (const device of devices) {
        const report = await analyzeDevice(device.id, requirements.parametry)
        if (report) {
          reports.push(report)
          await saveReport(report)
        }
      }

      return NextResponse.json({
        success: true,
        count: reports.length,
        reports
      })

    } else if (deviceId) {
      // Analizuj pojedyncze urządzenie
      const report = await analyzeDevice(deviceId, requirements.parametry)

      if (!report) {
        return NextResponse.json({
          success: false,
          error: 'Nie znaleziono urządzenia'
        }, { status: 404 })
      }

      await saveReport(report)

      return NextResponse.json({
        success: true,
        report
      })

    } else {
      return NextResponse.json({
        success: false,
        error: 'Podaj deviceId lub analyzeAll=true'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json(
      { success: false, error: 'Błąd analizy' },
      { status: 500 }
    )
  }
}

async function analyzeDevice(
  deviceId: string,
  requirements: { nazwa: string; wymaganie_minimalne: string; typ_porownania?: string }[]
): Promise<AnalysisReport | null> {
  const deviceData = await getDevicePDF(deviceId)
  if (!deviceData) return null

  const deviceParams = extractDeviceParameters(deviceData.content)
  const results: ComparisonResult[] = []

  for (const req of requirements) {
    const deviceParam = findMatchingParam(req.nazwa, deviceParams)
    const result = compareParameter(
      {
        nazwa: req.nazwa,
        wymaganie_minimalne: req.wymaganie_minimalne,
        typ_porownania: req.typ_porownania as any
      },
      deviceParam
    )
    results.push(result)
  }

  const summary = {
    spelnia: results.filter(r => r.status === 'SPEŁNIA').length,
    nie_spelnia: results.filter(r => r.status === 'NIE SPEŁNIA').length,
    do_weryfikacji: results.filter(r => r.status === 'DO WERYFIKACJI').length
  }

  return {
    nazwa_urzadzenia: deviceData.name.replace('.pdf', ''),
    data_analizy: new Date().toISOString(),
    plik_zrodlowy: deviceData.name,
    wyniki: results,
    podsumowanie: summary
  }
}
