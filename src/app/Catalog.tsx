import { useState } from 'react';
import {
  Search,
  Plus,
  Star,
  Drum,
  Piano,
  Guitar,
  Mic2,
  Speaker,
  UserRound,
  Layers3,
  Monitor,
  Box,
  SlidersHorizontal,
} from 'lucide-react';
import { catalog } from '../catalog/data';
import { useEditorStore } from '../core/store';
import type { EquipmentDefinition, EquipmentKind } from '../core/types';

export function EquipmentIcon({ kind, size = 24 }: { kind: EquipmentKind; size?: number }) {
  const Icon = {
    drums: Drum,
    keyboard: Piano,
    guitar: Guitar,
    microphone: Mic2,
    monitor: Speaker,
    speaker: Speaker,
    person: UserRound,
    riser: Layers3,
    led: Monitor,
    'line-array': Speaker,
    console: SlidersHorizontal,
    box: Box,
  }[kind];
  return <Icon size={size} strokeWidth={1.5} />;
}
export default function Catalog({
  custom,
  onCustom,
}: {
  custom: EquipmentDefinition[];
  onCustom: () => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem('stagepro-favorites') || '[]');
      return Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  });
  const addObject = useEditorStore((s) => s.addObject);
  const items = [...catalog, ...custom].filter(
    (d) =>
      (category === 'Todos' || d.category === category) &&
      (!favoriteOnly || favorites.includes(d.id)) &&
      `${d.name} ${d.description}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  function favorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id];
    setFavorites(next);
    try {
      localStorage.setItem('stagepro-favorites', JSON.stringify(next));
    } catch {
      /* Optional preference; editing remains available. */
    }
  }
  return (
    <aside className="catalog-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">EQUIPAMIENTO</span>
          <h2>Biblioteca</h2>
        </div>
        <button
          aria-label="Mostrar favoritos"
          aria-pressed={favoriteOnly}
          className={`icon-button ${favoriteOnly ? 'active' : ''}`}
          onClick={() => setFavoriteOnly(!favoriteOnly)}
        >
          <Star size={17} />
        </button>
      </div>
      <label className="search-field">
        <Search size={16} />
        <input
          placeholder="Buscar equipo…"
          aria-label="Buscar equipo"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <kbd>/</kbd>
      </label>
      <div className="category-tabs">
        {['Todos', 'Instrumentos', 'Audio', 'Escenario', 'Video', 'Personas'].map((c) => (
          <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="catalog-section-label">
        <span>
          {favoriteOnly
            ? 'TUS FAVORITOS'
            : category === 'Todos'
              ? 'CATÁLOGO LOCAL'
              : category.toUpperCase()}
        </span>
        <span>{items.length}</span>
      </div>
      <div className="catalog-grid">
        {items.map((d) => (
          <div className="equipment-card" key={d.id}>
            <button
              className="equipment-add"
              aria-label={`Añadir ${d.name}`}
              onClick={() => addObject(d)}
            >
              <span className={`equipment-art kind-${d.kind}`} style={{ color: d.color }}>
                <EquipmentIcon kind={d.kind} size={38} />
                <Plus className="add-corner" size={15} />
              </span>
              <strong>{d.name}</strong>
              <small>
                {d.dimensions.width} × {d.dimensions.depth} m
              </small>
            </button>
            <button
              className={`favorite ${favorites.includes(d.id) ? 'active' : ''}`}
              aria-label={`Favorito ${d.name}`}
              aria-pressed={favorites.includes(d.id)}
              onClick={() => favorite(d.id)}
            >
              <Star size={12} fill={favorites.includes(d.id) ? 'currentColor' : 'none'} />
            </button>
          </div>
        ))}
      </div>
      {!items.length && <p className="empty-message">No hay equipos con ese filtro.</p>}
      <div className="catalog-footer">
        <button className="subtle-button" onClick={onCustom}>
          <Plus size={16} /> Crear equipo personalizado
        </button>
        <p>Modelos genéricos · medidas editables</p>
      </div>
    </aside>
  );
}
