import { beforeEach, describe, expect, it } from 'vitest';
import { catalog } from '../catalog/data';
import { useEditorStore } from './store';
import { createDemoProject, createObject, createProject } from './project';
import { getDimensions } from './geometry';
import { validateProjectData } from '../storage/schema';

const state = () => useEditorStore.getState();
beforeEach(() => state().setProject(createProject('Pruebas')));
function addBox() {
  state().addObject(catalog.find((d) => d.id === 'box')!);
  return state().project!.objects.at(-1)!;
}
describe('estado compartido e historial', () => {
  it('cambiar escenario o vista no cambia tamaño, posición ni rotación de objetos', () => {
    const object = addBox();
    state().updateObject(object.id, { position: { x: 1.255, y: 2.742, z: 0.8 }, rotation: 32 });
    const before = structuredClone(state().project!.objects);
    state().updateStage({ width: 10, depth: 8 });
    state().setView('3d');
    state().setView('2d');
    expect(state().project!.objects).toEqual(before);
    expect(state().selectedIds).toEqual([object.id]);
  });
  it('las posiciones numéricas exactas prevalecen sobre snap', () => {
    const object = addBox();
    state().updateStage({ snap: true, gridStep: 0.5 });
    state().updateObject(object.id, { position: { x: 0.123, y: 1.456, z: 0.8 } });
    expect(state().project!.objects[0].position).toEqual({ x: 0.123, y: 1.456, z: 0.8 });
  });
  it('deshace una interacción de arrastre completa en un solo paso y permite rehacer', () => {
    const object = addBox(),
      before = structuredClone(state().project!.objects[0]);
    const originalHistory = state().history.length;
    state().beginTransaction();
    state().updateObject(object.id, { position: { x: 1, y: 3, z: 0.8 } });
    state().updateObject(object.id, { position: { x: 2, y: 3, z: 0.8 } });
    expect(state().history).toHaveLength(originalHistory);
    expect(state().project!.objects[0].position.x).toBe(2);
    state().commitTransaction();
    expect(state().history).toHaveLength(originalHistory + 1);
    state().undo();
    expect(state().project!.objects[0]).toEqual(before);
    state().redo();
    expect(state().project!.objects[0].position.x).toBe(2);
  });
  it('cancelar una transacción restaura el proyecto, estado de guardado y redo anteriores', () => {
    const object = addBox();
    state().updateObject(object.id, { rotation: 45 });
    state().undo();
    state().markSaved();
    const before = structuredClone(state().project),
      future = structuredClone(state().future);
    state().beginTransaction();
    state().updateObject(object.id, { rotation: 90 });
    state().cancelTransaction();
    expect(state().project).toEqual(before);
    expect(state().future).toEqual(future);
    expect(state().dirty).toBe(false);
    state().redo();
    expect(state().project!.objects[0].rotation).toBe(45);
  });
  it('un arrastre que vuelve al origen no agrega historial ni marca cambios', () => {
    const object = addBox();
    state().markSaved();
    const history = state().history.length;
    state().beginTransaction();
    state().updateObject(object.id, { rotation: 90 });
    state().updateObject(object.id, { rotation: 0 });
    state().commitTransaction();
    expect(state().history).toHaveLength(history);
    expect(state().dirty).toBe(false);
  });
  it.each(['duplicate', 'delete', 'add'] as const)(
    'el comando %s durante un arrastre sobrevive al desmontaje del control y tiene su propio deshacer',
    (command) => {
      const object = addBox();
      const before = structuredClone(state().project!.objects);
      const history = state().history.length;
      state().beginTransaction();
      state().updateObject(object.id, { position: { ...object.position, x: 2 } });
      if (command === 'duplicate') state().duplicateSelected();
      else if (command === 'delete') state().deleteSelected();
      else addBox();
      expect(state().transactionActive).toBe(false);
      const after = structuredClone(state().project!.objects);
      expect(after).toHaveLength(command === 'delete' ? 0 : 2);
      if (command !== 'delete') expect(after[0]).toEqual(before[0]);
      state().cancelTransaction(); // cleanup of the previous 2D/3D gesture
      expect(state().project!.objects).toEqual(after);
      expect(state().selectedIds.every((id) => after.some((o) => o.id === id))).toBe(true);
      expect(state().history).toHaveLength(history + 1);
      state().undo();
      expect(state().project!.objects).toEqual(before);
    },
  );
  it('no mueve ni borra equipos bloqueados, pero permite desbloquearlos', () => {
    const object = addBox();
    state().updateObject(object.id, { locked: true });
    const before = structuredClone(state().project!.objects[0]);
    state().updateObject(object.id, { position: { x: 12, y: 12, z: 3 } });
    state().deleteSelected();
    expect(state().project!.objects[0]).toEqual(before);
    state().updateObject(object.id, { locked: false });
    state().deleteSelected();
    expect(state().project!.objects).toHaveLength(0);
  });
  it('los grupos mantienen distancias y tamaños al moverse y rotar', () => {
    const a = addBox(),
      b = addBox();
    state().updateObject(b.id, { position: { x: 2, y: 3, z: 0.8 } });
    state().select(a.id);
    state().select(b.id, true);
    state().groupSelected();
    state().select(a.id);
    state().updateObject(a.id, { position: { x: 1, y: 3, z: 0.8 } });
    expect(state().project!.objects[1].position.x).toBe(3);
    state().updateObject(a.id, { rotation: 90 });
    expect(state().project!.objects[1].position).toEqual({ x: 1, y: 5, z: 0.8 });
    expect(state().project!.objects.map(getDimensions)).toEqual([a.dimensions, b.dimensions]);
  });
  it('los descendientes acompañan posición, rotación y elevación de tarima', () => {
    const p = createProject(),
      support = createObject(catalog.find((d) => d.id === 'riser')!, { x: 0, y: 3, z: 0.8 });
    const child = createObject(catalog.find((d) => d.id === 'box')!, { x: 1, y: 3, z: 1.2 });
    child.parentId = support.id;
    p.objects.push(support, child);
    state().setProject(p);
    state().updateObject(support.id, { rotation: 90 });
    expect(state().project!.objects[1].position).toEqual({ x: 0, y: 4, z: 1.2 });
    state().updateObject(support.id, {
      position: { x: 2, y: 3, z: 0.8 },
      dimensions: { ...support.dimensions, height: 0.7 },
    });
    expect(state().project!.objects[1].position.x).toBe(2);
    expect(state().project!.objects[1].position.z).toBeCloseTo(1.5);
    expect(state().project!.objects[1].dimensions).toEqual(child.dimensions);
  });
  it('duplicar conjuntos asigna IDs nuevos y remapea soporte interno sin compartir datos', () => {
    const p = createDemoProject(),
      support = p.objects.find((o) => o.definition.kind === 'riser')!;
    state().setProject(p);
    state().select(support.id);
    state().duplicateSelected();
    const copies = state().project!.objects.filter((o) => state().selectedIds.includes(o.id));
    expect(copies).toHaveLength(3);
    expect(new Set(state().project!.objects.map((o) => o.id)).size).toBe(p.objects.length + 3);
    const newSupport = copies.find((o) => o.definition.kind === 'riser')!;
    expect(copies.filter((o) => o.parentId).every((o) => o.parentId === newSupport.id)).toBe(true);
    state().updateObject(newSupport.id, { dimensions: { width: 3, depth: 3, height: 0.6 } });
    expect(state().project!.objects.find((o) => o.id === support.id)!.dimensions).toEqual(
      support.dimensions,
    );
    expect(() => validateProjectData(state().project)).not.toThrow();
  });
  it('al borrar equipo conserva fuentes y limpia referencias rotas', () => {
    const p = createDemoProject(),
      source = p.audioSources[0];
    state().setProject(p);
    state().select(source.objectId!);
    state().deleteSelected();
    expect(state().project!.audioSources[0].id).toBe(source.id);
    expect(state().project!.audioSources[0].objectId).toBeUndefined();
    expect(() => validateProjectData(state().project)).not.toThrow();
  });
  it('rechaza valores físicos no finitos y parámetros imposibles sin corromper el estado', () => {
    const o = addBox(),
      before = structuredClone(state().project);
    state().updateObject(o.id, { dimensions: { width: NaN, height: 1, depth: 1 } });
    state().updateStage({ width: -1 });
    expect(state().project).toEqual(before);
    state().addObject(catalog.find((d) => d.id === 'led')!);
    const led = state().project!.objects.at(-1)!;
    if (led.parameters?.type !== 'led') throw new Error('Expected LED');
    state().updateObject(led.id, { parameters: { ...led.parameters, columns: 0 } });
    expect(state().project!.objects.at(-1)).toEqual(led);
  });
  it('un guardado antiguo no elimina la marca de cambios recientes', () => {
    const o = addBox(),
      savedAt = state().project!.updatedAt;
    state().updateObject(o.id, { rotation: 25 });
    state().markSaved(savedAt);
    expect(state().dirty).toBe(true);
    state().markSaved(state().project!.updatedAt);
    expect(state().dirty).toBe(false);
  });
});
