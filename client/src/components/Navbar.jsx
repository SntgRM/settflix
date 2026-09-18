import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, X, LogOut, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ searchQuery, onSearch }) => {
  const [value, setValue] = useState(searchQuery || '');
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    setValue(searchQuery || '');
  }, [searchQuery]);

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
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/70 border-b border-white/5">
      <div className="flex items-center gap-3 md:gap-6 px-4 md:px-8 h-16">
        <Link
          to="/"
          onClick={() => onSearch('')}
          className="font-display text-2xl tracking-wide flex-shrink-0"
        >
          <span className="text-[#ff6b1a]">SETT</span>
          <span className="text-white">FLIX</span>
        </Link>

        <form onSubmit={handleSubmit} className="flex-1 max-w-md mx-auto">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a554e]"
            />
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Buscar películas..."
              className="w-full pl-9 pr-8 py-2 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 text-sm text-[#e9e4dc] placeholder:text-[#5a554e] focus:outline-none focus:border-[#ff6b1a]/40 focus:shadow-[0_0_0_3px_rgba(255,107,26,0.12)] transition-all duration-200"
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5a554e] hover:text-[#e9e4dc] transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </form>

        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <Link
            to="/favorites"
            className="flex items-center gap-1.5 text-sm text-[#8f8a82] hover:text-[#ff6b1a] transition-colors"
          >
            <Heart size={18} />
            <span className="hidden sm:inline">Favoritas</span>
          </Link>

          {user && (
            <span className="hidden md:block text-sm text-[#8f8a82]">
              {user.username}
            </span>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-[#8f8a82] hover:text-[#ff6b1a] transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
