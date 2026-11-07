import { describe, expect, it } from 'vitest';
import { createDemoProject, createProject } from '../core/project';
import {
  activeProfile,
  cloneProfile,
  getInventory,
  newInput,
  suggestPatch,
  validateAudio,
} from './model';
import type { AudioSource } from '../core/types';

const source = (name: string): AudioSource => ({
  id: crypto.randomUUID(),
  name,
  microphone: 'DI genérica',
  phantom: false,
  notes: '',
});
function patchFixture() {
  const project = createProject('Prueba audio');
  const profile = activeProfile(project)!;
  project.audioSources.push(source('Voz'), source('Teclado L'), source('Teclado R'));
  for (const item of project.audioSources) profile.inputs.push(newInput(profile, item));
  return { project, profile };
}

describe('audio routing and independent configurations', () => {
  it('uses stable source identities while a logical channel can differ from its physical port', () => {
    const { project, profile } = patchFixture();
    profile.inputs[0].channel = 8;
    profile.inputs[0].port = 3;
    const id = profile.inputs[0].sourceId;
    expect(project.audioSources.find((s) => s.id === id)?.name).toBe('Voz');
    expect(validateAudio(project).some((i) => i.id.includes('conflict'))).toBe(false);
    expect(profile.inputs[0].channel).not.toBe(profile.inputs[0].port);
  });
  it('detects conflicting logical channels and stagebox ports independently', () => {
    const { project, profile } = patchFixture();
    profile.inputs[0].port = 4;
    profile.inputs[1].port = 4;
    profile.inputs[2].channel = profile.inputs[0].channel;
    const issues = validateAudio(project);
    expect(issues.some((i) => i.id.endsWith('port-conflict') && i.severity === 'error')).toBe(true);
    expect(issues.some((i) => i.id.endsWith('channel-conflict') && i.severity === 'error')).toBe(
      true,
    );
  });
  it('rejects resources beyond console and stagebox capacities without deleting sources', () => {
    const { project, profile } = patchFixture();
    profile.inputCapacity = 2;
    profile.stageboxInputs = 1;
    profile.inputs[0].port = 2;
    const issues = validateAudio(project);
    expect(issues.some((i) => i.id.endsWith('channel-capacity'))).toBe(true);
    expect(issues.some((i) => i.id.endsWith('port-capacity'))).toBe(true);
    expect(project.audioSources).toHaveLength(3);
  });
  it('auto patch preserves all existing assignments and skips locked empty ports', () => {
    const { profile } = patchFixture();
    profile.stageboxInputs = 4;
    profile.inputs[0].port = 3;
    profile.inputs[1].locked = true;
    const before = structuredClone(profile);
    const proposed = suggestPatch(profile);
    expect(proposed.inputs.map((i) => i.port)).toEqual([3, null, 1]);
    expect(proposed.inputs.map((i) => i.channel)).toEqual(before.inputs.map((i) => i.channel));
    expect(profile).toEqual(before);
  });
  it('leaves exhausted auto patch assignments pending instead of inventing ports', () => {
    const { profile } = patchFixture();
    profile.stageboxInputs = 2;
    expect(suggestPatch(profile).inputs.map((i) => i.port)).toEqual([1, 2, null]);
  });
  it('requires two physical ports for stereo and catches overlap with mono', () => {
    const { project, profile } = patchFixture();
    profile.outputCapacity = 2;
    profile.outputs = [
      { id: 'iem', channel: 1, name: 'IEM', bus: 'AUX1-2', stereo: true, destinationIds: [] },
      { id: 'wedge', channel: 2, name: 'Cuña', bus: 'AUX3', stereo: false, destinationIds: [] },
    ];
    expect(validateAudio(project).some((i) => i.id.endsWith('conflict-2'))).toBe(true);
    profile.outputs[0].channel = 2;
    expect(validateAudio(project).some((i) => i.id.endsWith('capacity-3'))).toBe(true);
  });
  it('allows two monitor destinations to share one bus and one output', () => {
    const project = createDemoProject();
    const profile = activeProfile(project)!;
    const wedges = project.objects.filter((o) => o.definition.kind === 'monitor');
    profile.outputs = [
      {
        id: 'shared',
        channel: 1,
        name: 'Mezcla compartida',
        bus: 'AUX1',
        stereo: false,
        destinationIds: wedges.slice(0, 2).map((o) => o.id),
      },
    ];
    expect(profile.outputs[0].destinationIds).toHaveLength(2);
    expect(validateAudio(project).filter((i) => i.id.includes('shared'))).toEqual([]);
  });
  it('duplicates patch IDs without duplicating sources or mutating geometry', () => {
    const project = createDemoProject();
    const first = activeProfile(project)!;
    const sceneBefore = structuredClone(project.objects);
    const copy = cloneProfile(first, 'Perfil alternativo');
    project.audioProfiles.push(copy);
    project.activeAudioProfileId = copy.id;
    copy.inputs[0].channel = 27;
    expect(copy.id).not.toBe(first.id);
    expect(copy.inputs[0].id).not.toBe(first.inputs[0].id);
    expect(copy.inputs[0].sourceId).toBe(first.inputs[0].sourceId);
    expect(first.inputs[0].channel).toBe(1);
    expect(project.objects).toEqual(sceneBefore);
    expect(activeProfile(project)?.name).toBe('Perfil alternativo');
  });
  it('scopes document validation to the selected profile while global validation retains conflicts', () => {
    const { project, profile } = patchFixture();
    profile.inputs = suggestPatch(profile).inputs;
    const alternative = cloneProfile(profile, 'Perfil insuficiente');
    alternative.inputCapacity = 1;
    project.audioProfiles.push(alternative);
    expect(
      validateAudio(project).some((issue) => issue.message.includes('Perfil insuficiente')),
    ).toBe(true);
    expect(
      validateAudio(project, profile.id).some((issue) =>
        issue.message.includes('Perfil insuficiente'),
      ),
    ).toBe(false);
  });
  it('reports stale references and unmapped sources without throwing', () => {
    const { project, profile } = patchFixture();
    profile.inputs[0].sourceId = 'missing';
    project.audioSources[1].objectId = 'deleted-object';
    const issues = validateAudio(project);
    expect(issues.some((i) => i.id.endsWith('-source'))).toBe(true);
    expect(issues.some((i) => i.id.includes('-unmapped-'))).toBe(true);
    expect(issues.some((i) => i.id.startsWith('audio-source-object-'))).toBe(true);
  });
});

describe('derived equipment inventory', () => {
  it('counts LED cabinets and each array cabinet, including hidden equipment', () => {
    const project = createDemoProject();
    const led = project.objects.find((o) => o.parameters?.type === 'led')!;
    led.hidden = true;
    const inventory = getInventory(project);
    expect(inventory.find((row) => row.category === 'Video')?.quantity).toBe(50);
    const arrayRow = inventory.find((row) => row.id.includes('line-array'))!;
    expect(arrayRow.quantity).toBe(12);
    expect(arrayRow.provenance).toBe('Genérico / estimado');
    const array = project.objects.find((o) => o.parameters?.type === 'line-array')!;
    if (array.parameters?.type === 'line-array') array.parameters.count = 8;
    expect(getInventory(project).find((row) => row.id.includes('line-array'))?.quantity).toBe(14);
  });
  it('keeps different physical dimensions and definition versions as separate inventory rows', () => {
    const project = createDemoProject();
    const object = project.objects.find((o) => o.definition.kind === 'monitor')!;
    const originalCount = getInventory(project).filter((row) =>
      row.id.startsWith(object.definition.id + ':'),
    ).length;
    object.dimensions.width += 0.13;
    expect(
      getInventory(project).filter((row) => row.id.startsWith(object.definition.id + ':')),
    ).toHaveLength(originalCount + 1);
  });
});
