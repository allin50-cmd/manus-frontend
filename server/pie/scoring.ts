export type BuildType = 'extension' | 'new_build' | 'loft_conversion' | 'refurbishment' | 'other';

const PLACEHOLDER_RATES: Record<BuildType, number> = {
  extension: 2500,
  new_build: 3200,
  loft_conversion: 2200,
  refurbishment: 1800,
  other: 2000,
};

const COMPLEXITY_BONUS: Record<BuildType, number> = {
  extension: 10,
  new_build: 30,
  loft_conversion: 15,
  refurbishment: 5,
  other: 0,
};

const FLOOR_AREA_DEFAULTS: Record<BuildType, number> = {
  extension: 25,
  new_build: 120,
  loft_conversion: 40,
  refurbishment: 80,
  other: 80,
};

export function inferBuildType(description: string): BuildType {
  const text = description.toLowerCase();
  if (text.includes('new build') || text.includes('new dwelling') || text.includes('new housing')) {
    return 'new_build';
  }
  if (text.includes('loft') && text.includes('conversion')) {
    return 'loft_conversion';
  }
  if (text.includes('extension')) {
    return 'extension';
  }
  if (text.includes('refurbishment') || text.includes('renovation') || text.includes('refurb')) {
    return 'refurbishment';
  }
  return 'other';
}

export function extractFloorArea(
  description: string,
  buildType: BuildType,
): { area: number; source: 'keyword_extraction' | 'default'; confidence: 'low' } {
  const match = description.match(
    /(\d+(?:\.\d+)?)\s?(?:sq\.?\s?m|square\s?metres|m\s?²|sqm)/i,
  );
  if (match) {
    return { area: parseFloat(match[1]), source: 'keyword_extraction', confidence: 'low' };
  }
  return { area: FLOOR_AREA_DEFAULTS[buildType], source: 'default', confidence: 'low' };
}

export function calculateOpportunityScore(buildType: BuildType, floorArea: number): number {
  const bonus = COMPLEXITY_BONUS[buildType];
  const score = Math.floor(floorArea / 2 + bonus);
  return Math.min(100, score);
}

export function calculateEstimatedValue(buildType: BuildType, floorArea: number): number {
  const rate = PLACEHOLDER_RATES[buildType];
  return floorArea * rate;
}
