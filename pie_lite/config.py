import os

# Build type → £/m² (placeholder rates)
PLACEHOLDER_RATES = {
    "extension":        2500,
    "new_build":        3200,
    "loft_conversion":  2200,
    "refurbishment":    1800,
    "other":            2000
}

# Complexity bonus for opportunity score
COMPLEXITY_BONUS = {
    "extension":        10,
    "new_build":        30,
    "loft_conversion":  15,
    "refurbishment":    5,
    "other":            0
}

# 6-stage CRM pipeline
CRM_STAGES = ["New", "Contacted", "Site Visit", "Quoted", "Won", "Lost"]

# Default floor area (m²) when extraction fails
FLOOR_AREA_DEFAULTS = {
    "extension":        25,
    "new_build":        120,
    "loft_conversion":  40,
    "other":            80
}

# File paths
LEADS_JSON_PATH = "pie_lite/data/leads.json"
SEEN_REFS_PATH = "seen_refs.json"          # shared with idox-scraper
CSV_INPUT_PATH = "real_council_leads.csv"

# Vercel API target (override with PIE_API_URL env var for staging/prod)
VERCEL_API_URL = os.environ.get("PIE_API_URL", "http://localhost:3000")
