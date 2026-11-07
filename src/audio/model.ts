import type {
  AudioInput,
  AudioProfile,
  AudioSource,
  Project,
  ValidationIssue,
} from '../core/types';
import { getDimensions } from '../core/geometry';

export const activeProfile = (project: Project): AudioProfile | undefined =>
  project.audioProfiles.find((p) => p.id === project.activeAudioProfileId);
export interface InventoryRow {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  dimensions: string;
  provenance: string;
}

export function getInventory(project: Project): InventoryRow[] {
  const rows = new Map<string, InventoryRow>();
  for (const object of project.objects) {
    const parameters = object.parameters;
    const modular = parameters?.type === 'led' || parameters?.type === 'line-array';
    const dimensions = modular
      ? {
          width: parameters.cabinetWidth,
          depth: parameters.cabinetDepth,
          height: parameters.cabinetHeight,
        }
      : getDimensions(object);
    const size = `${dimensions.width.toFixed(3)} × ${dimensions.depth.toFixed(3)} × ${dimensions.height.toFixed(3)} m`;
    const id = `${object.definition.id}:${object.definition.version}:${size}:${parameters?.type ?? 'item'}`;
    const quantity =
      parameters?.type === 'led'
        ? parameters.columns * parameters.rows
        : parameters?.type === 'line-array'
          ? parameters.count
          : 1;
    const existing = rows.get(id);
    if (existing) existing.quantity += quantity;
    else
      rows.set(id, {
        id,
        name: `${object.definition.name}${modular ? ' · gabinete' : ''}`,
        category: object.definition.category,
        quantity,
        unit: modular ? 'gabinetes' : 'unidades',
        dimensions: size,
        provenance:
          object.definition.provenance === 'generic'
            ? 'Genérico / estimado'
            : 'Introducido por el usuario',
      });
  }
  return [...rows.values()].sort(
    (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  );
}

export function validateAudio(project: Project, profileId?: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const sourceIds = new Set(project.audioSources.map((source) => source.id));
  const objects = new Set(project.objects.map((object) => object.id));
  const add = (id: string, severity: 'error' | 'warning', message: string, objectId?: string) =>
    issues.push({ id, severity, message, objectId });
  if (!activeProfile(project))
    add('audio-profile', 'error', 'No hay un perfil de audio activo válido.');
  for (const source of project.audioSources)
    if (source.objectId && !objects.has(source.objectId))
      add(
        `audio-source-object-${source.id}`,
        'warning',
        `La fuente «${source.name}» apunta a un elemento que ya no existe.`,
      );
  for (const profile of project.audioProfiles.filter(
    (profile) => !profileId || profile.id === profileId,
  )) {
    const channels = new Map<number, string>();
    const ports = new Map<number, string>();
    for (const input of profile.inputs) {
      const source = project.audioSources.find((s) => s.id === input.sourceId);
      const label = `${profile.name} · ${source?.name ?? 'Fuente ausente'}`;
      const prefix = `audio-${profile.id}-${input.id}`;
      if (!sourceIds.has(input.sourceId))
        add(`${prefix}-source`, 'error', `${label}: referencia a una fuente inexistente.`);
      if (
        !Number.isInteger(input.channel) ||
        input.channel < 1 ||
        input.channel > profile.inputCapacity
      )
        add(
          `${prefix}-channel-capacity`,
          'error',
          `${label}: canal ${input.channel} fuera de la capacidad (${profile.inputCapacity}).`,
          source?.objectId,
        );
      if (channels.has(input.channel))
        add(
          `${prefix}-channel-conflict`,
          'error',
          `${profile.name}: canal lógico ${input.channel} asignado a más de una entrada.`,
          source?.objectId,
        );
      channels.set(input.channel, input.id);
      if (input.port === null)
        add(
          `${prefix}-unpatched`,
          'warning',
          `${label}: puerto físico pendiente.`,
          source?.objectId,
        );
      else {
        if (!Number.isInteger(input.port) || input.port < 1 || input.port > profile.stageboxInputs)
          add(
            `${prefix}-port-capacity`,
            'error',
            `${label}: puerto ${input.port} fuera de la stagebox (${profile.stageboxInputs}).`,
            source?.objectId,
          );
        if (ports.has(input.port))
          add(
            `${prefix}-port-conflict`,
            'error',
            `${profile.name}: el puerto físico ${input.port} está ocupado por más de una entrada.`,
            source?.objectId,
          );
        ports.set(input.port, input.id);
      }
    }
    const mappedSources = new Set(profile.inputs.map((input) => input.sourceId));
    for (const source of project.audioSources)
      if (!mappedSources.has(source.id))
        add(
          `audio-${profile.id}-unmapped-${source.id}`,
          'warning',
          `${profile.name}: «${source.name}» no tiene canal asignado.`,
          source.objectId,
        );
    const outputs = new Map<number, string>();
    for (const output of profile.outputs) {
      const prefix = `audio-${profile.id}-${output.id}`;
      const required = output.stereo ? [output.channel, output.channel + 1] : [output.channel];
      for (const channel of required) {
        if (!Number.isInteger(channel) || channel < 1 || channel > profile.outputCapacity)
          add(
            `${prefix}-capacity-${channel}`,
            'error',
            `${profile.name} · ${output.name}: salida física ${channel} fuera de la capacidad (${profile.outputCapacity}).`,
          );
        if (outputs.has(channel))
          add(
            `${prefix}-conflict-${channel}`,
            'error',
            `${profile.name}: la salida física ${channel} está asignada a más de una mezcla.`,
          );
        outputs.set(channel, output.id);
      }
      if (!output.bus.trim())
        add(`${prefix}-bus`, 'warning', `${profile.name} · ${output.name}: bus sin definir.`);
      if (!output.destinationIds.length)
        add(
          `${prefix}-destination`,
          'warning',
          `${profile.name} · ${output.name}: falta asociar un destino.`,
        );
      for (const destinationId of output.destinationIds)
        if (!objects.has(destinationId))
          add(
            `${prefix}-missing-${destinationId}`,
            'warning',
            `${profile.name} · ${output.name}: un destino ya no existe.`,
          );
    }
  }
  return issues;
}

/** Fill only unassigned, unlocked ports. Never renumber or overwrite an existing assignment. */
export function suggestPatch(profile: AudioProfile): AudioProfile {
  const next = structuredClone(profile);
  const occupied = new Set(
    next.inputs.flatMap((input) => (input.port === null ? [] : [input.port])),
  );
  for (const input of next.inputs) {
    if (input.locked || input.port !== null) continue;
    for (let port = 1; port <= next.stageboxInputs; port++)
      if (!occupied.has(port)) {
        input.port = port;
        occupied.add(port);
        break;
      }
  }
  return next;
}

export function nextFreeChannel(profile: AudioProfile): number {
  const used = new Set(profile.inputs.map((input) => input.channel));
  let channel = 1;
  while (used.has(channel)) channel++;
  return channel;
}

export function newInput(profile: AudioProfile, source: AudioSource): AudioInput {
  return {
    id: crypto.randomUUID(),
    sourceId: source.id,
    channel: nextFreeChannel(profile),
    port: null,
    locked: false,
  };
}

export function cloneProfile(profile: AudioProfile, name: string): AudioProfile {
  const copy = structuredClone(profile);
  copy.id = crypto.randomUUID();
  copy.name = name;
  copy.inputs = copy.inputs.map((input) => ({ ...input, id: crypto.randomUUID() }));
  copy.outputs = copy.outputs.map((output) => ({ ...output, id: crypto.randomUUID() }));
  return copy;
}
