import { beforeEach, describe, expect, it } from 'vitest';
import { catalog } from '../catalog/data';
import { createObject, createProject } from './project';
import { canAttach, getDescendantIds, getLocalTransform } from './hierarchy';
import { useEditorStore } from './store';
import type { SceneObject, Vec3 } from './types';
import { getRotationPivotWorld } from './pivots';

const state = () => useEditorStore.getState();
const boxDefinition = catalog.find((definition) => definition.id === 'box')!;
function box(label: string, position: Vec3): SceneObject {
  return { ...createObject(boxDefinition, position), label };
}
function load(...objects: SceneObject[]) {
  const project = createProject('Relaciones físicas');
  project.objects = objects;
  state().setProject(project);
  return project;
}
function object(id: string) {
  return state().project!.objects.find((candidate) => candidate.id === id)!;
}
function select(...ids: string[]) {
  state().clearSelection();
  ids.forEach((id) => state().select(id, true));
}
beforeEach(() => state().setProject(createProject('Relaciones físicas')));

describe('pivotes de giro configurables', () => {
  it('gira alrededor de una esquina conservando su posición mundial y las dimensiones', () => {
    const base = box('Base', { x: 2, y: 3, z: 0.8 });
    base.rotationPivot = { x: 0.5, y: -0.5 };
    load(base);
    state().updateObject(base.id, { rotation: 90 });
    expect(object(base.id).position).toEqual({ x: 2, y: 2, z: 0.8 });
    expect(getRotationPivotWorld(object(base.id))).toEqual({ x: 2.5, y: 2.5, z: 0.8 });
    expect(object(base.id).dimensions).toEqual(base.dimensions);
    state().undo();
    expect(object(base.id)).toEqual(base);
  });

  it('conserva un pivote arbitrario en un marco inicialmente girado', () => {
    const base = box('Equipo girado', { x: 1.237, y: -2.456, z: 4.5 });
    base.rotation = 35;
    base.rotationPivot = { x: 1.234, y: -0.456 };
    load(base);
    const pivot = getRotationPivotWorld(base);
    state().updateObject(base.id, { rotation: 137.25 });
    const result = getRotationPivotWorld(object(base.id));
    expect(result.x).toBeCloseTo(pivot.x, 6);
    expect(result.y).toBeCloseTo(pivot.y, 6);
    expect(result.z).toBe(4.5);
    const angle = (137.25 * Math.PI) / 180;
    expect(object(base.id).position.x).toBeCloseTo(
      pivot.x - (1.234 * Math.cos(angle) + 0.456 * Math.sin(angle)),
      5,
    );
    expect(object(base.id).position.y).toBeCloseTo(
      pivot.y - (1.234 * Math.sin(angle) - 0.456 * Math.cos(angle)),
      5,
    );
  });

  it('padre, descendientes y grupo giran una sola vez alrededor del pivote del elemento principal', () => {
    const base = box('Base', { x: 0, y: 3, z: 0.8 });
    const child = box('Equipo', { x: 1, y: 3, z: 1.8 });
    const leaf = box('Hijo del equipo', { x: 1.5, y: 3, z: 2.8 });
    const sibling = box('Otro miembro', { x: 2, y: 3, z: 0.8 });
    base.rotationPivot = { x: 0.5, y: -0.5 };
    child.parentId = base.id;
    leaf.parentId = child.id;
    child.rotationPivot = { x: -1, y: 2 };
    base.groupId = sibling.groupId = 'group';
    load(base, child, leaf, sibling);
    select(base.id, child.id, sibling.id);
    state().updateObject(base.id, { rotation: 90 });
    expect(object(base.id).position).toEqual({ x: 0, y: 2, z: 0.8 });
    expect(object(child.id).position).toEqual({ x: 0, y: 3, z: 1.8 });
    expect(object(leaf.id).position).toEqual({ x: 0, y: 3.5, z: 2.8 });
    expect(object(sibling.id).position).toEqual({ x: 0, y: 4, z: 0.8 });
    expect(state().project!.objects.map((o) => o.rotation)).toEqual([90, 90, 90, 90]);
    expect(object(child.id).rotationPivot).toEqual(child.rotationPivot);
    expect(state().project!.objects.map((o) => o.dimensions)).toEqual(
      [base, child, leaf, sibling].map((o) => o.dimensions),
    );
    state().undo();
    expect(state().project!.objects).toEqual([base, child, leaf, sibling]);
  });

  it('una posición explícita prevalece sobre la compensación del pivote', () => {
    const base = box('Base', { x: 0, y: 3, z: 0.8 });
    base.rotationPivot = { x: 0.5, y: -0.5 };
    const child = box('Equipo', { x: 1, y: 3, z: 1.8 });
    child.parentId = base.id;
    load(base, child);
    state().updateObject(base.id, { position: { x: 8, y: 9, z: 2 }, rotation: 90 });
    expect(object(base.id).position).toEqual({ x: 8, y: 9, z: 2 });
    expect(object(child.id).position).toEqual({ x: 8, y: 10, z: 3 });
  });

  it.each([undefined, { x: 0, y: 0 }])(
    'el pivote central %j conserva el comportamiento anterior',
    (pivot) => {
      const base = box('Base', { x: 2, y: 3, z: 0.8 });
      if (pivot) base.rotationPivot = pivot;
      const child = box('Equipo', { x: 3, y: 3, z: 1.8 });
      child.parentId = base.id;
      load(base, child);
      state().updateObject(base.id, { rotation: 90 });
      expect(object(base.id).position).toEqual(base.position);
      expect(object(child.id).position).toEqual({ x: 2, y: 4, z: 1.8 });
    },
  );

  it('un descendiente bloqueado rechaza también la traslación causada por el pivote', () => {
    const base = box('Base', { x: 0, y: 3, z: 0.8 });
    const child = box('Equipo bloqueado', { x: 1, y: 3, z: 1.8 });
    base.rotationPivot = { x: 0.5, y: -0.5 };
    child.parentId = base.id;
    child.locked = true;
    load(base, child);
    const before = structuredClone(state().project);
    state().updateObject(base.id, { rotation: 90 });
    expect(state().project).toEqual(before);
    expect(state().history).toHaveLength(0);
    expect(state().notice).toMatch(/bloqueado/);
  });

  it.each(['target', 'child'] as const)(
    'rechaza el giro si el pivote lleva a %s fuera de límites',
    (target) => {
      const base = box('Base', { x: target === 'target' ? 10000 : 9999, y: 3, z: 0.8 });
      base.rotationPivot = { x: 0.5, y: 0 };
      const child = box('Equipo', { x: 9998, y: 3, z: 1.8 });
      child.parentId = base.id;
      load(base, child);
      const before = structuredClone(state().project);
      state().updateObject(base.id, { rotation: 180 });
      expect(state().project).toEqual(before);
      expect(state().history).toHaveLength(0);
      expect(state().notice).toMatch(/límites/);
    },
  );

  it('un gesto de giro usa un solo deshacer y conserva el pivote a través de sus pasos', () => {
    const base = box('Base', { x: 1, y: 3, z: 0.8 });
    base.rotationPivot = { x: 0.5, y: -0.5 };
    load(base);
    const pivot = getRotationPivotWorld(base);
    state().beginTransaction();
    for (const rotation of [15, 30, 45, 60, 75, 90]) state().updateObject(base.id, { rotation });
    state().commitTransaction();
    expect(getRotationPivotWorld(object(base.id))).toEqual(pivot);
    expect(state().history).toHaveLength(1);
    state().undo();
    expect(object(base.id)).toEqual(base);
  });
});

describe('anclajes y coordenadas relativas', () => {
  it('identifica todos los descendientes sin incluir al soporte ni otro conjunto', () => {
    const a = box('Base', { x: 0, y: 3, z: 0.8 });
    const b = box('Nivel', { x: 1, y: 3, z: 1.8 });
    const c = box('Equipo', { x: 1.5, y: 3, z: 2.8 });
    const separate = box('Independiente', { x: 4, y: 3, z: 0.8 });
    b.parentId = a.id;
    c.parentId = b.id;
    const project = load(a, b, c, separate);
    expect(getDescendantIds(project, a.id)).toEqual(new Set([b.id, c.id]));
    expect(getDescendantIds(project, b.id)).toEqual(new Set([c.id]));
    expect(getDescendantIds(project, separate.id).size).toBe(0);
  });

  it('impide autoanclaje, referencias ausentes y ciclos directos o indirectos', () => {
    const a = box('Base', { x: 0, y: 0, z: 0 });
    const b = box('Nivel', { x: 0, y: 0, z: 1 });
    const c = box('Equipo', { x: 0, y: 0, z: 2 });
    b.parentId = a.id;
    c.parentId = b.id;
    const project = load(a, b, c);
    expect(canAttach(project, a.id, a.id)).toBe(false);
    expect(canAttach(project, a.id, c.id)).toBe(false);
    expect(canAttach(project, b.id, c.id)).toBe(false);
    expect(canAttach(project, c.id, 'missing')).toBe(false);
    expect(canAttach(project, 'missing', a.id)).toBe(false);
    const before = structuredClone(state().project);
    state().attachObject(a.id, c.id, false);
    expect(state().project).toEqual(before);
    expect(state().notice).toBeTruthy();
  });

  it('anclar y desanclar conservan mundo; apoyar cambia solamente la altura inferior', () => {
    const support = box('Base', { x: 2, y: 3, z: 0.8 });
    support.rotation = 90;
    const child = box('Equipo', { x: 3.4, y: 4.6, z: 4.2 });
    child.rotation = 135;
    load(support, child);
    state().attachObject(child.id, support.id, false);
    expect(object(child.id).position).toEqual(child.position);
    expect(object(child.id).rotation).toBe(135);
    expect(object(child.id).parentId).toBe(support.id);
    state().attachObject(child.id, support.id, true);
    expect(object(child.id).position).toEqual({ x: 3.4, y: 4.6, z: 1.8 });
    const supported = structuredClone(object(child.id));
    state().detachObject(child.id);
    expect(object(child.id).parentId).toBeUndefined();
    expect(object(child.id).position).toEqual(supported.position);
    expect(object(child.id).rotation).toBe(supported.rotation);
  });

  it('convierte coordenadas locales en el marco girado del soporte sin alterar su geometría', () => {
    const support = box('Base', { x: 2, y: 3, z: 0.8 });
    support.rotation = 90;
    const child = box('Equipo', { x: 2, y: 5, z: 2.8 });
    child.rotation = 120;
    child.parentId = support.id;
    load(support, child);
    expect(getLocalTransform(state().project!, child.id)).toEqual({
      position: { x: 2, y: 0, z: 2 },
      rotation: 30,
    });
    state().updateLocalTransform(child.id, {
      position: { x: 1, y: 2, z: 3 },
      rotation: 60,
    });
    expect(object(child.id).position).toEqual({ x: 0, y: 4, z: 3.8 });
    expect(object(child.id).rotation).toBe(150);
    expect(getLocalTransform(state().project!, child.id)).toEqual({
      position: { x: 1, y: 2, z: 3 },
      rotation: 60,
    });
    expect(object(support.id)).toEqual(support);
    expect(object(child.id).dimensions).toEqual(child.dimensions);
  });

  it('propaga traslación, giro y altura por varios niveles una sola vez', () => {
    const support = box('Soporte no tarima', { x: 0, y: 3, z: 0.8 });
    const middle = box('Nivel intermedio', { x: 1, y: 3, z: 1.8 });
    middle.parentId = support.id;
    middle.rotation = 10;
    const leaf = box('Equipo', { x: 1.5, y: 3, z: 2.8 });
    leaf.parentId = middle.id;
    leaf.rotation = 20;
    load(support, middle, leaf);
    state().updateObject(support.id, {
      position: { x: 2, y: 4, z: 1.2 },
      rotation: 90,
      dimensions: { ...support.dimensions, height: 2 },
    });
    expect(object(middle.id).position).toEqual({ x: 2, y: 5, z: 3.2 });
    expect(object(leaf.id).position).toEqual({ x: 2, y: 5.5, z: 4.2 });
    expect(object(middle.id).rotation).toBe(100);
    expect(object(leaf.id).rotation).toBe(110);
    expect(object(middle.id).dimensions).toEqual(middle.dimensions);
    expect(object(leaf.id).dimensions).toEqual(leaf.dimensions);
    state().undo();
    expect(state().project!.objects).toEqual([support, middle, leaf]);
  });

  it('un nieto bloqueado impide toda la transformación y no agrega historial', () => {
    const support = box('Base', { x: 0, y: 3, z: 0.8 });
    const middle = box('Nivel', { x: 1, y: 3, z: 1.8 });
    const leaf = box('Equipo bloqueado', { x: 1, y: 3, z: 2.8 });
    middle.parentId = support.id;
    leaf.parentId = middle.id;
    leaf.locked = true;
    load(support, middle, leaf);
    const before = structuredClone(state().project);
    state().updateObject(support.id, {
      position: { x: 2, y: 4, z: 1.8 },
      rotation: 60,
      dimensions: { ...support.dimensions, height: 2 },
    });
    expect(state().project).toEqual(before);
    expect(state().history).toHaveLength(0);
    expect(state().notice).toBeTruthy();
  });

  it('rechaza atómicamente movimientos que sacarían un descendiente del rango numérico', () => {
    const support = box('Base', { x: 9998, y: 3, z: 0.8 });
    const child = box('Equipo', { x: 9999, y: 3, z: 1.8 });
    child.parentId = support.id;
    load(support, child);
    const before = structuredClone(state().project);
    state().updateObject(support.id, { position: { x: 10000, y: 3, z: 0.8 } });
    expect(state().project).toEqual(before);
    expect(state().history).toHaveLength(0);
    expect(state().notice).toBeTruthy();
  });

  it('padre e hijo multiseleccionados y agrupados reciben un solo desplazamiento', () => {
    const support = box('Base', { x: 0, y: 3, z: 0.8 });
    const child = box('Equipo', { x: 1, y: 3, z: 1.8 });
    child.parentId = support.id;
    support.groupId = child.groupId = 'same-group';
    load(support, child);
    select(support.id, child.id);
    state().updateObject(support.id, { position: { x: 2, y: 3, z: 0.8 } });
    expect(object(support.id).position.x).toBe(2);
    expect(object(child.id).position.x).toBe(3);
  });

  it('editar el marco local de un hijo no mueve a sus hermanos de grupo', () => {
    const support = box('Base', { x: 0, y: 3, z: 0.8 });
    const child = box('Equipo', { x: 1, y: 3, z: 1.8 });
    const sibling = box('Hermano', { x: -1, y: 3, z: 1.8 });
    const leaf = box('Hijo del equipo', { x: 1, y: 3, z: 2.8 });
    child.parentId = sibling.parentId = support.id;
    child.groupId = sibling.groupId = 'internal-group';
    leaf.parentId = child.id;
    load(support, child, sibling, leaf);
    select(child.id, sibling.id);
    state().updateLocalTransform(child.id, { position: { x: 2, y: 0, z: 1 } });
    expect(object(child.id).position).toEqual({ x: 2, y: 3, z: 1.8 });
    expect(object(leaf.id).position).toEqual({ x: 2, y: 3, z: 2.8 });
    expect(object(sibling.id)).toEqual(sibling);
    expect(object(support.id)).toEqual(support);
  });
});

describe('alineación y distribución de conjuntos', () => {
  it('el centro de un grupo no depende de cuál de sus miembros se seleccione', () => {
    const a = box('Extremo A', { x: 0, y: 3, z: 0.8 });
    const b = box('Extremo B', { x: 4, y: 3, z: 0.8 });
    const separate = box('Independiente', { x: 10, y: 3, z: 0.8 });
    a.groupId = b.groupId = 'group';
    load(a, b, separate);
    select(a.id, separate.id);
    state().alignSelected('x');
    const aligned = structuredClone(state().project!.objects);
    expect((object(a.id).position.x + object(b.id).position.x) / 2).toBe(
      object(separate.id).position.x,
    );
    expect(object(b.id).position.x - object(a.id).position.x).toBe(4);
    state().undo();
    select(b.id, separate.id);
    state().alignSelected('x');
    expect(state().project!.objects).toEqual(aligned);
  });
  it('distribuye centros con extremos fijos, preserva hijos y se deshace en un paso', () => {
    const a = box('Izquierda', { x: -3, y: 2, z: 0.8 });
    const b = box('Centro', { x: -2, y: 4, z: 0.8 });
    const c = box('Derecha', { x: 5, y: 1, z: 0.8 });
    const child = box('Hijo central', { x: -1.75, y: 4.5, z: 1.8 });
    child.parentId = b.id;
    load(a, b, c, child);
    select(a.id, b.id, c.id);
    state().distributeSelected('x');
    expect([object(a.id).position.x, object(b.id).position.x, object(c.id).position.x]).toEqual([
      -3, 1, 5,
    ]);
    expect(object(child.id).position).toEqual({ x: 1.25, y: 4.5, z: 1.8 });
    expect(state().project!.objects.map((item) => item.dimensions)).toEqual(
      [a, b, c, child].map((item) => item.dimensions),
    );
    expect(state().history).toHaveLength(1);
    state().undo();
    expect(state().project!.objects).toEqual([a, b, c, child]);
  });

  it('alinea soportes sin desplazar dos veces hijos seleccionados', () => {
    const a = box('Base A', { x: -3, y: 2, z: 0.8 });
    const b = box('Base B', { x: 5, y: 4, z: 0.8 });
    const child = box('Hijo A', { x: -2.5, y: 2, z: 1.8 });
    child.parentId = a.id;
    load(a, b, child);
    select(a.id, b.id, child.id);
    state().alignSelected('x');
    expect(object(a.id).position.x).toBe(object(b.id).position.x);
    expect(object(child.id).position.x - object(a.id).position.x).toBeCloseTo(0.5);
    expect(object(child.id).position.z).toBe(1.8);
  });

  it('una capa bloqueada impide movimiento, eliminación y edición parcial del conjunto', () => {
    const support = box('Base', { x: 0, y: 3, z: 0.8 });
    const child = box('Equipo', { x: 1, y: 3, z: 1.8 });
    child.parentId = support.id;
    load(support, child);
    state().addLayer('No mover');
    const layer = state().project!.layers.at(-1)!;
    select(child.id);
    state().assignSelectionToLayer(layer.id);
    state().updateLayer(layer.id, { locked: true });
    const before = structuredClone(state().project);
    const history = state().history.length;
    state().updateObject(child.id, { rotation: 45 });
    state().deleteSelected();
    state().updateObject(support.id, { position: { x: 1, y: 3, z: 0.8 } });
    expect(state().project).toEqual(before);
    expect(state().history).toHaveLength(history);
    expect(state().notice).toBeTruthy();
  });
});
