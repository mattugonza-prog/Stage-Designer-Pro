import { beforeEach, describe, expect, it } from 'vitest';
import { catalog } from '../catalog/data';
import { createObject, createProject } from './project';
import { detectInterferences } from './collisions';
import { useEditorStore } from './store';
import { validateProjectData } from '../storage/schema';

const state = () => useEditorStore.getState();
beforeEach(() => {
  const project = createProject();
  const definition = catalog.find((d) => d.id === 'box')!;
  project.objects = [0, 0.2].map((x) => createObject(definition, { x, y: 3, z: 0.8 }));
  state().setProject(project);
});
describe('revisiones trazables de interferencias', () => {
  it('requiere motivo y geometría vigente, preserva una revisión reabierta y permite deshacer', () => {
    const issue = detectInterferences(state().project!).issues[0];
    state().reviewInterference(issue, '   ');
    expect(state().project!.interferenceReviews).toHaveLength(0);
    state().reviewInterference(issue, 'Solapamiento previsto del puesto');
    const review = state().project!.interferenceReviews[0];
    expect(review.signature).toBe(issue.signature);
    expect(review.note).toBe('Solapamiento previsto del puesto');
    state().revokeInterferenceReview(review.id);
    expect(state().project!.interferenceReviews[0].revokedAt).toBeTruthy();
    state().undo();
    expect(state().project!.interferenceReviews[0].revokedAt).toBeUndefined();
    expect(() => validateProjectData(state().project)).not.toThrow();
  });
  it('un cambio físico invalida el aviso presentado y no sobrescribe su trazabilidad', () => {
    const before = detectInterferences(state().project!).issues[0];
    state().reviewInterference(before, 'Posición inicial revisada');
    const o = state().project!.objects[1];
    state().updateObject(o.id, { position: { ...o.position, x: 0.4 } });
    state().reviewInterference(before, 'Aviso obsoleto');
    expect(state().project!.interferenceReviews).toHaveLength(1);
    const current = detectInterferences(state().project!).issues[0];
    expect(current.signature).not.toBe(before.signature);
    state().reviewInterference(current, 'Nueva posición revisada');
    expect(state().project!.interferenceReviews).toHaveLength(2);
    expect(state().project!.interferenceReviews[0].note).toBe('Posición inicial revisada');
  });
  it('eliminar un equipo limpia referencias; deshacer recupera sus revisiones', () => {
    state().reviewInterference(detectInterferences(state().project!).issues[0], 'Intencional');
    const before = structuredClone(state().project!);
    state().select(before.objects[0].id);
    state().deleteSelected();
    expect(state().project!.interferenceReviews).toHaveLength(0);
    expect(() => validateProjectData(state().project)).not.toThrow();
    state().undo();
    expect(state().project!.interferenceReviews).toEqual(before.interferenceReviews);
  });
  it('configurar pivote no mueve geometría y respeta bloqueos y límites', () => {
    const o = state().project!.objects[0];
    state().setRotationPivot(o.id, { x: 0.5, y: -0.5 });
    expect(state().project!.objects[0].position).toEqual(o.position);
    expect(state().project!.objects[0].rotationPivot).toEqual({ x: 0.5, y: -0.5 });
    state().updateObject(o.id, { locked: true });
    state().setRotationPivot(o.id, undefined);
    expect(state().project!.objects[0].rotationPivot).toEqual({ x: 0.5, y: -0.5 });
    state().updateObject(o.id, { locked: false });
    state().setRotationPivot(o.id, { x: Infinity, y: 0 });
    expect(state().project!.objects[0].rotationPivot).toEqual({ x: 0.5, y: -0.5 });
    state().setRotationPivot(o.id, undefined);
    expect(state().project!.objects[0].rotationPivot).toBeUndefined();
  });
});
