import { describe, expect, it } from 'vitest';
import { catalog } from '../catalog/data';
import { createObject, createProject } from './project';
import { createSnapContext, snapToGuides, snapDragPosition } from './snapping';
import { bounds } from './geometry';
import type { SceneObject } from './types';

const box = (id: string, x: number, y: number): SceneObject => ({
  ...createObject(catalog.find((d) => d.id === 'box')!, { x, y, z: 0.8 }),
  id,
});
function setup(...objects: SceneObject[]) {
  return { ...createProject(), objects };
}

describe('guías magnéticas métricas', () => {
  it('alinea centros con referencias de equipo y conserva exacto el eje sin coincidencia', () => {
    const a = box('moving', 20, 20),
      b = box('reference', 23, 25);
    const project = setup(a, b),
      original = structuredClone(project);
    const result = snapToGuides(
      createSnapContext(project, a.id, [a.id]),
      { x: 23.045, y: 20.123 },
      0.01,
    );
    expect(result.position).toEqual({ x: 23, y: 20.123 });
    expect(result.guides).toEqual([
      expect.objectContaining({
        axis: 'x',
        value: 23,
        movingFeature: 'center',
        targetFeature: 'center',
        targetId: b.id,
      }),
    ]);
    expect(project).toEqual(original);
  });
  it('usa los bordes de huellas giradas, no dimensiones sin rotación', () => {
    const a = box('moving', 20, 20),
      b = box('reference', 25, 25);
    a.dimensions = { width: 3, depth: 1, height: 1 };
    a.rotation = 45;
    const extent = bounds(a).maxX - a.position.x;
    const proposed = 24.5 - extent + 0.03;
    const result = snapToGuides(
      createSnapContext(setup(a, b), a.id, [a.id]),
      { x: proposed, y: 20 },
      0.01,
    );
    expect(result.position.x + extent).toBeCloseTo(24.5, 6);
    expect(result.guides[0]).toMatchObject({ movingFeature: 'max', targetFeature: 'min' });
    expect(a.dimensions).toEqual({ width: 3, depth: 1, height: 1 });
  });
  it('expande grupos y descendientes y los excluye de las referencias estáticas', () => {
    const a = box('a', 20, 20),
      b = box('b', 22, 20),
      child = box('child', 22, 21),
      target = box('target', 25, 25);
    a.groupId = b.groupId = 'group';
    child.parentId = b.id;
    const context = createSnapContext(setup(a, b, child, target), a.id, [a.id])!;
    expect(context.movingBounds).toEqual({ minX: 19.5, maxX: 22.5, minY: 19.5, maxY: 21.5 });
    expect(context.references.x.map((r) => r.targetId)).not.toContain(b.id);
    expect(context.references.x.map((r) => r.targetId)).not.toContain(child.id);
    const result = snapToGuides(context, { x: 24.04, y: 20.123 }, 0.01);
    expect(result.position.x).toBe(24); // aggregate center at x25
    expect(result.guides.find((g) => g.axis === 'x')).toMatchObject({
      value: 25,
      movingFeature: 'center',
    });
  });
  it('la tolerancia mantiene siete píxeles al cambiar de zoom', () => {
    const a = box('a', 20, 20),
      target = box('target', 25, 25);
    const context = createSnapContext(setup(a, target), a.id, [a.id]);
    expect(snapToGuides(context, { x: 25.06, y: 20 }, 0.01).position.x).toBe(25);
    expect(snapToGuides(context, { x: 25.06, y: 20 }, 0.005).guides).toHaveLength(0);
    expect(snapToGuides(context, { x: 25.03, y: 20 }, 0.005).position.x).toBe(25);
  });
  it('no usa equipos ocultos ni capas ocultas, pero permite referencias bloqueadas', () => {
    const a = box('a', 20, 20),
      hidden = box('hidden', 23, 25),
      layerHidden = box('layer-hidden', 26, 25),
      locked = box('locked', 29, 25);
    hidden.hidden = true;
    layerHidden.layerId = 'hidden-layer';
    locked.locked = true;
    const project = setup(a, hidden, layerHidden, locked);
    project.layers.push({ id: 'hidden-layer', name: 'Oculta', hidden: true, locked: false });
    const context = createSnapContext(project, a.id, [a.id]);
    expect(snapToGuides(context, { x: 23.04, y: 20 }, 0.01).guides).toHaveLength(0);
    expect(snapToGuides(context, { x: 26.04, y: 20 }, 0.01).guides).toHaveLength(0);
    expect(snapToGuides(context, { x: 29.04, y: 20 }, 0.01).position.x).toBe(29);
  });
  it('incluye ejes centrales y bordes de la plataforma', () => {
    const a = box('a', 20, 20),
      context = createSnapContext(setup(a), a.id, [a.id]);
    expect(snapToGuides(context, { x: 0.04, y: 3.04 }, 0.01).position).toEqual({ x: 0, y: 3 });
    const edge = snapToGuides(context, { x: 4.46, y: 20 }, 0.01);
    expect(edge.position.x).toBe(4.5);
    expect(edge.guides[0]).toMatchObject({
      targetId: 'stage',
      targetFeature: 'max',
      movingFeature: 'min',
    });
  });
  it('resuelve empates determinísticamente sin depender del orden de objetos', () => {
    const a = box('a', 20, 20),
      first = box('first', 24.95, 25),
      second = box('second', 25.05, 25);
    const forward = snapToGuides(
      createSnapContext(setup(a, first, second), a.id, [a.id]),
      { x: 25, y: 20 },
      0.01,
    );
    const reverse = snapToGuides(
      createSnapContext(setup(second, first, a), a.id, [a.id]),
      { x: 25, y: 20 },
      0.01,
    );
    expect(reverse).toEqual(forward);
    expect(forward.position.x).toBe(24.95);
    expect(forward.guides[0].targetId).toBe('first');
  });
  it('un contexto ausente o una escala inválida conserva la propuesta sin guías', () => {
    const a = box('a', 20, 20),
      context = createSnapContext(setup(a), a.id, [a.id]);
    const point = { x: 0.01, y: 3.01 };
    expect(createSnapContext(setup(a), 'missing', [])).toBeNull();
    for (const scale of [0, -1, NaN])
      expect(snapToGuides(context, point, scale)).toEqual({ position: point, guides: [] });
    expect(snapToGuides(null, point, 0.01)).toEqual({ position: point, guides: [] });
  });
  it('prioriza la guía sobre la cuadrícula sólo en el eje coincidente y extiende su trazo al resultado final', () => {
    const a = box('a', 20, 20),
      target = box('target', 23.13, 25);
    const context = createSnapContext(setup(a, target), a.id, [a.id]);
    const result = snapDragPosition(context, { x: 23.17, y: 20.23 }, 0.01, {
      guidesEnabled: true,
      gridStep: 0.5,
    });
    expect(result.position).toEqual({ x: 23.13, y: 20 });
    expect(result.guides).toEqual([expect.objectContaining({ axis: 'x', from: 19.5, to: 25.5 })]);
  });
  it('Alt omite guías y cuadrícula; desactivar guías conserva el ajuste de cuadrícula', () => {
    const a = box('a', 20, 20),
      target = box('target', 23.13, 25);
    const context = createSnapContext(setup(a, target), a.id, [a.id]);
    const position = { x: 23.17, y: 20.23 };
    expect(
      snapDragPosition(context, position, 0.01, {
        guidesEnabled: true,
        gridStep: 0.5,
        bypass: true,
      }),
    ).toEqual({ position, guides: [] });
    expect(
      snapDragPosition(context, position, 0.01, { guidesEnabled: false, gridStep: 0.5 }),
    ).toEqual({ position: { x: 23, y: 20 }, guides: [] });
    expect(snapDragPosition(context, position, 0.01, { guidesEnabled: false })).toEqual({
      position,
      guides: [],
    });
  });
});
