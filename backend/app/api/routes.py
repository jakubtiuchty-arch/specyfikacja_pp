import shutil
from pathlib import Path
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

from ..services.analyzer import SpecificationAnalyzer
from ..services.pdf_extractor import PDFExtractor
from ..models.schemas import UploadResponse, AnalysisReport
from ..core.config import WYMAGANIA_DIR, KARTY_DIR

router = APIRouter()
analyzer = SpecificationAnalyzer()


@router.post("/upload/requirements", response_model=UploadResponse)
async def upload_requirements(file: UploadFile = File(...)):
    """Upload pliku PDF z wymaganiami minimalnymi (tabela 'Terminale mobilne')"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Tylko pliki PDF są akceptowane")

    file_path = WYMAGANIA_DIR / file.filename

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Załaduj wymagania
        result = analyzer.load_requirements(str(file_path))

        if result["success"]:
            return UploadResponse(
                success=True,
                filename=file.filename,
                message=f"Załadowano {result['requirements_count']} wymagań",
                file_path=str(file_path)
            )
        else:
            return UploadResponse(
                success=False,
                filename=file.filename,
                message=result.get("error", "Błąd ładowania wymagań")
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload/device", response_model=UploadResponse)
async def upload_device_catalog(file: UploadFile = File(...)):
    """Upload karty katalogowej urządzenia"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Tylko pliki PDF są akceptowane")

    file_path = KARTY_DIR / file.filename

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return UploadResponse(
            success=True,
            filename=file.filename,
            message="Karta katalogowa została wgrana",
            file_path=str(file_path)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/{filename}")
async def analyze_device(filename: str):
    """Analizuje kartę katalogową urządzenia i porównuje z wymaganiami"""
    file_path = KARTY_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Plik nie znaleziony")

    try:
        report = analyzer.analyze_device(str(file_path))
        return report.model_dump()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-all")
async def analyze_all_devices():
    """Analizuje wszystkie karty katalogowe w folderze"""
    try:
        reports = analyzer.analyze_all_devices()
        return {
            "count": len(reports),
            "reports": [r.model_dump() for r in reports]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/requirements")
async def get_requirements():
    """Zwraca załadowane wymagania minimalne"""
    return analyzer.get_requirements_summary()


@router.get("/requirements/details")
async def get_requirements_details():
    """Zwraca szczegółowe wymagania minimalne"""
    if not analyzer.requirements_loaded:
        result = analyzer.load_requirements()
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result.get("error"))

    return {
        "count": len(analyzer.requirements),
        "requirements": [r.model_dump() for r in analyzer.requirements]
    }


@router.get("/devices")
async def list_devices():
    """Lista wgranych kart katalogowych"""
    pdf_files = list(KARTY_DIR.glob("*.pdf"))
    return {
        "count": len(pdf_files),
        "files": [f.name for f in pdf_files]
    }


@router.get("/preview/{filename}")
async def preview_pdf(filename: str):
    """Podgląd zawartości PDF (tabele i tekst)"""
    # Szukaj w obu folderach
    file_path = KARTY_DIR / filename
    if not file_path.exists():
        file_path = WYMAGANIA_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Plik nie znaleziony")

    try:
        extractor = PDFExtractor(str(file_path))
        data = extractor.extract_all()
        tables_info = extractor.get_all_tables_info()

        return {
            "filename": filename,
            "tables_count": data["num_tables"],
            "tables": tables_info,
            "text_preview": data["text"][:2000] if data["text"] else ""
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/device/{filename}")
async def delete_device(filename: str):
    """Usuwa kartę katalogową"""
    file_path = KARTY_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Plik nie znaleziony")

    try:
        file_path.unlink()
        return {"success": True, "message": f"Usunięto {filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/compare")
async def compare_devices():
    """Porównuje wszystkie przeanalizowane urządzenia"""
    try:
        reports = analyzer.analyze_all_devices()
        comparison = analyzer.compare_multiple_devices(reports)
        return comparison
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
