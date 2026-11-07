import { z } from 'zod';
import type { Project } from '../core/types';
import { getDimensions } from '../core/geometry';
import { createDefaultLayers, getDefaultLayerId } from '../core/layers';

const id = z.string().min(1).max(128);
const text = z.string().max(2000);
const name = z.string().trim().min(1).max(200);
const metric = z.number().finite().positive().max(100);
const dimensions = z.object({ width: metric, depth: metric, height: metric }).strict();
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const equipmentSchema = z
  .object({
    id,
    version: z.number().int().positive().max(100000),
    name,
    category: z.enum(['Instrumentos', 'Audio', 'Escenario', 'Video', 'Personas']),
    kind: z.enum([
      'box',
      'drums',
      'keyboard',
      'guitar',
      'microphone',
      'monitor',
      'speaker',
      'person',
      'riser',
      'led',
      'line-array',
      'console',
    ]),
    dimensions,
    color,
    provenance: z.enum(['generic', 'user']),
    description: text,
  })
  .strict();
const parameters = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('led'),
      columns: z.number().int().min(1).max(100),
      rows: z.number().int().min(1).max(100),
      cabinetWidth: metric,
      cabinetHeight: metric,
      cabinetDepth: metric,
    })
    .strict(),
  z
    .object({
      type: z.literal('line-array'),
      count: z.number().int().min(1).max(64),
      cabinetWidth: metric,
      cabinetHeight: metric,
      cabinetDepth: metric,
      splayAngle: z.number().finite().min(-15).max(15),
    })
    .strict(),
]);
const sceneObject = z
  .object({
    id,
    label: name,
    definition: equipmentSchema,
    dimensions,
    position: z
      .object({
        x: z.number().finite().min(-10000).max(10000),
        y: z.number().finite().min(-10000).max(10000),
        z: z.number().finite().min(-100).max(1000),
      })
      .strict(),
    rotation: z.number().finite().min(-360000).max(360000),
    locked: z.boolean(),
    hidden: z.boolean(),
    groupId: id.optional(),
    parentId: id.optional(),
    parameters: parameters.optional(),
  })
  .strict();
const source = z
  .object({
    id,
    objectId: id.optional(),
    name,
    microphone: z.string().max(200),
    phantom: z.boolean(),
    notes: text,
  })
  .strict();
const input = z
  .object({
    id,
    sourceId: id,
    channel: z.number().int().min(1).max(4096),
    port: z.number().int().min(1).max(4096).nullable(),
    locked: z.boolean(),
  })
  .strict();
const output = z
  .object({
    id,
    channel: z.number().int().min(1).max(4096),
    name,
    bus: z.string().max(200),
    stereo: z.boolean(),
    destinationIds: z.array(id).max(2000),
  })
  .strict();
const profile = z
  .object({
    id,
    name,
    inputCapacity: z.number().int().min(1).max(4096),
    outputCapacity: z.number().int().min(1).max(4096),
    stageboxInputs: z.number().int().min(0).max(4096),
    inputs: z.array(input).max(4096),
    outputs: z.array(output).max(4096),
  })
  .strict();
const date = z.string().datetime();
// An import byte limit alone does not limit procedural mesh multiplication.
// Count approximate rendering primitives before any scene is mounted.
export const MAX_SCENE_COMPLEXITY = 6000;
const estimatedPrimitives: Record<string, number> = {
  box: 2,
  riser: 4,
  drums: 16,
  keyboard: 54,
  guitar: 6,
  microphone: 6,
  monitor: 3,
  speaker: 4,
  person: 8,
  console: 22,
  led: 2,
  'line-array': 4,
};
const baseProjectSchema = z
  .object({
    schemaVersion: z.literal(1),
    id,
    name,
    description: text,
    organization: z.string().max(200),
    eventDate: z.string().max(40),
    createdAt: date,
    updatedAt: date,
    archived: z.boolean(),
    stage: z
      .object({
        width: z.number().finite().positive().max(1000),
        depth: z.number().finite().positive().max(1000),
        height: z.number().finite().min(0).max(100),
        gridStep: z.number().finite().min(0.01).max(10),
        snap: z.boolean(),
        gridVisible: z.boolean(),
        color,
      })
      .strict(),
    objects: z.array(sceneObject).max(2000),
    audioSources: z.array(source).max(4096),
    audioProfiles: z.array(profile).min(1).max(50),
    activeAudioProfileId: id,
  })
  .strict();

function validateReferences(
  project: z.infer<typeof baseProjectSchema> | z.infer<typeof version2BaseSchema> | Project,
  ctx: z.RefinementCtx,
) {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
  const assertUnique = (ids: string[], scope: string) => {
    if (new Set(ids).size !== ids.length) fail(`Identificadores duplicados en ${scope}.`);
  };
  assertUnique(
    project.objects.map((o) => o.id),
    'objetos',
  );
  assertUnique(
    project.audioSources.map((s) => s.id),
    'fuentes',
  );
  assertUnique(
    project.audioProfiles.map((p) => p.id),
    'perfiles',
  );
  if ('layers' in project)
    assertUnique(
      project.layers.map((layer) => layer.id),
      'capas',
    );
  const layerIds = 'layers' in project ? new Set(project.layers.map((layer) => layer.id)) : null;
  const objectIds = new Set(project.objects.map((o) => o.id)),
    sourceIds = new Set(project.audioSources.map((s) => s.id));
  if ('interferenceReviews' in project) {
    assertUnique(
      project.interferenceReviews.map((review) => review.id),
      'revisiones de interferencia',
    );
    for (const review of project.interferenceReviews) {
      if (new Set(review.objectIds).size !== review.objectIds.length)
        fail('Una revisión de interferencia necesita objetos distintos.');
      if (review.objectIds.some((objectId) => !objectIds.has(objectId)))
        fail('Revisión de interferencia vinculada a un objeto inexistente.');
    }
  }
  if (!project.audioProfiles.some((p) => p.id === project.activeAudioProfileId))
    fail('El perfil de audio activo no existe.');
  const parentMap = new Map(project.objects.map((o) => [o.id, o.parentId]));
  const complexity = project.objects.reduce(
    (sum, o) =>
      sum +
      (o.parameters?.type === 'led'
        ? 2 * o.parameters.columns * o.parameters.rows
        : o.parameters?.type === 'line-array'
          ? 4 * o.parameters.count
          : estimatedPrimitives[o.definition.kind]),
    0,
  );
  if (complexity > MAX_SCENE_COMPLEXITY)
    fail(
      `La escena supera el límite de complejidad (${MAX_SCENE_COMPLEXITY} primitivas estimadas). Dividí el montaje en varios proyectos.`,
    );
  for (const o of project.objects) {
    if (layerIds && 'layerId' in o && o.layerId && !layerIds.has(o.layerId as string))
      fail(`Capa inexistente para ${o.label}.`);
    if (o.parentId && !objectIds.has(o.parentId)) fail(`Soporte inexistente para ${o.label}.`);
    const seen = new Set([o.id]);
    let parent = o.parentId;
    while (parent) {
      if (seen.has(parent)) {
        fail('Relación física circular.');
        break;
      }
      seen.add(parent);
      parent = parentMap.get(parent);
    }
    if (o.parameters && o.parameters.type !== o.definition.kind)
      fail('Parámetros incompatibles con el tipo de equipo.');
    if (
      o.parameters?.type === 'led' &&
      (o.parameters.columns * o.parameters.cabinetWidth > 100 ||
        o.parameters.rows * o.parameters.cabinetHeight > 100)
    )
      fail('La pantalla excede el límite de 100 m.');
    if (o.parameters) {
      const derived = getDimensions(o);
      if (
        Object.values(derived).some((value) => !Number.isFinite(value) || value <= 0 || value > 100)
      )
        fail('Las dimensiones paramétricas exceden los límites permitidos.');
      if (
        (['width', 'depth', 'height'] as const).some(
          (key) => Math.abs(derived[key] - o.dimensions[key]) > 0.00001,
        )
      )
        fail('Las dimensiones no coinciden con los parámetros del equipo.');
    }
  }
  for (const s of project.audioSources)
    if (s.objectId && !objectIds.has(s.objectId)) fail('Fuente vinculada a un objeto inexistente.');
  for (const p of project.audioProfiles) {
    assertUnique(
      p.inputs.map((i) => i.id),
      'entradas',
    );
    assertUnique(
      p.outputs.map((o) => o.id),
      'salidas',
    );
    for (const i of p.inputs)
      if (!sourceIds.has(i.sourceId)) fail('Entrada vinculada a una fuente inexistente.');
    for (const o of p.outputs)
      for (const destination of o.destinationIds)
        if (!objectIds.has(destination)) fail('Salida vinculada a un destino inexistente.');
  }
}

const layerSchema = z.object({ id, name, hidden: z.boolean(), locked: z.boolean() }).strict();
export const legacyProjectSchema = baseProjectSchema.superRefine(validateReferences);
const version2BaseSchema = baseProjectSchema
  .extend({
    schemaVersion: z.literal(2),
    layers: z.array(layerSchema).max(64),
    objects: z.array(sceneObject.extend({ layerId: id.optional() }).strict()).max(2000),
  })
  .strict();
export const version2ProjectSchema = version2BaseSchema.superRefine(validateReferences);
const reviewFields = {
  id,
  signature: z.string().min(1).max(8000),
  note: z.string().trim().min(1).max(2000),
  reviewedAt: date,
  revokedAt: date.optional(),
};
const interferenceReviewSchema = z.discriminatedUnion('kind', [
  z.object({ ...reviewFields, kind: z.literal('overlap'), objectIds: z.tuple([id, id]) }).strict(),
  z
    .object({ ...reviewFields, kind: z.literal('stage-penetration'), objectIds: z.tuple([id]) })
    .strict(),
]);
export const projectSchema = version2BaseSchema
  .extend({
    schemaVersion: z.literal(3),
    interferenceReviews: z.array(interferenceReviewSchema).max(2000),
    objects: z
      .array(
        sceneObject
          .extend({
            layerId: id.optional(),
            rotationPivot: z
              .object({
                x: z.number().finite().min(-100).max(100),
                y: z.number().finite().min(-100).max(100),
              })
              .strict()
              .optional(),
          })
          .strict(),
      )
      .max(2000),
  })
  .strict()
  .superRefine(validateReferences);

export const MAX_PROJECT_BYTES = 10 * 1024 * 1024;
function validationError(issues: Array<{ message: string }>): Error {
  return new Error(
    `Proyecto inválido: ${issues
      .slice(0, 3)
      .map((issue) => issue.message)
      .join(' ')}`,
  );
}

/** Validate each historical format before enriching it; never mutate stored snapshots. */
export function validateProjectData(data: unknown): Project {
  if (typeof data === 'object' && data !== null && 'schemaVersion' in data) {
    if (data.schemaVersion !== 1 && data.schemaVersion !== 2 && data.schemaVersion !== 3) {
      throw new Error(
        'Versión de proyecto no compatible. Se pueden abrir esquemas 1, 2 y 3; el guardado utiliza el esquema 3.',
      );
    }
    if (data.schemaVersion === 1) {
      const legacy = legacyProjectSchema.safeParse(data);
      if (!legacy.success) throw validationError(legacy.error.issues);
      data = {
        ...legacy.data,
        schemaVersion: 2,
        layers: createDefaultLayers(),
        objects: legacy.data.objects.map((object) => ({
          ...object,
          layerId: getDefaultLayerId(object.definition.category),
        })),
      };
    }
  }
  if (
    typeof data === 'object' &&
    data !== null &&
    'schemaVersion' in data &&
    data.schemaVersion === 2
  ) {
    const legacy = version2ProjectSchema.safeParse(data);
    if (!legacy.success) throw validationError(legacy.error.issues);
    data = { ...legacy.data, schemaVersion: 3, interferenceReviews: [] };
  }
  const result = projectSchema.safeParse(data);
  if (!result.success) throw validationError(result.error.issues);
  return result.data as Project;
}
export function parseProject(text: string): Project {
  if (new TextEncoder().encode(text).byteLength > MAX_PROJECT_BYTES)
    throw new Error('El proyecto supera el límite de 10 MB.');
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('El archivo no contiene JSON válido.');
  }
  return validateProjectData(data);
}
