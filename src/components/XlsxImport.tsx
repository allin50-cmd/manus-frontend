import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Upload, FileSpreadsheet, ArrowRight, ArrowLeft, CheckCircle, AlertCircle,
  Loader2, X, GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  parseWorkbook, autoMapColumns, validateRow,
  MAPPABLE_FIELDS, type ColumnMapping, type ParsedWorkbook, type ParsedSheet,
} from '../utils/xlsxHelpers';
import {
  bulkImportAcspClients, importWithWorkflow, fetchTeamMembers,
  type BulkImportResult, type TeamMember,
} from '../utils/api';

interface XlsxImportProps {
  onComplete: () => void;
  onViewWorkflow?: (workflowId: string) => void;
}

type ImportStep = 'upload' | 'map' | 'preview' | 'results';

const STEP_ORDER: ImportStep[] = ['upload', 'map', 'preview', 'results'];

export default function XlsxImport({ onComplete, onViewWorkflow }: XlsxImportProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload state
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);

  // Mapping state
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [defaultServiceType, setDefaultServiceType] = useState('filing');

  // Preview state
  const [createWorkflow, setCreateWorkflow] = useState(true);
  const [taskTitleTemplate, setTaskTitleTemplate] = useState('Review compliance: {companyName}');
  const [selectedTeamMember, setSelectedTeamMember] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoaded, setTeamLoaded] = useState(false);

  // Results state
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<BulkImportResult | null>(null);
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  const currentSheet: ParsedSheet | null = workbook && selectedSheet ? workbook.sheets[selectedSheet] : null;

  const stepIndex = STEP_ORDER.indexOf(step);

  // File handling
  const handleFile = useCallback(async (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    const validTypes = ['.xlsx', '.xls', '.csv'];
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validTypes.includes(ext)) {
      toast.error('Please upload an .xlsx, .xls, or .csv file.');
      return;
    }

    setParsing(true);
    try {
      const wb = await parseWorkbook(file);
      if (wb.sheetNames.length === 0) {
        toast.error('The file appears to be empty.');
        return;
      }

      setWorkbook(wb);
      setFileName(file.name);
      setFileSize(file.size);

      const firstSheet = wb.sheetNames[0];
      setSelectedSheet(firstSheet);

      // Auto-map columns
      const sheet = wb.sheets[firstSheet];
      if (sheet) {
        setMapping(autoMapColumns(sheet.headers));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    const sheet = workbook?.sheets[sheetName];
    if (sheet) {
      setMapping(autoMapColumns(sheet.headers));
    }
  };

  // Validation
  const getValidatedRows = () => {
    if (!currentSheet) return [];
    return currentSheet.data.map((row, i) => ({
      index: i,
      ...validateRow(row, currentSheet.headers, mapping, defaultServiceType),
    }));
  };

  const validatedRows = currentSheet ? getValidatedRows() : [];
  const validCount = validatedRows.filter((r) => r.valid).length;
  const errorCount = validatedRows.filter((r) => !r.valid).length;

  // Import
  const handleImport = async () => {
    if (!currentSheet) return;

    const validRows = validatedRows.filter((r) => r.valid);
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    if (validRows.length > 500) {
      toast.error('Maximum 500 rows per import. Please split your file.');
      return;
    }

    setImporting(true);
    try {
      const clients = validRows.map((r) => r.mapped);

      if (createWorkflow) {
        const result = await importWithWorkflow({
          clients,
          workflowTitle: `Import: ${fileName}`,
          workflowType: 'onboarding',
          assignedTo: selectedTeamMember || undefined,
          taskTemplate: { title: taskTitleTemplate },
          fileName,
          columnMapping: mapping as Record<string, string>,
        });
        setResults(result);
        setWorkflowId(result.workflow.id);
      } else {
        const result = await bulkImportAcspClients(clients, fileName, mapping as Record<string, string>);
        setResults(result);
      }
      setStep('results');
      toast.success('Import complete!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  // Load team members when reaching preview step
  const handleGoToPreview = async () => {
    if (!teamLoaded) {
      try {
        const members = await fetchTeamMembers();
        setTeamMembers(members);
      } catch {
        // Non-critical
      }
      setTeamLoaded(true);
    }
    setStep('preview');
  };

  const resetWizard = () => {
    setStep('upload');
    setFileName('');
    setFileSize(0);
    setWorkbook(null);
    setSelectedSheet('');
    setMapping({});
    setResults(null);
    setWorkflowId(null);
    setImporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEP_ORDER.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              stepIndex >= i ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-500 border border-white/10'
            }`}>
              {stepIndex > i ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            {i < STEP_ORDER.length - 1 && (
              <div className={`w-8 sm:w-12 h-0.5 rounded-full ${stepIndex > i ? 'bg-emerald-600' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Upload Spreadsheet</h3>

          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
              dragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-emerald-500/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {parsing ? (
              <Loader2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 animate-spin" />
            ) : (
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            )}
            <p className="text-white font-medium mb-1">
              {parsing ? 'Parsing file...' : 'Drag and drop your file here'}
            </p>
            <p className="text-slate-500 text-sm">or click to browse</p>
            <p className="text-slate-600 text-xs mt-3">Supports .xlsx, .xls, .csv (max 10MB)</p>
          </div>

          {workbook && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{fileName}</p>
                  <p className="text-xs text-slate-400">
                    {(fileSize / 1024).toFixed(1)} KB &middot; {workbook.sheetNames.length} sheet{workbook.sheetNames.length > 1 ? 's' : ''} &middot; {currentSheet?.data.length ?? 0} rows
                  </p>
                </div>
                <button onClick={resetWizard} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {workbook.sheetNames.length > 1 && (
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Select sheet</label>
                  <select
                    value={selectedSheet}
                    onChange={(e) => handleSheetChange(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    {workbook.sheetNames.map((name) => (
                      <option key={name} value={name}>{name} ({workbook.sheets[name]?.data.length ?? 0} rows)</option>
                    ))}
                  </select>
                </div>
              )}

              <Button onClick={() => setStep('map')} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold">
                Continue to Column Mapping <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 'map' && currentSheet && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Map Columns</h3>
          <p className="text-sm text-slate-400 mb-6">Match your spreadsheet columns to ACSP client fields.</p>

          <div className="space-y-3">
            {MAPPABLE_FIELDS.map((field) => (
              <div key={field.key} className="flex items-center gap-4">
                <div className="w-40 shrink-0">
                  <span className="text-sm text-white">{field.label}</span>
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </div>
                <select
                  value={mapping[field.key] || ''}
                  onChange={(e) => setMapping((prev) => ({ ...prev, [field.key]: e.target.value || undefined }))}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="">-- Not mapped --</option>
                  {currentSheet.headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Default service type if not mapped */}
          {!mapping.serviceType && (
            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-sm text-amber-400 mb-2">No "Service Type" column mapped. Select a default:</p>
              <select
                value={defaultServiceType}
                onChange={(e) => setDefaultServiceType(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="filing">Filing Agent</option>
                <option value="formation">Formation</option>
                <option value="registered_office">Registered Office</option>
                <option value="verification">Identity Verification</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button onClick={() => setStep('upload')} variant="outline" className="border-white/10 text-slate-300 hover:bg-white/5">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button
              onClick={handleGoToPreview}
              disabled={!mapping.companyNumber || !mapping.companyName}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Preview Import <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && currentSheet && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2">Preview & Import</h3>

          {/* Summary bar */}
          <div className="flex items-center gap-4 mb-6 p-3 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">{validCount} valid</span>
            </div>
            {errorCount > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">{errorCount} with errors</span>
              </div>
            )}
            <div className="text-sm text-slate-500">
              {currentSheet.data.length} total rows
            </div>
          </div>

          {/* Preview table (first 10 rows) */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">#</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Company Number</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Company Name</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Service Type</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {validatedRows.slice(0, 10).map((row) => (
                  <tr key={row.index} className={`border-b border-white/5 ${!row.valid ? 'bg-red-900/20' : ''}`}>
                    <td className="py-2 px-3 text-slate-500">{row.index + 1}</td>
                    <td className="py-2 px-3 text-white font-mono text-xs">{row.mapped.companyNumber || '—'}</td>
                    <td className="py-2 px-3 text-white">{row.mapped.companyName || '—'}</td>
                    <td className="py-2 px-3 text-slate-300">{row.mapped.serviceType || defaultServiceType}</td>
                    <td className="py-2 px-3">
                      {row.valid ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <span className="text-xs text-red-400">{row.errors.join(', ')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {validatedRows.length > 10 && (
              <p className="text-xs text-slate-500 mt-2 text-center">
                Showing first 10 of {validatedRows.length} rows
              </p>
            )}
          </div>

          {/* Workflow options */}
          <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#5A4BFF]" />
                <span className="text-sm font-medium text-white">Create workflow for imported clients</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={createWorkflow}
                  onChange={() => setCreateWorkflow(!createWorkflow)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
              </label>
            </div>

            {createWorkflow && (
              <>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Task title template</label>
                  <Input
                    value={taskTitleTemplate}
                    onChange={(e) => setTaskTitleTemplate(e.target.value)}
                    placeholder="Review compliance: {companyName}"
                    className="bg-white/5 border-white/10 text-white text-sm placeholder:text-slate-500"
                  />
                  <p className="text-xs text-slate-600 mt-1">Use {'{companyName}'} as a placeholder</p>
                </div>

                {teamMembers.length > 0 && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Assign to team member</label>
                    <select
                      value={selectedTeamMember}
                      onChange={(e) => setSelectedTeamMember(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setStep('map')} variant="outline" className="border-white/10 text-slate-300 hover:bg-white/5">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              {importing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</>
              ) : (
                <>Import {validCount} Client{validCount !== 1 ? 's' : ''} <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 'results' && results && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Import Complete</h3>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-emerald-400">{results.summary.imported}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Imported</div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-amber-400">{results.summary.skipped}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Skipped</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-red-400">{results.summary.errors}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">Errors</div>
            </div>
          </div>

          {/* Row details (collapsed by default, show skipped/errors) */}
          {(results.summary.skipped > 0 || results.summary.errors > 0) && (
            <div className="mb-6">
              <p className="text-sm text-slate-400 mb-2">Issues:</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {results.results
                  .filter((r) => r.status !== 'imported')
                  .map((r) => (
                    <div key={r.row} className="flex items-center gap-2 text-xs p-2 bg-white/5 rounded-lg">
                      <span className="text-slate-500">Row {r.row}</span>
                      <span className={r.status === 'skipped' ? 'text-amber-400' : 'text-red-400'}>
                        {r.status}: {r.error}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={onComplete} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
              View Clients
            </Button>
            {workflowId && onViewWorkflow && (
              <Button
                onClick={() => onViewWorkflow(workflowId)}
                variant="outline"
                className="flex-1 border-white/10 text-slate-300 hover:bg-white/5"
              >
                <GitBranch className="w-4 h-4 mr-2" /> View Workflow
              </Button>
            )}
            <Button onClick={resetWizard} variant="outline" className="border-white/10 text-slate-300 hover:bg-white/5">
              Import Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
