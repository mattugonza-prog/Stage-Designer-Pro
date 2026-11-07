import { useEffect, useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { SceneObject } from '../core/types';
import { getDimensions } from '../core/geometry';

type Triple = [number, number, number];
const black = '#20292c';
const steel = '#adb9be';

function Box({
  position,
  scale,
  color = black,
  metalness = 0.15,
}: {
  position: Triple;
  scale: Triple;
  color?: string;
  metalness?: number;
}) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <boxGeometry />
      <meshStandardMaterial color={color} roughness={0.65} metalness={metalness} />
    </mesh>
  );
}
function Cylinder({
  position,
  scale,
  color = steel,
  rotation,
}: {
  position: Triple;
  scale: Triple;
  color?: string;
  rotation?: Triple;
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale} castShadow receiveShadow>
      <cylinderGeometry args={[1, 1, 1, 20]} />
      <meshStandardMaterial color={color} roughness={0.43} metalness={0.35} />
    </mesh>
  );
}
function Sphere({ position, scale, color }: { position: Triple; scale: Triple; color: string }) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <sphereGeometry args={[1, 16, 12]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}
function Speaker({ color }: { color: string }) {
  return (
    <>
      <Box position={[0, 0.5, 0]} scale={[1, 1, 0.98]} color={color} />
      <Box position={[0, 0.5, 0.491]} scale={[0.88, 0.87, 0.012]} color="#11191d" />
      <Cylinder
        position={[0, 0.39, 0.491]}
        scale={[0.27, 0.018, 0.27]}
        rotation={[Math.PI / 2, 0, 0]}
        color="#344146"
      />
      <Box position={[0, 0.82, 0.49]} scale={[0.47, 0.12, 0.02]} color="#485357" />
    </>
  );
}

function MonitorCabinet() {
  const geometry = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      'position',
      new Float32BufferAttribute(
        [
          -0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5, -0.5, 1, -0.5, 0.5, 1, -0.5, 0.5,
          0.4, 0.5, -0.5, 0.4, 0.5,
        ],
        3,
      ),
    );
    geometry.setIndex([
      0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1,
      2, 6, 1, 6, 5,
    ]);
    geometry.computeVertexNormals();
    return geometry;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color="#29373e" roughness={0.8} />
      </mesh>
      <group position={[0, 0.705, 0]} rotation={[Math.atan(0.6), 0, 0]}>
        <Box position={[0, 0, 0]} scale={[0.88, 0.01, 1.02]} color="#405158" />
        <Cylinder position={[0, 0.007, 0]} scale={[0.26, 0.008, 0.26]} color="#17262d" />
      </group>
    </>
  );
}

/** Original procedural generic models. Geometry is fitted to the declared physical envelope. */
export function EquipmentModel({ object }: { object: SceneObject }) {
  const d = getDimensions(object);
  const color = object.definition.color;
  const kind = object.definition.kind;
  if (object.parameters?.type === 'led') {
    const p = object.parameters;
    return (
      <group>
        {Array.from({ length: p.rows }, (_, row) =>
          Array.from({ length: p.columns }, (_, col) => (
            <group
              key={`${row}-${col}`}
              position={[
                -d.width / 2 + (col + 0.5) * p.cabinetWidth,
                (row + 0.5) * p.cabinetHeight,
                0,
              ]}
            >
              <Box
                position={[0, 0, 0]}
                scale={[p.cabinetWidth * 0.994, p.cabinetHeight * 0.994, p.cabinetDepth]}
                color="#151d23"
              />
              <mesh position={[0, 0, p.cabinetDepth / 2 + 0.001]}>
                <planeGeometry args={[p.cabinetWidth * 0.978, p.cabinetHeight * 0.978]} />
                <meshStandardMaterial
                  color={row % 2 === 0 ? '#599a9a' : '#75b8ad'}
                  emissive="#227a74"
                  emissiveIntensity={0.45}
                  roughness={0.7}
                />
              </mesh>
            </group>
          )),
        )}
      </group>
    );
  }
  // Array geometry is supplied by its own physical assembly component below.
  return (
    <group scale={[d.width, d.height, d.depth]}>
      {(kind === 'box' || kind === 'riser') && (
        <>
          <Box
            position={[0, 0.5, 0]}
            scale={[1, 1, 1]}
            color={kind === 'riser' ? '#333b3e' : color}
          />
          <Box
            position={[0, 0.987, 0]}
            scale={[0.98, 0.025, 0.98]}
            color={kind === 'riser' ? '#566167' : color}
          />
          {kind === 'riser' &&
            [-0.45, 0.45].map((x) => (
              <Box key={x} position={[x, 0.08, 0]} scale={[0.045, 0.16, 0.88]} color="#838b8d" />
            ))}
        </>
      )}
      {(kind === 'speaker' || kind === 'line-array') && <Speaker color={color} />}
      {kind === 'monitor' && <MonitorCabinet />}
      {kind === 'microphone' && (
        <>
          <Cylinder position={[0, 0.43, 0]} scale={[0.026, 0.8, 0.026]} />
          {[0, 2.094, 4.188].map((a) => (
            <group key={a} rotation={[0, a, 0]}>
              <Box position={[0, 0.025, 0.22]} scale={[0.035, 0.035, 0.48]} color={black} />
            </group>
          ))}
          <group position={[0, 0.8, 0]} rotation={[-0.5, 0, 0]}>
            <Cylinder position={[0, 0.09, 0]} scale={[0.024, 0.18, 0.024]} color={black} />
            <Sphere position={[0, 0.2, 0]} scale={[0.058, 0.035, 0.058]} color="#899697" />
          </group>
        </>
      )}
      {kind === 'keyboard' && (
        <>
          <Box position={[0, 0.87, 0]} scale={[1, 0.17, 0.96]} color={color} />
          {Array.from({ length: 28 }, (_, i) => (
            <Box
              key={i}
              position={[-0.455 + i * 0.033, 0.963, 0.12]}
              scale={[0.03, 0.012, 0.55]}
              color="#e8ebe5"
            />
          ))}
          {Array.from({ length: 20 }, (_, i) => (
            <Box
              key={i}
              position={[-0.44 + i * 0.045, 0.978, -0.02]}
              scale={[0.018, 0.026, 0.26]}
              color="#192125"
            />
          ))}
          <group rotation={[0, 0, 0.39]}>
            <Box position={[0, 0.43, 0]} scale={[0.035, 0.84, 0.15]} />
          </group>
          <group rotation={[0, 0, -0.39]}>
            <Box position={[0, 0.43, 0]} scale={[0.035, 0.84, 0.15]} />
          </group>
          <Box position={[0, 0.02, 0]} scale={[0.8, 0.04, 0.65]} />
        </>
      )}
      {kind === 'guitar' && (
        <>
          <Sphere position={[0, 0.25, 0]} scale={[0.46, 0.23, 0.28]} color={color} />
          <Sphere position={[0, 0.43, 0]} scale={[0.3, 0.18, 0.25]} color={color} />
          <Box position={[0, 0.69, 0]} scale={[0.12, 0.5, 0.15]} color="#a4855c" />
          <Box position={[0, 0.96, 0]} scale={[0.18, 0.08, 0.18]} color="#bda680" />
          <Box position={[0, 0.33, 0.29]} scale={[0.3, 0.065, 0.03]} color="#dad3c2" />
          <Box position={[0, 0.02, 0]} scale={[1, 0.04, 1]} color={black} />
        </>
      )}
      {kind === 'person' && (
        <>
          <Sphere position={[0, 0.91, 0]} scale={[0.2, 0.09, 0.25]} color="#c6b99f" />
          <Sphere position={[0, 0.64, 0]} scale={[0.38, 0.22, 0.32]} color={color} />
          {[-1, 1].map((side) => (
            <group key={side}>
              <Cylinder
                position={[side * 0.14, 0.23, 0]}
                scale={[0.11, 0.46, 0.14]}
                color="#28373e"
              />
              <Box
                position={[side * 0.14, 0.025, 0.14]}
                scale={[0.25, 0.05, 0.65]}
                color="#1d272e"
              />
              <Cylinder position={[side * 0.4, 0.62, 0]} scale={[0.08, 0.31, 0.11]} color={color} />
            </group>
          ))}
        </>
      )}
      {kind === 'drums' && (
        <>
          <Cylinder
            position={[0, 0.25, 0.2]}
            scale={[0.25, 0.3, 0.25]}
            rotation={[Math.PI / 2, 0, 0]}
            color={color}
          />
          <Cylinder
            position={[0, 0.25, 0.357]}
            scale={[0.23, 0.018, 0.23]}
            rotation={[Math.PI / 2, 0, 0]}
            color="#dddcd2"
          />
          {[-0.18, 0.18].map((x) => (
            <group key={x}>
              <Cylinder position={[x, 0.55, 0.08]} scale={[0.15, 0.25, 0.15]} color={color} />
              <Cylinder position={[x, 0.682, 0.08]} scale={[0.15, 0.014, 0.15]} color="#dbded9" />
            </group>
          ))}
          <Cylinder position={[-0.34, 0.3, -0.15]} scale={[0.15, 0.35, 0.15]} color={color} />
          <Cylinder position={[-0.34, 0.483, -0.15]} scale={[0.15, 0.014, 0.15]} color="#e1e4db" />
          <Cylinder position={[0.3, 0.35, -0.17]} scale={[0.14, 0.12, 0.14]} color="#7d9197" />
          {[-1, 1].map((side) => (
            <group key={side}>
              <Cylinder position={[side * 0.32, 0.48, 0.23]} scale={[0.012, 0.9, 0.012]} />
              <Cylinder
                position={[side * 0.32, 0.94, 0.23]}
                scale={[0.18, 0.014, 0.18]}
                color="#c8af65"
              />
            </group>
          ))}
          <Cylinder position={[0, 0.2, -0.34]} scale={[0.12, 0.05, 0.12]} color={black} />
          <Cylinder position={[0, 0.1, -0.34]} scale={[0.025, 0.2, 0.025]} />
        </>
      )}
      {kind === 'console' && (
        <>
          <Box position={[0, 0.44, 0]} scale={[1, 0.88, 1]} color="#253339" />
          <Box position={[-0.19, 0.9, -0.16]} scale={[0.45, 0.05, 0.35]} color="#75bab5" />
          {Array.from({ length: 10 }, (_, i) => (
            <group key={i}>
              <Box
                position={[-0.41 + i * 0.09, 0.9, 0.22]}
                scale={[0.014, 0.015, 0.32]}
                color="#111c22"
              />
              <Box
                position={[-0.41 + i * 0.09, 0.93, 0.15 + (i % 3) * 0.04]}
                scale={[0.055, 0.035, 0.05]}
                color="#c9d1ce"
              />
            </group>
          ))}
        </>
      )}
      {kind === 'led' && (
        <>
          <Box position={[0, 0.5, 0]} scale={[1, 1, 1]} />
          <Box position={[0, 0.5, 0.501]} scale={[0.98, 0.98, 0.01]} color="#62aca4" />
        </>
      )}
    </group>
  );
}

export function ArrayCabinet({
  width,
  height,
  depth,
}: {
  width: number;
  height: number;
  depth: number;
}) {
  return (
    <group scale={[width, height, depth]} position={[0, -height / 2, 0]}>
      <Speaker color="#263238" />
    </group>
  );
}
