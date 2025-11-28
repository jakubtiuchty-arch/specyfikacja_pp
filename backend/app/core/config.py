import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
INPUT_DIR = BASE_DIR / "input"
OUTPUT_DIR = BASE_DIR / "output"
WYMAGANIA_DIR = INPUT_DIR / "wymagania"
KARTY_DIR = INPUT_DIR / "karty_katalogowe"

# Ensure directories exist
for dir_path in [INPUT_DIR, OUTPUT_DIR, WYMAGANIA_DIR, KARTY_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# OpenAI API (opcjonalnie dla zaawansowanej analizy)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# App settings
APP_NAME = "Terminal Specification Analyzer"
DEBUG = os.getenv("DEBUG", "True").lower() == "true"
