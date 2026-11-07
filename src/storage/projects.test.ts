import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { catalog } from '../catalog/data';
import { createDemoProject, createProject } from '../core/project';
import {
  db,
  deleteProject,
  duplicateProject,
  exportProject,
  listDefinitions,
  listProjects,
  listRevisions,
  loadProject,
  loadRevision,
  parseProject,
  saveDefinition,
  saveProject,
  saveRevision,
} from './projects';
import { MAX_PROJECT_BYTES, validateProjectData } from './schema';

beforeEach(async () => {
  await Promise.all([db.projects.clear(), db.revisions.clear(), db.definitions.clear()]);
});
describe('persistencia IndexedDB y paquetes Stagepro', () => {
  it('guarda y recupera toda la escena demo, medidas, relaciones, entradas y salidas', async () => {
    const p = createDemoProject();
    await saveProject(p);
    expect(await loadProject(p.id)).toEqual(p);
    expect(parseProject(exportProject(p))).toEqual(p);
    expect(await listProjects()).toHaveLength(1);
    // Reopen the database to exercise storage, not a cache of an object reference.
    db.close();
    await db.open();
    expect(await loadProject(p.id)).toEqual(p);
  });
  it('las revisiones son instantáneas independientes e inmutables desde el proyecto vivo', async () => {
    const p = createDemoProject();
    await saveProject(p);
    const before = structuredClone(p);
    const revision = await saveRevision(p, 'Diseño aprobado');
    p.objects[0].position.x += 3;
    p.audioProfiles[0].inputs[0].channel = 23;
    await saveProject(p);
    expect((await loadRevision(revision.id))!.project).toEqual(before);
    expect(await listRevisions(p.id)).toHaveLength(1);
    await deleteProject(p.id);
    expect(await loadProject(p.id)).toBeUndefined();
    expect(await listRevisions(p.id)).toEqual([]);
  });
  it('preserva pivotes y trazabilidad de interferencias al guardar, exportar y recuperar una revisión', async () => {
    const p = createDemoProject();
    p.objects[0].rotationPivot = { x: -1, y: 0.5 };
    p.interferenceReviews = [
      {
        id: 'review-1',
        objectIds: [p.objects[0].id, p.objects[1].id],
        kind: 'overlap',
        signature: 'estado físico revisado',
        note: 'Contacto intencional documentado',
        reviewedAt: p.createdAt,
      },
    ];
    await saveProject(p);
    const before = structuredClone(p),
      snapshot = await saveRevision(p, 'Antes de reabrir');
    p.interferenceReviews[0].revokedAt = new Date(Date.parse(p.updatedAt) + 1).toISOString();
    p.updatedAt = p.interferenceReviews[0].revokedAt;
    p.objects[0].rotationPivot = { x: 0, y: 0 };
    await saveProject(p);
    db.close();
    await db.open();
    expect(await loadProject(p.id)).toEqual(p);
    expect(parseProject(exportProject(p))).toEqual(p);
    expect((await loadRevision(snapshot.id))?.project).toEqual(before);
  });
  it('duplicar un proyecto remapea IDs, canales y relaciones sin tocar el original', async () => {
    const original = createDemoProject();
    await saveProject(original);
    const copy = await duplicateProject(original);
    expect(copy.id).not.toBe(original.id);
    expect(copy.objects).toHaveLength(original.objects.length);
    expect(copy.audioProfiles[0].id).not.toBe(original.audioProfiles[0].id);
    expect(copy.audioSources[0].id).not.toBe(original.audioSources[0].id);
    expect(copy.audioProfiles[0].inputs[0].sourceId).toBe(copy.audioSources[0].id);
    expect(copy.objects.find((o) => o.parentId)!.parentId).toBe(
      copy.objects.find((o) => o.definition.kind === 'riser')!.id,
    );
    expect(() => validateProjectData(copy)).not.toThrow();
    expect(await loadProject(original.id)).toEqual(original);
  });
  it('un autosave tardío no sobrescribe una edición más reciente', async () => {
    const p = createProject(),
      newer = structuredClone(p);
    newer.updatedAt = new Date(Date.parse(p.updatedAt) + 100).toISOString();
    newer.name = 'Más reciente';
    await saveProject(newer);
    await saveProject(p);
    expect((await loadProject(p.id))!.name).toBe('Más reciente');
  });
  it('una actualización de catálogo no cambia equipos ni revisiones existentes', async () => {
    const p = createDemoProject(),
      before = structuredClone(p.objects[0].definition),
      definition = structuredClone(catalog[0]);
    await saveProject(p);
    await saveDefinition(definition);
    definition.version = 2;
    definition.dimensions.width = 4;
    await saveDefinition(definition);
    expect((await listDefinitions())[0].version).toBe(2);
    expect((await loadProject(p.id))!.objects[0].definition).toEqual(before);
  });
  it.each(['{', 'null', '{}', '[]'])(
    'rechaza archivos JSON inválidos o incompletos: %s',
    (text) => {
      expect(() => parseProject(text)).toThrow();
    },
  );
  it('rechaza versiones desconocidas y límites de tamaño', () => {
    const p = createProject();
    expect(() => parseProject(JSON.stringify({ ...p, schemaVersion: 999 }))).toThrow(/Versión/);
    expect(() => parseProject(' '.repeat(MAX_PROJECT_BYTES + 1))).toThrow(/10 MB/);
  });
  it('rechaza IDs duplicados, referencias inexistentes y relaciones circulares', () => {
    const p = createDemoProject();
    p.objects.push(structuredClone(p.objects[0]));
    expect(() => validateProjectData(p)).toThrow(/duplicados/);
    p.objects.pop();
    p.audioSources[0].objectId = 'missing';
    expect(() => validateProjectData(p)).toThrow(/inexistente/);
    delete p.audioSources[0].objectId;
    p.objects[0].parentId = p.objects[1].id;
    p.objects[1].parentId = p.objects[0].id;
    expect(() => validateProjectData(p)).toThrow(/circular/);
  });
  it('rechaza geometría malformada y dimensiones paramétricas incoherentes', () => {
    const p = createDemoProject();
    p.objects[0].dimensions.width = -2;
    expect(() => validateProjectData(p)).toThrow();
    const ledProject = createDemoProject(),
      led = ledProject.objects.find((o) => o.parameters?.type === 'led')!;
    led.dimensions.width = 3;
    expect(() => validateProjectData(ledProject)).toThrow(/parámetros/);
  });
  it('limita la expansión procedural de gabinetes aunque el archivo sea pequeño', () => {
    const p = createDemoProject(),
      led = p.objects.find((o) => o.parameters?.type === 'led')!;
    if (led.parameters?.type !== 'led') throw new Error('Expected LED');
    led.parameters.columns = 100;
    led.parameters.rows = 100;
    led.dimensions = { width: 50, depth: 0.1, height: 50 };
    expect(JSON.stringify(p).length).toBeLessThan(MAX_PROJECT_BYTES);
    expect(() => validateProjectData(p)).toThrow(/complejidad/);
  });
});
