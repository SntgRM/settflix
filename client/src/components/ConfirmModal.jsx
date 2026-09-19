import { useEffect } from 'react';

const modalAnimationStyles = `
  @keyframes confirmModalBackdropIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes confirmModalPanelIn {
    from { opacity: 0; transform: translateY(8px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
`;

const ConfirmModal = ({
  open,
  title,
  message,
  confirmLabel = 'Sí, eliminar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <>
      <style>{modalAnimationStyles}</style>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        style={{ animation: 'confirmModalBackdropIn 180ms ease-out both' }}
        onClick={() => !loading && onCancel()}
      >
      <div
        className="w-full max-w-sm rounded-lg border border-white/10 bg-[#161616] p-5 shadow-xl"
        style={{ animation: 'confirmModalPanelIn 220ms ease-out both' }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-[#e9e4dc] font-medium leading-snug">
          {title}
        </p>
        {message && (
          <p className="text-xs text-[#8f8a82] mt-2 leading-relaxed">
            {message}
          </p>
        )}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className="cursor-pointer flex-1 h-9 rounded-md bg-white/5 border border-white/10 text-[#8f8a82] text-xs font-medium hover:text-[#e9e4dc] hover:border-white/20 active:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/30"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="cursor-pointer flex-1 h-9 flex items-center justify-center gap-1.5 rounded-md bg-red-500/90 text-white text-xs font-medium hover:bg-red-500 active:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-400/60"
          >
            {loading && (
              <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
      </div>
    </>
  );
};

export default ConfirmModal;
