import { useState, useRef, useCallback } from 'react';
import {
  Camera, Upload, CheckCircle, ArrowLeft, RotateCcw,
  Zap, AlertTriangle, Save, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfidenceBar from '@/components/ui/ConfidenceBar';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

type ScanStep = 'capture' | 'preview' | 'extracted' | 'confirmed';

interface ExtractedData {
  supplier: string;
  date: string;
  net: number;
  vat: number;
  gross: number;
  invoiceNumber: string;
  vatRate: number;
  confidence: number;
}

// Mock OCR extraction
function mockOCRExtract(): ExtractedData {
  return {
    supplier: 'Staples Business Direct',
    date: new Date().toISOString().split('T')[0],
    net: 124.99,
    vat: 25.00,
    gross: 149.99,
    invoiceNumber: `STB-${Date.now().toString().slice(-6)}`,
    vatRate: 20,
    confidence: 96.3,
  };
}

export default function Scanner() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [step, setStep] = useState<ScanStep>('capture');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [edited, setEdited] = useState<ExtractedData | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch {
      alert('Camera access denied or not available. Please use the upload option.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      setCameraActive(false);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageData);
      stopCamera();
      setStep('preview');
    }
  }, [stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        setCapturedImage(ev.target?.result as string);
        setStep('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    setIsProcessing(true);
    // Simulate OCR API call
    await new Promise(r => setTimeout(r, 2000));
    const data = mockOCRExtract();
    setExtracted(data);
    setEdited(data);
    setIsProcessing(false);
    setStep('extracted');
  };

  const handleSave = () => {
    if (edited && edited.confidence >= 98) {
      setStep('confirmed');
    } else if (edited) {
      // Force save with manual override
      setStep('confirmed');
    }
  };

  if (step === 'confirmed') {
    return (
      <div className="max-w-sm mx-auto py-12 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Receipt Saved</h2>
        <p className="text-sm text-gray-500 mb-2">
          The receipt has been sent to the staging queue for verification.
        </p>
        {edited && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Supplier</span>
              <span className="font-medium">{edited.supplier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Gross</span>
              <span className="font-bold text-gray-900">{formatCurrency(edited.gross)}</span>
            </div>
          </div>
        )}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              setStep('capture');
              setCapturedImage(null);
              setExtracted(null);
              setEdited(null);
            }}
            className="btn-secondary flex-1"
          >
            Scan Another
          </button>
          <button
            onClick={() => navigate('/staging')}
            className="btn-primary flex-1"
          >
            View Queue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Scan Receipt</h1>
          <p className="text-xs text-gray-500">
            {step === 'capture' && 'Take a photo or upload a file'}
            {step === 'preview' && 'Confirm the image is clear'}
            {step === 'extracted' && 'Review extracted fields'}
          </p>
        </div>
      </div>

      {/* Step: Capture */}
      {step === 'capture' && (
        <div className="space-y-4">
          {/* Camera View */}
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden aspect-[3/4]">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Edge detection frame */}
                <div className="absolute inset-8 border-2 border-white/50 rounded-xl pointer-events-none">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white/60 text-sm font-medium">Position receipt within frame</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
                <Camera className="w-16 h-16 text-gray-600" />
                <p className="text-gray-400 text-sm text-center">
                  Camera preview will appear here
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {cameraActive ? (
              <>
                <button
                  onClick={stopCamera}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={capturePhoto}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
                >
                  <Camera className="w-5 h-5" /> Capture
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={startCamera}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
                >
                  <Camera className="w-5 h-5" /> Open Camera
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3"
                >
                  <Upload className="w-4 h-4" /> Upload
                </button>
              </>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />

          <p className="text-xs text-gray-400 text-center">
            Accepts JPG, PNG, or PDF · Max 10MB
          </p>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && capturedImage && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-gray-100">
            <img
              src={capturedImage}
              alt="Receipt preview"
              className="w-full object-contain max-h-[400px]"
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <Zap className="w-4 h-4 flex-shrink-0" />
            Ready to extract data using OCR. Confirm the image is clear and readable.
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('capture')}
              className="btn-secondary flex-1 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Retake
            </button>
            <button
              onClick={processImage}
              disabled={isProcessing}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" /> Extract Data
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step: Extracted fields */}
      {step === 'extracted' && extracted && edited && (
        <div className="space-y-4">
          {/* Confidence */}
          <div className="card p-4">
            <ConfidenceBar confidence={extracted.confidence} threshold={98} />
          </div>

          {/* Duplicate warning */}
          {extracted.confidence < 98 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Manual verification required.</strong> Confidence below 98% threshold.
                Please review and correct any extraction errors before saving.
              </div>
            </div>
          )}

          {/* Small preview */}
          {capturedImage && (
            <div className="rounded-lg overflow-hidden h-24 bg-gray-100">
              <img src={capturedImage} alt="Receipt" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Editable fields */}
          <div className="card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Extracted Fields</h3>

            <div>
              <label className="label">Supplier *</label>
              <input
                type="text"
                value={edited.supplier}
                onChange={e => setEdited(p => p ? { ...p, supplier: e.target.value } : null)}
                className="input"
              />
            </div>

            <div>
              <label className="label">Date *</label>
              <input
                type="date"
                value={edited.date}
                onChange={e => setEdited(p => p ? { ...p, date: e.target.value } : null)}
                className="input"
              />
            </div>

            <div>
              <label className="label">Invoice Number</label>
              <input
                type="text"
                value={edited.invoiceNumber}
                onChange={e => setEdited(p => p ? { ...p, invoiceNumber: e.target.value } : null)}
                className="input font-mono"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Net (£) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={edited.net}
                  onChange={e => {
                    const net = parseFloat(e.target.value) || 0;
                    const vat = parseFloat((net * edited.vatRate / 100).toFixed(2));
                    setEdited(p => p ? { ...p, net, vat, gross: net + vat } : null);
                  }}
                  className="input font-mono"
                />
              </div>
              <div>
                <label className="label">VAT (£) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={edited.vat}
                  onChange={e => {
                    const vat = parseFloat(e.target.value) || 0;
                    setEdited(p => p ? { ...p, vat, gross: p.net + vat } : null);
                  }}
                  className="input font-mono"
                />
              </div>
              <div>
                <label className="label">Gross (£) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={edited.gross}
                  readOnly
                  className="input font-mono bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="label">VAT Rate</label>
              <select
                value={edited.vatRate}
                onChange={e => setEdited(p => p ? { ...p, vatRate: parseInt(e.target.value) } : null)}
                className="input"
              >
                <option value={20}>Standard 20%</option>
                <option value={5}>Reduced 5%</option>
                <option value={0}>Zero-rated 0%</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('preview')}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleSave}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
            >
              <Save className="w-4 h-4" /> Save to Queue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
