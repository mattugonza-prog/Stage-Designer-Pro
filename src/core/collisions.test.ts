import { describe, expect, it } from 'vitest';
import { catalog } from '../catalog/data';
import { createObject, createProject } from './project';
import { bounds, getArrayCabinets } from './geometry';
import { detectInterferences, INTERFERENCE_TOLERANCE } from './collisions';
import type { Dimensions, SceneObject, Vec3 } from './types';

const definition = catalog.find((d) => d.id === 'box')!;
function box(id: string, position: Vec3 = { x: 0, y: 3, z: 0.8 }, dimensions?: Dimensions) {
  const object = createObject(definition, position);
  object.id = id;
  object.label = id;
  if (dimensions) object.dimensions = dimensions;
  return object;
}
function project(...objects: SceneObject[]) {
  const p = createProject('Interferencias');
  p.objects = objects;
  return p;
}

describe('interferencias de volúmenes físicos', () => {
  it('detecta un par superpuesto una sola vez sin modificar el proyecto', () => {
    const p = project(box('A'), box('B', { x: 0.25, y: 3, z: 0.8 }));
    const before = structuredClone(p);
    const report = detectInterferences(p);
    expect(report.total).toBe(1);
    expect(report.truncated).toBe(false);
    expect(report.issues[0]).toMatchObject({ kind: 'overlap', objectIds: ['A', 'B'] });
    expect(p).toEqual(before);
  });

  it('excluye contactos de caras y pequeñas tolerancias sin esconder penetraciones reales', () => {
    const a = box('A'),
      b = box('B', { x: 1, y: 3, z: 0.8 });
    const p = project(a, b);
    expect(detectInterferences(p).total).toBe(0);
    b.position.x = 1 - INTERFERENCE_TOLERANCE / 2;
    expect(detectInterferences(p).total).toBe(0);
    b.position.x = 1 - INTERFERENCE_TOLERANCE * 2;
    expect(detectInterferences(p).total).toBe(1);
  });

  it('una proyección XY superpuesta no colisiona si los intervalos de altura están separados', () => {
    const a = box('A'),
      b = box('B', { x: 0, y: 3, z: 2 });
    const p = project(a, b);
    expect(detectInterferences(p).total).toBe(0);
    b.position.z = 1.8;
    expect(detectInterferences(p).total).toBe(0);
    b.position.z = 1.79;
    expect(detectInterferences(p).total).toBe(1);
  });

  it('SAT descarta falsas superposiciones de las cajas AABB de dos equipos girados', () => {
    const dimensions = { width: 4, depth: 0.2, height: 1 };
    const a = box('A', { x: 0, y: 3, z: 0.8 }, dimensions);
    const b = box('B', { x: 0, y: 3.4, z: 0.8 }, dimensions);
    a.rotation = b.rotation = 45;
    expect(bounds(a).maxY).toBeGreaterThan(bounds(b).minY);
    expect(bounds(a).maxX).toBeGreaterThan(bounds(b).minX);
    const p = project(a, b);
    expect(detectInterferences(p).total).toBe(0);
    b.position.y = 3.2;
    expect(detectInterferences(p).total).toBe(1);
  });

  it('un anclaje no oculta penetraciones, pero el apoyo exacto en tarima no es interferencia', () => {
    const support = box('Tarima'),
      child = box('Equipo', { x: 0, y: 3, z: 1.8 });
    child.parentId = support.id;
    const p = project(support, child);
    expect(detectInterferences(p).total).toBe(0);
    child.position.z = 1.7;
    expect(detectInterferences(p).issues[0].objectIds).toEqual(['Equipo', 'Tarima']);
  });

  it('incluye objetos ocultos y bloqueados porque mantienen su volumen físico', () => {
    const a = box('A'),
      b = box('B');
    a.hidden = b.locked = true;
    const p = project(a, b);
    p.layers.find((l) => l.id === a.layerId)!.hidden = true;
    expect(detectInterferences(p).total).toBe(1);
  });

  it('detecta penetración de plataforma sólo si hay solapamiento físico en sus tres ejes', () => {
    const a = box('A', { x: 4.6, y: 3, z: 0.4 });
    const p = project(a);
    expect(detectInterferences(p).total).toBe(0);
    a.position.x = 4.4;
    expect(detectInterferences(p).issues[0]).toMatchObject({
      kind: 'stage-penetration',
      objectIds: ['A'],
    });
    a.position.z = 0.8;
    expect(detectInterferences(p).total).toBe(0);
    a.position.z = -2;
    expect(detectInterferences(p).total).toBe(0);
  });

  it('una plataforma de altura cero no produce una colisión por mero contacto con el piso', () => {
    const p = project(box('A', { x: 0, y: 3, z: 0 }));
    p.stage.height = 0;
    expect(detectInterferences(p).total).toBe(0);
  });

  it('el line array comprueba gabinetes inclinados y no rellena espacios vacíos de su envolvente', () => {
    const array = createObject(catalog.find((d) => d.id === 'line-array')!, { x: 0, y: 3, z: 0.8 });
    array.id = 'Array';
    if (array.parameters?.type !== 'line-array') throw new Error('Expected array');
    array.parameters.splayAngle = 15;
    const tiny = box(
      'Equipo pequeño',
      { x: 0, y: 3.5, z: 0.9 },
      { width: 0.05, depth: 0.05, height: 0.05 },
    );
    const p = project(array, tiny);
    const arrayBounds = bounds(array),
      tinyBounds = bounds(tiny);
    expect(tinyBounds.minY).toBeGreaterThan(arrayBounds.minY);
    expect(tinyBounds.maxY).toBeLessThan(arrayBounds.maxY);
    expect(tinyBounds.minZ).toBeGreaterThan(arrayBounds.minZ);
    expect(tinyBounds.maxZ).toBeLessThan(arrayBounds.maxZ);
    expect(detectInterferences(p).total).toBe(0);
    const cabinet = getArrayCabinets(array.parameters).at(-1)!;
    tiny.position.y = array.position.y + cabinet.position.y;
    tiny.position.z = array.position.z + cabinet.position.z - tiny.dimensions.height / 2;
    expect(detectInterferences(p).issues[0].objectIds).toEqual(['Array', 'Equipo pequeño']);
    array.rotation = 90;
    tiny.position.x = array.position.x - cabinet.position.y;
    tiny.position.y = array.position.y;
    expect(detectInterferences(p).total).toBe(1);
  });

  it('el resultado y sus firmas son independientes del orden de los objetos', () => {
    const p = project(box('C'), box('A'), box('B'));
    const before = detectInterferences(p);
    p.objects.reverse();
    expect(detectInterferences(p)).toEqual(before);
    expect(new Set(before.issues.map((i) => i.id)).size).toBe(3);
  });

  it('sólo cambios de geometría invalidan una revisión de superposición de equipos', () => {
    const a = box('A'),
      b = box('B');
    const p = project(a, b);
    const signature = detectInterferences(p).issues[0].signature;
    a.label = 'Otro nombre';
    a.hidden = true;
    a.locked = true;
    a.parentId = b.id;
    delete a.layerId;
    p.stage.width = 20;
    expect(detectInterferences(p).issues[0].signature).toBe(signature);
    a.rotation = 360;
    expect(detectInterferences(p).issues[0].signature).toBe(signature);
    a.position.x = 0.05;
    expect(detectInterferences(p).issues[0].signature).not.toBe(signature);
    a.position.x = 0;
    a.dimensions.width = 1.1;
    expect(detectInterferences(p).issues[0].signature).not.toBe(signature);
  });

  it('la firma de penetración incluye medidas de la plataforma, pero no su cuadrícula', () => {
    const p = project(box('A', { x: 0, y: 3, z: 0.4 }));
    const signature = detectInterferences(p).issues[0].signature;
    p.stage.gridStep = 0.1;
    p.stage.color = '#ffffff';
    expect(detectInterferences(p).issues[0].signature).toBe(signature);
    p.stage.height = 1;
    expect(detectInterferences(p).issues[0].signature).not.toBe(signature);
  });

  it('limita filas de salida con un total explícito, estable y sin saltarse el cálculo', () => {
    const p = project(...Array.from({ length: 12 }, (_, i) => box(String(i).padStart(2, '0'))));
    const report = detectInterferences(p, 5);
    expect(report.total).toBe(66);
    expect(report.issues).toHaveLength(5);
    expect(report.truncated).toBe(true);
    p.objects.reverse();
    expect(detectInterferences(p, 5)).toEqual(report);
    expect(detectInterferences(p, 0)).toEqual({ issues: [], total: 66, truncated: true });
  });
});
