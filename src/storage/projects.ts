import Dexie, { type EntityTable } from 'dexie';
import type { EquipmentDefinition, Project, ProjectRevision } from '../core/types';
import { newId } from '../core/project';
import { equipmentSchema, validateProjectData } from './schema';
export { parseProject, MAX_PROJECT_BYTES } from './schema';

export const db = new Dexie('stage-designer-pro') as Dexie & {
  projects: EntityTable<Project, 'id'>;
  revisions: EntityTable<ProjectRevision, 'id'>;
  definitions: EntityTable<EquipmentDefinition, 'id'>;
};
db.version(1).stores({
  projects: 'id, updatedAt, archived',
  revisions: 'id, projectId, createdAt',
  definitions: 'id, name',
});

export async function saveProject(project: Project): Promise<void> {
  const data = validateProjectData(project);
  await db.transaction('rw', db.projects, async () => {
    const stored = await db.projects.get(data.id);
    // Async autosaves may finish out of order; never replace a newer snapshot.
    if (!stored || data.updatedAt >= stored.updatedAt) await db.projects.put(structuredClone(data));
  });
}
export async function loadProject(id: string): Promise<Project | undefined> {
  const data = await db.projects.get(id);
  return data ? validateProjectData(data) : undefined;
}
export async function listProjects(): Promise<Project[]> {
  const projects = await db.projects.orderBy('updatedAt').reverse().toArray();
  return projects.map((project) => validateProjectData(project));
}
export async function deleteProject(id: string): Promise<void> {
  await db.transaction('rw', db.projects, db.revisions, async () => {
    await db.projects.delete(id);
    await db.revisions.where('projectId').equals(id).delete();
  });
}
export async function duplicateProject(project: Project): Promise<Project> {
  const copy = validateProjectData(structuredClone(project)),
    now = new Date().toISOString();
  const objectIds = new Map(copy.objects.map((o) => [o.id, newId()]));
  const layerIds = new Map(copy.layers.map((layer) => [layer.id, newId()]));
  for (const layer of copy.layers) layer.id = layerIds.get(layer.id)!;
  const sourceIds = new Map(copy.audioSources.map((s) => [s.id, newId()]));
  const profileIds = new Map(copy.audioProfiles.map((p) => [p.id, newId()]));
  const groupIds = new Map(copy.objects.filter((o) => o.groupId).map((o) => [o.groupId!, newId()]));
  copy.id = newId();
  copy.name = `${copy.name.slice(0, 190)} · copia`;
  copy.createdAt = now;
  copy.updatedAt = now;
  copy.archived = false;
  // An interference review belongs to the original project and its object IDs.
  // A copied design must review its conflicts independently.
  copy.interferenceReviews = [];
  for (const o of copy.objects) {
    o.id = objectIds.get(o.id)!;
    if (o.parentId) o.parentId = objectIds.get(o.parentId);
    if (o.layerId) o.layerId = layerIds.get(o.layerId);
    if (o.groupId) o.groupId = groupIds.get(o.groupId);
  }
  for (const s of copy.audioSources) {
    s.id = sourceIds.get(s.id)!;
    if (s.objectId) s.objectId = objectIds.get(s.objectId);
  }
  copy.activeAudioProfileId = profileIds.get(copy.activeAudioProfileId)!;
  for (const p of copy.audioProfiles) {
    p.id = profileIds.get(p.id)!;
    for (const i of p.inputs) {
      i.id = newId();
      i.sourceId = sourceIds.get(i.sourceId)!;
    }
    for (const o of p.outputs) {
      o.id = newId();
      o.destinationIds = o.destinationIds.map((id) => objectIds.get(id)!);
    }
  }
  await saveProject(copy);
  return copy;
}
export function exportProject(project: Project): string {
  return JSON.stringify(validateProjectData(project), null, 2);
}
export async function saveRevision(project: Project, name: string): Promise<ProjectRevision> {
  const revision: ProjectRevision = {
    id: newId(),
    projectId: project.id,
    name: name.trim().slice(0, 200) || 'Revisión',
    createdAt: new Date().toISOString(),
    project: validateProjectData(structuredClone(project)),
  };
  await db.revisions.add(revision);
  return revision;
}
export async function listRevisions(projectId: string): Promise<ProjectRevision[]> {
  const revisions = await db.revisions.where('projectId').equals(projectId).toArray();
  return revisions
    .map((revision) => ({ ...revision, project: validateProjectData(revision.project) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function loadRevision(id: string): Promise<ProjectRevision | undefined> {
  const revision = await db.revisions.get(id);
  if (revision) revision.project = validateProjectData(revision.project);
  return revision;
}
export async function listDefinitions(): Promise<EquipmentDefinition[]> {
  return db.definitions.orderBy('name').toArray();
}
export async function saveDefinition(definition: EquipmentDefinition): Promise<void> {
  const data = equipmentSchema.parse(definition);
  await db.definitions.put(data);
}
