import re
from typing import Optional, Tuple
from ..models.schemas import (
    ParameterRequirement,
    DeviceParameter,
    ComparisonResult,
    ComplianceStatus
)


class ParameterComparator:
    """Serwis do porównywania parametrów urządzeń z wymaganiami minimalnymi"""

    def compare(
        self,
        requirement: ParameterRequirement,
        device_param: Optional[DeviceParameter]
    ) -> ComparisonResult:
        """Porównuje parametr urządzenia z wymaganiem minimalnym"""

        if not device_param:
            return ComparisonResult(
                parametr=requirement.nazwa,
                wymaganie_minimalne=requirement.wymaganie_minimalne,
                wartosc_urzadzenia="BRAK DANYCH",
                status=ComplianceStatus.DO_WERYFIKACJI,
                komentarz="Nie znaleziono tego parametru w karcie katalogowej"
            )

        req_value = requirement.wymaganie_minimalne
        dev_value = device_param.wartosc
        comparison_type = requirement.typ_porownania or "exact"

        # Wybierz metodę porównania
        if comparison_type == "min":
            status, comment = self._compare_min(req_value, dev_value)
        elif comparison_type == "max":
            status, comment = self._compare_max(req_value, dev_value)
        elif comparison_type == "boolean":
            status, comment = self._compare_boolean(req_value, dev_value)
        elif comparison_type == "contains":
            status, comment = self._compare_contains(req_value, dev_value)
        else:
            status, comment = self._compare_exact(req_value, dev_value)

        return ComparisonResult(
            parametr=requirement.nazwa,
            wymaganie_minimalne=req_value,
            wartosc_urzadzenia=dev_value,
            status=status,
            komentarz=comment
        )

    def _extract_number(self, text: str) -> Optional[float]:
        """Wyciąga liczbę z tekstu"""
        # Usuń spacje i zamień przecinek na kropkę
        text = text.replace(" ", "").replace(",", ".")

        # Szukaj liczb (w tym z jednostkami)
        patterns = [
            r'(\d+\.?\d*)',  # podstawowa liczba
            r'(\d+)',  # liczba całkowita
        ]

        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    return float(match.group(1))
                except ValueError:
                    continue

        return None

    def _compare_min(self, req: str, dev: str) -> Tuple[ComplianceStatus, str]:
        """Porównanie minimalne (wartość urządzenia >= wymaganie)"""
        req_num = self._extract_number(req)
        dev_num = self._extract_number(dev)

        if req_num is None or dev_num is None:
            return ComplianceStatus.DO_WERYFIKACJI, "Nie można porównać wartości numerycznych"

        if dev_num >= req_num:
            return ComplianceStatus.SPEŁNIA, f"{dev_num} >= {req_num}"
        else:
            return ComplianceStatus.NIE_SPEŁNIA, f"{dev_num} < {req_num} (wymagane minimum)"

    def _compare_max(self, req: str, dev: str) -> Tuple[ComplianceStatus, str]:
        """Porównanie maksymalne (wartość urządzenia <= wymaganie)"""
        req_num = self._extract_number(req)
        dev_num = self._extract_number(dev)

        if req_num is None or dev_num is None:
            return ComplianceStatus.DO_WERYFIKACJI, "Nie można porównać wartości numerycznych"

        if dev_num <= req_num:
            return ComplianceStatus.SPEŁNIA, f"{dev_num} <= {req_num}"
        else:
            return ComplianceStatus.NIE_SPEŁNIA, f"{dev_num} > {req_num} (wymagane maksimum)"

    def _compare_boolean(self, req: str, dev: str) -> Tuple[ComplianceStatus, str]:
        """Porównanie tak/nie"""
        positive_words = ["tak", "yes", "true", "1", "posiada", "obsługuje", "wspiera", "✓", "✔"]
        negative_words = ["nie", "no", "false", "0", "brak", "✗", "✘", "-"]

        req_lower = req.lower().strip()
        dev_lower = dev.lower().strip()

        # Jeśli wymaganie to "tak"
        if any(word in req_lower for word in positive_words):
            if any(word in dev_lower for word in positive_words):
                return ComplianceStatus.SPEŁNIA, "Urządzenie posiada wymaganą funkcję"
            elif any(word in dev_lower for word in negative_words):
                return ComplianceStatus.NIE_SPEŁNIA, "Urządzenie nie posiada wymaganej funkcji"

        return ComplianceStatus.DO_WERYFIKACJI, "Wymaga manualnej weryfikacji"

    def _compare_contains(self, req: str, dev: str) -> Tuple[ComplianceStatus, str]:
        """Sprawdza czy urządzenie zawiera wymaganą funkcjonalność"""
        req_lower = req.lower()
        dev_lower = dev.lower()

        # Wyciągnij kluczowe słowa z wymagania
        keywords = self._extract_keywords(req_lower)

        matched = sum(1 for kw in keywords if kw in dev_lower)
        total = len(keywords)

        if total == 0:
            return ComplianceStatus.DO_WERYFIKACJI, "Brak słów kluczowych do porównania"

        if matched == total:
            return ComplianceStatus.SPEŁNIA, f"Znaleziono wszystkie wymagane elementy ({matched}/{total})"
        elif matched > 0:
            return ComplianceStatus.DO_WERYFIKACJI, f"Częściowe dopasowanie ({matched}/{total})"
        else:
            return ComplianceStatus.NIE_SPEŁNIA, "Nie znaleziono wymaganych elementów"

    def _compare_exact(self, req: str, dev: str) -> Tuple[ComplianceStatus, str]:
        """Porównanie dokładne lub przybliżone"""
        req_clean = req.lower().strip()
        dev_clean = dev.lower().strip()

        # Dokładne dopasowanie
        if req_clean == dev_clean:
            return ComplianceStatus.SPEŁNIA, "Dokładne dopasowanie"

        # Sprawdź czy wymaganie zawiera się w wartości urządzenia
        if req_clean in dev_clean:
            return ComplianceStatus.SPEŁNIA, "Wartość urządzenia zawiera wymaganie"

        # Porównaj liczby jeśli są
        req_num = self._extract_number(req)
        dev_num = self._extract_number(dev)

        if req_num is not None and dev_num is not None:
            if dev_num >= req_num:
                return ComplianceStatus.SPEŁNIA, f"Wartość {dev_num} >= {req_num}"
            else:
                return ComplianceStatus.NIE_SPEŁNIA, f"Wartość {dev_num} < {req_num}"

        # Sprawdź podobieństwo tekstu
        similarity = self._text_similarity(req_clean, dev_clean)
        if similarity > 0.8:
            return ComplianceStatus.SPEŁNIA, f"Wysokie podobieństwo ({similarity:.0%})"
        elif similarity > 0.5:
            return ComplianceStatus.DO_WERYFIKACJI, f"Częściowe podobieństwo ({similarity:.0%})"

        return ComplianceStatus.DO_WERYFIKACJI, "Wymaga manualnej weryfikacji"

    def _extract_keywords(self, text: str) -> list:
        """Wyciąga kluczowe słowa z tekstu"""
        # Usuń słowa funkcyjne
        stopwords = {"i", "lub", "oraz", "a", "w", "z", "do", "na", "dla", "min", "max", "co", "najmniej"}
        words = re.findall(r'\b\w+\b', text.lower())
        return [w for w in words if w not in stopwords and len(w) > 2]

    def _text_similarity(self, text1: str, text2: str) -> float:
        """Oblicza podobieństwo dwóch tekstów (Jaccard)"""
        words1 = set(text1.split())
        words2 = set(text2.split())

        if not words1 or not words2:
            return 0.0

        intersection = words1 & words2
        union = words1 | words2

        return len(intersection) / len(union)
