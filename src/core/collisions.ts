import { getArrayCabinets, getDimensions, radians, roundMetric } from './geometry';
import type { Dimensions, Project, SceneObject, Vec3 } from './types';

/** Penetrations of 0.1 mm or less are treated as surface contact, in world metres. */
export const INTERFERENCE_TOLERANCE = 0.0001;
export const DEFAULT_INTERFERENCE_LIMIT = 500;

export interface Interference {
  id: string;
  objectIds: string[];
  kind: 'overlap' | 'stage-penetration';
  message: string;
  /** Geometry-only fingerprint. Changes of label, visibility or locking do not invalidate a review. */
  signature: string;
}

export interface InterferenceReport {
  issues: Interference[];
  /** Complete count, including issues beyond the display limit. */
  total: number;
  truncated: boolean;
}

type Axes = [Vec3, Vec3, Vec3];
interface Box {
  center: Vec3;
  axes: Axes;
  half: [number, number, number];
  bounds: Bounds;
}
interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}
interface Body {
  object: SceneObject;
  boxes: Box[];
  bounds: Bounds;
  signature: unknown[];
}

const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const normalizedAngle = (degrees: number) => roundMetric(((degrees % 360) + 360) % 360);

function makeBox(center: Vec3, dimensions: Dimensions, yaw: number, tilt = 0): Box {
  const y = radians(yaw),
    a = radians(tilt),
    c = Math.cos(y),
    s = Math.sin(y),
    ca = Math.cos(a),
    sa = Math.sin(a);
  // Project axes correspond to the scene's yaw and the cabinet's Three X rotation.
  const axes: Axes = [
    { x: c, y: s, z: 0 },
    { x: -s * ca, y: c * ca, z: -sa },
    { x: -s * sa, y: c * sa, z: ca },
  ];
  const half: Box['half'] = [dimensions.width / 2, dimensions.depth / 2, dimensions.height / 2];
  const radius = (axis: keyof Vec3) =>
    axes.reduce((sum, direction, index) => sum + Math.abs(direction[axis]) * half[index], 0);
  const rx = radius('x'),
    ry = radius('y'),
    rz = radius('z');
  return {
    center,
    axes,
    half,
    bounds: {
      minX: center.x - rx,
      maxX: center.x + rx,
      minY: center.y - ry,
      maxY: center.y + ry,
      minZ: center.z - rz,
      maxZ: center.z + rz,
    },
  };
}

function bodyFor(object: SceneObject): Body {
  const yaw = normalizedAngle(object.rotation);
  const params = object.parameters;
  const dimensions = getDimensions(object);
  const boxes =
    params?.type === 'line-array'
      ? getArrayCabinets(params).map((cabinet) => {
          const angle = radians(yaw),
            c = Math.cos(angle),
            s = Math.sin(angle);
          return makeBox(
            {
              x: object.position.x + c * cabinet.position.x - s * cabinet.position.y,
              y: object.position.y + s * cabinet.position.x + c * cabinet.position.y,
              z: object.position.z + cabinet.position.z,
            },
            cabinet.dimensions,
            yaw,
            cabinet.angle,
          );
        })
      : [
          makeBox(
            { ...object.position, z: object.position.z + dimensions.height / 2 },
            dimensions,
            yaw,
          ),
        ];
  const bounds = {
    minX: Math.min(...boxes.map((b) => b.bounds.minX)),
    maxX: Math.max(...boxes.map((b) => b.bounds.maxX)),
    minY: Math.min(...boxes.map((b) => b.bounds.minY)),
    maxY: Math.max(...boxes.map((b) => b.bounds.maxY)),
    minZ: Math.min(...boxes.map((b) => b.bounds.minZ)),
    maxZ: Math.max(...boxes.map((b) => b.bounds.maxZ)),
  };
  return {
    object,
    boxes,
    bounds,
    signature: [
      object.id,
      [object.position.x, object.position.y, object.position.z],
      yaw,
      [dimensions.width, dimensions.depth, dimensions.height],
      params?.type === 'line-array'
        ? [
            params.count,
            params.cabinetWidth,
            params.cabinetDepth,
            params.cabinetHeight,
            params.splayAngle,
          ]
        : null,
    ],
  };
}

function boundsOverlap(a: Bounds, b: Bounds): boolean {
  return (
    Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX) > INTERFERENCE_TOLERANCE &&
    Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY) > INTERFERENCE_TOLERANCE &&
    Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ) > INTERFERENCE_TOLERANCE
  );
}

/** Separating-axis test for two oriented prisms, including tilted array cabinets. */
function boxesOverlap(a: Box, b: Box): boolean {
  if (!boundsOverlap(a.bounds, b.bounds)) return false;
  const offset = {
    x: b.center.x - a.center.x,
    y: b.center.y - a.center.y,
    z: b.center.z - a.center.z,
  };
  const axes = [
    ...a.axes,
    ...b.axes,
    ...a.axes.flatMap((axis) => b.axes.map((other) => cross(axis, other))),
  ];
  for (const axis of axes) {
    const length = Math.hypot(axis.x, axis.y, axis.z);
    // Parallel edges contribute no separating direction.
    if (length < 1e-10) continue;
    const direction = { x: axis.x / length, y: axis.y / length, z: axis.z / length };
    const radiusA = a.axes.reduce(
      (sum, local, i) => sum + Math.abs(dot(local, direction)) * a.half[i],
      0,
    );
    const radiusB = b.axes.reduce(
      (sum, local, i) => sum + Math.abs(dot(local, direction)) * b.half[i],
      0,
    );
    if (radiusA + radiusB - Math.abs(dot(offset, direction)) <= INTERFERENCE_TOLERANCE)
      return false;
  }
  return true;
}

/**
 * Physical occupancy warnings, never automatic errors or movement restrictions.
 * Generic models use their declared oriented bounding prism, not icon silhouettes.
 * Modular arrays use each cabinet's oriented prism, excluding empty hull space.
 * Visibility, groups and anchoring do not remove equipment from physical checks.
 * The complete count is computed even when the returned display list is capped.
 */
export function detectInterferences(
  project: Project,
  limit = DEFAULT_INTERFERENCE_LIMIT,
): InterferenceReport {
  const maximum = Number.isFinite(limit)
    ? Math.max(0, Math.floor(limit))
    : DEFAULT_INTERFERENCE_LIMIT;
  const issues: Interference[] = [];
  let total = 0;
  const append = (makeIssue: () => Interference) => {
    total++;
    if (issues.length < maximum) issues.push(makeIssue());
  };
  const bodies = project.objects.map(bodyFor).sort((a, b) => compare(a.object.id, b.object.id));
  if (project.stage.height > INTERFERENCE_TOLERANCE) {
    const stage = makeBox(
      { x: 0, y: project.stage.depth / 2, z: project.stage.height / 2 },
      { width: project.stage.width, depth: project.stage.depth, height: project.stage.height },
      0,
    );
    for (const body of bodies) {
      if (!boundsOverlap(body.bounds, stage.bounds)) continue;
      if (body.boxes.some((box) => boxesOverlap(box, stage)))
        append(() => ({
          id: JSON.stringify(['stage-penetration', body.object.id]),
          objectIds: [body.object.id],
          kind: 'stage-penetration',
          message: `${body.object.label}: su volumen físico penetra la plataforma. Revisar altura y apoyo.`,
          signature: JSON.stringify([
            'interference-v1',
            'stage',
            [project.stage.width, project.stage.depth, project.stage.height],
            body.signature,
          ]),
        }));
    }
  }
  // Sweep along X avoids SAT work for distant equipment. Secondary AABB tests
  // reject different heights and depths before the oriented box comparisons.
  bodies.sort((a, b) => a.bounds.minX - b.bounds.minX || compare(a.object.id, b.object.id));
  for (let i = 0; i < bodies.length; i++) {
    const a = bodies[i];
    for (let j = i + 1; j < bodies.length; j++) {
      const b = bodies[j];
      if (b.bounds.minX >= a.bounds.maxX - INTERFERENCE_TOLERANCE) break;
      if (!boundsOverlap(a.bounds, b.bounds)) continue;
      if (!a.boxes.some((boxA) => b.boxes.some((boxB) => boxesOverlap(boxA, boxB)))) continue;
      const pair = [a, b].sort((left, right) => compare(left.object.id, right.object.id));
      append(() => ({
        id: JSON.stringify(['overlap', pair[0].object.id, pair[1].object.id]),
        objectIds: pair.map((body) => body.object.id),
        kind: 'overlap',
        message: `${pair[0].object.label} y ${pair[1].object.label}: sus volúmenes físicos se superponen. Revisar si la interferencia es intencional.`,
        signature: JSON.stringify([
          'interference-v1',
          'pair',
          ...pair.map((body) => body.signature),
        ]),
      }));
    }
  }
  issues.sort((a, b) => compare(a.id, b.id));
  return { issues, total, truncated: total > issues.length };
}
