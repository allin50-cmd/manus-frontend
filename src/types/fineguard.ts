// ============================================================================
// FINEGUARD TYPE DEFINITIONS
// ============================================================================

// User & Auth
export type UserRole = 'viewer' | 'accountant' | 'senior_accountant' | 'partner';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyIds: string[];
  mfaEnabled: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Company
export type CompanyStatus = 'active' | 'dissolved' | 'liquidation' | 'dormant';
export type VATScheme = 'standard' | 'flat_rate' | 'cash_accounting' | 'annual_accounting';
export type FilingStatus = 'compliant' | 'due_soon' | 'overdue' | 'submitted' | 'draft';

export interface Company {
  id: string;
  name: string;
  companyNumber: string;
  vrn: string; // VAT Registration Number
  vatScheme: VATScheme;
  status: CompanyStatus;
  registeredAddress: string;
  directors: string[];
  nextFilingDate: string;
  nextVATReturn: string;
  filingStatus: FilingStatus;
  syncStatus: 'in_sync' | 'variance_detected' | 'pending';
  lastSynced: string;
}

// VAT
export interface VATBoxes {
  box1: number; // VAT due on sales
  box2: number; // VAT due on acquisitions
  box3: number; // Total VAT due (box1 + box2)
  box4: number; // VAT reclaimable
  box5: number; // Net VAT due (box3 - box4)
  box6: number; // Total value of sales
  box7: number; // Total value of purchases
  box8: number; // Total value of EU sales
  box9: number; // Total value of EU purchases
}

export type VATReturnStatus = 'draft' | 'validated' | 'submitted' | 'accepted' | 'rejected';

export interface VATReturn {
  id: string;
  companyId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  status: VATReturnStatus;
  boxes: VATBoxes;
  submittedAt?: string;
  submissionId?: string;
  hmrcReceipt?: string;
  authorizedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Ledger
export type TransactionType = 'sales' | 'purchase' | 'adjustment';
export type TransactionSource = 'manual' | 'ocr' | 'bank_feed' | 'import';
export type VerificationStatus = 'unverified' | 'verified' | 'locked';

export interface LedgerEntry {
  id: string;
  companyId: string;
  date: string;
  description: string;
  supplier: string;
  net: number;
  vat: number;
  gross: number;
  type: TransactionType;
  verifiedBy?: string;
  verifiedAt?: string;
  source: TransactionSource;
  status: VerificationStatus;
  invoiceNumber?: string;
  vatRate: number;
  fingerprint?: string; // SHA256(supplier+date+gross)
  createdAt: string;
}

// Receipt & OCR
export type ReceiptStatus = 'uploaded' | 'processing' | 'extracted' | 'verified' | 'rejected' | 'duplicate';
export type FileType = 'pdf' | 'image' | 'csv' | 'excel';

export interface ExtractedFields {
  supplier: string;
  date: string;
  net: number;
  vat: number;
  gross: number;
  invoiceNumber: string;
  vatRate: number;
  confidence: number; // 0-100
}

export interface Receipt {
  id: string;
  companyId: string;
  fileName: string;
  fileType: FileType;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  status: ReceiptStatus;
  extractedFields?: ExtractedFields;
  isDuplicate: boolean;
  originalReceiptId?: string;
  fingerprint?: string;
  notes?: string;
}

// Staging / Verification Queue
export type StagingStatus = 'pending' | 'approved' | 'rejected';

export interface StagingItem {
  id: string;
  receiptId: string;
  companyId: string;
  receipt: Receipt;
  extractedFields: ExtractedFields;
  status: StagingStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

// Bank Reconciliation
export type ReconciliationStatus = 'unmatched' | 'matched' | 'split' | 'non_vat' | 'pending_receipt';

export interface BankTransaction {
  id: string;
  companyId: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  reference: string;
  reconciliationStatus: ReconciliationStatus;
  matchedLedgerIds: string[];
}

// Document Vault
export type DocumentCategory = 'receipts' | 'invoices' | 'accounts' | 'company_documents' | 'tax_filings' | 'contracts';

export interface VaultDocument {
  id: string;
  companyId: string;
  name: string;
  category: DocumentCategory;
  fileType: FileType;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
  year: number;
  tags: string[];
  description?: string;
}

// Compliance Alerts
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = 'vat_due' | 'confirmation_statement' | 'accounts_filing' | 'mtd_error' | 'data_mismatch' | 'companies_house';

export interface ComplianceAlert {
  id: string;
  companyId: string;
  companyName: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  dueDate?: string;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
}

// Audit Trail
export interface AuditLog {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeValue?: Record<string, unknown>;
  afterValue?: Record<string, unknown>;
  timestamp: string;
  ipAddress: string;
}

// Supplier Memory
export interface SupplierMemory {
  id: string;
  companyId: string;
  supplierName: string;
  defaultVatRate: number;
  transactionType: TransactionType;
  lastSeen: string;
  transactionCount: number;
}

// MTD Filing
export interface MTDFiling {
  id: string;
  companyId: string;
  vatReturnId: string;
  periodStart: string;
  periodEnd: string;
  submissionDate: string;
  submissionId: string;
  hmrcReceipt: string;
  authorizedBy: string;
  status: 'pending' | 'submitted' | 'accepted' | 'rejected';
  validationChecks: {
    ledgerLocked: boolean;
    noStagedRecords: boolean;
    vatTotalsVerified: boolean;
    authorizedUser: boolean;
  };
}

// Offline Queue
export interface OfflineQueueItem {
  id: string;
  type: 'receipt' | 'ledger_entry';
  data: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
}

// Dashboard Stats
export interface DashboardStats {
  nextVATDeadline: string;
  vatReturnStatus: VATReturnStatus;
  recentReceiptsCount: number;
  unreadAlerts: number;
  vatLiabilityEstimate: number;
  vatBoxes: VATBoxes;
  syncStatus: 'in_sync' | 'variance_detected' | 'pending';
  pendingStaging: number;
  pendingOfflineUploads: number;
}

// Companies House
export interface CompaniesHouseResult {
  companyNumber: string;
  companyName: string;
  status: CompanyStatus;
  companyType: string;
  dateOfCreation: string;
  registeredOfficeAddress: {
    addressLine1: string;
    addressLine2?: string;
    locality: string;
    postalCode: string;
    country: string;
  };
  directors: Array<{
    name: string;
    appointedOn: string;
    occupation: string;
  }>;
  filingHistory: Array<{
    type: string;
    date: string;
    description: string;
  }>;
}

// API Response wrappers
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
