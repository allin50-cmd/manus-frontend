// ============================================================================
// FINEGUARD API SERVICE LAYER
// ============================================================================

import type {
  Company, VATReturn, LedgerEntry, Receipt, StagingItem,
  BankTransaction, VaultDocument, ComplianceAlert, AuditLog,
  DashboardStats, CompaniesHouseResult, MTDFiling,
  ApiResponse, PaginatedResponse, ExtractedFields
} from '@/types/fineguard';

const API_BASE = '/api';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('fg_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new ApiError(res.status, err.message ?? `HTTP ${res.status}`, err);
  }

  return res.json();
}

// ============================================================================
// AUTH
// ============================================================================
export const authApi = {
  login: (email: string, password: string) =>
    request<ApiResponse<{ token: string; user: import('@/types/fineguard').User }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  loginMagicLink: (email: string) =>
    request<ApiResponse<void>>('/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyMFA: (code: string) =>
    request<ApiResponse<{ token: string }>>('/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  logout: () =>
    request<void>('/auth/logout', { method: 'POST' }),
};

// ============================================================================
// COMPANIES
// ============================================================================
export const companiesApi = {
  getAll: () =>
    request<ApiResponse<Company[]>>('/companies'),

  getById: (id: string) =>
    request<ApiResponse<Company>>(`/companies/${id}`),

  create: (data: Partial<Company>) =>
    request<ApiResponse<Company>>('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Company>) =>
    request<ApiResponse<Company>>(`/companies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ============================================================================
// VAT
// ============================================================================
export const vatApi = {
  getBoxes: (companyId: string) =>
    request<ApiResponse<import('@/types/fineguard').VATBoxes>>(`/vat/boxes?companyId=${companyId}`),

  getReturns: (companyId: string) =>
    request<ApiResponse<VATReturn[]>>(`/vat/returns?companyId=${companyId}`),

  getReturn: (id: string) =>
    request<ApiResponse<VATReturn>>(`/vat/returns/${id}`),

  validate: (returnId: string) =>
    request<ApiResponse<{ valid: boolean; errors: string[] }>>(`/vat/validate`, {
      method: 'POST',
      body: JSON.stringify({ returnId }),
    }),

  submit: (returnId: string) =>
    request<ApiResponse<MTDFiling>>('/vat/submit', {
      method: 'POST',
      body: JSON.stringify({ returnId }),
    }),

  exportCSV: (returnId: string) =>
    request<Blob>(`/vat/returns/${returnId}/export`),
};

// ============================================================================
// FILES & RECEIPTS
// ============================================================================
export const receiptsApi = {
  upload: async (file: File, companyId: string): Promise<ApiResponse<Receipt>> => {
    const token = localStorage.getItem('fg_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('companyId', companyId);

    const res = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Upload failed' }));
      throw new ApiError(res.status, err.message);
    }

    return res.json();
  },

  process: (receiptId: string) =>
    request<ApiResponse<ExtractedFields>>('/receipts/process', {
      method: 'POST',
      body: JSON.stringify({ receiptId }),
    }),

  getAll: (companyId: string) =>
    request<ApiResponse<Receipt[]>>(`/receipts?companyId=${companyId}`),

  getById: (id: string) =>
    request<ApiResponse<Receipt>>(`/receipts/${id}`),

  approve: (receiptId: string, fields: ExtractedFields) =>
    request<ApiResponse<LedgerEntry>>(`/receipts/${receiptId}/approve`, {
      method: 'POST',
      body: JSON.stringify(fields),
    }),

  reject: (receiptId: string, reason: string) =>
    request<ApiResponse<void>>(`/receipts/${receiptId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

// ============================================================================
// LEDGER
// ============================================================================
export const ledgerApi = {
  getEntries: (companyId: string, params?: Record<string, string>) => {
    const query = params ? '&' + new URLSearchParams(params).toString() : '';
    return request<ApiResponse<LedgerEntry[]>>(`/ledger?companyId=${companyId}${query}`);
  },

  createEntry: (data: Partial<LedgerEntry>) =>
    request<ApiResponse<LedgerEntry>>('/ledger', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateEntry: (id: string, data: Partial<LedgerEntry>) =>
    request<ApiResponse<LedgerEntry>>(`/ledger/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  verifyEntry: (id: string) =>
    request<ApiResponse<LedgerEntry>>(`/ledger/${id}/verify`, {
      method: 'POST',
    }),
};

// ============================================================================
// STAGING QUEUE
// ============================================================================
export const stagingApi = {
  getQueue: (companyId: string) =>
    request<ApiResponse<StagingItem[]>>(`/staging?companyId=${companyId}`),

  approve: (id: string, fields: ExtractedFields) =>
    request<ApiResponse<LedgerEntry>>(`/staging/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify(fields),
    }),

  reject: (id: string, reason: string) =>
    request<ApiResponse<void>>(`/staging/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

// ============================================================================
// BANK RECONCILIATION
// ============================================================================
export const reconciliationApi = {
  getBankTransactions: (companyId: string) =>
    request<ApiResponse<BankTransaction[]>>(`/bank/transactions?companyId=${companyId}`),

  matchTransaction: (bankTxId: string, ledgerIds: string[]) =>
    request<ApiResponse<BankTransaction>>(`/bank/transactions/${bankTxId}/match`, {
      method: 'POST',
      body: JSON.stringify({ ledgerIds }),
    }),

  markNonVAT: (bankTxId: string) =>
    request<ApiResponse<BankTransaction>>(`/bank/transactions/${bankTxId}/non-vat`, {
      method: 'POST',
    }),
};

// ============================================================================
// DOCUMENT VAULT
// ============================================================================
export const documentsApi = {
  getAll: (companyId: string, params?: Record<string, string>) => {
    const query = params ? '&' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResponse<VaultDocument>>(`/documents?companyId=${companyId}${query}`);
  },

  upload: async (file: File, companyId: string, metadata: Partial<VaultDocument>): Promise<ApiResponse<VaultDocument>> => {
    const token = localStorage.getItem('fg_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('companyId', companyId);
    formData.append('metadata', JSON.stringify(metadata));

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!res.ok) throw new ApiError(res.status, 'Upload failed');
    return res.json();
  },

  delete: (id: string) =>
    request<ApiResponse<void>>(`/documents/${id}`, { method: 'DELETE' }),
};

// ============================================================================
// COMPLIANCE ALERTS
// ============================================================================
export const alertsApi = {
  getAll: (companyId?: string) => {
    const query = companyId ? `?companyId=${companyId}` : '';
    return request<ApiResponse<ComplianceAlert[]>>(`/alerts${query}`);
  },

  markRead: (id: string) =>
    request<ApiResponse<void>>(`/alerts/${id}/read`, { method: 'POST' }),

  resolve: (id: string) =>
    request<ApiResponse<void>>(`/alerts/${id}/resolve`, { method: 'POST' }),
};

// ============================================================================
// AUDIT TRAIL
// ============================================================================
export const auditApi = {
  getLogs: (companyId: string, params?: Record<string, string>) => {
    const query = params ? '&' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResponse<AuditLog>>(`/audit?companyId=${companyId}${query}`);
  },
};

// ============================================================================
// COMPANIES HOUSE
// ============================================================================
export const companiesHouseApi = {
  search: (query: string) =>
    request<ApiResponse<CompaniesHouseResult[]>>(`/companies-house/search?q=${encodeURIComponent(query)}`),

  getByNumber: (companyNumber: string) =>
    request<ApiResponse<CompaniesHouseResult>>(`/companies-house/${companyNumber}`),
};

// ============================================================================
// DASHBOARD
// ============================================================================
export const dashboardApi = {
  getStats: (companyId: string) =>
    request<ApiResponse<DashboardStats>>(`/dashboard/stats?companyId=${companyId}`),
};
