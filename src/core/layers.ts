import type { Category, Project, SceneLayer, SceneObject } from './types';

const DEFAULT_LAYERS: ReadonlyArray<Readonly<SceneLayer & { category: Category }>> = [
  {
    id: 'layer-instrumentos',
    name: 'Instrumentos',
    category: 'Instrumentos',
    hidden: false,
    locked: false,
  },
  { id: 'layer-audio', name: 'Audio', category: 'Audio', hidden: false, locked: false },
  { id: 'layer-escenario', name: 'Escenario', category: 'Escenario', hidden: false, locked: false },
  { id: 'layer-video', name: 'Video', category: 'Video', hidden: false, locked: false },
  { id: 'layer-personas', name: 'Personas', category: 'Personas', hidden: false, locked: false },
];

/** Stable defaults let legacy projects acquire layers without changing any existing identity. */
export function getDefaultLayerId(category: Category): string {
  return DEFAULT_LAYERS.find((layer) => layer.category === category)!.id;
}

export function createDefaultLayers(): SceneLayer[] {
  return DEFAULT_LAYERS.map(({ id, name, hidden, locked }) => ({ id, name, hidden, locked }));
}

/** A support and its child can belong to different departments; flags do not inherit. */
export function isObjectHidden(project: Pick<Project, 'layers'>, object: SceneObject): boolean {
  return object.hidden || !!project.layers.find((layer) => layer.id === object.layerId)?.hidden;
}

/** Physical transform propagation checks every affected object separately. */
export function isObjectLocked(project: Pick<Project, 'layers'>, object: SceneObject): boolean {
  return object.locked || !!project.layers.find((layer) => layer.id === object.layerId)?.locked;
}
