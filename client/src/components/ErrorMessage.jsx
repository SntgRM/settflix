import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorMessage = ({ message = 'Algo salió mal', onRetry, compact = false }) => (
  <div
    className={`flex flex-col items-center justify-center gap-3 text-center ${
      compact ? 'py-6' : 'py-20'
    }`}
  >
    <AlertCircle className="w-10 h-10 text-[#ff6b1a]/60" />
    <p className="text-[#8f8a82] text-sm max-w-xs">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-1 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#161616] border border-white/10 text-[#e9e4dc] text-sm hover:border-[#ff6b1a]/50 hover:text-[#ff6b1a] transition-colors"
      >
        <RefreshCw size={15} />
        Reintentar
      </button>
    )}
  </div>
);

export default ErrorMessage;
