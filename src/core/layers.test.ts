import { beforeEach, describe, expect, it } from 'vitest';
import { createDemoProject } from './project';
import { isObjectHidden, isObjectLocked } from './layers';
import { useEditorStore } from './store';

const state = () => useEditorStore.getState();
beforeEach(() => state().setProject(createDemoProject()));
describe('capas y operaciones de edición', () => {
  it('ocultar no modifica las posiciones ni los canales; sus hijos en otra capa permanecen visibles', () => {
    const before = structuredClone(state().project!);
    const layer = before.layers.find((l) => l.name === 'Escenario')!;
    state().updateLayer(layer.id, { hidden: true });
    const p = state().project!;
    expect(p.objects).toEqual(before.objects);
    expect(p.audioProfiles).toEqual(before.audioProfiles);
    expect(isObjectHidden(p, p.objects[0])).toBe(true);
    expect(isObjectHidden(p, p.objects[1])).toBe(false);
    state().undo();
    expect(state().project!.layers).toEqual(before.layers);
  });
  it('el bloqueo de capa no sustituye bloqueos individuales', () => {
    const p = state().project!,
      o = p.objects[0];
    state().updateObject(o.id, { locked: true });
    state().updateLayer(o.layerId!, { locked: true });
    state().updateLayer(o.layerId!, { locked: false });
    const next = state().project!;
    expect(isObjectLocked(next, next.objects[0])).toBe(true);
    state().updateObject(o.id, { locked: false });
    expect(isObjectLocked(state().project!, state().project!.objects[0])).toBe(false);
  });
  it('eliminar conserva objetos y relaciones; undo recupera asignaciones', () => {
    const before = structuredClone(state().project!),
      layer = before.layers[0];
    state().removeLayer(layer.id);
    expect(state().project!.objects).toHaveLength(before.objects.length);
    expect(state().project!.objects.filter((o) => o.layerId === layer.id)).toHaveLength(0);
    expect(state().project!.audioProfiles).toEqual(before.audioProfiles);
    state().undo();
    expect(state().project!.objects).toEqual(before.objects);
    expect(state().project!.layers).toEqual(before.layers);
  });
  it('crear, renombrar, asignar y seleccionar no permite referencias inválidas', () => {
    state().addLayer('Mi montaje');
    const layer = state().project!.layers.at(-1)!;
    const o = state().project!.objects[0];
    state().select(o.id);
    state().assignSelectionToLayer(layer.id);
    state().clearSelection();
    state().selectLayer(layer.id);
    expect(state().selectedIds).toEqual([o.id]);
    state().updateLayer(layer.id, { name: 'Montaje principal' });
    expect(state().project!.layers.at(-1)!.name).toBe('Montaje principal');
    state().assignSelectionToLayer('missing');
    expect(state().project!.objects[0].layerId).toBe(layer.id);
    expect(state().notice).toBeTruthy();
  });
  it('ocultar durante un arrastre cancela sólo ese gesto y registra la visibilidad por separado', () => {
    const before = structuredClone(state().project!),
      o = before.objects[0];
    state().select(o.id);
    state().beginTransaction();
    state().updateObject(o.id, { position: { ...o.position, x: 2 } });
    state().updateLayer(o.layerId!, { hidden: true });
    expect(state().transactionActive).toBe(false);
    expect(state().project!.objects).toEqual(before.objects);
    expect(state().history).toHaveLength(1);
    expect(state().selectedIds).toHaveLength(0);
    state().undo();
    expect(state().project!.layers).toEqual(before.layers);
  });
  it('la edición interna conserva los hermanos agrupados y arrastra sólo los descendientes propios', () => {
    const p = structuredClone(state().project!),
      root = p.objects[0],
      child = p.objects[1],
      sibling = p.objects[3];
    root.groupId = sibling.groupId = 'group';
    state().setProject(p);
    state().select(root.id);
    state().select(sibling.id, true);
    state().updateObjectOnly(root.id, { position: { ...root.position, x: 1 } });
    expect(state().project!.objects[3]).toEqual(sibling);
    expect(state().project!.objects[1].position.x).toBe(child.position.x + 1);
  });
});
