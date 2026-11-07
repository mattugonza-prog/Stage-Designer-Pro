import { useEffect, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, UnlockKeyhole, Plus, Trash2, MousePointer2 } from 'lucide-react';
import { useEditorStore } from '../core/store';
import type { SceneLayer } from '../core/types';

function LayerRow({ layer }: { layer: SceneLayer }) {
  const state = useEditorStore();
  const [name, setName] = useState(layer.name);
  useEffect(() => setName(layer.name), [layer.name]);
  const count = state.project!.objects.filter((o) => o.layerId === layer.id).length;
  return (
    <article
      className={`layer-card ${layer.hidden ? 'layer-hidden' : ''}`}
      data-testid={`layer-${layer.id}`}
    >
      <div className="layer-card-title">
        <span className="layer-swatch" />
        <input
          aria-label={`Nombre de capa ${layer.name}`}
          value={name}
          maxLength={200}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            const next = name.trim();
            if (next) state.updateLayer(layer.id, { name: next });
            else setName(layer.name);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
        />
        <span className="layer-count">{count}</span>
      </div>
      <div className="layer-actions">
        <button
          aria-label={`${layer.hidden ? 'Mostrar' : 'Ocultar'} capa ${layer.name}`}
          aria-pressed={!layer.hidden}
          onClick={() => state.updateLayer(layer.id, { hidden: !layer.hidden })}
        >
          {layer.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
          <span>{layer.hidden ? 'Oculta' : 'Visible'}</span>
        </button>
        <button
          aria-label={`${layer.locked ? 'Desbloquear' : 'Bloquear'} capa ${layer.name}`}
          aria-pressed={layer.locked}
          onClick={() => state.updateLayer(layer.id, { locked: !layer.locked })}
        >
          {layer.locked ? <LockKeyhole size={14} /> : <UnlockKeyhole size={14} />}
        </button>
        <button
          aria-label={`Seleccionar capa ${layer.name}`}
          title="Seleccionar elementos de la capa"
          disabled={!count || layer.hidden}
          onClick={() => state.selectLayer(layer.id)}
        >
          <MousePointer2 size={14} />
        </button>
        <button
          aria-label={`Eliminar capa ${layer.name}`}
          title="Eliminar capa; conservar sus elementos"
          onClick={() => {
            if (
              confirm(
                `¿Eliminar la capa «${layer.name}»? Sus ${count} elementos se conservarán sin capa. Podés deshacer esta operación.`,
              )
            )
              state.removeLayer(layer.id);
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </article>
  );
}

export default function LayersPanel() {
  const state = useEditorStore();
  const [name, setName] = useState('');
  const project = state.project!;
  const unassigned = project.objects.filter((o) => !o.layerId).length;
  return (
    <section className="layers-panel" aria-label="Administración de capas">
      <p className="field-help">
        Organizá el montaje por disciplina. Ocultar una capa cambia el plano y la vista 3D; sus
        equipos siguen en el inventario.
      </p>
      <form
        className="layer-create"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) {
            state.addLayer(name.trim());
            setName('');
          }
        }}
      >
        <input
          aria-label="Nombre de nueva capa"
          placeholder="Nueva capa…"
          maxLength={200}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="icon-button"
          aria-label="Crear capa"
          disabled={!name.trim() || project.layers.length >= 64}
        >
          <Plus size={17} />
        </button>
      </form>
      {project.layers.map((layer) => (
        <LayerRow key={layer.id} layer={layer} />
      ))}
      <div className="layer-unassigned">
        <span>Sin capa</span>
        <strong>{unassigned}</strong>
      </div>
      {state.selectedIds.length > 0 && (
        <section className="property-section layer-assignment">
          <h3>
            ASIGNAR SELECCIÓN <span>{state.selectedIds.length}</span>
          </h3>
          <select
            aria-label="Asignar selección a capa"
            value=""
            onChange={(e) => {
              if (e.target.value)
                state.assignSelectionToLayer(
                  e.target.value === '__none' ? undefined : e.target.value,
                );
            }}
          >
            <option value="">Elegir destino…</option>
            <option value="__none">Sin capa</option>
            {project.layers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
                {l.locked ? ' · bloqueada' : ''}
              </option>
            ))}
          </select>
        </section>
      )}
      <p className="field-help">
        Un bloqueo de capa se suma al bloqueo individual. Al desbloquear la capa se conservan los
        bloqueos de cada equipo.
      </p>
    </section>
  );
}
