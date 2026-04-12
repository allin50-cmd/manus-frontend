export interface Officer {
  name: string;
  role: string;
  appointedOn: string;
  resignedOn?: string;
  nationality?: string;
}

export interface PersonWithSignificantControl {
  name: string;
  nationality?: string;
  notifiedOn: string;
  ceasedOn?: string;
  naturesOfControl: string[];
}

export interface Charge {
  chargeCode: string;
  status: string;
  createdOn: string;
  satisfiedOn?: string;
  description?: string;
}

export type ViabilityTier = 'excellent' | 'strong' | 'moderate' | 'weak' | 'poor';

export interface ViabilityScore {
  score: number;        // 0 – 100
  tier: ViabilityTier;
  factors: string[];    // human-readable positive / negative signals
}

export interface DiscoveryInsights {
  /** Primary contacts and their decision-making context */
  whoToContact: { name: string; role: string; context: string }[];
  /** Recommended engagement approach for the business */
  howToEngage: string;
  /** Plain-English viability summary */
  viabilitySummary: string;
  /** Red flags that should give you pause */
  redFlags: string[];
  /** Positive signals supporting the business relationship */
  strengthSignals: string[];
}

export interface AgentDiscovery {
  companyNumber: string;
  companyName: string;
  sicCodes: string[];
  hasInsolvencyHistory: boolean;
  officers: Officer[];
  personsWithSignificantControl: PersonWithSignificantControl[];
  charges: Charge[];
  viability: ViabilityScore;
  insights: DiscoveryInsights | null;
  generatedAt: string;
}
