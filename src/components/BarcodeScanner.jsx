import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Camera, XCircle, Search, Loader2 } from 'lucide-react';

export default function BarcodeScanner({ onScan, isScanning }) {
  const [manualBarcode, setManualBarcode] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [hasCamera, setHasCamera] = useState(true);
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        const reader = new BrowserMultiFormatReader();
        codeReaderRef.current = reader;

        const videoInputDevices = await reader.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
          if (mounted) {
            setHasCamera(false);
            setCameraError("Nessuna fotocamera trovata.");
          }
          return;
        }

        if (mounted && videoRef.current && isScanning) {
          reader.decodeFromVideoDevice(
            null, // auto-selects rear camera usually
            videoRef.current,
            (result, err) => {
              if (result && mounted) {
                onScan(result.getText());
              }
              if (err && !(err instanceof NotFoundException)) {
                console.error("Barcode scan error:", err);
              }
            }
          );
        }
      } catch (err) {
        console.error("Scanner setup error:", err);
        if (mounted) {
          setHasCamera(false);
          setCameraError("Permesso fotocamera negato o dispositivo non supportato.");
        }
      }
    };

    if (isScanning) {
      startScanner();
    }

    return () => {
      mounted = false;
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, [isScanning, onScan]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim());
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {hasCamera && isScanning && !cameraError ? (
        <div className="relative rounded-3xl overflow-hidden bg-black/40 border border-white/10 aspect-video flex items-center justify-center">
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover"
          />
          {/* Overlay scanner line */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/4 h-32 border-2 border-lime-500/50 rounded-xl relative">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.8)] animate-scan-line"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl flex flex-col items-center text-center gap-3">
          <XCircle className="w-8 h-8 text-red-400" />
          <div>
            <p className="text-red-400 font-medium">Fotocamera non disponibile</p>
            <p className="text-red-400/70 text-sm mt-1">{cameraError || "Inserisci il codice manualmente"}</p>
          </div>
        </div>
      )}

      {/* Fallback / Manual Input */}
      <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-lime-400" />
          Inserisci Barcode Manualmente
        </h4>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value.replace(/\D/g, ''))}
            placeholder="Es. 8001234567890"
            className="flex-1 bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-lime-500/50"
          />
          <button 
            type="submit"
            disabled={!manualBarcode.trim()}
            className="px-6 bg-lime-500 hover:bg-lime-400 disabled:bg-white/10 text-black disabled:text-white/30 font-bold rounded-xl transition-colors"
          >
            Cerca
          </button>
        </form>
      </div>
    </div>
  );
}
