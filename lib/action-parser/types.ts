export interface ParsedAction {
  action: string;
  title?: string;
  date?: string;
  time?: string;
  participants?: string[];
  missing_fields?: string[];
  needs_confirmation?: boolean;
  confidence: number;
  [key: string]: unknown;
}

export interface EntityExtraction {
  date?: string;
  time?: string;
  participants?: string[];
  title?: string;
}
