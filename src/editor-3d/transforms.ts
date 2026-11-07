import { Euler, type Quaternion } from 'three';
import { fromThree, rotatePoint, roundMetric } from '../core/geometry';
import type { SceneObject, Vec3 } from '../core/types';

/** Recover full yaw after TransformControls changes a quaternion.
 * Reading default XYZ Euler.y alone folds rotations beyond ±90 degrees.
 */
export function projectYawFromQuaternion(quaternion: Quaternion): number {
  const radians = new Euler().setFromQuaternion(quaternion, 'YXZ').y;
  return (radians * 180) / Math.PI;
}

/** The gizmo is attached to the rotation pivot; the document stores the bottom center. */
export function objectPositionFromGizmoTranslation(
  object: Pick<SceneObject, 'rotation' | 'rotationPivot'>,
  enginePivot: Vec3,
): Vec3 {
  const pivot = fromThree(enginePivot);
  const offset = rotatePoint(object.rotationPivot ?? { x: 0, y: 0 }, object.rotation);
  return {
    x: roundMetric(pivot.x - offset.x),
    y: roundMetric(pivot.y - offset.y),
    z: roundMetric(pivot.z),
  };
}
