import { catalog } from '../catalog/data';
import { getDimensions } from './geometry';
import { createDefaultLayers, getDefaultLayerId } from './layers';
import type { EquipmentDefinition, Project, SceneObject, Stage, Vec3 } from './types';

export const newId = () => crypto.randomUUID();
export function createObject(definition: EquipmentDefinition, position: Vec3): SceneObject {
  const object: SceneObject = {
    id: newId(),
    label: definition.name,
    definition: structuredClone(definition),
    dimensions: { ...definition.dimensions },
    position: { ...position },
    rotation: 0,
    locked: false,
    hidden: false,
    layerId: getDefaultLayerId(definition.category),
  };
  if (definition.kind === 'led')
    object.parameters = {
      type: 'led',
      columns: 10,
      rows: 5,
      cabinetWidth: 0.5,
      cabinetHeight: 0.5,
      cabinetDepth: 0.1,
    };
  if (definition.kind === 'line-array')
    object.parameters = {
      type: 'line-array',
      count: 6,
      cabinetWidth: 0.7,
      cabinetHeight: 0.3,
      cabinetDepth: 0.4,
      splayAngle: 0,
    };
  object.dimensions = getDimensions(object);
  return object;
}
export function createProject(name = 'Nuevo proyecto', stage: Partial<Stage> = {}): Project {
  const now = new Date().toISOString(),
    audioId = newId();
  return {
    schemaVersion: 3,
    id: newId(),
    name: name.trim() || 'Nuevo proyecto',
    description: '',
    organization: '',
    eventDate: '',
    archived: false,
    createdAt: now,
    updatedAt: now,
    stage: {
      width: 8,
      depth: 6,
      height: 0.8,
      gridStep: 0.5,
      snap: true,
      gridVisible: true,
      color: '#363b39',
      ...stage,
    },
    objects: [],
    layers: createDefaultLayers(),
    interferenceReviews: [],
    audioSources: [],
    audioProfiles: [
      {
        id: audioId,
        name: 'Consola genérica · 32 entradas / 16 salidas',
        inputCapacity: 32,
        outputCapacity: 16,
        stageboxInputs: 32,
        inputs: [],
        outputs: [],
      },
    ],
    activeAudioProfileId: audioId,
  };
}
export function createDemoProject(): Project {
  const p = createProject('Demo — Escenario Banda Completa');
  p.description =
    'Montaje de ejemplo con dimensiones genéricas editables, pantalla modular y sistemas PA independientes. No constituye cálculo estructural ni acústico.';
  const add = (kind: string, label: string, x: number, y: number, z = p.stage.height) => {
    const def = catalog.find((d) => d.id === kind)!;
    const object = createObject(def, { x, y, z });
    object.label = label;
    p.objects.push(object);
    return object;
  };
  const source = (
    object: SceneObject,
    name: string,
    microphone = 'Micrófono genérico',
    phantom = false,
  ) => {
    const id = newId();
    p.audioSources.push({
      id,
      objectId: object.id,
      name,
      microphone,
      phantom,
      notes: 'Confirmar selección de equipo con producción.',
    });
    const channel = p.audioSources.length;
    p.audioProfiles[0].inputs.push({
      id: newId(),
      sourceId: id,
      channel,
      port: channel,
      locked: false,
    });
  };
  const riser = add('riser', 'Tarima batería', 0, 4.2);
  riser.dimensions = { width: 2.4, depth: 2, height: 0.4 };
  const drums = add('drums', 'Batería', 0, 4.2, 1.2);
  drums.parentId = riser.id;
  ['Bombo', 'Redoblante', 'Hi-hat', 'Tom 1', 'Tom 2', 'Overhead L', 'Overhead R'].forEach(
    (name, i) => source(drums, name, 'Micrófono genérico', i >= 5),
  );
  add('person', 'Baterista', 0, 4.9, 1.2).parentId = riser.id;
  const bass = add('guitar', 'Bajo', -2.8, 3);
  source(bass, 'Bajo', 'DI genérica');
  add('person', 'Bajista', -2.8, 3.45);
  add('amp', 'Amplificador bajo', -3, 4.4);
  const guitar = add('guitar', 'Guitarra', 2.8, 3);
  source(guitar, 'Guitarra', 'Micrófono genérico');
  add('person', 'Guitarrista', 2.8, 3.45);
  add('amp', 'Amplificador guitarra', 3, 4.4);
  [-2.3, 2.3].forEach((x, i) => {
    const keys = add('keyboard', `Teclado ${i + 1}`, x, 2);
    source(keys, `Teclado ${i + 1} L`, 'DI genérica');
    source(keys, `Teclado ${i + 1} R`, 'DI genérica');
    add('person', `Tecladista ${i + 1}`, x, 2.5);
  });
  [-1.7, -0.65, 0.65, 1.7].forEach((x, i) => {
    const mic = add('microphone', i === 0 ? 'Voz principal' : `Coro ${i}`, x, 0.85);
    source(mic, mic.label);
    add('person', i === 0 ? 'Cantante' : `Corista ${i}`, x, 1.25);
  });
  const wedges = [-2.3, 0, 2.3].map((x, i) => add('monitor', `Monitor ${i + 1}`, x, 0.3));
  const arrays = [-4.8, 4.8].map((x, i) =>
    add('line-array', i ? 'PA izquierda escénica' : 'PA derecha escénica', x, 0.5, 2.4),
  );
  [-4.6, 4.6].forEach((x, i) => add('subwoofer', `Subgrave ${i + 1}`, x, 0.3, 0));
  add('led', 'LED posterior · 10 × 5 gabinetes', 0, 6.15, 1.9);
  add('stagebox', 'Stagebox 32 entradas (genérica)', -3.5, 5.5);
  add('console', 'Control FOH', 0, -3, 0.8);
  const iem = add('iem', 'IEM voz principal', -1.7, 1.25, 1.7);
  p.audioProfiles[0].outputs = [
    {
      id: newId(),
      channel: 1,
      name: 'Main L/R',
      bus: 'MAIN',
      stereo: true,
      destinationIds: arrays.map((a) => a.id),
    },
    {
      id: newId(),
      channel: 3,
      name: 'Voces · monitores compartidos',
      bus: 'AUX 1',
      stereo: false,
      destinationIds: wedges.slice(0, 2).map((a) => a.id),
    },
    {
      id: newId(),
      channel: 4,
      name: 'Instrumentos',
      bus: 'AUX 2',
      stereo: false,
      destinationIds: [wedges[2].id],
    },
    {
      id: newId(),
      channel: 5,
      name: 'Voz principal · IEM',
      bus: 'AUX 3/4',
      stereo: true,
      destinationIds: [iem.id],
    },
  ];
  return p;
}
