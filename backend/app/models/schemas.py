from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
from datetime import datetime


class ComplianceStatus(str, Enum):
    SPEŁNIA = "SPEŁNIA"
    NIE_SPEŁNIA = "NIE SPEŁNIA"
    DO_WERYFIKACJI = "DO WERYFIKACJI"


class ParameterRequirement(BaseModel):
    """Wymaganie minimalne dla parametru"""
    nazwa: str
    wymaganie_minimalne: str
    jednostka: Optional[str] = None
    typ_porownania: Optional[str] = None  # "min", "max", "exact", "contains"


class DeviceParameter(BaseModel):
    """Parametr urządzenia z karty katalogowej"""
    nazwa: str
    wartosc: str
    jednostka: Optional[str] = None


class ComparisonResult(BaseModel):
    """Wynik porównania pojedynczego parametru"""
    parametr: str
    wymaganie_minimalne: str
    wartosc_urzadzenia: str
    status: ComplianceStatus
    komentarz: Optional[str] = None


class AnalysisReport(BaseModel):
    """Pełny raport analizy urządzenia"""
    nazwa_urzadzenia: str
    data_analizy: datetime
    plik_zrodlowy: str
    wyniki: List[ComparisonResult]
    podsumowanie: dict  # {"spelnia": int, "nie_spelnia": int, "do_weryfikacji": int}


class UploadResponse(BaseModel):
    """Odpowiedź po uploadzie pliku"""
    success: bool
    filename: str
    message: str
    file_path: Optional[str] = None


class RequirementsData(BaseModel):
    """Dane wymagań minimalnych"""
    nazwa_tabeli: str
    parametry: List[ParameterRequirement]


class DeviceData(BaseModel):
    """Dane urządzenia z karty katalogowej"""
    nazwa_urzadzenia: str
    producent: Optional[str] = None
    model: Optional[str] = None
    parametry: List[DeviceParameter]
