import { NextRequest, NextResponse } from 'next/server'
import { listDevices, deleteDevice } from '@/lib/storage'

export async function GET() {
  try {
    const devices = await listDevices()

    return NextResponse.json({
      count: devices.length,
      devices
    })

  } catch (error) {
    console.error('Devices error:', error)
    return NextResponse.json(
      { error: 'Błąd pobierania listy urządzeń' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Brak ID urządzenia' },
        { status: 400 }
      )
    }

    const deleted = await deleteDevice(id)

    return NextResponse.json({
      success: deleted,
      message: deleted ? `Usunięto ${id}` : 'Nie znaleziono urządzenia'
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Błąd usuwania' },
      { status: 500 }
    )
  }
}
