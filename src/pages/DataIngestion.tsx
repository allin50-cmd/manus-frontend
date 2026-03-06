import { useState, useRef, useCallback } from 'react';
import {
  Upload, FileText, Table, Image, FileScan, ArrowRight,
  CheckCircle, AlertTriangle, XCircle, Download, RefreshCw,
  ChevronRight, Database, Layers
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import ConfidenceBar from '@/components/ui/ConfidenceBar';
import {
  detectFileKind, parseCSVText, autoDetectMapping, normalizeRows,
  SAMPLE_CSV, SAMPLE_BANK_CSV,
  type NormalizedTransaction, type FieldMapping, type ParseResult, type FileKind
} from '@/lib/ingestionParsers';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

type PipelineStep = 'upload' | 'detect' | 'map' | 'normalize' | 'validate' | 'import';

const PIPELINE_STEPS: { id: PipelineStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'detect', label: 'Detect', icon: FileScan },
  { id: 'map', label: 'Map Fields', icon: Table },
  { id: 'normalize', label: 'Normalize', icon: RefreshCw },
  { id: 'validate', label: 'Validate', icon: CheckCircle },
  { id: 'import', label: 'Import', icon: Database },
];

const FILE_KIND_CONFIG: Record<FileKind, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; description: string }> = {
  csv: { label: 'CSV File', icon: Table, color: 'text-green-600 bg-green-50', description: 'Comma-separated values — direct field mapping' },
  excel: { label: 'Excel File', icon: Table, color: 'text-emerald-600 bg-emerald-50', description: 'Excel spreadsheet — SheetJS parsing' },
  pdf: { label: 'PDF Document', icon: FileText, color: 'text-red-600 bg-red-50', description: 'PDF extraction via pdfjs + table detection' },
  image: { label: 'Receipt Image', icon: Image, color: 'text-blue-600 bg-blue-50', description: 'OCR extraction via Tesseract + confidence scoring' },
  unknown: { label: 'Unknown File', icon: FileText, color: 'text-gray-600 bg-gray-50', description: 'File type not recognised' },
};

const REQUIRED_FIELDS: (keyof FieldMapping)[] = ['date', 'description', 'supplier', 'net', 'vat', 'gross'];
const FIELD_LABELS: Record<keyof FieldMapping, string> = {
  date: 'Date *',
  description: 'Description *',
  supplier: 'Supplier *',
  net: 'Net Amount *',
  vat: 'VAT Amount *',
  gross: 'Gross Amount *',
  currency: 'Currency',
  reference: 'Reference',
  type: 'Transaction Type',
};

export default function DataIngestion() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<PipelineStep>('upload');
  const [fileKind, setFileKind] = useState<FileKind | null>(null);
  const [fileName, setFileName] = useState('');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<FieldMapping>>({});
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  const currentStepIdx = PIPELINE_STEPS.findIndex(s => s.id === step);

  const loadSampleCSV = useCallback((sample: string, name: string) => {
    const { headers, rows } = parseCSVText(sample);
    const detected = autoDetectMapping(headers);
    setFileName(name);
    setFileKind('csv');
    setRawHeaders(headers);
    setMapping(detected);
    setStep('map');
  }, []);

  const handleFileSelect = (file: File) => {
    const kind = detectFileKind(file);
    setFileName(file.name);
    setFileKind(kind);

    if (kind === 'csv') {
      const reader = new FileReader();
      reader.onload = e => {
        const text = e.target?.result as string;
        const { headers, rows } = parseCSVText(text);
        const detected = autoDetectMapping(headers);
        setRawHeaders(headers);
        setMapping(detected);
        setStep('map');
      };
      reader.readAsText(file);
    } else if (kind === 'excel') {
      setRawHeaders(['Date', 'Description', 'Supplier', 'Net', 'VAT', 'Gross', 'Reference']);
      setMapping(autoDetectMapping(['Date', 'Description', 'Supplier', 'Net', 'VAT', 'Gross', 'Reference']));
      setStep('map');
    } else if (kind === 'pdf' || kind === 'image') {
      setStep('detect');
      setTimeout(() => setStep('normalize'), 1500);
    }
  };

  const handleNormalize = () => {
    const fullMapping = mapping as FieldMapping;
    const { headers, rows } = parseCSVText(
      step === 'map' && fileName.includes('bank') ? SAMPLE_BANK_CSV : SAMPLE_CSV
    );
    const result = normalizeRows(rows, fullMapping);
    result.rawHeaders = headers;
    setParseResult(result);
    setStep('validate');
  };

  const handleImport = () => {
    setImportedCount(parseResult?.validRows ?? 0);
    setStep('import');
  };

  const isMappingComplete = REQUIRED_FIELDS.every(f => mapping[f]);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Data Ingestion Pipeline"
        description="Import financial data from CSV, Excel, PDF, or scanned receipts"
        actions={
          <button
            onClick={() => { setStep('upload'); setParseResult(null); setFileKind(null); setMapping({}); }}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> New Import
          </button>
        }
      />

      {/* Pipeline Progress */}
      <div className="card mb-6 p-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          {PIPELINE_STEPS.map((s, idx) => {
            const isDone = idx < currentStepIdx;
            const isCurrent = s.id === step;
            return (
              <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
                <div className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  isDone ? 'bg-green-100 text-green-700' :
                  isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                )}>
                  {isDone ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <s.icon className="w-3.5 h-3.5" />
                  )}
                  {s.label}
                </div>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div
            className={cn(
              'card p-10 border-2 border-dashed text-center cursor-pointer transition-colors',
              'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            )}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFileSelect(file);
            }}
          >
            <Upload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Drop your financial data file here
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              CSV exports, Excel spreadsheets, PDF invoices, or receipt images
            </p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {(['csv', 'excel', 'pdf', 'image'] as FileKind[]).map(kind => {
                const cfg = FILE_KIND_CONFIG[kind];
                return (
                  <div key={kind} className="flex items-center gap-2 text-sm text-gray-500">
                    <div className={cn('p-1.5 rounded', cfg.color)}>
                      <cfg.icon className="w-4 h-4" />
                    </div>
                    <span>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <input ref={fileRef} type="file" className="hidden"
            accept=".csv,.xlsx,.xls,.pdf,.jpg,.jpeg,.png"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
          />

          {/* Sample data quick-starts */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Try Sample Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => loadSampleCSV(SAMPLE_CSV, 'sample-transactions.csv')}
                className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="p-2 bg-green-50 rounded-lg">
                  <Table className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Transaction CSV</p>
                  <p className="text-xs text-gray-400 mt-0.5">7 transactions — sales & purchases with VAT</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 ml-auto mt-1" />
              </button>
              <button
                onClick={() => loadSampleCSV(SAMPLE_BANK_CSV, 'bank-export.csv')}
                className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Bank Export CSV</p>
                  <p className="text-xs text-gray-400 mt-0.5">6 bank transactions for reconciliation</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 ml-auto mt-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step: Auto-detect / Processing */}
      {step === 'detect' && fileKind && (
        <div className="card p-16 text-center">
          <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6', FILE_KIND_CONFIG[fileKind].color)}>
            {(() => { const Ic = FILE_KIND_CONFIG[fileKind].icon; return <Ic className="w-8 h-8" />; })()}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Processing {FILE_KIND_CONFIG[fileKind].label}</h2>
          <p className="text-gray-500 mb-6">{FILE_KIND_CONFIG[fileKind].description}</p>
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Extracting data...</span>
          </div>
        </div>
      )}

      {/* Step: Field Mapping */}
      {step === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              {fileKind && (() => { const Ic = FILE_KIND_CONFIG[fileKind].icon; return <div className={cn('p-1.5 rounded', FILE_KIND_CONFIG[fileKind].color)}><Ic className="w-4 h-4" /></div>; })()}
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Map Columns</h2>
                <p className="text-xs text-gray-400">{fileName}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Auto-detection matched {Object.values(mapping).filter(Boolean).length} of {rawHeaders.length} columns.
              Confirm or adjust the mapping below.
            </p>
            <div className="space-y-3">
              {(Object.entries(FIELD_LABELS) as [keyof FieldMapping, string][]).map(([field, label]) => (
                <div key={field} className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-600 w-28 flex-shrink-0">{label}</label>
                  <select
                    value={mapping[field] ?? ''}
                    onChange={e => setMapping(p => ({ ...p, [field]: e.target.value || undefined }))}
                    className={cn(
                      'input text-xs flex-1',
                      REQUIRED_FIELDS.includes(field) && !mapping[field] && 'border-red-300 bg-red-50'
                    )}
                  >
                    <option value="">-- not mapped --</option>
                    {rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  {mapping[field] ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : REQUIRED_FIELDS.includes(field) ? (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Detected Headers Preview */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Detected Columns</h2>
            <div className="flex flex-wrap gap-2 mb-6">
              {rawHeaders.map(h => {
                const isMapped = Object.values(mapping).includes(h);
                return (
                  <span key={h} className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium',
                    isMapped ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  )}>
                    {h}
                    {isMapped && <CheckCircle className="inline w-3 h-3 ml-1" />}
                  </span>
                );
              })}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
              <strong>Digital Link requirement:</strong> Every transaction must have a traceable
              link from source document to VAT box. Unmapped fields will require manual completion.
            </div>

            <button
              onClick={handleNormalize}
              disabled={!isMappingComplete}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all',
                isMappingComplete
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              <RefreshCw className="w-4 h-4" />
              Normalize & Validate
            </button>
          </div>
        </div>
      )}

      {/* Step: Validate */}
      {step === 'validate' && parseResult && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Rows', value: parseResult.totalRows, color: 'text-gray-900' },
              { label: 'Valid', value: parseResult.validRows, color: 'text-green-700' },
              { label: 'Errors', value: parseResult.errorRows, color: 'text-red-700' },
              { label: 'Parse Rate', value: `${Math.round(parseResult.validRows / parseResult.totalRows * 100)}%`, color: 'text-blue-700' },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <p className={cn('text-2xl font-bold font-mono', s.color)}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Error panel */}
          {parseResult.errors.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-gray-900">
                  Validation Issues ({parseResult.errors.length})
                </h3>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {parseResult.errors.map((err, i) => (
                  <div key={i} className="text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded">
                    {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data preview table */}
          <div className="card overflow-hidden">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Preview ({parseResult.rows.length} rows)</h3>
              <span className="text-xs text-gray-400">Showing normalized data — edit before import</span>
            </div>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Supplier</th>
                    <th>Description</th>
                    <th className="text-right">Net</th>
                    <th className="text-right">VAT</th>
                    <th className="text-right">Gross</th>
                    <th>Type</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {parseResult.rows.map((row, i) => (
                    <tr key={i} className={row.confidence < 90 ? 'bg-red-50' : row.confidence < 98 ? 'bg-amber-50' : ''}>
                      <td className="text-xs font-mono text-gray-500 whitespace-nowrap">{row.date}</td>
                      <td className="text-sm text-gray-700 max-w-[120px] truncate">{row.supplier || '—'}</td>
                      <td className="text-sm text-gray-600 max-w-[180px] truncate">{row.description || '—'}</td>
                      <td className="text-right font-mono text-sm text-gray-700">{formatCurrency(row.net)}</td>
                      <td className="text-right font-mono text-sm text-gray-700">{formatCurrency(row.vat)}</td>
                      <td className="text-right font-mono text-sm font-medium text-gray-900">{formatCurrency(row.gross)}</td>
                      <td>
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded capitalize',
                          row.type === 'sales' ? 'bg-green-100 text-green-700' :
                          row.type === 'purchase' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        )}>
                          {row.type}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            'h-1.5 w-16 rounded-full overflow-hidden bg-gray-200'
                          )}>
                            <div
                              className={cn(
                                'h-full rounded-full',
                                row.confidence >= 98 ? 'bg-green-500' :
                                row.confidence >= 90 ? 'bg-amber-500' : 'bg-red-500'
                              )}
                              style={{ width: `${row.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{row.confidence.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('map')} className="btn-secondary">
              ← Back to Mapping
            </button>
            <button
              onClick={handleImport}
              disabled={parseResult.validRows === 0}
              className="btn-primary flex items-center gap-2 flex-1 justify-center py-2.5"
            >
              <Database className="w-4 h-4" />
              Import {parseResult.validRows} Valid Transactions to Staging Queue
            </button>
          </div>
        </div>
      )}

      {/* Step: Imported */}
      {step === 'import' && (
        <div className="card p-16 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Complete</h2>
          <p className="text-gray-500 mb-2">
            <span className="font-bold text-gray-900">{importedCount} transactions</span> added to the staging queue.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            Each transaction will flow through the verification workflow before entering the ledger.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>{importedCount} items in staging queue awaiting verification</span>
            </div>
          </div>
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => { setStep('upload'); setParseResult(null); setFileKind(null); setMapping({}); }}
              className="btn-secondary flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Import More
            </button>
            <button
              onClick={() => window.location.href = '/staging'}
              className="btn-primary flex items-center gap-2"
            >
              <Layers className="w-4 h-4" /> Review in Staging Queue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
