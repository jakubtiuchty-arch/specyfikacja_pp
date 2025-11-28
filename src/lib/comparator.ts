import {
  ParameterRequirement,
  DeviceParameter,
  ComparisonResult,
  ComplianceStatus
} from '@/types'
import { extractNumber } from './pdf-parser'

export function compareParameter(
  requirement: ParameterRequirement,
  deviceParam: DeviceParameter | null
): ComparisonResult {
  if (!deviceParam) {
    return {
      parametr: requirement.nazwa,
      wymaganie_minimalne: requirement.wymaganie_minimalne,
      wartosc_urzadzenia: 'BRAK DANYCH',
      status: 'DO WERYFIKACJI',
      komentarz: 'Nie znaleziono tego parametru w karcie katalogowej'
    }
  }

  const reqValue = requirement.wymaganie_minimalne
  const devValue = deviceParam.wartosc
  const comparisonType = requirement.typ_porownania || 'exact'

  let status: ComplianceStatus
  let komentarz: string

  switch (comparisonType) {
    case 'min':
      [status, komentarz] = compareMin(reqValue, devValue)
      break
    case 'max':
      [status, komentarz] = compareMax(reqValue, devValue)
      break
    case 'boolean':
      [status, komentarz] = compareBoolean(reqValue, devValue)
      break
    case 'contains':
      [status, komentarz] = compareContains(reqValue, devValue)
      break
    default:
      [status, komentarz] = compareExact(reqValue, devValue)
  }

  return {
    parametr: requirement.nazwa,
    wymaganie_minimalne: reqValue,
    wartosc_urzadzenia: devValue,
    status,
    komentarz
  }
}

function compareMin(req: string, dev: string): [ComplianceStatus, string] {
  const reqNum = extractNumber(req)
  const devNum = extractNumber(dev)

  if (reqNum === null || devNum === null) {
    return ['DO WERYFIKACJI', 'Nie można porównać wartości numerycznych']
  }

  if (devNum >= reqNum) {
    return ['SPEŁNIA', `${devNum} >= ${reqNum}`]
  }
  return ['NIE SPEŁNIA', `${devNum} < ${reqNum} (wymagane minimum)`]
}

function compareMax(req: string, dev: string): [ComplianceStatus, string] {
  const reqNum = extractNumber(req)
  const devNum = extractNumber(dev)

  if (reqNum === null || devNum === null) {
    return ['DO WERYFIKACJI', 'Nie można porównać wartości numerycznych']
  }

  if (devNum <= reqNum) {
    return ['SPEŁNIA', `${devNum} <= ${reqNum}`]
  }
  return ['NIE SPEŁNIA', `${devNum} > ${reqNum} (wymagane maksimum)`]
}

function compareBoolean(req: string, dev: string): [ComplianceStatus, string] {
  const positiveWords = ['tak', 'yes', 'true', '1', 'posiada', 'obsługuje', 'wspiera', '✓', '✔']
  const negativeWords = ['nie', 'no', 'false', '0', 'brak', '✗', '✘', '-']

  const reqLower = req.toLowerCase().trim()
  const devLower = dev.toLowerCase().trim()

  // Jeśli wymaganie to "tak"
  if (positiveWords.some(w => reqLower.includes(w))) {
    if (positiveWords.some(w => devLower.includes(w))) {
      return ['SPEŁNIA', 'Urządzenie posiada wymaganą funkcję']
    }
    if (negativeWords.some(w => devLower.includes(w))) {
      return ['NIE SPEŁNIA', 'Urządzenie nie posiada wymaganej funkcji']
    }
  }

  return ['DO WERYFIKACJI', 'Wymaga manualnej weryfikacji']
}

function compareContains(req: string, dev: string): [ComplianceStatus, string] {
  const reqLower = req.toLowerCase()
  const devLower = dev.toLowerCase()

  const keywords = extractKeywords(reqLower)
  const matched = keywords.filter(kw => devLower.includes(kw)).length
  const total = keywords.length

  if (total === 0) {
    return ['DO WERYFIKACJI', 'Brak słów kluczowych do porównania']
  }

  if (matched === total) {
    return ['SPEŁNIA', `Znaleziono wszystkie wymagane elementy (${matched}/${total})`]
  }
  if (matched > 0) {
    return ['DO WERYFIKACJI', `Częściowe dopasowanie (${matched}/${total})`]
  }
  return ['NIE SPEŁNIA', 'Nie znaleziono wymaganych elementów']
}

function compareExact(req: string, dev: string): [ComplianceStatus, string] {
  const reqClean = req.toLowerCase().trim()
  const devClean = dev.toLowerCase().trim()

  // Dokładne dopasowanie
  if (reqClean === devClean) {
    return ['SPEŁNIA', 'Dokładne dopasowanie']
  }

  // Wymaganie zawiera się w wartości urządzenia
  if (devClean.includes(reqClean)) {
    return ['SPEŁNIA', 'Wartość urządzenia zawiera wymaganie']
  }

  // Porównaj liczby
  const reqNum = extractNumber(req)
  const devNum = extractNumber(dev)

  if (reqNum !== null && devNum !== null) {
    if (devNum >= reqNum) {
      return ['SPEŁNIA', `Wartość ${devNum} >= ${reqNum}`]
    }
    return ['NIE SPEŁNIA', `Wartość ${devNum} < ${reqNum}`]
  }

  // Podobieństwo tekstu
  const similarity = textSimilarity(reqClean, devClean)
  if (similarity > 0.8) {
    return ['SPEŁNIA', `Wysokie podobieństwo (${Math.round(similarity * 100)}%)`]
  }
  if (similarity > 0.5) {
    return ['DO WERYFIKACJI', `Częściowe podobieństwo (${Math.round(similarity * 100)}%)`]
  }

  return ['DO WERYFIKACJI', 'Wymaga manualnej weryfikacji']
}

function extractKeywords(text: string): string[] {
  const stopwords = new Set(['i', 'lub', 'oraz', 'a', 'w', 'z', 'do', 'na', 'dla', 'min', 'max', 'co', 'najmniej'])
  const words = text.match(/\b\w+\b/g) || []
  return words.filter(w => !stopwords.has(w) && w.length > 2)
}

function textSimilarity(text1: string, text2: string): number {
  const arr1 = text1.split(/\s+/)
  const arr2 = text2.split(/\s+/)
  const words1 = new Set(arr1)
  const words2 = new Set(arr2)

  if (words1.size === 0 || words2.size === 0) return 0

  let intersectionCount = 0
  arr1.forEach(word => {
    if (words2.has(word)) intersectionCount++
  })

  const unionSet = new Set(arr1.concat(arr2))

  return intersectionCount / unionSet.size
}

export function findMatchingParam(
  paramName: string,
  deviceParams: DeviceParameter[]
): DeviceParameter | null {
  const paramLower = paramName.toLowerCase()

  // Dokładne dopasowanie
  let found = deviceParams.find(dp => dp.nazwa.toLowerCase() === paramLower)
  if (found) return found

  // Częściowe dopasowanie
  found = deviceParams.find(dp =>
    paramLower.includes(dp.nazwa.toLowerCase()) ||
    dp.nazwa.toLowerCase().includes(paramLower)
  )
  if (found) return found

  // Dopasowanie słów kluczowych
  const keywords = paramLower.split(/\s+/)
  found = deviceParams.find(dp => {
    const dpWords = dp.nazwa.toLowerCase().split(/\s+/)
    return keywords.some(kw => dpWords.includes(kw))
  })

  return found || null
}
