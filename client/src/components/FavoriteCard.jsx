import { useEffect, useRef, useState } from 'react';
import { Bookmark, Check, Pencil, Save, Star, HeartCrack, XCircle, StarX } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import StarRating, { clampRating } from './StarRating';

const formatNota = (value) => String(Math.round(clampRating(value)));

export default function FavoriteCard({ favorite, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [currentNota, setCurrentNota] = useState(favorite.nota ?? null);
  const [note, setNote] = useState(favorite.nota ?? 0);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const ratingEditorRef = useRef(null);

  useEffect(() => {
    setCurrentNota(favorite.nota ?? null);
    setNote(favorite.nota ?? 0);
  }, [favorite.nota]);

  useEffect(() => {
    if (!editing) return;

    const handlePointerDown = (event) => {
      if (!ratingEditorRef.current?.contains(event.target)) {
        setEditing(false);
        setNote(currentNota ?? 0);
        setError('');
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [editing, currentNota]);

  const handleSave = async () => {
    const safeRating = Math.round(clampRating(note));
    if (!safeRating) return;
    setSaving(true);
    setError('');
    try {
      await onUpdate?.(favorite.id, safeRating);
      setCurrentNota(safeRating);
      setNote(safeRating);
      setEditing(false);
    } catch {
      setError('No se pudo guardar la calificación.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveNote = async () => {
    setRemoving(true);
    setError('');
    try {
      await onUpdate?.(favorite.id, null);
      setCurrentNota(null);
      setNote(0);
      setEditing(false);
    } catch {
      setError('No se pudo quitar la calificación.');
    } finally {
      setRemoving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete?.(favorite.id);
      setShowDeleteModal(false);
    } catch {
      setDeleting(false);
      setError('No se pudo eliminar de favoritas.');
    }
  };

  return (
    <>
      <article className="group relative overflow-visible rounded-2xl border border-white/[0.08] bg-[#171719] shadow-[0_16px_40px_rgba(0,0,0,.22)] transition duration-300 hover:z-30 hover:-translate-y-1 hover:border-[#ff7a2f]/45 hover:shadow-[0_18px_48px_rgba(255,109,36,.14)]">
        <div className="relative aspect-[2/3] overflow-hidden rounded-t-2xl bg-white/5">
          <img src={favorite.poster} alt={favorite.titulo} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
            <Star size={12} className={currentNota ? 'text-[#ffad72]' : 'text-white/45'} fill="currentColor" />
            {currentNota ? formatNota(currentNota) : 'Sin nota'}
          </div>
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[.16em] text-white/65">
            <Bookmark size={12} /> Favorita
          </div>
        </div>

        <div className="p-4">
          <h2 className="line-clamp-2 min-h-12 text-[15px] font-semibold leading-6 text-[#f5eee8]">{favorite.titulo}</h2>
          <p className="mt-1 text-xs font-medium text-[#9b928c]">{favorite.anio || 'Año desconocido'}</p>

          <div className="relative mt-4 h-9">
            {editing ? (
              <div ref={ratingEditorRef} className="absolute bottom-full left-0 right-0 z-40 mb-2 space-y-3 rounded-2xl border border-[#ff7a2f]/25 bg-[#1d1b1d] p-3 shadow-[0_18px_45px_rgba(0,0,0,.45)]">
                <div className="rounded-xl border border-[#ff7a2f]/20 bg-[#ff7a2f]/[0.07] px-3 py-2 text-center">
                  <StarRating value={note} onChange={setNote} size={20} />
                  <p className="mt-1 text-[11px] font-semibold text-[#ffad72]">{note ? `${Math.round(note)} / 5` : 'Elige una calificación'}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={handleSave} disabled={saving || !note} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#ff7a2f] text-xs font-bold text-white transition hover:bg-[#ff8c4b] disabled:cursor-not-allowed disabled:opacity-50">
                    {saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Save size={14} />} Guardar
                  </button>
                  {currentNota != null && <button type="button" onClick={handleRemoveNote} disabled={removing} aria-label="Quitar calificación" className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-[#a59b94] transition hover:border-red-400/40 hover:text-red-400 disabled:opacity-50"><StarX size={15} /></button>}
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditing(true)} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.045] text-xs font-semibold text-[#b8aea7] transition hover:border-[#ff7a2f]/40 hover:bg-[#ff7a2f]/10 hover:text-[#ffad72]"><Pencil size={13} /> Editar nota</button>
                <button type="button" onClick={() => setShowDeleteModal(true)} aria-label="Eliminar de favoritas" className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.045] text-[#a59b94] transition hover:border-red-400/40 hover:bg-red-400/10 hover:text-red-400"><HeartCrack size={14} /></button>
              </div>
            )}
          </div>
          {error && <p role="alert" className="mt-2 text-center text-[11px] text-red-400">{error}</p>}
        </div>
      </article>
      <ConfirmModal open={showDeleteModal} title={`¿Eliminar “${favorite.titulo}”?`} message="La película se quitará de tu lista de favoritas." onConfirm={handleDelete} onCancel={() => setShowDeleteModal(false)} loading={deleting} />
    </>
  );
}
