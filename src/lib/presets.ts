import { RequirementsData } from '@/types'

// Pełny preset wymagań minimalnych dla terminali mobilnych
// Na podstawie dokumentu przetargowego
export const TERMINALE_MOBILNE_PRESET: RequirementsData = {
  nazwa_tabeli: 'Terminale mobilne',
  parametry: [
    {
      nazwa: 'System',
      wymaganie_minimalne: 'Android min. 13 z możliwością upgrade do v.16',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'Procesor',
      wymaganie_minimalne: 'ARM, min. 2.0 GHZ, min. 8 rdzeni',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'Min. RAM / Flash',
      wymaganie_minimalne: '8 GB/32 GB',
      typ_porownania: 'min'
    },
    {
      nazwa: 'NFC',
      wymaganie_minimalne: 'tak',
      typ_porownania: 'boolean'
    },
    {
      nazwa: 'GPS',
      wymaganie_minimalne: 'tak',
      typ_porownania: 'boolean'
    },
    {
      nazwa: 'BT',
      wymaganie_minimalne: 'Min. 5.0 BLE',
      typ_porownania: 'min'
    },
    {
      nazwa: 'Test AnTuTu',
      wymaganie_minimalne: 'Min. 41.000 pkt',
      typ_porownania: 'min'
    },
    {
      nazwa: 'WiFi 802.1x (WPA2-Enterprise)',
      wymaganie_minimalne: '2,4 GHz oraz 5 GHz',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'VoIP',
      wymaganie_minimalne: 'opcja',
      typ_porownania: 'boolean'
    },
    {
      nazwa: 'AER',
      wymaganie_minimalne: 'tak',
      typ_porownania: 'boolean'
    },
    {
      nazwa: 'GMS',
      wymaganie_minimalne: 'tak',
      typ_porownania: 'boolean'
    },
    {
      nazwa: 'GSM',
      wymaganie_minimalne: 'Tak - LTE',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'Karty SIM',
      wymaganie_minimalne: '1 x SIM, 1 x e-SIM',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'Gniazda',
      wymaganie_minimalne: 'USB-C',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'Kamera przód',
      wymaganie_minimalne: 'min. 8 MP',
      typ_porownania: 'min'
    },
    {
      nazwa: 'Kamera tył',
      wymaganie_minimalne: 'min. 13 MP',
      typ_porownania: 'min'
    },
    {
      nazwa: 'Wbudowany głośnik',
      wymaganie_minimalne: 'Tak',
      typ_porownania: 'boolean'
    },
    {
      nazwa: 'Wbudowany mikrofon',
      wymaganie_minimalne: 'tak',
      typ_porownania: 'boolean'
    },
    {
      nazwa: 'Dodatkowe karty',
      wymaganie_minimalne: 'SD lub micro SD',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'Waga max',
      wymaganie_minimalne: 'ok. 300 g',
      typ_porownania: 'max'
    },
    {
      nazwa: 'Waga max z uchwytem',
      wymaganie_minimalne: 'ok. 600 g',
      typ_porownania: 'max'
    },
    {
      nazwa: 'Wymiary max',
      wymaganie_minimalne: 'ok. 175 x 80 x 25 mm bez uchwytu pistoletowego',
      typ_porownania: 'max'
    },
    {
      nazwa: 'Klasa szczelności',
      wymaganie_minimalne: 'min. IP65, IP68',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'Temperatura pracy',
      wymaganie_minimalne: 'Od -10st.C do +50st.C',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'Odporność na upadki',
      wymaganie_minimalne: 'Wielokrotne na beton z wysokości powyżej 1,0 m w zakresie temperatur pracy urządzenia, czyli od -10 do +50 st.C',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'Odporność na wstrząsy',
      wymaganie_minimalne: 'Odporne zgodnie z IEC 600-2-64 lub nie gorszy – może być inna norma, ale odporność nie gorsza',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'Akumulator litowo-jonowy, wymienny jako tylna klapa urządzenia',
      wymaganie_minimalne: 'Min. 3500 mAh',
      typ_porownania: 'min'
    },
    {
      nazwa: 'Czas pracy akumulatora',
      wymaganie_minimalne: 'Gwarancja min. 12 miesięcy',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'Klawiatura',
      wymaganie_minimalne: 'Min. 10-12 godzin ciągłej pracy przy działających modułach GSM + GPS',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'Klawisze nawigacyjne',
      wymaganie_minimalne: 'Ekranowa (nie fizyczna)',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'Klawisze funkcyjne',
      wymaganie_minimalne: 'Fizyczne w kolorze innym niż obudowa lub podświetlane haptyczne zintegrowane z obudową położone pod ekranem urządzenia',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'Uchwyt pistoletowy',
      wymaganie_minimalne: 'Jako opcja',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'LCD – kolor, dotykowy, pojemnościowy – obsługa palcem lub rysikiem',
      wymaganie_minimalne: 'Jako dodatkowe akcesorium montowane w specjalnym uchwycie pistoletowym bez wcześniejszego demontażu elementów',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'LCD – rozdzielczość',
      wymaganie_minimalne: 'Min. 5,5" do max 6,5"',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'LCD – szkło',
      wymaganie_minimalne: 'Min. 1080 x 1920 pix',
      typ_porownania: 'min'
    },
    {
      nazwa: 'Imager 2D',
      wymaganie_minimalne: 'Gorilla Glass',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'Kody 1D min.',
      wymaganie_minimalne: 'Odczyt 1D i 2D',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'Kody 2D min.',
      wymaganie_minimalne: 'EAN8, EAN13, EAN 128 (GS1-128) CODABAR, Standard 2 of 5, Interleaved z przełożeniem 2 of 5, Code 39, Code 128, EAN 2 ISSN/ISBN',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'Sygnalizacja po odczytaniu kodu - dźwiękowa',
      wymaganie_minimalne: 'Dźwiękowa',
      typ_porownania: 'boolean'
    },
    {
      nazwa: 'Sygnalizacja po odczytaniu kodu - świetlna',
      wymaganie_minimalne: 'Świetlna - opcjonalnie',
      typ_porownania: 'contains'
    },
    {
      nazwa: 'Sygnalizacja po odczytaniu kodu - wibracyjna',
      wymaganie_minimalne: 'Opcjonalnie',
      typ_porownania: 'contains'
    }
  ],
  urzadzenia: [
    'Zebra TC58E', 'Zebra TC27', 'Honey CT32', 'Honey CT37', 'Honey EDA52',
    'PM84', 'Meferi', 'Newland MT95', 'Unitech PA768', 'Unitech EA660',
    'SM30', 'Cipherlab RS38', 'Bluebird S10', 'Bluebird S20'
  ]
}

// Lista dostępnych presetów
export const AVAILABLE_PRESETS = [
  {
    id: 'terminale_mobilne',
    name: 'Terminale mobilne',
    description: 'Wymagania minimalne dla terminali mobilnych (przetarg)',
    data: TERMINALE_MOBILNE_PRESET
  }
]

export function getPresetById(id: string): RequirementsData | null {
  const preset = AVAILABLE_PRESETS.find(p => p.id === id)
  return preset?.data || null
}
