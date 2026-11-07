import type { SceneObject, Vec3 } from './types';
import { rotatePoint, roundMetric } from './geometry';

type PivotObject = Pick<SceneObject, 'position' | 'rotation' | 'rotationPivot'>;

/** The pivot is an editing reference in the object's local XY frame, not its geometry origin. */
export function getRotationPivotWorld(object: PivotObject): Vec3 {
  const offset = rotatePoint(object.rotationPivot ?? { x: 0, y: 0 }, object.rotation);
  return {
    x: roundMetric(object.position.x + offset.x),
    y: roundMetric(object.position.y + offset.y),
    z: object.position.z,
  };
}

/** New bottom-center position for a yaw change that keeps the configured world pivot fixed. */
export function compensateRotationPivot(object: PivotObject, rotation: number): Vec3 {
  const local = object.rotationPivot ?? { x: 0, y: 0 };
  const previousOffset = rotatePoint(local, object.rotation);
  const nextOffset = rotatePoint(local, rotation);
  return {
    x: roundMetric(object.position.x + previousOffset.x - nextOffset.x),
    y: roundMetric(object.position.y + previousOffset.y - nextOffset.y),
    z: object.position.z,
  };
}
