import { describe, expect, it } from 'vitest';
import {
  bounds,
  convertLength,
  distance,
  footprint,
  fromThree,
  getArrayCabinets,
  getDimensions,
  rotatePoint,
  snap,
  toThree,
  validateProject,
} from './geometry';
import { createDemoProject, createObject, createProject } from './project';
import { catalog } from '../catalog/data';

describe('geometría física compartida', () => {
  it('convierte metros entre los ejes del proyecto y Three sin perder altura ni orientación', () => {
    const point = { x: 3.125, y: 6.21, z: 0.8 };
    const [x, y, z] = toThree(point);
    expect([x, y, z]).toEqual([3.125, 0.8, -6.21]);
    expect(fromThree({ x, y, z })).toEqual(point);
  });
  it('centraliza unidades milimétricas y permite posiciones fuera de la cuadrícula', () => {
    expect(convertLength(1255, 'mm', 'm')).toBe(1.255);
    expect(convertLength(0.8, 'm', 'cm')).toBe(80);
    expect(snap(1.255, 0.25)).toBe(1.25);
    expect(distance({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 })).toBe(5);
  });
  it('calcula huellas rotadas usando medidas físicas y conserva su centro', () => {
    const object = createObject(catalog.find((d) => d.id === 'keyboard')!, { x: 2, y: 3, z: 0.8 });
    object.rotation = 90;
    expect(rotatePoint({ x: 1, y: 0 }, 90)).toEqual({ x: 0, y: 1 });
    const b = bounds(object);
    expect(b.maxX - b.minX).toBeCloseTo(0.45);
    expect(b.maxY - b.minY).toBeCloseTo(1.25);
    expect(footprint(object).reduce((sum, p) => sum + p.x, 0) / 4).toBe(2);
  });
  it('deriva la pantalla 5 × 2,5 m de 50 gabinetes con profundidad física', () => {
    const led = createObject(catalog.find((d) => d.id === 'led')!, { x: 0, y: 6, z: 1 });
    expect(getDimensions(led)).toEqual({ width: 5, depth: 0.1, height: 2.5 });
    if (led.parameters?.type !== 'led') throw new Error('Expected LED');
    led.parameters.columns = 12;
    expect(getDimensions(led)).toEqual({ width: 6, depth: 0.1, height: 2.5 });
  });
  it('construye cajas individuales y mide el volumen real del arreglo curvo', () => {
    const object = createObject(catalog.find((d) => d.id === 'line-array')!, { x: 0, y: 0, z: 0 });
    if (object.parameters?.type !== 'line-array') throw new Error('Expected array');
    expect(getArrayCabinets(object.parameters)).toHaveLength(6);
    expect(getDimensions(object)).toEqual({ width: 0.7, depth: 0.4, height: 1.8 });
    object.parameters.count = 8;
    object.parameters.splayAngle = 3;
    const cabinets = getArrayCabinets(object.parameters),
      dims = getDimensions(object);
    expect(cabinets).toHaveLength(8);
    expect(cabinets[7].angle).toBe(21);
    expect(dims.depth).toBeGreaterThan(0.4);
    expect(dims.height).toBeGreaterThan(2);
    for (const cabinet of cabinets) {
      const a = (cabinet.angle * Math.PI) / 180;
      const halfZ = (Math.abs(Math.sin(a)) * 0.4 + Math.abs(Math.cos(a)) * 0.3) / 2;
      expect(cabinet.position.z - halfZ).toBeGreaterThanOrEqual(-0.000001);
      expect(cabinet.position.z + halfZ).toBeLessThanOrEqual(dims.height + 0.000001);
    }
  });
  it('mantiene los dos PA independientes y señala ubicaciones externas sin corregirlas', () => {
    const p = createDemoProject(),
      arrays = p.objects.filter((o) => o.parameters?.type === 'line-array');
    expect(arrays).toHaveLength(2);
    if (arrays[0].parameters?.type !== 'line-array' || arrays[1].parameters?.type !== 'line-array')
      throw new Error('Expected arrays');
    arrays[0].parameters.count = 8;
    expect(arrays[1].parameters.count).toBe(6);
    const before = structuredClone(p.objects),
      issues = validateProject(p);
    expect(issues.some((i) => i.objectId === arrays[0].id && i.severity === 'warning')).toBe(true);
    expect(p.objects).toEqual(before);
    expect(validateProject(createProject())).toEqual([]);
  });
});
