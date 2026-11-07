import { Eye, EyeOff, LockKeyhole, CornerDownRight } from 'lucide-react';
import { useEditorStore } from '../core/store';
import { isObjectHidden, isObjectLocked } from '../core/layers';
import type { SceneObject } from '../core/types';
import { EquipmentIcon } from './Catalog';

export default function SceneTree() {
  const state = useEditorStore();
  const project = state.project!;
  const rows: { object: SceneObject; depth: number }[] = [];
  const visited = new Set<string>();
  const append = (object: SceneObject, depth: number) => {
    if (visited.has(object.id)) return;
    visited.add(object.id);
    rows.push({ object, depth });
    project.objects.filter((o) => o.parentId === object.id).forEach((o) => append(o, depth + 1));
  };
  project.objects.filter((o) => !o.parentId).forEach((o) => append(o, 0));
  project.objects.filter((o) => !visited.has(o.id)).forEach((o) => append(o, 0));
  return (
    <section className="property-section scene-tree">
      <h3>
        ELEMENTOS <span>{project.objects.length}</span>
      </h3>
      {rows.map(({ object: o, depth }) => (
        <div
          key={o.id}
          data-testid={`scene-tree-row-${o.id}`}
          data-depth={depth}
          className={`tree-row ${state.selectedIds.includes(o.id) ? 'selected' : ''} ${isObjectHidden(project, o) ? 'tree-hidden' : ''}`}
          style={{ paddingLeft: Math.min(depth, 6) * 9 }}
        >
          <button
            aria-label={`Seleccionar en lista ${o.label}`}
            title={
              o.parentId
                ? `${o.label} · sobre ${project.objects.find((p) => p.id === o.parentId)?.label}`
                : o.label
            }
            onClick={(e) => state.select(o.id, e.shiftKey)}
          >
            {depth > 0 && <CornerDownRight size={11} />}
            <EquipmentIcon kind={o.definition.kind} size={13} />
            <span>{o.label}</span>
            {isObjectLocked(project, o) && <LockKeyhole size={11} />}
          </button>
          <button
            aria-label={`${o.hidden ? 'Mostrar' : 'Ocultar'} ${o.label}`}
            title={isObjectHidden(project, o) && !o.hidden ? 'Su capa está oculta' : undefined}
            onClick={() => state.updateObject(o.id, { hidden: !o.hidden })}
          >
            {isObjectHidden(project, o) ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
      ))}
    </section>
  );
}
