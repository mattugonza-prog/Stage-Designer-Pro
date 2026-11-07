import { useEffect, useState } from 'react';
import { Link2, Unlink, ArrowUpRight } from 'lucide-react';
import { useEditorStore } from '../core/store';
import { getLocalTransform, getDescendantIds } from '../core/hierarchy';
import { isObjectLocked } from '../core/layers';
import type { SceneObject } from '../core/types';
import { NumberField } from './controls';

export default function AnchorControls({ object }: { object: SceneObject }) {
  const state = useEditorStore();
  const project = state.project!;
  const [parentId, setParentId] = useState(object.parentId || '');
  const [snapTop, setSnapTop] = useState(true);
  useEffect(() => setParentId(object.parentId || ''), [object.id, object.parentId]);
  const parent = project.objects.find((o) => o.id === object.parentId);
  const local = getLocalTransform(project, object.id);
  const locked = isObjectLocked(project, object);
  const descendants = getDescendantIds(project, object.id);
  const choices = project.objects.filter((o) => o.id !== object.id && !descendants.has(o.id));
  return (
    <section className="property-section anchor-controls">
      <h3>
        SOPORTE FÍSICO <Link2 size={13} />
      </h3>
      <label className="text-field">
        <span>Anclar este elemento a</span>
        <select
          aria-label="Soporte físico"
          value={parentId}
          disabled={locked}
          onChange={(e) => setParentId(e.target.value)}
        >
          <option value="">Elegir soporte…</option>
          {choices.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="check-field">
        <input
          type="checkbox"
          checked={snapTop}
          disabled={locked}
          onChange={(e) => setSnapTop(e.target.checked)}
        />{' '}
        Apoyar sobre la cara superior
      </label>
      <button
        className="subtle-button anchor-attach"
        disabled={!parentId || locked}
        onClick={() => state.attachObject(object.id, parentId, snapTop)}
      >
        <Link2 size={14} />
        {parent ? 'Actualizar anclaje' : 'Anclar al soporte'}
      </button>
      {!parent && (
        <p className="field-help">
          Al anclar, el objeto acompañará los movimientos, giros y cambios de altura de su soporte.
        </p>
      )}
      {parent && local && (
        <>
          <div className="anchor-parent">
            <span>
              Vinculado a <strong>{parent.label}</strong>
            </span>
            <button
              className="icon-button"
              aria-label="Seleccionar soporte"
              onClick={() => state.select(parent.id)}
            >
              <ArrowUpRight size={14} />
            </button>
          </div>
          <h3 className="anchor-subtitle">
            POSICIÓN RELATIVA <span>metros</span>
          </h3>
          <div className="triple-fields">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <NumberField
                key={axis}
                label={`${axis.toUpperCase()} relativo`}
                value={local.position[axis]}
                disabled={locked}
                min={-10000}
                max={10000}
                onChange={(n) =>
                  state.updateLocalTransform(object.id, {
                    position: { ...local.position, [axis]: n },
                  })
                }
              />
            ))}
          </div>
          <NumberField
            label="Giro relativo"
            value={local.rotation}
            suffix="°"
            step={1}
            disabled={locked}
            onChange={(rotation) => state.updateLocalTransform(object.id, { rotation })}
          />
          <p className="field-help">
            Coordenadas medidas desde el centro inferior del soporte. Editar aquí mueve este
            elemento y sus hijos, conservando el resto del conjunto.
          </p>
          <button
            className="subtle-button anchor-detach"
            disabled={locked}
            onClick={() => state.detachObject(object.id)}
          >
            <Unlink size={14} /> Desvincular conservando posición
          </button>
        </>
      )}
    </section>
  );
}
