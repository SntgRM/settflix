import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Film, Loader2 } from 'lucide-react';
import HeroCarousel from '../components/HeroCarousel';
import MovieRow from '../components/MovieRow';
import MovieCard from '../components/MovieCard';
import Loader from '../components/Loader';
import ErrorMessage from '../components/ErrorMessage';
import { searchMovies } from '../api/movies';

const SEED_CATEGORIES = [
  { term: 'spider man', title: 'El Hombre Araña' },
  { term: 'avengers', title: 'Los Vengadores' },
  { term: 'the purge', title: 'La Purga' },
  { term: 'superman', title: 'Superman' },
  { term: 'terrifier', title: 'Terrifier' },
];

const Home = ({ searchQuery }) => {
  const [categories, setCategories] = useState(
    SEED_CATEGORIES.map((c) => ({
      ...c,
      loading: true,
      error: null,
      resultados: [],
    }))
  );

  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const latestQuery = useRef(searchQuery);

  useEffect(() => {
    latestQuery.current = searchQuery;
  }, [searchQuery]);

  const loadCategory = useCallback(async (index, term) => {
    try {
      const data = await searchMovies(term, 1);
      setCategories((prev) =>
        prev.map((c, i) =>
          i === index ? { ...c, loading: false, resultados: data.resultados || [] } : c
        )
      );
    } catch (err) {
      setCategories((prev) =>
        prev.map((c, i) => (i === index ? { ...c, loading: false, error: err } : c))
      );
    }
  }, []);

  useEffect(() => {
    SEED_CATEGORIES.forEach((cat, i) => loadCategory(i, cat.term));
  }, [loadCategory]);

  const retryCategory = useCallback(
    (index) => {
      setCategories((prev) =>
        prev.map((c, i) => (i === index ? { ...c, loading: true, error: null } : c))
      );
      loadCategory(index, SEED_CATEGORIES[index].term);
    },
    [loadCategory]
  );

  const heroMovies = useMemo(() => {
    const seen = new Set();
    const movies = [];
    for (const cat of categories) {
      if (cat.loading || cat.error) continue;
      const first = cat.resultados[0];
      if (first && !seen.has(first.id_pelicula)) {
        seen.add(first.id_pelicula);
        movies.push(first);
      }
      if (movies.length >= 6) break;
    }
    return movies;
  }, [categories]);

  const isSearching = !!(searchQuery && searchQuery.trim().length > 0);

  useEffect(() => {
    if (!isSearching) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }
    let stale = false;
    setSearchLoading(true);
    setSearchError(null);
    setPage(1);
    searchMovies(searchQuery, 1)
      .then((data) => {
        if (stale) return;
        setSearchResults(data.resultados || []);
        setTotal(data.total || 0);
      })
      .catch((err) => {
        if (stale) return;
        setSearchError(err);
      })
      .finally(() => {
        if (stale) return;
        setSearchLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [searchQuery, isSearching, retryCount]);

  const hasMore = searchResults.length < total;

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const query = searchQuery;
    try {
      const next = page + 1;
      const data = await searchMovies(query, next);
      if (latestQuery.current !== query) return;
      setSearchResults((prev) => [...prev, ...(data.resultados || [])]);
      setPage(next);
      setTotal(data.total || 0);
    } catch {
    } finally {
      setLoadingMore(false);
    }
  };

  if (isSearching) {
    return (
        <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-10 2xl:px-14">
          <div className="flex items-center gap-2 mb-6">
            <Search size={20} className="text-[#ff6b1a]" />
            <h1 className="font-display text-2xl text-[#e9e4dc]">
              Resultados para &ldquo;{searchQuery}&rdquo;
            </h1>
          </div>

          {searchLoading ? (
            <Loader label="Buscando películas..." />
          ) : searchError ? (
            <ErrorMessage
              message={
                searchError.response?.status === 502
                  ? 'No se pudieron obtener resultados en este momento. Intenta más tarde.'
                  : 'Ocurrió un error al buscar películas.'
              }
              onRetry={() => setRetryCount((c) => c + 1)}
            />
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Film className="w-12 h-12 text-[#5a554e] mb-3" />
              <p className="text-[#8f8a82]">
                No se encontraron películas para &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          ) : (
            <>
              <div className="mx-auto grid w-full max-w-[1420px] grid-cols-2 justify-items-center gap-x-3 gap-y-7 py-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8 md:grid-cols-4 lg:grid-cols-5 lg:gap-x-6 xl:grid-cols-5 2xl:grid-cols-5">
                {searchResults.map((movie) => (
                  <MovieCard key={movie.id_pelicula} movie={movie} />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center py-8">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#161616] border border-white/10 text-[#e9e4dc] text-sm hover:border-[#ff6b1a]/50 hover:text-[#ff6b1a] transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : null}
                    {loadingMore ? 'Cargando...' : 'Cargar más'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
    );
  }

  return (
    <>
      {heroMovies.length > 0 && <HeroCarousel movies={heroMovies} />}

      <div className="pt-6 pb-12">
        {categories.map((cat, i) => (
          <div key={cat.term} className={i > 0 ? 'mt-6' : ''}>
            <MovieRow
              title={cat.title}
              loading={cat.loading}
              error={cat.error}
              resultados={cat.resultados}
              onRetry={() => retryCategory(i)}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default Home;
