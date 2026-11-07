import type { Project, SceneObject, Vec3 } from './types';
import { getDimensions, rotatePoint, roundMetric } from './geometry';
import { isObjectLocked } from './layers';
import { compensateRotationPivot } from './pivots';

export function getDescendantIds(project: Project, id: string): Set<string> {
  const result = new Set<string>();
  const queue = [id];
  for (let i = 0; i < queue.length; i++) {
    for (const child of project.objects) {
      if (child.parentId === queue[i] && child.id !== id && !result.has(child.id)) {
        result.add(child.id);
        queue.push(child.id);
      }
    }
  }
  return result;
}
export function canAttach(project: Project, childId: string, parentId: string): boolean {
  return (
    childId !== parentId &&
    project.objects.some((o) => o.id === childId) &&
    project.objects.some((o) => o.id === parentId) &&
    !getDescendantIds(project, childId).has(parentId)
  );
}
export function getLocalTransform(
  project: Project,
  id: string,
): { position: Vec3; rotation: number } | null {
  const child = project.objects.find((o) => o.id === id);
  const parent = project.objects.find((o) => o.id === child?.parentId);
  if (!child || !parent) return null;
  const xy = rotatePoint(
    { x: child.position.x - parent.position.x, y: child.position.y - parent.position.y },
    -parent.rotation,
  );
  return {
    position: { ...xy, z: roundMetric(child.position.z - parent.position.z) },
    rotation: roundMetric(child.rotation - parent.rotation),
  };
}
export function relatedIds(project: Project, ids: string[], includeGroups = true): Set<string> {
  const result = new Set(ids);
  let changed = true;
  while (changed) {
    changed = false;
    const groups = new Set(
      project.objects.filter((o) => result.has(o.id) && o.groupId).map((o) => o.groupId),
    );
    for (const o of project.objects)
      if (
        !result.has(o.id) &&
        ((o.parentId && result.has(o.parentId)) ||
          (includeGroups && o.groupId && groups.has(o.groupId)))
      ) {
        result.add(o.id);
        changed = true;
      }
  }
  return result;
}
export function assertEditable(project: Project, ids: Iterable<string>): void {
  const affected = new Set(ids);
  const locked = project.objects.find((o) => affected.has(o.id) && isObjectLocked(project, o));
  if (locked)
    throw new Error(
      `«${locked.label}» está bloqueado. Desbloqueá el elemento o su capa para editar el conjunto.`,
    );
}
export function assertPhysical(object: SceneObject): void {
  const { position: p, rotation } = object;
  if (
    ![p.x, p.y, p.z, rotation].every(Number.isFinite) ||
    Math.abs(p.x) > 10000 ||
    Math.abs(p.y) > 10000 ||
    p.z < -100 ||
    p.z > 1000 ||
    Math.abs(rotation) > 360000
  )
    throw new Error('La transformación excede los límites de posición o rotación permitidos.');
  if (
    object.rotationPivot &&
    [object.rotationPivot.x, object.rotationPivot.y].some(
      (value) => !Number.isFinite(value) || Math.abs(value) > 100,
    )
  )
    throw new Error('El pivote de giro debe estar entre −100 y 100 m en cada eje local.');
  const parameters = object.parameters;
  if (parameters) {
    if (
      parameters.type !== object.definition.kind ||
      [parameters.cabinetWidth, parameters.cabinetHeight, parameters.cabinetDepth].some(
        (n) => !Number.isFinite(n) || n <= 0 || n > 100,
      )
    )
      throw new Error('Medidas de gabinete inválidas.');
    if (
      parameters.type === 'led' &&
      [parameters.rows, parameters.columns].some((n) => !Number.isInteger(n) || n < 1 || n > 100)
    )
      throw new Error('La cantidad de gabinetes debe ser un entero entre 1 y 100.');
    if (
      parameters.type === 'line-array' &&
      (!Number.isInteger(parameters.count) ||
        parameters.count < 1 ||
        parameters.count > 64 ||
        !Number.isFinite(parameters.splayAngle) ||
        Math.abs(parameters.splayAngle) > 15)
    )
      throw new Error('Configuración de line array fuera de rango.');
  }
  if (Object.values(getDimensions(object)).some((n) => !Number.isFinite(n) || n <= 0 || n > 100))
    throw new Error('Las dimensiones deben ser mayores a cero y no superar 100 m.');
}

/** Operates on a draft. The caller commits only if the complete physical operation succeeds. */
export function applyObjectPatch(
  project: Project,
  id: string,
  patch: Partial<SceneObject>,
  selectedIds: string[] = [],
  individual = false,
): void {
  const target = project.objects.find((o) => o.id === id);
  if (!target) return;
  if (
    Object.keys(patch).some(
      (key) =>
        !['position', 'rotation', 'dimensions', 'parameters', 'label', 'locked', 'hidden'].includes(
          key,
        ),
    )
  )
    throw new Error(
      'Usá los controles de anclaje o capas para modificar las relaciones del elemento.',
    );
  const flagsOnly = Object.keys(patch).every((key) => key === 'locked' || key === 'hidden');
  if (!flagsOnly) assertEditable(project, [id]);
  if (patch.label !== undefined && (!patch.label.trim() || patch.label.length > 200))
    throw new Error('El nombre del elemento debe tener entre 1 y 200 caracteres.');
  const before = structuredClone(target);
  const after = { ...structuredClone(target), ...structuredClone(patch) };
  if (patch.rotation !== undefined && patch.position === undefined)
    after.position = compensateRotationPivot(before, after.rotation);
  assertPhysical(after);
  const physicalMove = !!patch.position || patch.rotation !== undefined;
  const ids = physicalMove
    ? relatedIds(project, !individual && selectedIds.includes(id) ? selectedIds : [id], !individual)
    : new Set([id]);
  const descendants = getDescendantIds(project, id);
  const heightDelta = getDimensions(after).height - getDimensions(before).height;
  if (heightDelta) for (const child of descendants) ids.add(child);
  if (physicalMove || heightDelta) assertEditable(project, ids);
  const angle = after.rotation - before.rotation;
  for (const item of project.objects) {
    if (item.id === id || !ids.has(item.id)) continue;
    if (physicalMove) {
      const xy = rotatePoint(
        { x: item.position.x - before.position.x, y: item.position.y - before.position.y },
        angle,
      );
      item.position = {
        x: roundMetric(after.position.x + xy.x),
        y: roundMetric(after.position.y + xy.y),
        z: roundMetric(item.position.z + after.position.z - before.position.z),
      };
      item.rotation = roundMetric(item.rotation + angle);
    }
    if (heightDelta && descendants.has(item.id))
      item.position.z = roundMetric(item.position.z + heightDelta);
    assertPhysical(item);
  }
  Object.assign(target, after);
  if (target.parameters) target.dimensions = getDimensions(target);
}

/** Selected parents subsume descendants; linked groups and subtrees move as one unit. */
export function selectionUnits(
  project: Project,
  selectedIds: string[],
): { ids: Set<string>; center: Vec3 }[] {
  const selected = project.objects.filter((o) => selectedIds.includes(o.id));
  const descendantsOfSelected = new Set(
    selected.flatMap((o) => [...getDescendantIds(project, o.id)]),
  );
  const roots = selected.filter((o) => !descendantsOfSelected.has(o.id));
  const components: { ids: Set<string> }[] = [];
  for (const root of roots) {
    let ids = relatedIds(project, [root.id]);
    for (let i = components.length - 1; i >= 0; i--) {
      const component = components[i];
      if ([...component.ids].some((id) => ids.has(id))) {
        ids = new Set([...ids, ...component.ids]);
        components.splice(i, 1);
      }
    }
    components.push({ ids });
  }
  return components.map(({ ids }) => {
    // Use every independent root of the expanded group, so the alignment
    // center does not depend on which member was clicked. Descendants follow
    // their supports without shifting the support's reference point.
    const members = project.objects.filter(
      (o) => ids.has(o.id) && !(o.parentId && ids.has(o.parentId)),
    );
    const center = { x: 0, y: 0, z: 0 };
    for (const o of members)
      for (const axis of ['x', 'y', 'z'] as const)
        center[axis] += o.position[axis] / members.length;
    return { ids, center };
  });
}
export function arrangeSelection(
  project: Project,
  selectedIds: string[],
  axis: 'x' | 'y',
  distribute: boolean,
): void {
  const units = selectionUnits(project, selectedIds).sort(
    (a, b) => a.center[axis] - b.center[axis],
  );
  const minimum = distribute ? 3 : 2;
  if (units.length < minimum)
    throw new Error(`Seleccioná al menos ${minimum} elementos o conjuntos independientes.`);
  assertEditable(
    project,
    units.flatMap((u) => [...u.ids]),
  );
  const first = units[0].center[axis],
    last = units.at(-1)!.center[axis];
  const mean = units.reduce((sum, u) => sum + u.center[axis], 0) / units.length;
  units.forEach((unit, index) => {
    const destination = distribute ? first + ((last - first) * index) / (units.length - 1) : mean;
    const delta = destination - unit.center[axis];
    for (const o of project.objects)
      if (unit.ids.has(o.id)) {
        o.position[axis] = roundMetric(o.position[axis] + delta);
        assertPhysical(o);
      }
  });
}
