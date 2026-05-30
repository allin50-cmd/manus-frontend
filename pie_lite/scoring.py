import re
from .config import PLACEHOLDER_RATES, COMPLEXITY_BONUS, FLOOR_AREA_DEFAULTS


def infer_build_type(description: str) -> str:
    """Simple keyword matching to guess build type."""
    text = description.lower()
    if any(phrase in text for phrase in ("new build", "new dwelling", "new housing")):
        return "new_build"
    if "loft" in text and "conversion" in text:
        return "loft_conversion"
    if "extension" in text:
        return "extension"
    if any(w in text for w in ("refurbishment", "renovation", "refurb")):
        return "refurbishment"
    return "other"


def extract_floor_area(description: str, build_type: str) -> tuple[float, str, str]:
    """
    Try to find a number followed by sqm/m².
    Returns (area, source, confidence).
    """
    match = re.search(
        r"(\d+(?:\.\d+)?)\s?(?:sq\.?\s?m|square\s?metres|m\s?²|sqm)",
        description,
        re.IGNORECASE,
    )
    if match:
        area = float(match.group(1))
        return area, "keyword_extraction", "low"
    default = FLOOR_AREA_DEFAULTS.get(build_type, 80)
    return float(default), "default", "low"


def calculate_opportunity_score(build_type: str, floor_area: float) -> int:
    """Transparent scoring formula."""
    bonus = COMPLEXITY_BONUS.get(build_type, 0)
    score = floor_area / 2.0 + bonus
    return min(100, int(round(score)))


def calculate_estimated_value(build_type: str, floor_area: float) -> float:
    """Uses placeholder rate – requires professional validation."""
    rate = PLACEHOLDER_RATES.get(build_type, 2000)
    return floor_area * rate
