import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, X, LogOut, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from './ConfirmModal';

const Navbar = ({ searchQuery, onSearch }) => {
  const [value, setValue] = useState(searchQuery || '');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    setValue(searchQuery || '');
  }, [searchQuery]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!userMenuRef.current?.contains(event.target)) {
        userMenuRef.current?.removeAttribute('open');
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = value.trim();
    onSearch(q);
    if (q) navigate('/');
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#090909]/80 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
      <div className="mx-auto flex h-[4.5rem] max-w-[1440px] items-center gap-3 px-4 sm:gap-5 sm:px-6 lg:gap-8 lg:px-8">
        <Link
          to="/"
          onClick={() => onSearch('')}
          className="flex-shrink-0 font-display text-[1.65rem] font-semibold tracking-[0.16em] transition-opacity hover:opacity-85 sm:text-2xl"
        >
          <span className="text-[#ff6b1a]">SETT</span>
          <span className="text-white">FLIX</span>
        </Link>

        <form onSubmit={handleSubmit} className="group/search relative order-last ml-0 flex min-w-0 flex-1 justify-end md:order-none md:mx-auto md:max-w-md md:justify-stretch">
          <div className="relative w-full transition-[width] duration-300 md:w-full">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-[#8f8a82] transition-colors group-focus-within/search:text-[#ff6b1a]"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Buscar películas..."
              className="h-10 w-full rounded-full border border-white/[0.12] bg-white/[0.06] pl-10 pr-9 text-sm text-[#e9e4dc] shadow-inner shadow-white/[0.02] outline-none placeholder:text-[#6f6a63] transition-all duration-300 focus:border-[#ff6b1a]/50 focus:bg-white/[0.09] focus:shadow-[0_0_0_4px_rgba(255,107,26,0.10)]"
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6f6a63] transition-colors hover:text-[#e9e4dc]"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </form>

        <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2.5 md:gap-4">
          <Link
            to="/favorites"
            className="group flex items-center gap-1.5 rounded-full px-2 py-2 text-sm text-[#a19b91] transition-colors hover:bg-white/[0.06] hover:text-[#ff6b1a] sm:px-3"
          >
            <Heart size={18} />
            <span className="hidden sm:inline">Favoritas</span>
          </Link>

          {user && (
            <details ref={userMenuRef} className="group/user relative">
              <summary className="flex max-w-32 cursor-pointer list-none items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-sm text-[#a19b91] outline-none transition-colors hover:border-[#ff6b1a]/40 hover:bg-white/[0.08] hover:text-white sm:max-w-40 sm:px-3 [&::-webkit-details-marker]:hidden">
                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#ff6b1a] shadow-[0_0_10px_rgba(255,107,26,0.7)]" />
                <span className="truncate">{user.username}</span>
              </summary>
              <div className="absolute right-0 top-[calc(100%+0.65rem)] w-44 rounded-2xl border border-white/[0.1] bg-[#151412]/95 p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <button
                  onClick={handleLogout}
                  className="cursor-pointer flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-[#b2aca3] transition-colors hover:bg-[#ff6b1a]/10 hover:text-[#ff6b1a]"
                >
                  <LogOut size={16} />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </details>
          )}
        </div>
      </div>
      </header>
      <ConfirmModal
        open={showLogoutModal}
        title="¿Cerrar sesión?"
        message="Tendrás que volver a iniciar sesión para acceder a tu cuenta."
        confirmLabel="Cerrar sesión"
        cancelLabel="Cancelar"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
};

export default Navbar;
