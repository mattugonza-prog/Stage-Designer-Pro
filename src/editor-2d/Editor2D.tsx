import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  Grid3X3,
  ScanLine,
  Hand,
  Magnet,
  Maximize2,
  MousePointer2,
  RotateCw,
  Ruler,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { getDimensions, roundMetric } from '../core/geometry';
import { getRotationPivotWorld } from '../core/pivots';
import {
  createSnapContext,
  snapDragPosition,
  type MagneticGuide,
  type SnapContext,
} from '../core/snapping';
import { isObjectHidden, isObjectLocked } from '../core/layers';
import { useEditorStore } from '../core/store';
import type { SceneObject } from '../core/types';
import './editor2d.css';

type Point = { x: number; y: number };
type Tool = 'select' | 'pan' | 'measure';
type Gesture =
  | { type: 'pan'; pointerId: number; start: Point; center: Point }
  | {
      type: 'move';
      pointerId: number;
      start: Point;
      id: string;
      initial: Point;
      ids: string[];
      delta: Point;
      snapContext: SnapContext | null;
      guides: MagneticGuide[];
    }
  | {
      type: 'rotate';
      pointerId: number;
      id: string;
      initial: number;
      startAngle: number;
      angle: number;
      center: Point;
    };

const round = (n: number) => Math.round(n * 1000) / 1000;
const format = (n: number) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(n);

/** Symbols are drawn in physical units; text and interaction handles remain screen-sized. */
export function EquipmentSymbol({ object }: { object: SceneObject }) {
  const { width: w, depth: d } = getDimensions(object);
  const color = object.definition.color;
  const common = { stroke: color, strokeWidth: 1.3, vectorEffect: 'non-scaling-stroke' as const };
  const box = (
    <rect
      x={-w / 2}
      y={-d / 2}
      width={w}
      height={d}
      rx={Math.min(w, d) * 0.06}
      fill={color}
      fillOpacity={0.17}
      {...common}
    />
  );
  switch (object.definition.kind) {
    case 'drums':
      return (
        <g>
          {box}
          <ellipse cx={0} cy={d * 0.2} rx={w * 0.19} ry={d * 0.2} fill="#29383c" {...common} />
          <circle
            cx={-w * 0.17}
            cy={-d * 0.05}
            r={Math.min(w, d) * 0.13}
            fill="#29383c"
            {...common}
          />
          <circle
            cx={w * 0.13}
            cy={-d * 0.08}
            r={Math.min(w, d) * 0.15}
            fill="#29383c"
            {...common}
          />
          <circle
            cx={w * 0.33}
            cy={d * 0.19}
            r={Math.min(w, d) * 0.13}
            fill="#29383c"
            {...common}
          />
          {[
            [-0.34, -0.28],
            [0.32, -0.3],
            [-0.37, 0.2],
          ].map(([x, y], i) => (
            <g key={i}>
              <circle
                cx={w * x}
                cy={d * y}
                r={Math.min(w, d) * 0.12}
                fill="#bda06a"
                fillOpacity={0.32}
                stroke="#bda06a"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={w * x} cy={d * y} r={Math.min(w, d) * 0.025} fill="#bda06a" />
            </g>
          ))}
        </g>
      );
    case 'keyboard':
      return (
        <g>
          {box}
          <rect x={-w * 0.46} y={-d * 0.12} width={w * 0.92} height={d * 0.48} fill="#cad8d3" />
          {Array.from({ length: 20 }, (_, i) => (
            <line
              key={i}
              x1={-w * 0.46 + (i * w * 0.92) / 20}
              x2={-w * 0.46 + (i * w * 0.92) / 20}
              y1={-d * 0.12}
              y2={d * 0.36}
              stroke="#42514f"
              strokeWidth={0.65}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {Array.from({ length: 14 }, (_, i) => (
            <rect
              key={i}
              x={-w * 0.44 + (i * w * 0.88) / 14}
              y={-d * 0.12}
              width={w * 0.025}
              height={d * 0.26}
              fill="#293634"
            />
          ))}
          <line x1={-w * 0.3} x2={w * 0.3} y1={-d * 0.32} y2={-d * 0.32} {...common} />
        </g>
      );
    case 'guitar':
      return (
        <g>
          <path
            d={`M ${-w * 0.15} ${-d * 0.1} Q ${-w * 0.5} ${-d * 0.25} ${-w * 0.45} ${d * 0.22} Q ${-w * 0.4} ${d * 0.5} 0 ${d * 0.48} Q ${w * 0.4} ${d * 0.5} ${w * 0.45} ${d * 0.22} Q ${w * 0.5} ${-d * 0.25} ${w * 0.15} ${-d * 0.1} L ${w * 0.07} ${-d * 0.48} L ${-w * 0.07} ${-d * 0.48} Z`}
            fill={color}
            fillOpacity={0.25}
            {...common}
          />
          <line x1={0} x2={0} y1={-d * 0.44} y2={d * 0.3} {...common} />
          <circle cy={d * 0.13} r={w * 0.11} fill="#182225" {...common} />
        </g>
      );
    case 'microphone':
      return (
        <g>
          <circle r={Math.min(w, d) * 0.44} fill={color} fillOpacity={0.1} {...common} />
          <path
            d={`M ${-w * 0.4} ${d * 0.25} L 0 0 L ${w * 0.4} ${d * 0.25} M 0 0 L 0 ${-d * 0.4}`}
            fill="none"
            {...common}
          />
          <circle r={Math.min(w, d) * 0.09} fill={color} />
          <line x1={0} y1={0} x2={w * 0.24} y2={-d * 0.34} {...common} />
          <rect
            x={w * 0.18}
            y={-d * 0.44}
            width={w * 0.14}
            height={d * 0.22}
            rx={w * 0.05}
            fill={color}
          />
        </g>
      );
    case 'person':
      return (
        <g>
          <ellipse
            cx={0}
            cy={d * 0.05}
            rx={w * 0.48}
            ry={d * 0.32}
            fill={color}
            fillOpacity={0.22}
            {...common}
          />
          <ellipse
            cx={0}
            cy={-d * 0.12}
            rx={w * 0.22}
            ry={d * 0.23}
            fill={color}
            fillOpacity={0.55}
            {...common}
          />
          <path
            d={`M ${-w * 0.15} ${d * 0.35} L 0 ${d * 0.48} L ${w * 0.15} ${d * 0.35}`}
            fill="none"
            {...common}
          />
        </g>
      );
    case 'monitor':
      return (
        <g>
          <path
            d={`M ${-w * 0.5} ${d * 0.5} L ${-w * 0.42} ${-d * 0.5} L ${w * 0.42} ${-d * 0.5} L ${w * 0.5} ${d * 0.5} Z`}
            fill={color}
            fillOpacity={0.2}
            {...common}
          />
          {[-0.25, 0, 0.25].map((y) => (
            <line key={y} x1={-w * 0.32} x2={w * 0.32} y1={d * y} y2={d * y} {...common} />
          ))}
          <path
            d={`M ${-w * 0.08} ${-d * 0.3} L 0 ${-d * 0.4} L ${w * 0.08} ${-d * 0.3}`}
            fill="none"
            {...common}
          />
        </g>
      );
    case 'led': {
      const columns = object.parameters?.type === 'led' ? object.parameters.columns : 1;
      return (
        <g>
          {box}
          {Array.from({ length: Math.min(columns, 100) }, (_, i) => (
            <line
              key={i}
              x1={-w / 2 + (i * w) / columns}
              x2={-w / 2 + (i * w) / columns}
              y1={-d / 2}
              y2={d / 2}
              {...common}
            />
          ))}
          <line
            x1={-w / 2}
            x2={w / 2}
            y1={d / 2}
            y2={d / 2}
            stroke="#94dacb"
            strokeWidth={3}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    }
    case 'line-array':
    case 'speaker':
      return (
        <g>
          {box}
          <rect
            x={-w * 0.36}
            y={-d * 0.34}
            width={w * 0.72}
            height={d * 0.68}
            rx={w * 0.025}
            fill="none"
            {...common}
          />
          <line
            x1={-w * 0.32}
            x2={w * 0.32}
            y1={d * 0.35}
            y2={d * 0.35}
            stroke={color}
            strokeWidth={3}
            vectorEffect="non-scaling-stroke"
          />
          {object.parameters?.type === 'line-array' && (
            <circle cx={0} cy={0} r={Math.min(w, d) * 0.13} fill={color} fillOpacity={0.5} />
          )}
        </g>
      );
    case 'console':
      return (
        <g>
          {box}
          <rect
            x={-w * 0.34}
            y={-d * 0.36}
            width={w * 0.68}
            height={d * 0.25}
            fill={color}
            fillOpacity={0.45}
          />
          {Array.from({ length: 8 }, (_, i) => (
            <g key={i}>
              <line
                x1={-w * 0.35 + i * w * 0.1}
                x2={-w * 0.35 + i * w * 0.1}
                y1={0}
                y2={d * 0.34}
                {...common}
              />
              <rect
                x={-w * 0.38 + i * w * 0.1}
                y={d * (0.08 + (i % 3) * 0.07)}
                width={w * 0.06}
                height={d * 0.06}
                fill={color}
              />
            </g>
          ))}
        </g>
      );
    case 'riser':
      return (
        <g>
          <rect
            x={-w / 2}
            y={-d / 2}
            width={w}
            height={d}
            fill="#495255"
            fillOpacity={0.25}
            stroke="#84918e"
            strokeDasharray="5 3"
            strokeWidth={1.2}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={-w / 2}
            x2={w / 2}
            y1={0}
            y2={0}
            stroke="#84918e"
            strokeOpacity={0.3}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
    default:
      return (
        <g>
          {box}
          <path
            d={`M ${-w * 0.3} ${-d * 0.3} L ${w * 0.3} ${d * 0.3} M ${w * 0.3} ${-d * 0.3} L ${-w * 0.3} ${d * 0.3}`}
            fill="none"
            stroke={color}
            strokeOpacity={0.4}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      );
  }
}

export default function Editor2D() {
  const project = useEditorStore((s) => s.project);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const select = useEditorStore((s) => s.select);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const updateObject = useEditorStore((s) => s.updateObject);
  const updateStage = useEditorStore((s) => s.updateStage);
  const beginTransaction = useEditorStore((s) => s.beginTransaction);
  const commitTransaction = useEditorStore((s) => s.commitTransaction);
  const cancelTransaction = useEditorStore((s) => s.cancelTransaction);
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [tool, setTool] = useState<Tool>('select');
  const [guidesEnabled, setGuidesEnabled] = useState(false);
  const [measure, setMeasure] = useState<{ start: Point; end: Point; complete: boolean } | null>(
    null,
  );
  const [cursor, setCursor] = useState<Point | null>(null);
  const id = useId().replace(/:/g, '');
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      if (rect.width && rect.height) setSize({ width: rect.width, height: rect.height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [project?.id]);
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setMeasure(null);
    gestureRef.current = null;
    setGesture(null);
  }, [project?.id]);
  const stage = project?.stage;
  const stageWidth = stage?.width ?? 8;
  const stageDepth = stage?.depth ?? 6;
  const aspect = size.width / size.height;
  const fitWidth = Math.max(stageWidth + 3, (stageDepth + 3) * aspect);
  const viewWidth = fitWidth / zoom;
  const viewHeight = viewWidth / aspect;
  const center = { x: pan.x, y: -stageDepth / 2 + pan.y };
  const px = viewWidth / size.width;
  const visibleStep = useMemo(() => {
    let step = stage?.gridStep ?? 0.5;
    while (step / px < 8) step *= 10;
    return step;
  }, [stage?.gridStep, px]);

  const worldPoint = useCallback((clientX: number, clientY: number): Point => {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return { x: 0, y: 0 };
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const result = point.matrixTransform(matrix.inverse());
    return { x: result.x, y: result.y };
  }, []);
  const setCurrentGesture = (next: Gesture | null) => {
    gestureRef.current = next;
    setGesture(next);
  };
  const startMove = (event: ReactPointerEvent<SVGGElement>, object: SceneObject) => {
    if (event.button !== 0 || tool !== 'select') return;
    event.stopPropagation();
    if (event.shiftKey) {
      select(object.id, true);
      return;
    }
    const ids = selectedIds.includes(object.id) ? selectedIds : [object.id];
    if (!selectedIds.includes(object.id)) select(object.id);
    if (!project || isObjectLocked(project, object)) return;
    svgRef.current?.setPointerCapture(event.pointerId);
    beginTransaction();
    setCurrentGesture({
      type: 'move',
      pointerId: event.pointerId,
      start: worldPoint(event.clientX, event.clientY),
      id: object.id,
      initial: { x: object.position.x, y: object.position.y },
      ids,
      delta: { x: 0, y: 0 },
      snapContext: createSnapContext(project, object.id, ids),
      guides: [],
    });
  };
  const startRotate = (event: ReactPointerEvent<SVGCircleElement>, object: SceneObject) => {
    event.stopPropagation();
    if (event.button !== 0 || !project || isObjectLocked(project, object)) return;
    const point = worldPoint(event.clientX, event.clientY);
    svgRef.current?.setPointerCapture(event.pointerId);
    beginTransaction();
    const pivot = getRotationPivotWorld(object);
    const c = { x: pivot.x, y: -pivot.y };
    setCurrentGesture({
      type: 'rotate',
      pointerId: event.pointerId,
      id: object.id,
      initial: object.rotation,
      startAngle: (Math.atan2(-(point.y - c.y), point.x - c.x) * 180) / Math.PI,
      angle: object.rotation,
      center: c,
    });
  };
  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 && event.button !== 1) return;
    const point = worldPoint(event.clientX, event.clientY);
    if (tool === 'measure' && event.button === 0) {
      setMeasure((prev) =>
        prev && !prev.complete
          ? { ...prev, end: point, complete: true }
          : { start: point, end: point, complete: false },
      );
      return;
    }
    if (tool === 'pan' || event.button === 1 || event.altKey) {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setCurrentGesture({
        type: 'pan',
        pointerId: event.pointerId,
        start: { x: event.clientX, y: event.clientY },
        center: pan,
      });
    } else clearSelection();
  };
  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const point = worldPoint(event.clientX, event.clientY);
    setCursor(point);
    if (tool === 'measure')
      setMeasure((prev) => (prev && !prev.complete ? { ...prev, end: point } : prev));
    const current = gestureRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (current.type === 'pan') {
      setPan({
        x: current.center.x - (event.clientX - current.start.x) * px,
        y: current.center.y - (event.clientY - current.start.y) * px,
      });
    } else if (current.type === 'move') {
      if (
        current.delta.x === 0 &&
        current.delta.y === 0 &&
        Math.hypot(point.x - current.start.x, point.y - current.start.y) < px * 2
      )
        return;
      const proposed = {
        x: current.initial.x + point.x - current.start.x,
        y: current.initial.y - (point.y - current.start.y),
      };
      const snapped = snapDragPosition(current.snapContext, proposed, px, {
        guidesEnabled,
        gridStep: stage?.snap ? stage.gridStep : undefined,
        bypass: event.altKey,
      });
      const x = roundMetric(snapped.position.x),
        y = roundMetric(snapped.position.y);
      const object = useEditorStore.getState().project?.objects.find((o) => o.id === current.id);
      if (object) updateObject(current.id, { position: { ...object.position, x, y } });
      const accepted = useEditorStore.getState().project?.objects.find((o) => o.id === current.id);
      setCurrentGesture({
        ...current,
        guides:
          accepted &&
          Math.abs(accepted.position.x - x) < 1e-6 &&
          Math.abs(accepted.position.y - y) < 1e-6
            ? snapped.guides
            : [],
        delta: {
          x: round(
            (useEditorStore.getState().project?.objects.find((o) => o.id === current.id)?.position
              .x ?? current.initial.x) - current.initial.x,
          ),
          y: round(
            (useEditorStore.getState().project?.objects.find((o) => o.id === current.id)?.position
              .y ?? current.initial.y) - current.initial.y,
          ),
        },
      });
    } else {
      const angle =
        (Math.atan2(-(point.y - current.center.y), point.x - current.center.x) * 180) / Math.PI;
      let rotation = current.initial + angle - current.startAngle;
      if (event.shiftKey) rotation = Math.round(rotation / 15) * 15;
      const nextAngle = round(((rotation % 360) + 360) % 360);
      updateObject(current.id, { rotation: nextAngle });
      setCurrentGesture({
        ...current,
        angle:
          useEditorStore.getState().project?.objects.find((o) => o.id === current.id)?.rotation ??
          current.initial,
      });
    }
  };
  const finishGesture = (event: ReactPointerEvent<SVGSVGElement>, cancel = false) => {
    const current = gestureRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    setCurrentGesture(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (current.type === 'pan') {
      if (cancel) setPan(current.center);
      return;
    }
    if (cancel) cancelTransaction();
    else commitTransaction();
  };
  const changeZoom = (factor: number) => setZoom((z) => Math.min(12, Math.max(0.15, z * factor)));
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom((z) => Math.min(12, Math.max(0.15, z * Math.exp(-event.deltaY * 0.0015))));
    };
    svg.addEventListener('wheel', wheel, { passive: false });
    return () => svg.removeEventListener('wheel', wheel);
  }, [project?.id]);
  useEffect(() => {
    const cancelGesture = () => {
      const active = gestureRef.current;
      if (!active) return;
      gestureRef.current = null;
      setGesture(null);
      if (active.type === 'pan') setPan(active.center);
      else cancelTransaction();
      if (svgRef.current?.hasPointerCapture(active.pointerId))
        svgRef.current.releasePointerCapture(active.pointerId);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cancelGesture();
        setMeasure(null);
      }
    };
    window.addEventListener('keydown', escape);
    window.addEventListener('blur', cancelGesture);
    return () => {
      window.removeEventListener('keydown', escape);
      window.removeEventListener('blur', cancelGesture);
      cancelGesture();
    };
  }, [cancelTransaction]);
  useEffect(() => {
    const active = gestureRef.current;
    if (!active || active.type === 'pan' || !project) return;
    const object = project.objects.find((o) => o.id === active.id);
    if (
      object &&
      !isObjectHidden(project, object) &&
      !isObjectLocked(project, object) &&
      useEditorStore.getState().transactionActive
    )
      return;
    // A layer action can cancel a transaction before hiding or locking its object.
    // Release the pointer without rolling back the separate layer operation.
    gestureRef.current = null;
    setGesture(null);
    if (svgRef.current?.hasPointerCapture(active.pointerId))
      svgRef.current.releasePointerCapture(active.pointerId);
    if (useEditorStore.getState().transactionActive) cancelTransaction();
  }, [project, cancelTransaction]);
  const fit = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const sortedObjects = useMemo(
    () =>
      [...(project?.objects ?? [])]
        .filter((o) => project && !isObjectHidden(project, o))
        .sort((a, b) => a.position.z - b.position.z),
    [project],
  );
  if (!project) return null;
  const measureLength = measure
    ? Math.hypot(measure.end.x - measure.start.x, measure.end.y - measure.start.y)
    : 0;
  const font = px * 11;
  return (
    <div className="editor2d" ref={rootRef} data-testid="editor-2d">
      <div className="editor2d-view-tag">
        <span className="editor2d-live-dot" /> PLANO TÉCNICO <span>2D</span>
      </div>
      <div className="editor2d-tools" aria-label="Herramientas del plano">
        <button
          className={tool === 'select' ? 'is-active' : ''}
          title="Seleccionar y mover"
          aria-label="Seleccionar y mover"
          aria-pressed={tool === 'select'}
          onClick={() => setTool('select')}
        >
          <MousePointer2 size={16} />
        </button>
        <button
          className={tool === 'pan' ? 'is-active' : ''}
          title="Desplazar plano · también Alt o botón central"
          aria-label="Desplazar plano"
          aria-pressed={tool === 'pan'}
          onClick={() => setTool('pan')}
        >
          <Hand size={16} />
        </button>
        <button
          className={tool === 'measure' ? 'is-active' : ''}
          title="Medir entre dos puntos"
          aria-label="Medir distancia"
          aria-pressed={tool === 'measure'}
          onClick={() => {
            setTool((t) => (t === 'measure' ? 'select' : 'measure'));
            setMeasure(null);
          }}
        >
          <Ruler size={16} />
        </button>
        <span className="editor2d-tool-divider" />
        <button
          className={stage?.gridVisible ? 'is-active' : ''}
          title="Mostrar cuadrícula"
          aria-label="Mostrar cuadrícula"
          aria-pressed={!!stage?.gridVisible}
          onClick={() => updateStage({ gridVisible: !stage?.gridVisible })}
        >
          <Grid3X3 size={16} />
        </button>
        <button
          className={stage?.snap ? 'is-active' : ''}
          title="Ajuste a cuadrícula · Alt para omitir al arrastrar"
          aria-label="Ajuste a cuadrícula"
          aria-pressed={!!stage?.snap}
          onClick={() => updateStage({ snap: !stage?.snap })}
        >
          <Magnet size={16} />
        </button>
        <button
          className={guidesEnabled ? 'is-active' : ''}
          title="Guías de centros y bordes · Alt omite los ajustes"
          aria-label="Guías magnéticas"
          aria-pressed={guidesEnabled}
          onClick={() => setGuidesEnabled((enabled) => !enabled)}
        >
          <ScanLine size={16} />
        </button>
      </div>
      <svg
        ref={svgRef}
        className={`editor2d-canvas tool-${tool} ${gesture ? 'is-dragging' : ''}`}
        role="img"
        aria-label={`Plano cenital de ${project.name}. Escenario de ${format(stageWidth)} por ${format(stageDepth)} metros.`}
        viewBox={`${center.x - viewWidth / 2} ${center.y - viewHeight / 2} ${viewWidth} ${viewHeight}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => finishGesture(e)}
        onPointerCancel={(e) => finishGesture(e, true)}
        onLostPointerCapture={(e) => finishGesture(e, true)}
        onPointerLeave={() => {
          if (!gestureRef.current) setCursor(null);
        }}
      >
        <defs>
          <pattern
            id={`${id}-grid`}
            x={0}
            y={0}
            width={visibleStep}
            height={visibleStep}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${visibleStep} 0 L 0 0 0 ${visibleStep}`}
              fill="none"
              stroke="var(--plan-grid, #34413f)"
              strokeWidth={0.7}
              vectorEffect="non-scaling-stroke"
            />
          </pattern>
          <pattern id={`${id}-dots`} x={0} y={0} width={1} height={1} patternUnits="userSpaceOnUse">
            <circle cx={0} cy={0} r={px * 0.8} fill="var(--plan-dot, #3b4847)" />
          </pattern>
        </defs>
        <rect
          x={center.x - viewWidth / 2}
          y={center.y - viewHeight / 2}
          width={viewWidth}
          height={viewHeight}
          fill={`url(#${id}-dots)`}
          pointerEvents="none"
        />
        <g pointerEvents="none">
          <rect
            x={-stageWidth / 2 + px * 5}
            y={-stageDepth + px * 7}
            width={stageWidth}
            height={stageDepth}
            fill="#000"
            fillOpacity={0.22}
            rx={px * 2}
          />
          <rect
            x={-stageWidth / 2}
            y={-stageDepth}
            width={stageWidth}
            height={stageDepth}
            fill={stage?.color ?? '#25312f'}
            stroke="var(--plan-stage-edge, #758880)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
          {stage?.gridVisible && (
            <rect
              x={-stageWidth / 2}
              y={-stageDepth}
              width={stageWidth}
              height={stageDepth}
              fill={`url(#${id}-grid)`}
            />
          )}
          <line
            x1={0}
            x2={0}
            y1={-stageDepth - 0.15}
            y2={0.3}
            stroke="#a1b9ae"
            strokeOpacity={0.28}
            strokeDasharray="5 5"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={-stageWidth / 2}
            x2={stageWidth / 2}
            y1={0}
            y2={0}
            stroke="#8bafa0"
            strokeWidth={3}
            vectorEffect="non-scaling-stroke"
          />
          <g
            fill="var(--plan-text, #a5b8b1)"
            fontSize={font}
            fontFamily="inherit"
            textAnchor="middle"
          >
            <text x={0} y={-stageDepth - px * 44} letterSpacing={px * 2}>
              FONDO · UPSTAGE
            </text>
            <text x={0} y={px * 30} letterSpacing={px * 2}>
              FRENTE · PÚBLICO
            </text>
            <path
              d={`M ${-px * 4} ${px * 39} L 0 ${px * 44} L ${px * 4} ${px * 39}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.2}
              vectorEffect="non-scaling-stroke"
            />
            <text x={-stageWidth / 2} y={px * 19} textAnchor="start" fontSize={font * 0.8}>
              DERECHA ESCÉNICA
            </text>
            <text x={stageWidth / 2} y={px * 19} textAnchor="end" fontSize={font * 0.8}>
              IZQUIERDA ESCÉNICA
            </text>
          </g>
          <g
            stroke="var(--plan-dimension, #6e8580)"
            fill="none"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          >
            <path
              d={`M ${-stageWidth / 2} ${-stageDepth - px * 10} v ${-px * 20} M ${stageWidth / 2} ${-stageDepth - px * 10} v ${-px * 20} M ${-stageWidth / 2} ${-stageDepth - px * 24} H ${stageWidth / 2}`}
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={`M ${-stageWidth / 2 - px * 10} 0 h ${-px * 20} M ${-stageWidth / 2 - px * 10} ${-stageDepth} h ${-px * 20} M ${-stageWidth / 2 - px * 24} 0 V ${-stageDepth}`}
              vectorEffect="non-scaling-stroke"
            />
          </g>
          <g
            fill="var(--plan-text, #a5b8b1)"
            fontFamily="inherit"
            fontSize={font}
            textAnchor="middle"
          >
            <rect
              x={-px * 32}
              y={-stageDepth - px * 32}
              width={px * 64}
              height={px * 16}
              fill="var(--plan-bg, #17201f)"
            />
            <text x={0} y={-stageDepth - px * 20}>
              {format(stageWidth)} m
            </text>
            <text
              transform={`translate(${-stageWidth / 2 - px * 30} ${-stageDepth / 2}) rotate(-90)`}
            >
              {format(stageDepth)} m
            </text>
          </g>
          <circle cx={0} cy={0} r={px * 3.5} fill="#97d6c0" />
        </g>
        {sortedObjects.map((object) => {
          const { width: w, depth: d } = getDimensions(object);
          const x = object.position.x;
          const y = object.position.y;
          const rotation = object.rotation;
          const selected = selectedIds.includes(object.id);
          const locked = isObjectLocked(project, object);
          const pivot = object.rotationPivot ?? { x: 0, y: 0 };
          const worldPivot = getRotationPivotWorld(object);
          const label = object.label.length > 25 ? `${object.label.slice(0, 23)}…` : object.label;
          return (
            <g
              key={object.id}
              data-testid={`object-2d-${object.id}`}
              data-object-id={object.id}
              data-x={round(x)}
              data-y={round(y)}
              data-rotation={rotation}
              data-selected={selected}
              data-locked={locked}
              className={`editor2d-object ${selected ? 'is-selected' : ''} ${locked ? 'is-locked' : ''}`}
              role="button"
              tabIndex={0}
              aria-label={`Seleccionar ${object.label}`}
              aria-pressed={selected}
              transform={`translate(${x} ${-y})`}
              onPointerDown={(e) => startMove(e, object)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  select(object.id, e.shiftKey);
                }
              }}
            >
              <title>
                {object.label} · {format(w)} × {format(d)} m{locked ? ' · Bloqueado' : ''}
              </title>
              <g transform={`rotate(${-rotation})`}>
                <rect
                  x={-Math.max(w, px * 16) / 2}
                  y={-Math.max(d, px * 16) / 2}
                  width={Math.max(w, px * 16)}
                  height={Math.max(d, px * 16)}
                  fill="transparent"
                />
                <EquipmentSymbol object={object} />
                {selected && (
                  <g className="editor2d-selection" pointerEvents="none">
                    <rect
                      x={-w / 2 - px * 3}
                      y={-d / 2 - px * 3}
                      width={w + px * 6}
                      height={d + px * 6}
                      rx={px * 2}
                      fill="#76e2bf"
                      fillOpacity={0.05}
                      stroke="#8be5c6"
                      strokeWidth={1.5}
                      vectorEffect="non-scaling-stroke"
                    />
                    {[
                      [-1, -1],
                      [-1, 1],
                      [1, -1],
                      [1, 1],
                    ].map(([sx, sy], i) => (
                      <rect
                        key={i}
                        x={sx * (w / 2 + px * 3) - px * 2}
                        y={sy * (d / 2 + px * 3) - px * 2}
                        width={px * 4}
                        height={px * 4}
                        fill="#b2f2dc"
                      />
                    ))}
                  </g>
                )}
                {selected && !locked && tool === 'select' && (
                  <g>
                    <line
                      x1={pivot.x}
                      x2={pivot.x}
                      y1={object.rotationPivot ? -pivot.y - px * 6 : -d / 2 - px * 3}
                      y2={-pivot.y - d / 2 - px * 22}
                      stroke="#8be5c6"
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                      pointerEvents="none"
                    />
                    <circle
                      className="editor2d-rotation-handle"
                      data-testid={`rotate-2d-${object.id}`}
                      aria-label={`Rotar ${object.label}`}
                      cx={pivot.x}
                      cy={-pivot.y - d / 2 - px * 24}
                      r={px * 5}
                      fill="#b2f2dc"
                      stroke="#17201f"
                      strokeWidth={1.5}
                      vectorEffect="non-scaling-stroke"
                      onPointerDown={(e) => startRotate(e, object)}
                    />
                  </g>
                )}
                {selected && object.rotationPivot && (
                  <g
                    className="editor2d-pivot"
                    data-testid={`pivot-2d-${object.id}`}
                    data-x={worldPivot.x}
                    data-y={worldPivot.y}
                    transform={`translate(${pivot.x} ${-pivot.y})`}
                    pointerEvents="none"
                    aria-label={`Pivote de giro de ${object.label}`}
                  >
                    <circle r={px * 4} />
                    <path d={`M ${-px * 7} 0 H ${px * 7} M 0 ${-px * 7} V ${px * 7}`} />
                  </g>
                )}
              </g>
              <text
                x={0}
                y={d / 2 + px * 15}
                fill={selected ? '#b2f2dc' : '#c3d0cc'}
                stroke="#17201f"
                strokeWidth={px * 3}
                paintOrder="stroke"
                fontSize={px * 10}
                fontFamily="inherit"
                textAnchor="middle"
                pointerEvents="none"
              >
                {locked ? '▣ ' : ''}
                {label}
              </text>
            </g>
          );
        })}
        {guidesEnabled &&
          gesture?.type === 'move' &&
          gesture.guides.map((guide) => (
            <g key={guide.axis} className="editor2d-magnetic-guide" pointerEvents="none">
              <line
                data-testid={`magnetic-guide-${guide.axis}`}
                data-target-id={guide.targetId}
                data-value={guide.value}
                x1={guide.axis === 'x' ? guide.value : guide.from - px * 12}
                x2={guide.axis === 'x' ? guide.value : guide.to + px * 12}
                y1={guide.axis === 'x' ? -guide.from + px * 12 : -guide.value}
                y2={guide.axis === 'x' ? -guide.to - px * 12 : -guide.value}
              />
            </g>
          ))}
        {measure && (
          <g pointerEvents="none">
            <line
              x1={measure.start.x}
              y1={measure.start.y}
              x2={measure.end.x}
              y2={measure.end.y}
              stroke="#eed390"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              vectorEffect="non-scaling-stroke"
            />
            {[measure.start, measure.end].map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={px * 3} fill="#eed390" />
            ))}
            <text
              x={(measure.start.x + measure.end.x) / 2}
              y={(measure.start.y + measure.end.y) / 2 - px * 8}
              textAnchor="middle"
              fill="#eed390"
              stroke="#17201f"
              paintOrder="stroke"
              strokeWidth={px * 4}
              fontSize={px * 12}
              data-testid="measurement-result"
            >
              {format(measureLength)} m
            </text>
          </g>
        )}
      </svg>
      {tool === 'measure' && (
        <div className="editor2d-hint">
          <Ruler size={13} />
          {measure && !measure.complete
            ? 'Elegí el segundo punto'
            : measure
              ? 'Medición lista · clic para medir otra distancia'
              : 'Elegí dos puntos del plano'}
        </div>
      )}
      {gesture?.type === 'rotate' && (
        <div className="editor2d-hint">
          <RotateCw size={13} />
          {format(gesture.angle)}° · Shift ajusta a 15°
        </div>
      )}
      <div className="editor2d-bottom">
        <div className="editor2d-coordinate">
          <span>
            {cursor ? `X ${format(cursor.x)} · Y ${format(-cursor.y)} m` : 'Escala real · metros'}
          </span>
          <span>
            Cuadrícula {format(visibleStep)} m
            {visibleStep !== (stage?.gridStep ?? 0.5) ? ' · adaptativa' : ''}
          </span>
        </div>
        <div className="editor2d-zoom">
          <button aria-label="Alejar plano" title="Alejar" onClick={() => changeZoom(1 / 1.25)}>
            <ZoomOut size={15} />
          </button>
          <span data-testid="zoom-2d">{Math.round(zoom * 100)}%</span>
          <button aria-label="Acercar plano" title="Acercar" onClick={() => changeZoom(1.25)}>
            <ZoomIn size={15} />
          </button>
          <span className="editor2d-tool-divider" />
          <button
            aria-label="Ajustar plano al escenario"
            title="Ajustar al escenario"
            onClick={fit}
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
