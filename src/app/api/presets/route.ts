import { NextRequest, NextResponse } from 'next/server'
import { AVAILABLE_PRESETS, getPresetById } from '@/lib/presets'
import { saveRequirements } from '@/lib/storage'

// GET - lista presetów
export async function GET() {
  return NextResponse.json({
    presets: AVAILABLE_PRESETS.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      parametersCount: p.data.parametry.length
    }))
  })
}

// POST - załaduj preset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { presetId } = body

    if (!presetId) {
      return NextResponse.json(
        { success: false, error: 'Brak presetId' },
        { status: 400 }
      )
    }

    const preset = getPresetById(presetId)

    if (!preset) {
      return NextResponse.json(
        { success: false, error: 'Nie znaleziono presetu' },
        { status: 404 }
      )
    }

    await saveRequirements(preset)

    return NextResponse.json({
      success: true,
      message: `Załadowano preset: ${preset.nazwa_tabeli}`,
      data: {
        count: preset.parametry.length,
        requirements: preset.parametry
      }
    })

  } catch (error) {
    console.error('Preset error:', error)
    return NextResponse.json(
      { success: false, error: 'Błąd ładowania presetu' },
      { status: 500 }
    )
  }
}
