import OpenAI from 'openai'
import { DeviceParameter } from '@/types'

// Lazy initialization - klient tworzony przy pierwszym użyciu
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured')
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return openaiClient
}

// Prompt do ekstrakcji parametrów z karty katalogowej
const EXTRACTION_PROMPT = `Analizujesz kartę katalogową terminala mobilnego. Wyekstrahuj wszystkie parametry techniczne urządzenia.

Szukaj w szczególności tych parametrów:
- System operacyjny (Android, wersja)
- Procesor (typ, taktowanie, rdzenie)
- RAM i pamięć Flash
- Łączność: NFC, GPS, Bluetooth, WiFi, LTE/GSM
- Kamery (przód, tył - megapiksele)
- Wyświetlacz (przekątna, rozdzielczość, typ szkła)
- Bateria (pojemność mAh, czas pracy)
- Wymiary i waga
- Klasa szczelności (IP)
- Temperatura pracy
- Odporność na upadki
- Skaner kodów (1D, 2D, obsługiwane formaty)
- Certyfikaty (AER, GMS, itp.)

Zwróć wynik jako JSON w formacie:
{
  "nazwa_urzadzenia": "nazwa modelu",
  "producent": "nazwa producenta",
  "parametry": [
    {"nazwa": "System", "wartosc": "Android 13"},
    {"nazwa": "Procesor", "wartosc": "Qualcomm Snapdragon 660, 2.2 GHz, 8 rdzeni"},
    ...
  ]
}

Jeśli parametr nie jest podany w dokumencie, pomiń go. Podawaj dokładne wartości z dokumentu.`

export async function analyzeDeviceWithAI(pdfText: string): Promise<{
  nazwa_urzadzenia: string
  producent: string
  parametry: DeviceParameter[]
} | null> {
  try {
    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: EXTRACTION_PROMPT
        },
        {
          role: 'user',
          content: `Przeanalizuj poniższą specyfikację techniczną urządzenia i wyekstrahuj parametry:\n\n${pdfText}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 4000
    })

    const content = response.choices[0]?.message?.content
    if (!content) return null

    const parsed = JSON.parse(content)

    return {
      nazwa_urzadzenia: parsed.nazwa_urzadzenia || 'Nieznane urządzenie',
      producent: parsed.producent || '',
      parametry: parsed.parametry || []
    }
  } catch (error) {
    console.error('OpenAI analysis error:', error)
    return null
  }
}

// Analiza obrazu karty katalogowej (dla skanów/obrazów)
export async function analyzeDeviceImageWithAI(imageBase64: string, mimeType: string): Promise<{
  nazwa_urzadzenia: string
  producent: string
  parametry: DeviceParameter[]
} | null> {
  try {
    const openai = getOpenAIClient()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: EXTRACTION_PROMPT
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Przeanalizuj ten obraz karty katalogowej urządzenia i wyekstrahuj wszystkie parametry techniczne:'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 4000
    })

    const content = response.choices[0]?.message?.content
    if (!content) return null

    const parsed = JSON.parse(content)

    return {
      nazwa_urzadzenia: parsed.nazwa_urzadzenia || 'Nieznane urządzenie',
      producent: parsed.producent || '',
      parametry: parsed.parametry || []
    }
  } catch (error) {
    console.error('OpenAI Vision analysis error:', error)
    return null
  }
}

// Sprawdź czy OpenAI jest skonfigurowane
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY
}
