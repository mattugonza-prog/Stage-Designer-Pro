import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Edges, Grid, Html, OrbitControls, TransformControls } from '@react-three/drei';
import { Camera, Focus, Move3d, Orbit, Rotate3d } from 'lucide-react';
import { Group, type WebGLRenderer } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useEditorStore } from '../core/store';
import { isObjectHidden, isObjectLocked } from '../core/layers';
import { getArrayCabinets, getDimensions, radians, toThree } from '../core/geometry';
import { getRotationPivotWorld } from '../core/pivots';
import type { Project, SceneObject } from '../core/types';
import { ArrayCabinet, EquipmentModel } from './models';
import { objectPositionFromGizmoTranslation, projectYawFromQuaternion } from './transforms';
import './editor3d.css';

type CameraPreset = 'iso' | 'front' | 'back' | 'left' | 'right' | 'top' | 'focus';
type EditMode = 'orbit' | 'translate' | 'rotate';
type CameraRequest = { preset: CameraPreset; serial: number };

class SceneErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="scene3d-unavailable" role="alert">
        <strong>No se pudo iniciar la vista 3D</strong>
        <p>
          Comprobá que WebGL y la aceleración gráfica estén disponibles. Podés seguir editando el
          plano 2D y guardar el proyecto.
        </p>
        <button onClick={() => this.setState({ error: false })}>Reintentar vista 3D</button>
      </div>
    ) : (
      this.props.children
    );
  }
}

function SceneObjectMesh({
  object,
  mode,
  locked,
}: {
  object: SceneObject;
  mode: EditMode;
  locked: boolean;
}) {
  const selected = useEditorStore((s) => s.selectedIds.includes(object.id));
  const selectedPrimary = useEditorStore((s) => s.selectedIds[0] === object.id);
  const transactionActive = useEditorStore((s) => s.transactionActive);
  const select = useEditorStore((s) => s.select);
  const group = useRef<Group>(null!);
  const dragging = useRef(false);
  const cancelDrag = useRef<() => void>(() => {});
  const d = getDimensions(object);
  const localPivot = object.rotationPivot ?? { x: 0, y: 0 };
  const { gl, invalidate, controls } = useThree();
  const p = object.parameters;
  const cabinets = p?.type === 'line-array' ? getArrayCabinets(p) : null;
  useEffect(() => {
    const cancel = () => {
      if (!dragging.current) return;
      dragging.current = false;
      useEditorStore.getState().cancelTransaction();
      if (controls && 'enabled' in controls) controls.enabled = true;
      const canonical = useEditorStore.getState().project?.objects.find((o) => o.id === object.id);
      if (canonical && group.current) {
        group.current.position.set(...toThree(getRotationPivotWorld(canonical)));
        group.current.rotation.set(0, radians(canonical.rotation), 0);
        group.current.updateMatrixWorld();
      }
      invalidate();
    };
    cancelDrag.current = cancel;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancel();
    };
    window.addEventListener('blur', cancel);
    window.addEventListener('keydown', escape);
    return () => {
      window.removeEventListener('blur', cancel);
      window.removeEventListener('keydown', escape);
      cancel();
    };
  }, [selectedPrimary, mode, locked, object.id, invalidate, controls]);
  useEffect(() => {
    if (!transactionActive) cancelDrag.current();
  }, [transactionActive]);
  return (
    <>
      <group
        ref={group}
        name={`object-3d-${object.id}`}
        position={toThree(getRotationPivotWorld(object))}
        rotation={[0, radians(object.rotation), 0]}
        onClick={(event) => {
          event.stopPropagation();
          if (!dragging.current) select(object.id, event.shiftKey);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          gl.domElement.style.cursor = locked ? 'not-allowed' : 'pointer';
        }}
        onPointerOut={() => {
          gl.domElement.style.cursor = 'auto';
        }}
      >
        <group position={[-localPivot.x, 0, localPivot.y]}>
          {cabinets ? (
            cabinets.map((box, i) => (
              <group
                key={i}
                position={toThree(box.position)}
                rotation={[-radians(box.angle), 0, 0]}
              >
                <ArrayCabinet
                  width={box.dimensions.width}
                  height={box.dimensions.height}
                  depth={box.dimensions.depth}
                />
              </group>
            ))
          ) : (
            <EquipmentModel object={object} />
          )}
          {selected && (
            <>
              <mesh position={[0, d.height / 2, 0]} raycast={() => null}>
                <boxGeometry args={[d.width + 0.025, d.height + 0.025, d.depth + 0.025]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                <Edges color="#9ce4d4" lineWidth={1.8} />
              </mesh>
              <Html
                position={[0, d.height + 0.14, 0]}
                center
                distanceFactor={12}
                style={{ pointerEvents: 'none' }}
              >
                <div className="scene3d-object-label">
                  {object.label}
                  {locked ? ' · bloqueado' : ''}
                </div>
              </Html>
            </>
          )}
        </group>
      </group>
      {selectedPrimary && !locked && mode !== 'orbit' && (
        <TransformControls
          object={group}
          mode={mode}
          space="world"
          showX={mode === 'translate'}
          showY
          showZ={mode === 'translate'}
          size={0.85}
          translationSnap={
            useEditorStore.getState().project?.stage.snap
              ? useEditorStore.getState().project!.stage.gridStep
              : null
          }
          rotationSnap={useEditorStore.getState().project?.stage.snap ? radians(5) : null}
          onMouseDown={() => {
            dragging.current = true;
            useEditorStore.getState().beginTransaction();
          }}
          onObjectChange={() => {
            if (!group.current) return;
            const target = group.current;
            const state = useEditorStore.getState();
            const current = state.project?.objects.find((o) => o.id === object.id);
            if (current && dragging.current && state.transactionActive)
              state.updateObject(
                object.id,
                mode === 'translate'
                  ? { position: objectPositionFromGizmoTranslation(current, target.position) }
                  : { rotation: projectYawFromQuaternion(target.quaternion) },
              );
            // TransformControls mutates the mesh before proposing the edit. If domain
            // rules reject it (for example a locked child), restore the canonical pose.
            const canonical = useEditorStore
              .getState()
              .project?.objects.find((o) => o.id === object.id);
            if (canonical) {
              target.position.set(...toThree(getRotationPivotWorld(canonical)));
              target.rotation.set(0, radians(canonical.rotation), 0);
              target.updateMatrixWorld();
            }
            invalidate();
          }}
          onMouseUp={() => {
            const wasDragging = dragging.current;
            dragging.current = false;
            if (wasDragging) useEditorStore.getState().commitTransaction();
          }}
        />
      )}
    </>
  );
}

function CameraRig({ project, request }: { project: Project; request: CameraRequest }) {
  const { camera, invalidate, size: viewportSize } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const { width, depth, height } = project.stage;
  useEffect(() => {
    if (!controls.current) return;
    const size = Math.max(width, depth, 5);
    let target: [number, number, number] = [0, height + 0.5, -depth / 2];
    const framing = Math.max(1, 1.25 / (viewportSize.width / viewportSize.height));
    let offset: [number, number, number] = [
      size * 0.92 * framing,
      size * 0.83 * framing,
      size * 1.05 * framing,
    ];
    if (request.preset === 'front') offset = [0, size * 0.16, size * 1.45];
    if (request.preset === 'back') offset = [0, size * 0.16, -size * 1.45];
    if (request.preset === 'left') offset = [size * 1.45, size * 0.25, 0];
    if (request.preset === 'right') offset = [-size * 1.45, size * 0.25, 0];
    if (request.preset === 'top') offset = [0, size * 1.65, 0.001];
    if (request.preset === 'focus') {
      const selected = useEditorStore
        .getState()
        .project?.objects.find((o) => o.id === useEditorStore.getState().selectedIds[0]);
      if (selected) {
        const d = getDimensions(selected),
          focusSize = Math.max(d.width, d.depth, d.height, 1);
        target = toThree({ ...selected.position, z: selected.position.z + d.height / 2 });
        offset = [focusSize * 1.4, focusSize, focusSize * 1.6];
      }
    }
    camera.position.set(target[0] + offset[0], target[1] + offset[1], target[2] + offset[2]);
    camera.up.set(0, 1, 0);
    camera.lookAt(...target);
    controls.current.target.set(...target);
    controls.current.update();
    invalidate();
  }, [request, width, depth, height, camera, invalidate, viewportSize.width, viewportSize.height]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.12}
      minDistance={0.25}
      maxDistance={Math.max(width, depth) * 15}
      maxPolarAngle={Math.PI * 0.95}
    />
  );
}

function Capture({ capture }: { capture: React.RefObject<(() => void) | null> }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    capture.current = () => {
      gl.render(scene, camera);
      const anchor = document.createElement('a');
      anchor.href = gl.domElement.toDataURL('image/png');
      anchor.download = `${(useEditorStore.getState().project?.name ?? 'escenario').replace(/[^a-zA-Z0-9áéíóúñ _-]/g, '').slice(0, 80)}-3d.png`;
      anchor.click();
    };
    return () => {
      capture.current = null;
    };
  }, [gl, scene, camera, capture]);
  return null;
}

function Scene({
  project,
  mode,
  request,
  capture,
}: {
  project: Project;
  mode: EditMode;
  request: CameraRequest;
  capture: React.RefObject<(() => void) | null>;
}) {
  const { stage } = project;
  const size = Math.max(stage.width, stage.depth);
  return (
    <>
      <color attach="background" args={['#172126']} />
      <fog attach="fog" args={['#172126', size * 3, size * 10]} />
      <ambientLight intensity={0.6} />
      <hemisphereLight args={['#d9efed', '#45515b', 1.5]} />
      <directionalLight
        position={[5, 12, 6]}
        intensity={2.8}
        color="#ffead1"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-size}
        shadow-camera-right={size}
        shadow-camera-top={size}
        shadow-camera-bottom={-size}
        shadow-camera-far={60}
        shadow-normalBias={0.04}
      />
      <directionalLight position={[-5, 7, -8]} intensity={1.8} color="#9ac9d7" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, -stage.depth / 2]} receiveShadow>
        <planeGeometry args={[size * 20, size * 20]} />
        <meshStandardMaterial color="#273239" roughness={0.92} />
      </mesh>
      <mesh position={[0, stage.height / 2, -stage.depth / 2]} receiveShadow castShadow>
        <boxGeometry args={[stage.width, Math.max(0.006, stage.height), stage.depth]} />
        <meshStandardMaterial color={stage.color} roughness={0.84} />
      </mesh>
      <mesh position={[0, stage.height - 0.015, 0.009]}>
        <boxGeometry args={[stage.width, 0.025, 0.018]} />
        <meshStandardMaterial color="#a6cac3" emissive="#40675e" emissiveIntensity={0.2} />
      </mesh>
      {stage.gridVisible && (
        <Grid
          position={[0, stage.height + 0.005, -stage.depth / 2]}
          args={[stage.width, stage.depth]}
          cellSize={stage.gridStep}
          cellThickness={0.4}
          cellColor="#505f64"
          sectionSize={1}
          sectionThickness={0.75}
          sectionColor="#7f9193"
          fadeDistance={size * 5}
          fadeStrength={1}
        />
      )}
      {project.objects
        .filter((o) => !isObjectHidden(project, o))
        .map((o) => (
          <SceneObjectMesh key={o.id} object={o} mode={mode} locked={isObjectLocked(project, o)} />
        ))}
      <CameraRig project={project} request={request} />
      <Capture capture={capture} />
    </>
  );
}

export default function Editor3D() {
  const project = useEditorStore((s) => s.project);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const [mode, setMode] = useState<EditMode>('orbit');
  const [request, setRequest] = useState<CameraRequest>({ preset: 'iso', serial: 0 });
  const [ready, setReady] = useState(false);
  const [captureError, setCaptureError] = useState('');
  const capture = useRef<(() => void) | null>(null);
  if (!project) return null;
  const selected = project.objects.find((o) => o.id === selectedIds[0]);
  const selectedPivot = selected ? getRotationPivotWorld(selected) : null;
  const selectedLocked = selected ? isObjectLocked(project, selected) : false;
  const cameraPreset = (preset: CameraPreset) =>
    setRequest((prev) => ({ preset, serial: prev.serial + 1 }));
  return (
    <section
      className="editor3d"
      data-testid="editor-3d"
      data-selection={selected?.id ?? ''}
      data-position={
        selected ? `${selected.position.x},${selected.position.y},${selected.position.z}` : ''
      }
      data-rotation={selected?.rotation ?? ''}
      data-rotation-pivot={
        selectedPivot ? `${selectedPivot.x},${selectedPivot.y},${selectedPivot.z}` : ''
      }
      data-ready={ready}
      data-visible-ids={project.objects
        .filter((o) => !isObjectHidden(project, o))
        .map((o) => o.id)
        .join(',')}
      data-locked={selectedLocked}
      aria-label="Editor tridimensional"
    >
      <div className="scene3d-toolbar">
        <span className="scene3d-caption">
          <span /> PERSPECTIVA 3D
        </span>
        <div className="scene3d-modes" aria-label="Modo de edición 3D">
          <button
            title="Orbitar cámara"
            aria-label="Orbitar cámara"
            aria-pressed={mode === 'orbit'}
            onClick={() => setMode('orbit')}
          >
            <Orbit size={15} />
          </button>
          <button
            title="Mover objeto en 3D"
            aria-label="Mover objeto en 3D"
            aria-pressed={mode === 'translate'}
            onClick={() => setMode('translate')}
          >
            <Move3d size={15} />
          </button>
          <button
            title="Rotar objeto en 3D"
            aria-label="Rotar objeto en 3D"
            aria-pressed={mode === 'rotate'}
            onClick={() => setMode('rotate')}
          >
            <Rotate3d size={15} />
          </button>
        </div>
      </div>
      <SceneErrorBoundary>
        <Canvas
          shadows
          frameloop="demand"
          dpr={[1, 1.75]}
          camera={{
            position: [10, 9, 11],
            fov: 44,
            near: 0.05,
            far: Math.max(1000, project.stage.width * 30, project.stage.depth * 30),
          }}
          gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }: { gl: WebGLRenderer }) => {
            gl.domElement.setAttribute('aria-label', 'Escena 3D interactiva');
            setReady(true);
          }}
          onPointerMissed={() => useEditorStore.getState().clearSelection()}
        >
          <Scene project={project} mode={mode} request={request} capture={capture} />
        </Canvas>
      </SceneErrorBoundary>
      <div className="scene3d-camera">
        <select
          aria-label="Cámara 3D"
          value={request.preset === 'focus' ? 'iso' : request.preset}
          onChange={(event) => cameraPreset(event.target.value as CameraPreset)}
        >
          <option value="iso">Isométrica</option>
          <option value="front">Frontal · público</option>
          <option value="back">Posterior</option>
          <option value="left">Izquierda escénica</option>
          <option value="right">Derecha escénica</option>
          <option value="top">Superior</option>
        </select>
        <button
          aria-label="Encuadrar selección"
          title="Encuadrar selección"
          disabled={!selected}
          onClick={() => cameraPreset('focus')}
        >
          <Focus size={16} />
        </button>
        <button
          aria-label="Capturar imagen 3D"
          title="Descargar imagen PNG de esta vista"
          disabled={!ready}
          onClick={() => {
            try {
              capture.current?.();
              setCaptureError('');
            } catch {
              setCaptureError('No se pudo guardar la imagen. Intentá de nuevo.');
            }
          }}
        >
          <Camera size={16} />
        </button>
      </div>
      <div className="scene3d-hint">
        {mode === 'orbit'
          ? 'Arrastrá para orbitar · rueda para acercar'
          : selectedLocked
            ? 'Objeto bloqueado'
            : selected
              ? mode === 'translate'
                ? 'Arrastrá un eje para mover'
                : 'Arrastrá el aro para rotar'
              : 'Seleccioná un objeto para editar'}
      </div>
      {captureError && (
        <div className="scene3d-error" role="alert">
          {captureError}
        </div>
      )}
    </section>
  );
}
