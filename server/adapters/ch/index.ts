// ============================================================================
// Companies House Adapter — Provider Selection
// Uses real adapter when COMPANIES_HOUSE_API_KEY is set, mock otherwise.
// ============================================================================

import { CHAdapter } from './types.js';
import { RealCHAdapter } from './real.js';
import { MockCHAdapter } from './mock.js';

let _adapter: CHAdapter | null = null;

export function getCHAdapter(): CHAdapter {
  if (_adapter) return _adapter;

  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  if (apiKey && apiKey !== 'your-companies-house-api-key-here') {
    console.log('🔗 Using real Companies House API adapter');
    _adapter = new RealCHAdapter(apiKey);
  } else {
    console.log('🧪 Using mock Companies House adapter (set COMPANIES_HOUSE_API_KEY to use live data)');
    _adapter = new MockCHAdapter();
  }

  return _adapter;
}

export type { CHAdapter, CHCompanyProfile } from './types.js';
