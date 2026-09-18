import { useState, useRef, useEffect } from 'react';
import { Star, Trash2, Check, Pencil, Save, X } from 'lucide-react';

const hasValidPoster = (poster) =>
  poster && poster !== 'N/A' && poster.trim() !== '';

const PosterPlaceholder = () => (
  <div className="w-full h-full bg-[#161616] flex items-center justify-center">
    <span className="text-[#5a554e] text-xs">Sin póster</span>
  </div>
);

const FavoriteCard = ({ favorite, onUpdate, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(favorite.nota ?? 5);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const confirmTimer = useRef(null);
  const valid = hasValidPoster(favorite.poster);

  useEffect(() => {
    setNote(favorite.nota ?? 5);
  }, [favorite.nota]);

  useEffect(() => () => clearTimeout(confirmTimer.current), []);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(favorite.id, note);
    setSaving(false);
    setEditing(false);
  };

  const handleDeleteClick = () => {
    if (!confirming) {
      setConfirming(true);
      confirmTimer.current = setTimeout(() => setConfirming(false), 3000);
    } else {
      clearTimeout(confirmTimer.current);
      onDelete(favorite.id);
    }
  };

  return (
    <div className="rounded-lg border border-white/5 bg-[#161616] overflow-hidden transition-all duration-300 hover:border-[#ff6b1a]/30">
      <div className="aspect-[2/3] relative">
        {valid ? (
          <img
            src={favorite.poster}
            alt={favorite.titulo}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <PosterPlaceholder />
        )}
        {favorite.nota != null && !editing && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-xs">
            <Star size={11} className="text-[#ff6b1a]" fill="currentColor" />
            <span className="text-[#e9e4dc] font-medium">{favorite.nota}</span>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="text-sm text-[#e9e4dc] font-medium leading-snug line-clamp-2">
          {favorite.titulo}
        </p>
        {favorite.anio && favorite.anio !== 'N/A' && (
          <p className="text-xs text-[#8f8a82] mt-0.5">{favorite.anio}</p>
        )}

        {editing ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="10"
                value={note}
                onChange={(e) => setNote(Number(e.target.value))}
                className="flex-1 accent-[#ff6b1a]"
              />
              <span className="text-sm text-[#ff6b1a] font-medium w-6 text-center">
                {note}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-[#ff6b1a] text-white text-xs font-medium hover:bg-[#ff8533] transition-colors disabled:opacity-60"
              >
                {saving ? '...' : <Save size={13} />}
                Guardar
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setNote(favorite.nota ?? 5);
                }}
                className="flex items-center justify-center w-8 py-1.5 rounded-md bg-white/5 border border-white/10 text-[#8f8a82] hover:text-[#e9e4dc] transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md bg-white/5 border border-white/10 text-[#8f8a82] text-xs hover:text-[#ff6b1a] hover:border-[#ff6b1a]/30 transition-colors"
            >
              <Pencil size={12} />
              Editar nota
            </button>
            <button
              onClick={handleDeleteClick}
              className={`flex items-center justify-center w-8 py-1.5 rounded-md border text-xs transition-all ${
                confirming
                  ? 'bg-red-500/20 border-red-500/50 text-red-400'
                  : 'bg-white/5 border-white/10 text-[#8f8a82] hover:text-red-400 hover:border-red-500/30'
              }`}
            >
              {confirming ? <Check size={13} /> : <Trash2 size={13} />}
            </button>
          </div>
        )}

        {confirming && !editing && (
          <p className="text-xs text-red-400 mt-1.5 text-center">¿Quitar?</p>
        )}
      </div>
    </div>
  );
};

export default FavoriteCard;
