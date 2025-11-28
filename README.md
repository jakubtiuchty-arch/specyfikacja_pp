# Analizator Specyfikacji Terminali Mobilnych

System automatycznej analizy specyfikacji technicznych terminali mobilnych dla przetargów publicznych.

## Opis

System pozwala na:
1. Wgranie PDF z wymaganiami minimalnymi (tabela "Terminale mobilne")
2. Wgrywanie kart katalogowych urządzeń
3. Automatyczną analizę parametrów i porównanie z wymaganiami
4. Generowanie raportów: **SPEŁNIA / NIE SPEŁNIA / DO WERYFIKACJI**

## Struktura projektu

```
specyfikacja_pp/
├── backend/
│   ├── app/
│   │   ├── api/           # Endpointy REST API
│   │   ├── core/          # Konfiguracja
│   │   ├── models/        # Modele danych (Pydantic)
│   │   └── services/      # Logika biznesowa
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── static/
│   │   ├── css/
│   │   └── js/
│   └── templates/
├── input/
│   ├── wymagania/         # PDF z wymaganiami minimalnymi
│   └── karty_katalogowe/  # Karty katalogowe urządzeń
└── output/                # Wygenerowane raporty
```

## Instalacja

```bash
# 1. Przejdź do folderu backend
cd backend

# 2. Stwórz virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# lub: venv\Scripts\activate  # Windows

# 3. Zainstaluj zależności
pip install -r requirements.txt
```

## Uruchomienie

```bash
# Z folderu backend
python run.py

# Lub bezpośrednio przez uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Aplikacja będzie dostępna pod: http://localhost:8000

## API Endpoints

| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/upload/requirements` | Upload PDF z wymaganiami |
| POST | `/api/upload/device` | Upload karty katalogowej |
| POST | `/api/analyze/{filename}` | Analiza pojedynczego urządzenia |
| POST | `/api/analyze-all` | Analiza wszystkich urządzeń |
| GET | `/api/requirements` | Pobranie wymagań |
| GET | `/api/devices` | Lista wgranych urządzeń |
| GET | `/api/compare` | Porównanie urządzeń |
| DELETE | `/api/device/{filename}` | Usunięcie urządzenia |

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

## Technologie

- **Backend**: Python 3.10+, FastAPI, pdfplumber
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Ekstrakcja PDF**: pdfplumber

## Licencja

Projekt wewnętrzny
