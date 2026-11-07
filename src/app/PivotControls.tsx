import { Crosshair } from 'lucide-react';
import { getDimensions } from '../core/geometry';
import { getRotationPivotWorld } from '../core/pivots';
import { isObjectLocked } from '../core/layers';
import { useEditorStore } from '../core/store';
import type { SceneObject } from '../core/types';
import { NumberField } from './controls';

export default function PivotControls({ object }: { object: SceneObject }) {
  const state = useEditorStore();
  const locked = isObjectLocked(state.project!, object);
  const pivot = object.rotationPivot ?? { x: 0, y: 0 };
  const world = getRotationPivotWorld(object);
  const { width, depth } = getDimensions(object);
  const presets = [
    { name: 'Centro', x: 0, y: 0 },
    { name: 'Esquina −X / −Y', x: -width / 2, y: -depth / 2 },
    { name: 'Esquina +X / −Y', x: width / 2, y: -depth / 2 },
    { name: 'Esquina −X / +Y', x: -width / 2, y: depth / 2 },
    { name: 'Esquina +X / +Y', x: width / 2, y: depth / 2 },
  ];
  const match = presets.findIndex(
    (p) => Math.abs(p.x - pivot.x) < 1e-6 && Math.abs(p.y - pivot.y) < 1e-6,
  );
  return (
    <section className="property-section pivot-controls">
      <h3>
        PIVOTE DE GIRO <Crosshair size={13} />
      </h3>
      <label className="text-field">
        <span>Referencia del giro</span>
        <select
          aria-label="Pivote de giro"
          value={match < 0 ? 'custom' : String(match)}
          disabled={locked}
          onChange={(e) => {
            const preset = presets[Number(e.target.value)];
            if (preset) state.setRotationPivot(object.id, { x: preset.x, y: preset.y });
          }}
        >
          {presets.map((p, i) => (
            <option value={i} key={p.name}>
              {p.name}
            </option>
          ))}
          <option value="custom" disabled>
            Personalizado
          </option>
        </select>
      </label>
      <div className="double-fields">
        {(['x', 'y'] as const).map((axis) => (
          <NumberField
            key={axis}
            label={`Pivote ${axis.toUpperCase()}`}
            value={pivot[axis]}
            min={-100}
            max={100}
            disabled={locked}
            onChange={(value) => state.setRotationPivot(object.id, { ...pivot, [axis]: value })}
          />
        ))}
      </div>
      <p className="field-help">
        Metros en los ejes locales del equipo. Cambiar el pivote conserva la posición; al girar,
        este punto queda fijo.
      </p>
      <p className="field-help" data-testid="pivot-world">
        Punto en el escenario: X {world.x.toFixed(3)} · Y {world.y.toFixed(3)} m.
      </p>
    </section>
  );
}
