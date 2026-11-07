import { describe, expect, it } from 'vitest';
import { Group, Quaternion, Vector3 } from 'three';
import { fromThree, toThree } from '../core/geometry';
import { compensateRotationPivot, getRotationPivotWorld } from '../core/pivots';
import { objectPositionFromGizmoTranslation, projectYawFromQuaternion } from './transforms';

describe('3D transform controls', () => {
  it.each([-175, -120, -90, -45, 0, 45, 90, 120, 175])(
    'preserves yaw %s without folding past a quarter turn',
    (degrees) => {
      const quaternion = new Quaternion().setFromAxisAngle(
        new Vector3(0, 1, 0),
        (degrees * Math.PI) / 180,
      );
      expect(projectYawFromQuaternion(quaternion)).toBeCloseTo(degrees, 10);
    },
  );
  it('maps a gizmo translation back to physical project coordinates', () => {
    const projectPosition = { x: 1.125, y: 4.675, z: 0.8 };
    const enginePosition = new Vector3(...toThree(projectPosition));
    enginePosition.add(new Vector3(0.25, 0.1, -0.5));
    const result = fromThree(enginePosition);
    expect(result.x).toBeCloseTo(1.375);
    expect(result.y).toBeCloseTo(5.175);
    expect(result.z).toBeCloseTo(0.9);
  });
  it.each([0, 90, 135, 270])(
    'translates the bottom center by the dragged delta with an offset pivot at %s degrees',
    (rotation) => {
      const object = {
        position: { x: 1.125, y: 4.675, z: 0.8 },
        rotation,
        rotationPivot: { x: 0.5, y: -0.25 },
      };
      const dragged = new Vector3(...toThree(getRotationPivotWorld(object)));
      dragged.add(new Vector3(0.25, 0.1, -0.5));
      expect(objectPositionFromGizmoTranslation(object, dragged)).toEqual({
        x: 1.375,
        y: 5.175,
        z: 0.9,
      });
    },
  );
  it('preserves the original translation mapping for an omitted or zero pivot', () => {
    const dragged = new Vector3(1.25, 0.9, -4.5);
    expect(objectPositionFromGizmoTranslation({ rotation: 125 }, dragged)).toEqual({
      x: 1.25,
      y: 4.5,
      z: 0.9,
    });
    expect(
      objectPositionFromGizmoTranslation({ rotation: 125, rotationPivot: { x: 0, y: 0 } }, dragged),
    ).toEqual(fromThree(dragged));
  });
  it('keeps geometry at its physical position when the visual group origin moves to a pivot', () => {
    const object = {
      position: { x: 2, y: 3, z: 0.8 },
      rotation: 90,
      rotationPivot: { x: 0.5, y: -0.25 },
    };
    const gizmoGroup = new Group();
    gizmoGroup.position.set(...toThree(getRotationPivotWorld(object)));
    gizmoGroup.rotation.y = Math.PI / 2;
    const geometryGroup = new Group();
    geometryGroup.position.set(-0.5, 0, -0.25);
    gizmoGroup.add(geometryGroup);
    gizmoGroup.updateMatrixWorld(true);
    // The geometry's bottom-center remains (2,3,0.8), independent of the gizmo origin.
    const origin = geometryGroup.localToWorld(new Vector3());
    expect(origin.x).toBeCloseTo(2);
    expect(origin.y).toBeCloseTo(0.8);
    expect(origin.z).toBeCloseTo(-3);
    // A model point at local project (0.4,0.2,1) rotates with its original frame.
    const point = geometryGroup.localToWorld(new Vector3(0.4, 1, -0.2));
    expect(point.x).toBeCloseTo(1.8);
    expect(point.y).toBeCloseTo(1.8);
    expect(point.z).toBeCloseTo(-3.4);
  });
  it('a quarter turn keeps the gizmo fixed while the physical origin moves around it', () => {
    const object = {
      position: { x: 0, y: 3, z: 0.8 },
      rotation: 0,
      rotationPivot: { x: 1, y: 0 },
    };
    const next = { ...object, rotation: 90, position: compensateRotationPivot(object, 90) };
    expect(next.position).toEqual({ x: 1, y: 2, z: 0.8 });
    expect(getRotationPivotWorld(next)).toEqual({ x: 1, y: 3, z: 0.8 });
    expect(getRotationPivotWorld(next)).toEqual(getRotationPivotWorld(object));
    expect(
      objectPositionFromGizmoTranslation(
        next,
        new Vector3(...toThree(getRotationPivotWorld(next))),
      ),
    ).toEqual(next.position);
  });
});
