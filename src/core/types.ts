export type Vec3 = { x: number; y: number; z: number };
export type Dimensions = { width: number; depth: number; height: number };
export type EquipmentKind =
  | 'box'
  | 'drums'
  | 'keyboard'
  | 'guitar'
  | 'microphone'
  | 'monitor'
  | 'speaker'
  | 'person'
  | 'riser'
  | 'led'
  | 'line-array'
  | 'console';
export type Category = 'Instrumentos' | 'Audio' | 'Escenario' | 'Video' | 'Personas';
export interface EquipmentDefinition {
  id: string;
  version: number;
  name: string;
  category: Category;
  kind: EquipmentKind;
  dimensions: Dimensions;
  color: string;
  provenance: 'generic' | 'user';
  description: string;
}
export type Parameters =
  | {
      type: 'led';
      columns: number;
      rows: number;
      cabinetWidth: number;
      cabinetHeight: number;
      cabinetDepth: number;
    }
  | {
      type: 'line-array';
      count: number;
      cabinetWidth: number;
      cabinetHeight: number;
      cabinetDepth: number;
      splayAngle: number;
    };
export interface SceneObject {
  id: string;
  label: string;
  definition: EquipmentDefinition;
  dimensions: Dimensions;
  position: Vec3;
  rotation: number;
  rotationPivot?: { x: number; y: number };
  locked: boolean;
  hidden: boolean;
  groupId?: string;
  parentId?: string;
  layerId?: string;
  parameters?: Parameters;
}
export interface SceneLayer {
  id: string;
  name: string;
  hidden: boolean;
  locked: boolean;
}
export interface Stage {
  width: number;
  depth: number;
  height: number;
  gridStep: number;
  snap: boolean;
  gridVisible: boolean;
  color: string;
}
export interface AudioSource {
  id: string;
  objectId?: string;
  name: string;
  microphone: string;
  phantom: boolean;
  notes: string;
}
export interface AudioInput {
  id: string;
  sourceId: string;
  channel: number;
  port: number | null;
  locked: boolean;
}
export interface AudioOutput {
  id: string;
  channel: number;
  name: string;
  bus: string;
  stereo: boolean;
  destinationIds: string[];
}
export interface AudioProfile {
  id: string;
  name: string;
  inputCapacity: number;
  outputCapacity: number;
  stageboxInputs: number;
  inputs: AudioInput[];
  outputs: AudioOutput[];
}
export interface Project {
  schemaVersion: 3;
  id: string;
  name: string;
  description: string;
  organization: string;
  eventDate: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  stage: Stage;
  objects: SceneObject[];
  layers: SceneLayer[];
  interferenceReviews: InterferenceReview[];
  audioSources: AudioSource[];
  audioProfiles: AudioProfile[];
  activeAudioProfileId: string;
}
export interface InterferenceReview {
  id: string;
  objectIds: string[];
  kind: 'overlap' | 'stage-penetration';
  signature: string;
  note: string;
  reviewedAt: string;
  revokedAt?: string;
}
export interface ProjectRevision {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  project: Project;
}
export type ViewMode = '2d' | '3d' | 'split';
export interface ValidationIssue {
  id: string;
  severity: 'warning' | 'error';
  message: string;
  objectId?: string;
}
