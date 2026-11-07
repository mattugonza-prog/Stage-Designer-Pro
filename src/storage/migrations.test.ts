import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createDemoProject, newId } from '../core/project';
import { getDefaultLayerId } from '../core/layers';
import {
  db,
  saveProject,
  loadProject,
  listProjects,
  listRevisions,
  loadRevision,
  duplicateProject,
  exportProject,
} from './projects';
import { validateProjectData, parseProject } from './schema';
import type { InterferenceReview, Project } from '../core/types';
import { useEditorStore } from '../core/store';

function legacy2() {
  const {
    interferenceReviews: _reviews,
    schemaVersion: _version,
    objects,
    ...p
  } = createDemoProject();
  return {
    ...p,
    schemaVersion: 2 as const,
    objects: objects.map(({ rotationPivot: _pivot, ...o }) => o),
  };
}
function legacy() {
  const { layers: _layers, schemaVersion: _version, objects, ...p } = legacy2();
  return {
    ...p,
    schemaVersion: 1 as const,
    objects: objects.map(({ layerId: _layerId, ...o }) => o),
  };
}
function review(project: Project): InterferenceReview {
  return {
    id: newId(),
    objectIds: project.objects.slice(0, 2).map((o) => o.id),
    kind: 'overlap',
    signature: 'geometría revisada',
    note: 'Solape intencional del montaje',
    reviewedAt: project.updatedAt,
  };
}
beforeEach(async () => {
  await db.projects.clear();
  await db.revisions.clear();
});
describe('migración de proyectos y revisiones de esquemas 1 y 2 a 3', () => {
  it('conserva identidades, geometría, estados y audio; añade capas y una lista vacía de revisiones', () => {
    const v1 = legacy();
    v1.objects[1].locked = true;
    v1.objects[2].hidden = true;
    const original = structuredClone(v1);
    const current = parseProject(JSON.stringify(v1));
    expect(current.schemaVersion).toBe(3);
    expect(current.layers).toHaveLength(5);
    expect(current.interferenceReviews).toEqual([]);
    expect(current.objects.map(({ layerId: _layerId, ...o }) => o)).toEqual(v1.objects);
    expect(current.audioSources).toEqual(v1.audioSources);
    expect(current.audioProfiles).toEqual(v1.audioProfiles);
    expect(current.id).toBe(v1.id);
    expect(current.updatedAt).toBe(v1.updatedAt);
    expect(v1).toEqual(original);
    for (const o of current.objects)
      expect(o.layerId).toBe(getDefaultLayerId(o.definition.category));
    expect(parseProject(exportProject(current))).toEqual(current);
  });
  it('migra el esquema 2 conservando sus capas, flags y todos los datos físicos y técnicos', () => {
    const v2 = legacy2();
    v2.layers[0].hidden = true;
    v2.layers[1].locked = true;
    const original = structuredClone(v2);
    const current = parseProject(JSON.stringify(v2));
    const { interferenceReviews, schemaVersion, ...rest } = current;
    const { schemaVersion: _oldVersion, ...oldRest } = v2;
    expect(schemaVersion).toBe(3);
    expect(interferenceReviews).toEqual([]);
    expect(rest).toEqual(oldRest);
    expect(v2).toEqual(original);
    expect(current.objects.every((o) => o.rotationPivot === undefined)).toBe(true);
  });
  it('no permite camuflar campos nuevos ni capas inválidas como documentos del esquema 2', () => {
    const v2 = legacy2();
    expect(() => validateProjectData({ ...v2, interferenceReviews: [] })).toThrow(/inválido/);
    expect(() =>
      validateProjectData({
        ...v2,
        objects: v2.objects.map((o) => ({ ...o, rotationPivot: { x: 0, y: 0 } })),
      }),
    ).toThrow(/inválido/);
    v2.objects[0].layerId = 'missing';
    expect(() => validateProjectData(v2)).toThrow(/Capa inexistente/);
  });
  it('leer proyecto y revisión v2 no reescribe sus registros hasta el guardado explícito', async () => {
    const v2 = legacy2(),
      id = newId();
    await db.projects.put(v2 as unknown as Project);
    await db.revisions.put({
      id,
      projectId: v2.id,
      name: 'Diseño v2',
      createdAt: v2.createdAt,
      project: v2 as unknown as Project,
    });
    const opened = await loadProject(v2.id);
    expect(opened?.schemaVersion).toBe(3);
    expect((await listProjects())[0].schemaVersion).toBe(3);
    expect((await listRevisions(v2.id))[0].project.schemaVersion).toBe(3);
    expect((await loadRevision(id))?.project.schemaVersion).toBe(3);
    expect(await db.projects.get(v2.id)).toEqual(v2);
    expect((await db.revisions.get(id))?.project).toEqual(v2);
    await saveProject(opened!);
    expect((await db.projects.get(v2.id))?.schemaVersion).toBe(3);
    expect((await db.revisions.get(id))?.project).toEqual(v2);
  });
  it('valida el formato antiguo antes de migrarlo y rechaza versiones desconocidas', () => {
    const v1 = legacy();
    v1.objects[0].position.x = Infinity;
    expect(() => validateProjectData(v1)).toThrow(/inválido/);
    expect(() => validateProjectData({ ...legacy(), layers: [] })).toThrow(/inválido/);
    expect(() => validateProjectData({ ...legacy(), schemaVersion: 4 })).toThrow(/Versión/);
  });
  it('lee registros existentes sin reescribirlos y sólo guarda v3 al solicitar guardado', async () => {
    const v1 = legacy();
    await db.projects.put(v1 as unknown as Project);
    const listed = await listProjects(),
      opened = await loadProject(v1.id);
    expect(listed[0].schemaVersion).toBe(3);
    expect(opened?.objects).toEqual(listed[0].objects);
    expect((await db.projects.get(v1.id))?.schemaVersion).toBe(1);
    await saveProject(opened!);
    expect((await db.projects.get(v1.id))?.schemaVersion).toBe(3);
  });
  it('preserva la instantánea antigua al leer revisiones para recuperar o reexportar', async () => {
    const v1 = legacy(),
      id = newId();
    await db.revisions.put({
      id,
      projectId: v1.id,
      name: 'Montaje v1',
      createdAt: v1.createdAt,
      project: v1 as unknown as Project,
    });
    const fromList = (await listRevisions(v1.id))[0],
      fromId = await loadRevision(id);
    expect(fromList.project.schemaVersion).toBe(3);
    expect(fromId?.project).toEqual(fromList.project);
    expect((await db.revisions.get(id))?.project.schemaVersion).toBe(1);
    expect((await db.revisions.get(id))?.project.objects).toEqual(v1.objects);
  });
  it('rechaza capas duplicadas, referencias inexistentes y más de 64 capas', () => {
    const p = createDemoProject();
    p.layers.push({ ...p.layers[0] });
    expect(() => validateProjectData(p)).toThrow(/duplicados/);
    p.layers.pop();
    p.objects[0].layerId = 'inexistente';
    expect(() => validateProjectData(p)).toThrow(/Capa inexistente/);
    delete p.objects[0].layerId;
    p.layers = Array.from({ length: 65 }, (_, i) => ({
      id: String(i),
      name: String(i),
      hidden: false,
      locked: false,
    }));
    expect(() => validateProjectData(p)).toThrow();
  });
  it('duplicar remapea capas; nuevos equipos siguen teniendo referencias válidas', async () => {
    const original = createDemoProject();
    const duplicate = await duplicateProject(original);
    expect(duplicate.layers.some((l) => original.layers.some((o) => o.id === l.id))).toBe(false);
    expect(
      duplicate.objects.every(
        (o) => !o.layerId || duplicate.layers.some((l) => l.id === o.layerId),
      ),
    ).toBe(true);
    useEditorStore.getState().setProject(duplicate);
    useEditorStore.getState().addObject(original.objects[0].definition);
    expect(() => validateProjectData(useEditorStore.getState().project)).not.toThrow();
  });
  it('valida pivotes locales finitos, su rango y la forma estricta sin cambiar la pose', () => {
    const p = createDemoProject(),
      before = structuredClone(p.objects[0]);
    p.objects[0].rotationPivot = { x: -0.75, y: 1.25 };
    const parsed = parseProject(exportProject(p));
    expect(parsed.objects[0]).toEqual({ ...before, rotationPivot: { x: -0.75, y: 1.25 } });
    for (const pivot of [
      { x: Infinity, y: 0 },
      { x: 0, y: NaN },
      { x: 100.001, y: 0 },
      { x: 0, y: -100.001 },
      { x: 0, y: 0, z: 0 },
    ]) {
      p.objects[0].rotationPivot = pivot;
      expect(() => validateProjectData(p)).toThrow(/inválido/);
    }
  });
  it('rechaza revisiones con identidades o referencias inválidas y cantidades incompatibles', () => {
    const p = createDemoProject(),
      valid = review(p);
    p.interferenceReviews = [valid];
    expect(() => validateProjectData(p)).not.toThrow();
    for (const objectIds of [
      [],
      [p.objects[0].id],
      [p.objects[0].id, p.objects[0].id],
      [p.objects[0].id, 'missing'],
    ]) {
      p.interferenceReviews = [{ ...valid, objectIds }];
      expect(() => validateProjectData(p)).toThrow(/inválido/);
    }
    p.interferenceReviews = [{ ...valid, kind: 'stage-penetration' }];
    expect(() => validateProjectData(p)).toThrow(/inválido/);
    p.interferenceReviews = [{ ...valid, kind: 'stage-penetration', objectIds: [p.objects[0].id] }];
    expect(() => validateProjectData(p)).not.toThrow();
    p.interferenceReviews = [valid, { ...valid }];
    expect(() => validateProjectData(p)).toThrow(/duplicados/);
  });
  it('limita y valida notas, firma, fechas y número de revisiones', () => {
    const p = createDemoProject(),
      valid = review(p);
    for (const patch of [
      { note: '   ' },
      { note: 'a'.repeat(2001) },
      { signature: '' },
      { signature: 'x'.repeat(8001) },
      { reviewedAt: 'ayer' },
      { revokedAt: 'mañana' },
    ]) {
      p.interferenceReviews = [{ ...valid, ...patch }];
      expect(() => validateProjectData(p)).toThrow(/inválido/);
    }
    p.interferenceReviews = Array.from({ length: 2001 }, (_, i) => ({
      ...valid,
      id: `review-${i}`,
    }));
    expect(() => validateProjectData(p)).toThrow(/inválido/);
  });
  it('la copia conserva pivotes pero reinicia revisiones de interferencia sin tocar las originales', async () => {
    const p = createDemoProject();
    p.objects[0].rotationPivot = { x: 0.8, y: -0.4 };
    p.interferenceReviews = [review(p)];
    const before = structuredClone(p);
    const copy = await duplicateProject(p);
    expect(copy.interferenceReviews).toEqual([]);
    expect(copy.objects[0].rotationPivot).toEqual(p.objects[0].rotationPivot);
    expect(copy.objects[0].id).not.toBe(p.objects[0].id);
    expect(p).toEqual(before);
    expect(await loadProject(copy.id)).toEqual(copy);
  });
});
