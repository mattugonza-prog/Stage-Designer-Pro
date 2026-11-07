import { bounds, roundMetric, snap } from './geometry';
import { relatedIds } from './hierarchy';
import { isObjectHidden } from './layers';
import type { Project } from './types';

type Point = { x: number; y: number };
type Axis = 'x' | 'y';
type Feature = 'center' | 'min' | 'max';
type Rectangle = { minX: number; maxX: number; minY: number; maxY: number };
interface Reference {
  value: number;
  feature: Feature;
  targetId: string;
  from: number;
  to: number;
}
export interface MagneticGuide {
  axis: Axis;
  value: number;
  from: number;
  to: number;
  targetId: string;
  movingFeature: Feature;
  targetFeature: Feature;
}
export interface SnapContext {
  origin: Point;
  movingBounds: Rectangle;
  references: Record<Axis, Reference[]>;
}

function features(rect: Rectangle, axis: Axis): { value: number; feature: Feature }[] {
  const min = axis === 'x' ? rect.minX : rect.minY;
  const max = axis === 'x' ? rect.maxX : rect.maxY;
  return [
    { value: (min + max) / 2, feature: 'center' },
    { value: min, feature: 'min' },
    { value: max, feature: 'max' },
  ];
}

/** Freeze physical references at pointer-down. No screen coordinates enter the project. */
export function createSnapContext(
  project: Project,
  primaryId: string,
  selectedIds: string[],
): SnapContext | null {
  const primary = project.objects.find((object) => object.id === primaryId);
  if (!primary) return null;
  const movingIds = relatedIds(
    project,
    selectedIds.includes(primaryId) ? selectedIds : [primaryId],
  );
  const moving = project.objects.filter(
    (object) => movingIds.has(object.id) && !isObjectHidden(project, object),
  );
  if (!moving.length) return null;
  const boxes = moving.map(bounds);
  const context: SnapContext = {
    origin: { x: primary.position.x, y: primary.position.y },
    movingBounds: {
      minX: Math.min(...boxes.map((box) => box.minX)),
      maxX: Math.max(...boxes.map((box) => box.maxX)),
      minY: Math.min(...boxes.map((box) => box.minY)),
      maxY: Math.max(...boxes.map((box) => box.maxY)),
    },
    references: { x: [], y: [] },
  };
  const add = (rect: Rectangle, targetId: string) => {
    for (const axis of ['x', 'y'] as const)
      for (const feature of features(rect, axis))
        context.references[axis].push({
          ...feature,
          targetId,
          from: axis === 'x' ? rect.minY : rect.minX,
          to: axis === 'x' ? rect.maxY : rect.maxX,
        });
  };
  add(
    {
      minX: -project.stage.width / 2,
      maxX: project.stage.width / 2,
      minY: 0,
      maxY: project.stage.depth,
    },
    'stage',
  );
  for (const object of project.objects)
    if (!movingIds.has(object.id) && !isObjectHidden(project, object))
      add(bounds(object), object.id);
  return context;
}

/** Align the collective footprint by translation; all group/support offsets remain intact. */
export function snapToGuides(
  context: SnapContext | null,
  proposedPosition: Point,
  worldUnitsPerPixel: number,
  tolerancePixels = 7,
): { position: Point; guides: MagneticGuide[] } {
  const position = { ...proposedPosition };
  const guides: MagneticGuide[] = [];
  if (
    !context ||
    ![position.x, position.y, worldUnitsPerPixel, tolerancePixels].every(Number.isFinite) ||
    worldUnitsPerPixel <= 0 ||
    tolerancePixels <= 0
  )
    return { position, guides };
  const tolerance = worldUnitsPerPixel * tolerancePixels;
  const winners: Partial<Record<Axis, { correction: number; source: Feature; target: Reference }>> =
    {};
  for (const axis of ['x', 'y'] as const) {
    let score: [number, number, number, string] | null = null;
    for (const source of features(context.movingBounds, axis)) {
      const value = source.value + proposedPosition[axis] - context.origin[axis];
      for (const target of context.references[axis]) {
        const correction = target.value - value;
        if (Math.abs(correction) > tolerance + 1e-9) continue;
        // First choose the closest reference. Ties prefer center-to-center,
        // then matching edges; IDs make the result independent of scene order.
        const rank =
          source.feature === 'center' && target.feature === 'center'
            ? 0
            : source.feature === target.feature
              ? 1
              : 2;
        const next: [number, number, number, string] = [
          roundMetric(Math.abs(correction)),
          rank,
          target.targetId === 'stage' ? 1 : 0,
          `${target.targetId}:${target.feature}:${source.feature}`,
        ];
        const better =
          !score ||
          next[0] < score[0] ||
          (next[0] === score[0] &&
            (next[1] < score[1] ||
              (next[1] === score[1] &&
                (next[2] < score[2] || (next[2] === score[2] && next[3] < score[3])))));
        if (better) {
          score = next;
          winners[axis] = { correction, source: source.feature, target };
        }
      }
    }
    const winner = winners[axis];
    if (winner) position[axis] = roundMetric(position[axis] + winner.correction);
  }
  for (const axis of ['x', 'y'] as const) {
    const winner = winners[axis];
    if (!winner) continue;
    const other = axis === 'x' ? 'y' : 'x';
    const delta = position[other] - context.origin[other];
    const from = (axis === 'x' ? context.movingBounds.minY : context.movingBounds.minX) + delta;
    const to = (axis === 'x' ? context.movingBounds.maxY : context.movingBounds.maxX) + delta;
    guides.push({
      axis,
      value: roundMetric(winner.target.value),
      from: Math.min(from, winner.target.from),
      to: Math.max(to, winner.target.to),
      targetId: winner.target.targetId,
      movingFeature: winner.source,
      targetFeature: winner.target.feature,
    });
  }
  return { position, guides };
}

/** Guides override the grid only on matched axes. Alt bypasses both adjustments. */
export function snapDragPosition(
  context: SnapContext | null,
  proposedPosition: Point,
  worldUnitsPerPixel: number,
  options: { guidesEnabled: boolean; gridStep?: number; bypass?: boolean },
): { position: Point; guides: MagneticGuide[] } {
  if (options.bypass) return { position: { ...proposedPosition }, guides: [] };
  const result = options.guidesEnabled
    ? snapToGuides(context, proposedPosition, worldUnitsPerPixel)
    : { position: { ...proposedPosition }, guides: [] as MagneticGuide[] };
  if (options.gridStep && Number.isFinite(options.gridStep) && options.gridStep > 0)
    for (const axis of ['x', 'y'] as const)
      if (!result.guides.some((guide) => guide.axis === axis))
        result.position[axis] = snap(result.position[axis], options.gridStep);
  // Extend guides to the final footprint after the other axis falls back to the grid.
  if (context)
    for (const guide of result.guides) {
      const target = context.references[guide.axis].find(
        (reference) =>
          reference.targetId === guide.targetId && reference.feature === guide.targetFeature,
      )!;
      const other = guide.axis === 'x' ? 'y' : 'x';
      const delta = result.position[other] - context.origin[other];
      const from =
        (guide.axis === 'x' ? context.movingBounds.minY : context.movingBounds.minX) + delta;
      const to =
        (guide.axis === 'x' ? context.movingBounds.maxY : context.movingBounds.maxX) + delta;
      guide.from = Math.min(from, target.from);
      guide.to = Math.max(to, target.to);
    }
  return result;
}
