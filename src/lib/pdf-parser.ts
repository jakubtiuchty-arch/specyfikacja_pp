import { ParameterRequirement, DeviceParameter } from '@/types'

// Funkcja do parsowania tekstu PDF i wyciągania tabel
export function parseTableFromText(text: string): string[][] {
  const lines = text.split('\n').filter(line => line.trim())
  const rows: string[][] = []

  for (const line of lines) {
    // Próbuj rozdzielić po tabulatorach lub wielokrotnych spacjach
    let cells = line.split('\t')
    if (cells.length === 1) {
      cells = line.split(/\s{2,}/)
    }
    if (cells.length > 1) {
      rows.push(cells.map(c => c.trim()))
    }
  }

  return rows
}

// Określ typ porównania na podstawie treści wymagania
export function determineComparisonType(requirement: string): ParameterRequirement['typ_porownania'] {
  const reqLower = requirement.toLowerCase()

  if (['minimum', 'min.', 'min ', 'co najmniej', '≥', '>='].some(w => reqLower.includes(w))) {
    return 'min'
  }
  if (['maksimum', 'max.', 'max ', 'co najwyżej', '≤', '<='].some(w => reqLower.includes(w))) {
    return 'max'
  }
  if (['tak', 'yes', 'wymagane', 'obowiązkowe'].some(w => reqLower.includes(w))) {
    return 'boolean'
  }
  if (['zawiera', 'obsługuje', 'posiada'].some(w => reqLower.includes(w))) {
    return 'contains'
  }
  return 'exact'
}

// Wyciągnij wymagania z tabeli
export function extractRequirementsFromTable(
  rows: string[][]
): { requirements: ParameterRequirement[], deviceColumns: string[] } {
  if (rows.length < 2) {
    return { requirements: [], deviceColumns: [] }
  }

  const requirements: ParameterRequirement[] = []
  const deviceColumns: string[] = []

  // Znajdź nagłówki
  const headers = rows[0].map(h => h.toLowerCase())

  let paramIdx = headers.findIndex(h => h.includes('parametr'))
  let reqIdx = headers.findIndex(h => h.includes('wymagan') && h.includes('minim'))

  if (paramIdx === -1) paramIdx = 0
  if (reqIdx === -1) reqIdx = headers.findIndex(h => h.includes('wymagan')) || 1

  // Pozostałe kolumny to urządzenia
  rows[0].forEach((header, i) => {
    if (i !== paramIdx && i !== reqIdx && header.trim()) {
      deviceColumns.push(header.trim())
    }
  })

  // Przetwórz wiersze
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (row.length <= Math.max(paramIdx, reqIdx)) continue

    const paramName = row[paramIdx]?.trim()
    const reqValue = row[reqIdx]?.trim()

    if (paramName && reqValue) {
      requirements.push({
        nazwa: paramName,
        wymaganie_minimalne: reqValue,
        typ_porownania: determineComparisonType(reqValue)
      })
    }
  }

  return { requirements, deviceColumns }
}

// Wyciągnij parametry urządzenia z tekstu PDF
export function extractDeviceParameters(text: string): DeviceParameter[] {
  const parameters: DeviceParameter[] = []
  const lines = text.split('\n')

  // Szukaj wzorca "Nazwa: Wartość" lub tabeli dwukolumnowej
  const pattern = /^([^:]+):\s*(.+)$/

  for (const line of lines) {
    const match = line.trim().match(pattern)
    if (match) {
      const [, nazwa, wartosc] = match
      if (nazwa.trim() && wartosc.trim() && !isHeader(nazwa)) {
        parameters.push({
          nazwa: nazwa.trim(),
          wartosc: wartosc.trim()
        })
      }
    }
  }

  // Parsuj też tabele
  const tableRows = parseTableFromText(text)
  for (const row of tableRows) {
    if (row.length >= 2 && !isHeader(row[0])) {
      const existing = parameters.find(p =>
        p.nazwa.toLowerCase() === row[0].toLowerCase()
      )
      if (!existing) {
        parameters.push({
          nazwa: row[0],
          wartosc: row[1]
        })
      }
    }
  }

  return parameters
}

function isHeader(text: string): boolean {
  const headerKeywords = ['parametr', 'nazwa', 'specyfikacja', 'opis', 'wartość', 'cecha', 'właściwość']
  return headerKeywords.some(kw => text.toLowerCase().includes(kw))
}

// Wyciągnij liczbę z tekstu
export function extractNumber(text: string): number | null {
  const cleaned = text.replace(/\s/g, '').replace(',', '.')
  const match = cleaned.match(/(\d+\.?\d*)/)
  return match ? parseFloat(match[1]) : null
}
