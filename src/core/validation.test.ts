import { describe, expect, it } from 'vitest';
import { catalog } from '../catalog/data';
import { createObject, createProject, newId } from './project';
import { getInterferenceReviewStatus, inspectProject } from './validation';

function scene() {
  const project = createProject();
  const definition = catalog.find((d) => d.id === 'box')!;
  project.objects = [0, 0.2].map((x) => createObject(definition, { x, y: 3, z: 0.8 }));
  const issue = inspectProject(project).interferences.issues[0];
  project.interferenceReviews.push({
    id: newId(),
    kind: issue.kind,
    objectIds: issue.objectIds,
    signature: issue.signature,
    note: 'Puesto combinado',
    reviewedAt: project.createdAt,
  });
  return project;
}
describe('validación compartida de interferencias', () => {
  it('una revisión vigente es información conservada; mover un equipo vuelve a generar advertencia', () => {
    const project = scene();
    expect(inspectProject(project).issues).toHaveLength(0);
    expect(inspectProject(project).activeReviews.size).toBe(1);
    project.objects[0].position.x = -0.1;
    expect(inspectProject(project).issues).toHaveLength(1);
    expect(inspectProject(project).activeReviews.size).toBe(0);
    expect(getInterferenceReviewStatus(project, project.interferenceReviews[0])).toBe('outdated');
  });
  it('renombrar u ocultar no altera la revisión geométrica; reabrir conserva su registro', () => {
    const project = scene();
    project.objects[0].label = 'Nombre actualizado';
    project.objects[1].hidden = true;
    expect(inspectProject(project).activeReviews.size).toBe(1);
    project.interferenceReviews[0].revokedAt = project.updatedAt;
    expect(inspectProject(project).issues).toHaveLength(1);
    expect(getInterferenceReviewStatus(project, project.interferenceReviews[0])).toBe('revoked');
  });
  it('una revisión importada con firma coincidente pero objetos diferentes no silencia avisos', () => {
    const project = scene();
    project.interferenceReviews[0].objectIds = [project.objects[0].id];
    expect(inspectProject(project).activeReviews.size).toBe(0);
    expect(inspectProject(project).issues).toHaveLength(1);
  });
});
