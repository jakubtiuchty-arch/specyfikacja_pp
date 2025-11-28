from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict
import json
import logging

from .pdf_extractor import PDFExtractor
from .comparator import ParameterComparator
from ..models.schemas import (
    ParameterRequirement,
    DeviceParameter,
    ComparisonResult,
    AnalysisReport,
    ComplianceStatus
)
from ..core.config import WYMAGANIA_DIR, KARTY_DIR, OUTPUT_DIR

logger = logging.getLogger(__name__)


class SpecificationAnalyzer:
    """Główny serwis analizy specyfikacji"""

    def __init__(self):
        self.comparator = ParameterComparator()
        self.requirements: List[ParameterRequirement] = []
        self.requirements_loaded = False

    def load_requirements(self, pdf_path: Optional[str] = None) -> Dict:
        """Ładuje wymagania minimalne z PDF"""
        if pdf_path is None:
            # Szukaj pierwszego PDF w folderze wymagań
            pdf_files = list(WYMAGANIA_DIR.glob("*.pdf"))
            if not pdf_files:
                return {"success": False, "error": "Brak plików PDF w folderze wymagań"}
            pdf_path = str(pdf_files[0])

        extractor = PDFExtractor(pdf_path)
        extractor.extract_all()

        # Szukaj tabeli "Terminale mobilne"
        table = extractor.find_table_by_name("Terminale mobilne")

        if not table:
            # Spróbuj pierwszej tabeli
            tables_info = extractor.get_all_tables_info()
            if tables_info:
                table = extractor.tables[0]
            else:
                return {"success": False, "error": "Nie znaleziono tabel w PDF"}

        self.requirements, device_columns = extractor.extract_requirements_from_table(table)
        self.requirements_loaded = True

        return {
            "success": True,
            "requirements_count": len(self.requirements),
            "device_columns": device_columns,
            "requirements": [r.model_dump() for r in self.requirements]
        }

    def analyze_device(self, pdf_path: str, device_name: Optional[str] = None) -> AnalysisReport:
        """Analizuje kartę katalogową urządzenia"""
        if not self.requirements_loaded:
            self.load_requirements()

        extractor = PDFExtractor(pdf_path)
        device_params = extractor.extract_device_parameters()

        # Nazwa urządzenia
        if not device_name:
            device_name = Path(pdf_path).stem

        # Porównaj każdy parametr
        results: List[ComparisonResult] = []

        for req in self.requirements:
            # Znajdź odpowiadający parametr urządzenia
            device_param = self._find_matching_param(req.nazwa, device_params)
            result = self.comparator.compare(req, device_param)
            results.append(result)

        # Podsumowanie
        summary = {
            "spelnia": sum(1 for r in results if r.status == ComplianceStatus.SPEŁNIA),
            "nie_spelnia": sum(1 for r in results if r.status == ComplianceStatus.NIE_SPEŁNIA),
            "do_weryfikacji": sum(1 for r in results if r.status == ComplianceStatus.DO_WERYFIKACJI)
        }

        report = AnalysisReport(
            nazwa_urzadzenia=device_name,
            data_analizy=datetime.now(),
            plik_zrodlowy=pdf_path,
            wyniki=results,
            podsumowanie=summary
        )

        # Zapisz raport
        self._save_report(report)

        return report

    def analyze_all_devices(self) -> List[AnalysisReport]:
        """Analizuje wszystkie karty katalogowe w folderze"""
        if not self.requirements_loaded:
            self.load_requirements()

        reports = []
        pdf_files = list(KARTY_DIR.glob("*.pdf"))

        for pdf_file in pdf_files:
            try:
                report = self.analyze_device(str(pdf_file))
                reports.append(report)
            except Exception as e:
                logger.error(f"Błąd analizy {pdf_file}: {e}")

        return reports

    def _find_matching_param(
        self,
        param_name: str,
        device_params: List[DeviceParameter]
    ) -> Optional[DeviceParameter]:
        """Znajduje parametr urządzenia pasujący do nazwy wymagania"""
        param_lower = param_name.lower()

        # Dokładne dopasowanie
        for dp in device_params:
            if dp.nazwa.lower() == param_lower:
                return dp

        # Częściowe dopasowanie
        for dp in device_params:
            if param_lower in dp.nazwa.lower() or dp.nazwa.lower() in param_lower:
                return dp

        # Dopasowanie słów kluczowych
        keywords = param_lower.split()
        for dp in device_params:
            dp_words = dp.nazwa.lower().split()
            if any(kw in dp_words for kw in keywords):
                return dp

        return None

    def _save_report(self, report: AnalysisReport) -> str:
        """Zapisuje raport do pliku"""
        filename = f"raport_{report.nazwa_urzadzenia}_{report.data_analizy.strftime('%Y%m%d_%H%M%S')}.json"
        filepath = OUTPUT_DIR / filename

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(report.model_dump(), f, ensure_ascii=False, indent=2, default=str)

        return str(filepath)

    def get_requirements_summary(self) -> Dict:
        """Zwraca podsumowanie załadowanych wymagań"""
        if not self.requirements_loaded:
            return {"loaded": False, "count": 0}

        return {
            "loaded": True,
            "count": len(self.requirements),
            "parameters": [r.nazwa for r in self.requirements]
        }

    def compare_multiple_devices(self, reports: List[AnalysisReport]) -> Dict:
        """Porównuje wiele urządzeń - generuje tabelę porównawczą"""
        if not reports:
            return {"error": "Brak raportów do porównania"}

        comparison = {
            "urzadzenia": [r.nazwa_urzadzenia for r in reports],
            "parametry": []
        }

        # Dla każdego parametru z wymagań
        for req in self.requirements:
            param_row = {
                "parametr": req.nazwa,
                "wymaganie_minimalne": req.wymaganie_minimalne,
                "wyniki": {}
            }

            for report in reports:
                # Znajdź wynik dla tego parametru
                result = next(
                    (r for r in report.wyniki if r.parametr == req.nazwa),
                    None
                )

                if result:
                    param_row["wyniki"][report.nazwa_urzadzenia] = {
                        "wartosc": result.wartosc_urzadzenia,
                        "status": result.status.value
                    }

            comparison["parametry"].append(param_row)

        return comparison
