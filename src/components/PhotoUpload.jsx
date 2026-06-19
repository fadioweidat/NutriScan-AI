import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Optional photo upload with drag & drop, preview, and base64 output.
 *
 * @param {object}   props
 * @param {Function} props.onPhotoSelected  – Called with { file, base64, preview }
 * @param {Function} [props.onPhotoRemove]  – Called when user removes photo
 * @param {string}   [props.currentPhotoUrl]
 * @param {boolean}  [props.disabled=false]
 */
export default function PhotoUpload({
  onPhotoSelected,
  onPhotoRemove,
  currentPhotoUrl,
  disabled = false,
}) {
  const [preview, setPreview] = useState(currentPhotoUrl || null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = useCallback((file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Formato non supportato. Usa JPEG, PNG o WebP.';
    }
    if (file.size > MAX_SIZE_BYTES) {
      return 'Il file supera la dimensione massima di 5 MB.';
    }
    return null;
  }, []);

  const processFile = useCallback(
    (file) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);

      // Generate preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Compress to max width 1024px, JPEG quality 0.75
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > 1024) {
            height = Math.round((height * 1024) / width);
            width = 1024;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Get base64 string
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);

          onPhotoSelected?.({
            file,
            base64: compressedBase64,
            preview: previewUrl,
          });
        };
        img.onerror = () => setError('Impossibile elaborare l\'immagine.');
        img.src = e.target.result;
      };
      reader.onerror = () => {
        setError('Errore nella lettura del file.');
      };
      reader.readAsDataURL(file);
    },
    [onPhotoSelected, validateFile],
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      if (disabled) return;

      const file = e.dataTransfer?.files?.[0];
      if (file) processFile(file);
    },
    [processFile, disabled],
  );

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset so same file can be re-selected
      e.target.value = '';
    },
    [processFile],
  );

  const handleRemove = useCallback(() => {
    setPreview(null);
    setError(null);
    onPhotoRemove?.();
  }, [onPhotoRemove]);

  const openFilePicker = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {preview ? (
        /* ── Preview ── */
        <div className="relative group animate-scale-in">
          <img
            src={preview}
            alt="Anteprima foto"
            className="w-full h-48 object-cover rounded-xl border border-white/[0.06]"
          />
          <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {!disabled && (
              <button
                onClick={handleRemove}
                className="
                  flex items-center gap-2 px-4 py-2
                  bg-red-500/80 hover:bg-red-500
                  text-white text-sm font-medium
                  rounded-lg transition-colors
                "
              >
                <X className="w-4 h-4" />
                Rimuovi foto
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ── Drop zone ── */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFilePicker}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => e.key === 'Enter' && openFilePicker()}
          aria-label="Carica una foto"
          className={`
            relative flex flex-col items-center justify-center
            w-full h-44 rounded-xl cursor-pointer
            border-2 border-dashed transition-all duration-200
            ${disabled
              ? 'border-white/[0.04] bg-white/[0.01] cursor-not-allowed opacity-50'
              : dragging
                ? 'border-accent bg-accent/5 scale-[1.01]'
                : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.03]'}
          `}
        >
          <div
            className={`
              w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors
              ${dragging ? 'bg-accent/15' : 'bg-white/[0.04]'}
            `}
          >
            {dragging ? (
              <ImageIcon className="w-6 h-6 text-accent" />
            ) : (
              <Upload className="w-6 h-6 text-slate-500" />
            )}
          </div>

          <p className="text-sm font-medium text-slate-300 mb-1">
            {dragging ? 'Rilascia qui la foto' : 'Trascina una foto qui'}
          </p>
          <p className="text-xs text-slate-500">
            oppure <span className="text-accent underline underline-offset-2">sfoglia i file</span>
          </p>
          <p className="text-[10px] text-slate-600 mt-2">
            JPEG, PNG, WebP — max 5 MB
          </p>
        </div>
      )}

      {/* ── Hidden file input ── */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
        aria-hidden="true"
      />

      {/* ── Error message ── */}
      {error && (
        <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 animate-slide-down">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
