# Analizator Specyfikacji Terminali Mobilnych

System automatycznej analizy specyfikacji technicznych terminali mobilnych dla przetargów publicznych.

## Opis

System pozwala na:
1. Wgranie PDF z wymaganiami minimalnymi (tabela "Terminale mobilne")
2. Wgrywanie kart katalogowych urządzeń
3. Automatyczną analizę parametrów i porównanie z wymaganiami
4. Generowanie raportów: **SPEŁNIA / NIE SPEŁNIA / DO WERYFIKACJI**

## Technologie

- **Framework**: Next.js 14 (App Router)
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Ekstrakcja PDF**: pdf-parse
- **Storage**: Vercel Blob (produkcja) / in-memory (dev)
- **Hosting**: Vercel

## Struktura projektu

```
specyfikacja_pp/
├── src/
│   ├── app/
│   │   ├── api/              # API Routes (serverless)
│   │   │   ├── upload/       # Upload plików
│   │   │   ├── analyze/      # Analiza urządzeń
│   │   │   ├── requirements/ # Wymagania minimalne
│   │   │   ├── devices/      # Lista urządzeń
│   │   │   └── compare/      # Porównanie urządzeń
│   │   ├── page.tsx          # Strona główna
│   │   ├── layout.tsx        # Layout
│   │   └── globals.css       # Style globalne
│   ├── components/           # Komponenty React
│   ├── lib/                  # Logika biznesowa
│   │   ├── pdf-parser.ts     # Parsowanie PDF
│   │   ├── comparator.ts     # Porównywanie parametrów
│   │   └── storage.ts        # Abstakcja storage
│   └── types/                # TypeScript types
├── package.json
├── vercel.json               # Konfiguracja Vercel
└── tailwind.config.ts
```

## Instalacja lokalna

```bash
# 1. Zainstaluj zależności
npm install

# 2. Uruchom serwer deweloperski
npm run dev
```

Aplikacja będzie dostępna pod: http://localhost:3000

## Deploy na Vercel

### Opcja 1: Vercel CLI

```bash
# 1. Zainstaluj Vercel CLI
npm i -g vercel

# 2. Zaloguj się
vercel login

# 3. Deploy
vercel
```

### Opcja 2: GitHub Integration

1. Pushuj kod na GitHub
2. Połącz repo z Vercel: https://vercel.com/new
3. Vercel automatycznie zbuduje i wdroży aplikację

### Konfiguracja Storage (opcjonalne)

Dla trwałego przechowywania plików na produkcji:

1. Wejdź w Vercel Dashboard → Storage → Create → Blob
2. Skopiuj `BLOB_READ_WRITE_TOKEN`
3. Dodaj jako Environment Variable w ustawieniach projektu

## API Endpoints

| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/upload` | Upload PDF (type: 'requirements' lub 'device') |
| POST | `/api/analyze` | Analiza urządzenia (deviceId lub analyzeAll) |
| GET | `/api/requirements` | Pobranie wymagań |
| GET | `/api/devices` | Lista wgranych urządzeń |
| DELETE | `/api/devices?id=` | Usunięcie urządzenia |
| GET | `/api/compare` | Porównanie wszystkich urządzeń |

## Jak używać

1. **Wgraj wymagania** - PDF z tabelą "Terminale mobilne" zawierającą:
   - Kolumna "Parametr" - nazwy parametrów
   - Kolumna "Wymagania minimalne" - minimalne wartości

2. **Wgraj karty katalogowe** - PDF z danymi technicznymi urządzeń

3. **Uruchom analizę** - system automatycznie:
   - Wyekstraktuje parametry z kart
   - Porówna z wymaganiami minimalnymi
   - Oznaczy każdy parametr statusem

## Statusy

- **SPEŁNIA** - parametr urządzenia spełnia wymaganie minimalne
- **NIE SPEŁNIA** - parametr nie spełnia wymagania
- **DO WERYFIKACJI** - wymaga manualnej weryfikacji (niejednoznaczne dane)

## Licencja

Projekt wewnętrzny
