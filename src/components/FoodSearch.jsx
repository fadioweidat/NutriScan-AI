import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, CheckCircle } from 'lucide-react';
import { searchFoods } from '../lib/search-engine.js';

/**
 * Autocomplete food search component professionale.
 *
 * @param {object}   props
 * @param {Function} props.onSelect       – Called with the selected food item
 * @param {string}   [props.placeholder]  – Input placeholder
 */
export default function FoodSearch({
  onSelect,
  placeholder = 'Cerca un alimento (es. banana, barcode)...',
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(null);

  // ── Debounced local search ──
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const localResults = await searchFoods(query.trim(), 20);
        setResults(localResults || []);
        setIsOpen(true);
        setActiveIndex(-1);
      } catch (err) {
        console.error("Food search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250); // Debounce 250ms come richiesto

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // ── Select handler ──
  const handleSelect = useCallback(
    (food) => {
      onSelect?.(food);
      setQuery('');
      setResults([]);
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    },
    [onSelect]
  );

  // ── Keyboard navigation ──
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) return;

      const totalItems = results.length;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < results.length) {
            handleSelect(results[activeIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setActiveIndex(-1);
          inputRef.current?.blur();
          break;
        default:
          break;
      }
    },
    [isOpen, results, activeIndex, handleSelect]
  );

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex];
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!inputRef.current?.closest('[data-food-search]')?.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const clearInput = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full" data-food-search>
      {/* ── Input ── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-lime-500/70 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="
            w-full pl-11 pr-10 py-3.5
            bg-white/5 border border-white/10
            rounded-2xl text-base text-white
            placeholder:text-white/40
            focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/30
            transition-all shadow-inner
          "
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
        />
        {/* Loading / Clear */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-5 h-5 text-lime-500 animate-spin" />
          ) : query ? (
            <button
              onClick={clearInput}
              className="p-1 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all"
              aria-label="Cancella ricerca"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Dropdown ── */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-down">
          <ul
            ref={listRef}
            className="max-h-80 overflow-y-auto py-2 custom-scrollbar"
            role="listbox"
          >
            {results.length === 0 && !loading ? (
              <li className="px-6 py-8 text-center flex flex-col items-center gap-2 text-white/50">
                <Search className="w-8 h-8 opacity-20 mb-2" />
                <span className="font-medium text-white/80">Alimento non trovato</span>
                <span className="text-sm">Prova a cercare con un altro nome o marca.</span>
              </li>
            ) : (
              results.map((food, i) => (
                <li
                  key={food.id || `${food.name}-${i}`}
                  role="option"
                  aria-selected={activeIndex === i}
                  className={`
                    flex items-center gap-4 px-4 py-3 cursor-pointer
                    transition-all border-l-2
                    ${activeIndex === i
                      ? 'bg-lime-500/10 border-lime-400 text-white'
                      : 'border-transparent text-white/80 hover:bg-white/5 hover:border-white/20'}
                  `}
                  onClick={() => handleSelect(food)}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold truncate">
                        {food.name || 'Alimento ignoto'}
                      </p>
                      {food.verified && (
                        <CheckCircle className="w-4 h-4 text-lime-400 shrink-0" title="Verificato" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-medium tracking-wide uppercase">
                        {food.source || 'SYSTEM'}
                      </span>
                      
                      {food.brand && (
                        <span className="text-xs text-white/40 truncate">
                          {food.brand}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 bg-black/20 px-3 py-1.5 rounded-xl border border-white/5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-bold text-lime-400 tabular-nums">
                        {food.calories ?? '--'}
                      </span>
                      <span className="text-xs font-semibold text-white/40">
                        kcal
                      </span>
                    </div>
                    <div className="text-[10px] text-white/30 text-right uppercase tracking-wider">
                      per 100g
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
