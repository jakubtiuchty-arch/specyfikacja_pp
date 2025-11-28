import { NextResponse } from 'next/server'
import { getRequirements, listDevices, getDevicePDF } from '@/lib/storage'
import { extractDeviceParameters } from '@/lib/pdf-parser'
import { compareParameter, findMatchingParam } from '@/lib/comparator'

export async function GET() {
  try {
    const requirements = await getRequirements()
    if (!requirements) {
      return NextResponse.json({
        error: 'Brak załadowanych wymagań'
      }, { status: 400 })
    }

    const devicesList = await listDevices()
    if (devicesList.length === 0) {
      return NextResponse.json({
        error: 'Brak wgranych urządzeń'
      }, { status: 400 })
    }

    // Zbierz dane wszystkich urządzeń
    const devicesData: { id: string; name: string; params: any[] }[] = []

    for (const device of devicesList) {
      const data = await getDevicePDF(device.id)
      if (data) {
        devicesData.push({
          id: device.id,
          name: data.name.replace('.pdf', ''),
          params: extractDeviceParameters(data.content)
        })
      }
    }

    // Buduj tabelę porównawczą
    const comparison = {
      urzadzenia: devicesData.map(d => d.name),
      parametry: requirements.parametry.map(req => {
        const wyniki: Record<string, { wartosc: string; status: string }> = {}

        for (const device of devicesData) {
          const deviceParam = findMatchingParam(req.nazwa, device.params)
          const result = compareParameter(req, deviceParam)

          wyniki[device.name] = {
            wartosc: result.wartosc_urzadzenia,
            status: result.status
          }
        }

        return {
          parametr: req.nazwa,
          wymaganie_minimalne: req.wymaganie_minimalne,
          wyniki
        }
      })
    }

    return NextResponse.json(comparison)

  } catch (error) {
    console.error('Compare error:', error)
    return NextResponse.json(
      { error: 'Błąd porównywania' },
      { status: 500 }
    )
  }
}
