import { NextResponse } from 'next/server'
import { getRequirements } from '@/lib/storage'

export async function GET() {
  try {
    const requirements = await getRequirements()

    if (!requirements) {
      return NextResponse.json({
        loaded: false,
        count: 0,
        message: 'Brak załadowanych wymagań'
      })
    }

    return NextResponse.json({
      loaded: true,
      count: requirements.parametry.length,
      nazwa_tabeli: requirements.nazwa_tabeli,
      urzadzenia: requirements.urzadzenia,
      parametry: requirements.parametry
    })

  } catch (error) {
    console.error('Requirements error:', error)
    return NextResponse.json(
      { loaded: false, error: 'Błąd pobierania wymagań' },
      { status: 500 }
    )
  }
}
