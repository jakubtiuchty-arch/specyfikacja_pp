import pdfplumber
import re
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import logging

from ..models.schemas import ParameterRequirement, DeviceParameter

logger = logging.getLogger(__name__)


class PDFExtractor:
    """Serwis do ekstrakcji danych z plików PDF"""

    def __init__(self, pdf_path: str):
        self.pdf_path = Path(pdf_path)
        self.tables: List[List[List[str]]] = []
        self.text: str = ""

    def extract_all(self) -> Dict:
        """Ekstraktuje wszystkie dane z PDF"""
        with pdfplumber.open(self.pdf_path) as pdf:
            all_tables = []
            all_text = []

            for page in pdf.pages:
                # Ekstrakcja tabel
                tables = page.extract_tables()
                if tables:
                    all_tables.extend(tables)

                # Ekstrakcja tekstu
                text = page.extract_text()
                if text:
                    all_text.append(text)

            self.tables = all_tables
            self.text = "\n".join(all_text)

        return {
            "tables": self.tables,
            "text": self.text,
            "num_tables": len(self.tables)
        }

    def find_table_by_name(self, table_name: str) -> Optional[List[List[str]]]:
        """Znajduje tabelę po nazwie (szuka w tekście przed tabelą)"""
        if not self.tables:
            self.extract_all()

        # Szukamy tabeli "Terminale mobilne" lub podobnej
        table_name_lower = table_name.lower()

        for table in self.tables:
            if table and len(table) > 0:
                # Sprawdź czy nazwa tabeli jest w pierwszym wierszu
                first_row = " ".join(str(cell) for cell in table[0] if cell)
                if table_name_lower in first_row.lower():
                    return table

                # Sprawdź w tekście
                if table_name_lower in self.text.lower():
                    return table

        # Zwróć pierwszą tabelę jeśli nie znaleziono po nazwie
        return self.tables[0] if self.tables else None

    def extract_requirements_from_table(self, table: List[List[str]]) -> Tuple[List[ParameterRequirement], List[str]]:
        """
        Ekstraktuje wymagania minimalne z tabeli.
        Zwraca: (lista wymagań, lista nazw urządzeń/kolumn)
        """
        if not table or len(table) < 2:
            return [], []

        requirements = []
        device_columns = []

        # Znajdź nagłówki (pierwszy wiersz)
        headers = [str(cell).strip() if cell else "" for cell in table[0]]

        # Znajdź indeks kolumny "Parametr" i "Wymagania minimalne"
        param_idx = None
        req_idx = None

        for i, header in enumerate(headers):
            header_lower = header.lower()
            if "parametr" in header_lower:
                param_idx = i
            elif "wymagan" in header_lower and "minim" in header_lower:
                req_idx = i
            elif "wymagan" in header_lower:
                req_idx = i

        # Jeśli nie znaleziono, przyjmij domyślne pozycje
        if param_idx is None:
            param_idx = 0
        if req_idx is None:
            req_idx = 1

        # Urządzenia są w pozostałych kolumnach
        for i, header in enumerate(headers):
            if i not in [param_idx, req_idx] and header:
                device_columns.append(header)

        # Przetwórz wiersze (pomijając nagłówek)
        for row in table[1:]:
            if not row or len(row) <= max(param_idx, req_idx):
                continue

            param_name = str(row[param_idx]).strip() if row[param_idx] else ""
            req_value = str(row[req_idx]).strip() if row[req_idx] else ""

            if param_name and req_value:
                # Określ typ porównania na podstawie treści
                typ = self._determine_comparison_type(req_value)

                requirements.append(ParameterRequirement(
                    nazwa=param_name,
                    wymaganie_minimalne=req_value,
                    typ_porownania=typ
                ))

        return requirements, device_columns

    def extract_device_parameters(self) -> List[DeviceParameter]:
        """Ekstraktuje parametry urządzenia z karty katalogowej"""
        if not self.tables:
            self.extract_all()

        parameters = []

        for table in self.tables:
            if not table or len(table) < 2:
                continue

            # Szukamy tabel z dwoma kolumnami (parametr: wartość)
            for row in table:
                if row and len(row) >= 2:
                    param_name = str(row[0]).strip() if row[0] else ""
                    param_value = str(row[1]).strip() if row[1] else ""

                    if param_name and param_value and not self._is_header(param_name):
                        parameters.append(DeviceParameter(
                            nazwa=param_name,
                            wartosc=param_value
                        ))

        # Dodatkowo parsuj tekst dla parametrów w formacie "Nazwa: Wartość"
        pattern = r'^([^:]+):\s*(.+)$'
        for line in self.text.split('\n'):
            match = re.match(pattern, line.strip())
            if match:
                param_name = match.group(1).strip()
                param_value = match.group(2).strip()

                # Unikaj duplikatów
                if not any(p.nazwa.lower() == param_name.lower() for p in parameters):
                    parameters.append(DeviceParameter(
                        nazwa=param_name,
                        wartosc=param_value
                    ))

        return parameters

    def _determine_comparison_type(self, requirement: str) -> str:
        """Określa typ porównania na podstawie treści wymagania"""
        req_lower = requirement.lower()

        if any(word in req_lower for word in ["minimum", "min.", "min ", "co najmniej", "≥", ">="]):
            return "min"
        elif any(word in req_lower for word in ["maksimum", "max.", "max ", "co najwyżej", "≤", "<="]):
            return "max"
        elif any(word in req_lower for word in ["tak", "yes", "wymagane", "obowiązkowe"]):
            return "boolean"
        elif any(word in req_lower for word in ["zawiera", "obsługuje", "posiada"]):
            return "contains"
        else:
            return "exact"

    def _is_header(self, text: str) -> bool:
        """Sprawdza czy tekst wygląda jak nagłówek"""
        header_keywords = ["parametr", "nazwa", "specyfikacja", "opis", "wartość", "cecha"]
        return any(keyword in text.lower() for keyword in header_keywords)

    def get_all_tables_info(self) -> List[Dict]:
        """Zwraca informacje o wszystkich tabelach w PDF"""
        if not self.tables:
            self.extract_all()

        tables_info = []
        for i, table in enumerate(self.tables):
            if table:
                tables_info.append({
                    "index": i,
                    "rows": len(table),
                    "cols": len(table[0]) if table[0] else 0,
                    "headers": table[0] if table else [],
                    "preview": table[:3] if len(table) >= 3 else table
                })

        return tables_info
