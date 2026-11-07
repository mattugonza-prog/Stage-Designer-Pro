import type { Dimensions, Parameters, Project, SceneObject, ValidationIssue, Vec3 } from './types';

export const toThree = ({ x, y, z }: Vec3): [number, number, number] => [x, z, -y];
export const fromThree = ({ x, y, z }: Vec3): Vec3 => ({ x, y: -z, z: y });
export const radians = (degrees: number) => (degrees * Math.PI) / 180;
export const roundMetric = (value: number) => Math.round(value * 1e6) / 1e6;
export const snap = (value: number, step: number) =>
  step > 0 ? roundMetric(Math.round(value / step) * step) : value;
export function convertLength(value: number, from: 'm' | 'cm' | 'mm', to: 'm' | 'cm' | 'mm') {
  const scales = { m: 1, cm: 0.01, mm: 0.001 };
  return roundMetric((value * scales[from]) / scales[to]);
}
export function rotatePoint(point: { x: number; y: number }, angle: number) {
  const a = radians(angle),
    c = Math.cos(a),
    s = Math.sin(a);
  return { x: roundMetric(point.x * c - point.y * s), y: roundMetric(point.x * s + point.y * c) };
}
export interface ArrayCabinet {
  position: Vec3;
  angle: number;
  dimensions: Dimensions;
}
export function getArrayCabinets(
  parameters: Extract<Parameters, { type: 'line-array' }>,
): ArrayCabinet[] {
  // Stack connected cabinet centers along each cabinet's local height axis, then
  // recenter the complete footprint and place the lowest corner at z=0.
  const {
    count,
    cabinetWidth: width,
    cabinetDepth: depth,
    cabinetHeight: height,
    splayAngle,
  } = parameters;
  const boxes: ArrayCabinet[] = [];
  let y = 0,
    z = 0;
  for (let i = 0; i < count; i++) {
    const angle = i * splayAngle,
      a = radians(angle);
    if (i > 0) {
      const previous = radians((i - 1) * splayAngle);
      y += ((Math.sin(previous) + Math.sin(a)) * height) / 2;
      z += ((Math.cos(previous) + Math.cos(a)) * height) / 2;
    }
    boxes.push({ position: { x: 0, y, z }, angle, dimensions: { width, depth, height } });
  }
  if (!boxes.length) return [];
  const edges = boxes.map((box) => {
    const a = radians(box.angle);
    const halfY = (Math.abs(Math.cos(a)) * depth + Math.abs(Math.sin(a)) * height) / 2;
    const halfZ = (Math.abs(Math.sin(a)) * depth + Math.abs(Math.cos(a)) * height) / 2;
    return {
      minY: box.position.y - halfY,
      maxY: box.position.y + halfY,
      minZ: box.position.z - halfZ,
    };
  });
  const centerY =
    (Math.min(...edges.map((e) => e.minY)) + Math.max(...edges.map((e) => e.maxY))) / 2;
  const bottom = Math.min(...edges.map((e) => e.minZ));
  return boxes.map((box) => ({
    ...box,
    position: {
      x: 0,
      y: roundMetric(box.position.y - centerY),
      z: roundMetric(box.position.z - bottom),
    },
  }));
}
export function getDimensions(object: Pick<SceneObject, 'dimensions' | 'parameters'>): Dimensions {
  const p = object.parameters;
  if (!p) return { ...object.dimensions };
  if (p.type === 'led')
    return {
      width: roundMetric(p.columns * p.cabinetWidth),
      height: roundMetric(p.rows * p.cabinetHeight),
      depth: p.cabinetDepth,
    };
  const cabinets = getArrayCabinets(p);
  let minY = Infinity,
    maxY = -Infinity,
    top = 0;
  for (const box of cabinets) {
    const a = radians(box.angle);
    const halfY =
      (Math.abs(Math.cos(a)) * box.dimensions.depth +
        Math.abs(Math.sin(a)) * box.dimensions.height) /
      2;
    const halfZ =
      (Math.abs(Math.sin(a)) * box.dimensions.depth +
        Math.abs(Math.cos(a)) * box.dimensions.height) /
      2;
    minY = Math.min(minY, box.position.y - halfY);
    maxY = Math.max(maxY, box.position.y + halfY);
    top = Math.max(top, box.position.z + halfZ);
  }
  return { width: p.cabinetWidth, depth: roundMetric(maxY - minY), height: roundMetric(top) };
}
export function footprint(object: SceneObject): { x: number; y: number }[] {
  const { width, depth } = getDimensions(object);
  return [
    [-width / 2, -depth / 2],
    [width / 2, -depth / 2],
    [width / 2, depth / 2],
    [-width / 2, depth / 2],
  ].map(([x, y]) => {
    const p = rotatePoint({ x, y }, object.rotation);
    return { x: p.x + object.position.x, y: p.y + object.position.y };
  });
}
export function bounds(object: SceneObject) {
  const points = footprint(object),
    dims = getDimensions(object);
  return {
    minX: Math.min(...points.map((p) => p.x)),
    maxX: Math.max(...points.map((p) => p.x)),
    minY: Math.min(...points.map((p) => p.y)),
    maxY: Math.max(...points.map((p) => p.y)),
    minZ: object.position.z,
    maxZ: object.position.z + dims.height,
  };
}
export const distance = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
export function validateProject(project: Project): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const object of project.objects) {
    const b = bounds(object);
    if (
      b.minX < -project.stage.width / 2 - 0.0001 ||
      b.maxX > project.stage.width / 2 + 0.0001 ||
      b.minY < -0.0001 ||
      b.maxY > project.stage.depth + 0.0001
    ) {
      issues.push({
        id: `bounds-${object.id}`,
        severity: 'warning',
        objectId: object.id,
        message: `${object.label}: fuera de la plataforma. Revisar si su ubicación en el entorno es intencional.`,
      });
    }
    if (object.position.z < 0)
      issues.push({
        id: `floor-${object.id}`,
        severity: 'warning',
        objectId: object.id,
        message: `${object.label}: parte del equipo está debajo del piso del lugar.`,
      });
  }
  return issues;
}
