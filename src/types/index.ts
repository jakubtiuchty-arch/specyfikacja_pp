export type ComplianceStatus = 'SPEŁNIA' | 'NIE SPEŁNIA' | 'DO WERYFIKACJI'

export interface ParameterRequirement {
  nazwa: string
  wymaganie_minimalne: string
  jednostka?: string
  typ_porownania?: 'min' | 'max' | 'exact' | 'boolean' | 'contains'
}

export interface DeviceParameter {
  nazwa: string
  wartosc: string
  jednostka?: string
}

export interface ComparisonResult {
  parametr: string
  wymaganie_minimalne: string
  wartosc_urzadzenia: string
  status: ComplianceStatus
  komentarz?: string
}

export interface AnalysisReport {
  nazwa_urzadzenia: string
  data_analizy: string
  plik_zrodlowy: string
  wyniki: ComparisonResult[]
  podsumowanie: {
    spelnia: number
    nie_spelnia: number
    do_weryfikacji: number
  }
}

export interface RequirementsData {
  nazwa_tabeli: string
  parametry: ParameterRequirement[]
  urzadzenia?: string[]
}

export interface UploadedFile {
  id: string
  name: string
  type: 'requirements' | 'device'
  uploadedAt: string
  url?: string
}

export interface AppState {
  requirements: RequirementsData | null
  devices: UploadedFile[]
  reports: AnalysisReport[]
}
