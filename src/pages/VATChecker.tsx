import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck, CheckCircle2, AlertTriangle, XCircle, Loader2,
  ArrowLeft, Info, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { authFetch } from '@/lib/auth';
import { toast } from 'sonner';

interface VATBoxes {
  box1: string; box2: string; box3: string; box4: string; box5: string;
  box6: string; box7: string; box8: string; box9: string;
}

interface VATResult {
  result: 'PASS' | 'WARNING' | 'ERROR';
  warnings: string[];
  errors: string[];
  checks: {
    box3Check: boolean;
    box5Check: boolean;
    negativeCheck: boolean;
    ratioCheck: boolean;
    roundingCheck: boolean;
  };
  reportId?: string;
}

const BOX_DESCRIPTIONS: Record<string, { label: string; desc: string }> = {
  box1: { label: 'Box 1', desc: 'VAT due in the period on sales and other outputs' },
  box2: { label: 'Box 2', desc: 'VAT due in the period on acquisitions from EU' },
  box3: { label: 'Box 3', desc: 'Total VAT due (Box 1 + Box 2)' },
  box4: { label: 'Box 4', desc: 'VAT reclaimed in the period on purchases and inputs' },
  box5: { label: 'Box 5', desc: 'Net VAT to pay/reclaim (Box 3 minus Box 4)' },
  box6: { label: 'Box 6', desc: 'Total value of sales and all other outputs (ex. VAT)' },
  box7: { label: 'Box 7', desc: 'Total value of purchases and all other inputs (ex. VAT)' },
  box8: { label: 'Box 8', desc: 'Total value of all supplies of goods to EC member states' },
  box9: { label: 'Box 9', desc: 'Total value of all acquisitions of goods from EC member states' },
};

function getResultConfig(result: 'PASS' | 'WARNING' | 'ERROR') {
  switch (result) {
    case 'PASS':
      return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'PASS', desc: 'VAT return passes all validation checks. Safe to submit.' };
    case 'WARNING':
      return { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'WARNING', desc: 'Review these warnings before submitting to HMRC.' };
    case 'ERROR':
      return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'ERROR', desc: 'Critical errors detected. Do NOT submit until resolved.' };
  }
}

export default function VATChecker() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VATResult | null>(null);
  const [error, setError] = useState('');
  const [companyRef, setCompanyRef] = useState('');
  const [boxes, setBoxes] = useState<VATBoxes>({
    box1: '', box2: '', box3: '', box4: '', box5: '',
    box6: '', box7: '', box8: '', box9: '',
  });

  const updateBox = (key: keyof VATBoxes, value: string) => {
    const updated = { ...boxes, [key]: value };

    // Auto-calculate Box 3 if Box 1 and Box 2 are set
    if ((key === 'box1' || key === 'box2') && updated.box1 && updated.box2) {
      const b1 = parseFloat(updated.box1) || 0;
      const b2 = parseFloat(updated.box2) || 0;
      updated.box3 = (b1 + b2).toFixed(2);
    }

    // Auto-calculate Box 5 if Box 3 and Box 4 are set
    if ((key === 'box3' || key === 'box4') && updated.box3 && updated.box4) {
      const b3 = parseFloat(updated.box3) || 0;
      const b4 = parseFloat(updated.box4) || 0;
      updated.box5 = (b3 - b4).toFixed(2);
    }

    setBoxes(updated);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await authFetch('/api/vat-check', {
        method: 'POST',
        body: JSON.stringify({ ...boxes, companyRef }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setResult(data.result);
        toast[data.result.result === 'PASS' ? 'success' : data.result.result === 'WARNING' ? 'warning' : 'error'](
          `VAT Check: ${data.result.result}`
        );
      } else {
        setError(data.error || 'VAT check failed. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setBoxes({ box1: '', box2: '', box3: '', box4: '', box5: '', box6: '', box7: '', box8: '', box9: '' });
    setResult(null);
    setError('');
    setCompanyRef('');
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <FileCheck className="w-8 h-8 text-[#C9A64A]" />
            <h1 className="text-2xl font-bold text-[#1A1A1A]">VAT Pre-Submission Checker</h1>
            <Badge className="bg-[#C9A64A] text-white">£1 per check</Badge>
          </div>
          <p className="text-gray-600">
            Enter all 9 boxes from a client's VAT return. We validate arithmetic, detect anomalies, and return PASS / WARNING / ERROR.
          </p>
        </div>

        {/* Result */}
        {result && (() => {
          const cfg = getResultConfig(result.result);
          const Icon = cfg.icon;
          return (
            <div className={`mb-6 rounded-xl border p-6 ${cfg.bg}`}>
              <div className="flex items-start gap-4">
                <Icon className={`w-8 h-8 ${cfg.color} flex-shrink-0 mt-1`} />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className={`text-2xl font-bold ${cfg.color}`}>{cfg.label}</h2>
                    {result.reportId && (
                      <span className="text-xs text-gray-500 font-mono">Ref: {result.reportId}</span>
                    )}
                  </div>
                  <p className="text-gray-700 mb-4">{cfg.desc}</p>

                  {result.errors.length > 0 && (
                    <div className="mb-3">
                      <h4 className="font-semibold text-red-800 mb-2">Errors (must fix before submitting):</h4>
                      <ul className="space-y-1">
                        {result.errors.map((err, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            {err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.warnings.length > 0 && (
                    <div className="mb-3">
                      <h4 className="font-semibold text-amber-800 mb-2">Warnings (review before submitting):</h4>
                      <ul className="space-y-1">
                        {result.warnings.map((warn, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            {warn}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Check summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
                    {Object.entries(result.checks).map(([key, passed]) => (
                      <div key={key} className={`text-center p-2 rounded-lg text-xs ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {passed ? '✓' : '✗'}{' '}
                        {key.replace('Check', '').replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex gap-3">
                    <Button onClick={resetForm} variant="outline" className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Check Another Return
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6">
            {/* VAT Boxes */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-[#C9A64A]" />
                    VAT Return Values
                  </CardTitle>
                  <CardDescription>
                    Enter figures exactly as they appear on the VAT return. Box 3 and Box 5 will auto-calculate.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="mb-4">
                    <Label htmlFor="companyRef">Company / Client Reference (optional)</Label>
                    <Input
                      id="companyRef"
                      placeholder="e.g. Acme Ltd or 12345678"
                      value={companyRef}
                      onChange={(e) => setCompanyRef(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(Object.keys(BOX_DESCRIPTIONS) as Array<keyof VATBoxes>).map((boxKey) => {
                      const { label, desc } = BOX_DESCRIPTIONS[boxKey];
                      const isCalculated = boxKey === 'box3' || boxKey === 'box5';
                      return (
                        <div key={boxKey} className={`space-y-1 p-3 rounded-lg border ${isCalculated ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                          <div className="flex items-center gap-1">
                            <Label htmlFor={boxKey} className="font-semibold text-sm">
                              {label} {!isCalculated && <span className="text-red-500">*</span>}
                            </Label>
                            {isCalculated && (
                              <span className="text-xs text-blue-600 font-normal">(auto-calculated)</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{desc}</p>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">£</span>
                            <Input
                              id={boxKey}
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={boxes[boxKey]}
                              onChange={(e) => updateBox(boxKey, e.target.value)}
                              className="pl-7"
                              required={!isCalculated}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Info box */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-gray-600">
                        <strong>Validation rules applied:</strong> Box 3 = Box 1 + Box 2 · Box 5 = Box 3 − Box 4 ·
                        Rounding tolerance ±1p · Negative total detection · Abnormal VAT ratio check (Box 1 / Box 6)
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit */}
          <div className="mt-6 flex gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#C9A64A] hover:bg-[#B8954A] text-white py-6 text-base font-semibold"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Running VAT Check...</>
              ) : (
                <><FileCheck className="w-5 h-5 mr-2" />Run VAT Check — £1</>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm} className="px-6">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-center text-xs text-gray-500 mt-3">
            £1 charged via Stripe per check · Results are stored in your account for audit purposes
          </p>
        </form>
      </div>
    </div>
  );
}
