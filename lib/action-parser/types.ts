export type ActionType =
  | 'create_reminder'
  | 'create_task'
  | 'draft_email'
  | 'create_invoice'
  | 'book_callback'
  | 'schedule_meeting'
  | 'unknown';

export type ParsedAction = {
  action: ActionType;
  title?: string;
  message?: string;
  person?: string;
  participants?: string[];
  amount?: number;
  currency?: 'GBP' | 'USD' | 'EUR';
  date?: string;
  time?: string;
  confidence: number;
  needs_confirmation: boolean;
  missing_fields: string[];
  raw_text: string;
};

export type ExtractedEntities = {
  title?: string;
  person?: string;
  participants?: string[];
  amount?: number;
  currency?: 'GBP' | 'USD' | 'EUR';
  date?: string;
  time?: string;
};
