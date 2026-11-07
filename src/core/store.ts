import { create } from 'zustand';
import { createObject, newId } from './project';
import { getDimensions, rotatePoint, roundMetric } from './geometry';
import { isObjectHidden, isObjectLocked, getDefaultLayerId } from './layers';
import { detectInterferences, type Interference } from './collisions';
import {
  applyObjectPatch,
  relatedIds,
  getDescendantIds,
  canAttach,
  getLocalTransform,
  assertEditable,
  arrangeSelection,
} from './hierarchy';
import type {
  EquipmentDefinition,
  Project,
  SceneObject,
  Stage,
  ViewMode,
  Vec3,
  SceneLayer,
} from './types';

interface EditorState {
  notice: string | null;
  clearNotice: () => void;
  setRotationPivot: (id: string, pivot: { x: number; y: number } | undefined) => void;
  reviewInterference: (issue: Interference, note: string) => void;
  revokeInterferenceReview: (id: string) => void;
  updateObjectOnly: (id: string, patch: Partial<SceneObject>) => void;
  attachObject: (childId: string, parentId: string, snapToTop: boolean) => void;
  detachObject: (id: string) => void;
  updateLocalTransform: (id: string, patch: { position?: Vec3; rotation?: number }) => void;
  alignSelected: (axis: 'x' | 'y') => void;
  distributeSelected: (axis: 'x' | 'y') => void;
  addLayer: (name: string) => void;
  updateLayer: (id: string, patch: Partial<Pick<SceneLayer, 'name' | 'hidden' | 'locked'>>) => void;
  removeLayer: (id: string) => void;
  assignSelectionToLayer: (id: string | undefined) => void;
  selectLayer: (id: string) => void;
  project: Project | null;
  selectedIds: string[];
  view: ViewMode;
  history: Project[];
  future: Project[];
  dirty: boolean;
  transactionActive: boolean;
  transactionStart: Project | null;
  transactionDirty: boolean;
  transactionFuture: Project[];
  setProject: (project: Project) => void;
  mutateProject: (fn: (project: Project) => void, continuous?: boolean) => void;
  select: (id: string, additive?: boolean) => void;
  clearSelection: () => void;
  setView: (view: ViewMode) => void;
  updateObject: (id: string, patch: Partial<SceneObject>) => void;
  updateStage: (patch: Partial<Stage>) => void;
  addObject: (definition: EquipmentDefinition) => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  undo: () => void;
  redo: () => void;
  markSaved: (updatedAt?: string) => void;
  beginTransaction: () => void;
  commitTransaction: () => void;
  cancelTransaction: () => void;
}
const HISTORY_LIMIT = 80;
const clone = <T>(value: T): T => structuredClone(value);
const appendHistory = (history: Project[], project: Project) =>
  [...history, clone(project)].slice(-HISTORY_LIMIT);
const contentOf = (project: Project) => JSON.stringify({ ...project, updatedAt: '' });
const relatedObjects = relatedIds;
function timestampAfter(previous: string) {
  return new Date(Math.max(Date.now(), Date.parse(previous) + 1)).toISOString();
}
export const useEditorStore = create<EditorState>((set, get) => ({
  notice: null,
  clearNotice: () => set({ notice: null }),
  project: null,
  selectedIds: [],
  view: 'split',
  history: [],
  future: [],
  dirty: false,
  transactionActive: false,
  transactionStart: null,
  transactionDirty: false,
  transactionFuture: [],
  setProject: (project) =>
    set({
      project: clone(project),
      notice: null,
      selectedIds: [],
      history: [],
      future: [],
      dirty: false,
      transactionActive: false,
      transactionStart: null,
      transactionDirty: false,
      transactionFuture: [],
    }),
  mutateProject: (fn, continuous = false) => {
    // Discrete commands are separate undo steps. Cancel the unfinished gesture
    // before changing selection or unmounting its object in either editor.
    if (!continuous && get().transactionActive) get().cancelTransaction();
    const current = get();
    if (!current.project) return;
    const next = clone(current.project);
    try {
      fn(next);
    } catch (error) {
      set({
        notice: error instanceof Error ? error.message : 'No se pudo completar la operación.',
      });
      return;
    }
    if (JSON.stringify(next) === JSON.stringify(current.project)) return;
    next.updatedAt = timestampAfter(current.project.updatedAt);
    set({
      project: next,
      dirty: true,
      future: [],
      history: current.transactionActive
        ? current.history
        : appendHistory(current.history, current.project),
    });
  },
  select: (id, additive = false) =>
    set((state) => ({
      selectedIds: additive
        ? state.selectedIds.includes(id)
          ? state.selectedIds.filter((x) => x !== id)
          : [...state.selectedIds, id]
        : [id],
    })),
  clearSelection: () => set({ selectedIds: [] }),
  setView: (view) => set({ view }),
  setRotationPivot: (id, pivot) =>
    get().mutateProject((project) => {
      assertEditable(project, [id]);
      const object = project.objects.find((o) => o.id === id);
      if (!object) return;
      if (pivot && [pivot.x, pivot.y].some((n) => !Number.isFinite(n) || Math.abs(n) > 100))
        throw new Error('El pivote debe tener coordenadas finitas entre −100 y 100 m.');
      if (!pivot || (pivot.x === 0 && pivot.y === 0)) delete object.rotationPivot;
      else object.rotationPivot = { x: roundMetric(pivot.x), y: roundMetric(pivot.y) };
    }),
  reviewInterference: (issue, note) =>
    get().mutateProject((project) => {
      const trimmed = note.trim();
      if (!trimmed || trimmed.length > 2000)
        throw new Error('Registrá un motivo de entre 1 y 2000 caracteres.');
      const current = detectInterferences(project).issues.find((i) => i.id === issue.id);
      if (!current || current.signature !== issue.signature)
        throw new Error(
          'La geometría cambió. Revisá nuevamente la interferencia antes de registrarla.',
        );
      if (
        project.interferenceReviews.some((r) => !r.revokedAt && r.signature === current.signature)
      )
        throw new Error('Esta interferencia ya tiene una revisión vigente.');
      if (project.interferenceReviews.length >= 2000)
        throw new Error('El proyecto alcanzó el límite de 2000 registros de revisión.');
      project.interferenceReviews.push({
        id: newId(),
        objectIds: [...current.objectIds],
        kind: current.kind,
        signature: current.signature,
        note: trimmed,
        reviewedAt: new Date().toISOString(),
      });
    }),
  revokeInterferenceReview: (id) =>
    get().mutateProject((project) => {
      const review = project.interferenceReviews.find((r) => r.id === id);
      if (review && !review.revokedAt) review.revokedAt = new Date().toISOString();
    }),
  updateObject: (id, patch) => {
    if (get().transactionActive && (patch.hidden !== undefined || patch.locked !== undefined))
      get().cancelTransaction();
    get().mutateProject(
      (project) => applyObjectPatch(project, id, patch, get().selectedIds),
      patch.position !== undefined || patch.rotation !== undefined,
    );
  },
  updateObjectOnly: (id, patch) =>
    get().mutateProject((project) => applyObjectPatch(project, id, patch, [], true)),
  attachObject: (childId, parentId, snapToTop) => {
    if (get().transactionActive) get().cancelTransaction();
    get().mutateProject((project) => {
      if (!canAttach(project, childId, parentId))
        throw new Error(
          'Ese anclaje crearía una relación circular o apunta a un soporte inexistente.',
        );
      assertEditable(project, [childId]);
      const child = project.objects.find((o) => o.id === childId)!;
      const parent = project.objects.find((o) => o.id === parentId)!;
      if (snapToTop)
        applyObjectPatch(
          project,
          childId,
          {
            position: {
              ...child.position,
              z: roundMetric(parent.position.z + getDimensions(parent).height),
            },
          },
          [],
          true,
        );
      child.parentId = parentId;
    });
  },
  detachObject: (id) => {
    if (get().transactionActive) get().cancelTransaction();
    get().mutateProject((project) => {
      assertEditable(project, [id]);
      const child = project.objects.find((o) => o.id === id);
      if (child) delete child.parentId;
    });
  },
  updateLocalTransform: (id, patch) =>
    get().mutateProject((project) => {
      const child = project.objects.find((o) => o.id === id),
        local = getLocalTransform(project, id);
      const parent = project.objects.find((o) => o.id === child?.parentId);
      if (!child || !parent || !local) throw new Error('El elemento no tiene un soporte físico.');
      const world: Partial<SceneObject> = {};
      if (patch.position) {
        const xy = rotatePoint(patch.position, parent.rotation);
        world.position = {
          x: roundMetric(parent.position.x + xy.x),
          y: roundMetric(parent.position.y + xy.y),
          z: roundMetric(parent.position.z + patch.position.z),
        };
      }
      if (patch.rotation !== undefined)
        world.rotation = roundMetric(parent.rotation + patch.rotation);
      applyObjectPatch(project, id, world, [], true);
    }),
  alignSelected: (axis) =>
    get().mutateProject((project) => arrangeSelection(project, get().selectedIds, axis, false)),
  distributeSelected: (axis) =>
    get().mutateProject((project) => arrangeSelection(project, get().selectedIds, axis, true)),
  addLayer: (name) => {
    if (get().transactionActive) get().cancelTransaction();
    get().mutateProject((project) => {
      const trimmed = name.trim();
      if (!trimmed || trimmed.length > 200)
        throw new Error('La capa necesita un nombre de hasta 200 caracteres.');
      if (project.layers.length >= 64) throw new Error('Se permiten hasta 64 capas por proyecto.');
      if (project.layers.some((l) => l.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase()))
        throw new Error('Ya existe una capa con ese nombre.');
      project.layers.push({ id: newId(), name: trimmed, hidden: false, locked: false });
    });
  },
  updateLayer: (id, patch) => {
    if (get().transactionActive) get().cancelTransaction();
    get().mutateProject((project) => {
      const layer = project.layers.find((l) => l.id === id);
      if (!layer) return;
      if (patch.name !== undefined) {
        const name = patch.name.trim();
        if (!name || name.length > 200) throw new Error('Nombre de capa inválido.');
        if (
          project.layers.some(
            (l) => l.id !== id && l.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
          )
        )
          throw new Error('Ya existe una capa con ese nombre.');
        layer.name = name;
      }
      if (patch.hidden !== undefined) layer.hidden = patch.hidden;
      if (patch.locked !== undefined) layer.locked = patch.locked;
    });
    set((state) => ({
      selectedIds: state.selectedIds.filter((id) =>
        state.project?.objects.some((o) => o.id === id && !isObjectHidden(state.project!, o)),
      ),
    }));
  },
  removeLayer: (id) => {
    if (get().transactionActive) get().cancelTransaction();
    get().mutateProject((project) => {
      project.layers = project.layers.filter((l) => l.id !== id);
      project.objects.forEach((o) => {
        if (o.layerId === id) delete o.layerId;
      });
    });
  },
  assignSelectionToLayer: (id) => {
    if (get().transactionActive) get().cancelTransaction();
    get().mutateProject((project) => {
      if (id && !project.layers.some((l) => l.id === id))
        throw new Error('La capa de destino no existe.');
      if (id && project.layers.find((l) => l.id === id)?.locked)
        throw new Error('Desbloqueá la capa de destino antes de asignarle elementos.');
      assertEditable(project, get().selectedIds);
      project.objects.forEach((o) => {
        if (get().selectedIds.includes(o.id)) {
          if (id) o.layerId = id;
          else delete o.layerId;
        }
      });
    });
  },
  selectLayer: (id) => {
    const project = get().project;
    if (project)
      set({
        selectedIds: project.objects
          .filter((o) => o.layerId === id && !isObjectHidden(project, o))
          .map((o) => o.id),
      });
  },
  updateStage: (patch) =>
    get().mutateProject((project) => {
      if (
        (patch.width !== undefined &&
          (!Number.isFinite(patch.width) || patch.width <= 0 || patch.width > 1000)) ||
        (patch.depth !== undefined &&
          (!Number.isFinite(patch.depth) || patch.depth <= 0 || patch.depth > 1000)) ||
        (patch.height !== undefined &&
          (!Number.isFinite(patch.height) || patch.height < 0 || patch.height > 100)) ||
        (patch.gridStep !== undefined &&
          (!Number.isFinite(patch.gridStep) || patch.gridStep < 0.01 || patch.gridStep > 10))
      )
        return;
      Object.assign(project.stage, patch);
    }),
  addObject: (definition) => {
    let added = '';
    get().mutateProject((project) => {
      const o = createObject(definition, {
        x: 0,
        y: project.stage.depth / 2,
        z: project.stage.height,
      });
      const layer =
        project.layers.find((l) => l.id === getDefaultLayerId(definition.category)) ||
        project.layers.find((l) => l.name === definition.category);
      if (layer?.locked) throw new Error('Desbloqueá la capa de destino antes de añadir equipos.');
      if (layer) o.layerId = layer.id;
      else delete o.layerId;
      project.objects.push(o);
      added = o.id;
    });
    if (added) set({ selectedIds: [added] });
  },
  deleteSelected: () => {
    const selected = new Set(get().selectedIds);
    get().mutateProject((project) => {
      assertEditable(project, [
        ...selected,
        ...[...selected].flatMap((id) => [...getDescendantIds(project, id)]),
      ]);
      const removed = new Set(
        project.objects.filter((o) => selected.has(o.id) && !o.locked).map((o) => o.id),
      );
      project.objects = project.objects.filter((o) => !removed.has(o.id));
      project.interferenceReviews = project.interferenceReviews.filter(
        (review) => !review.objectIds.some((id) => removed.has(id)),
      );
      for (const o of project.objects) if (o.parentId && removed.has(o.parentId)) delete o.parentId;
      // Preserve logical sources after deleting physical equipment; they remain editable.
      for (const s of project.audioSources)
        if (s.objectId && removed.has(s.objectId)) delete s.objectId;
      for (const profile of project.audioProfiles)
        for (const output of profile.outputs)
          output.destinationIds = output.destinationIds.filter((id) => !removed.has(id));
    });
    set((state) => ({
      selectedIds: state.selectedIds.filter((id) =>
        state.project?.objects.some((o) => o.id === id),
      ),
    }));
  },
  duplicateSelected: () => {
    const newIds: string[] = [];
    get().mutateProject((project) => {
      const ids = relatedObjects(project, get().selectedIds);
      assertEditable(project, ids);
      const originals = project.objects.filter((o) => ids.has(o.id));
      const idMap = new Map(originals.map((o) => [o.id, newId()]));
      const groupMap = new Map(
        originals.filter((o) => o.groupId).map((o) => [o.groupId!, newId()]),
      );
      for (const old of originals) {
        const o = clone(old);
        o.id = idMap.get(old.id)!;
        o.label = `${o.label.slice(0, 190)} · copia`;
        o.position.x += 0.5;
        o.position.y += 0.5;
        o.locked = false;
        if (o.groupId) o.groupId = groupMap.get(o.groupId);
        if (o.parentId) o.parentId = idMap.get(o.parentId); // Do not attach copy to original supports.
        project.objects.push(o);
        newIds.push(o.id);
      }
    });
    if (newIds.length) set({ selectedIds: newIds });
  },
  groupSelected: () =>
    get().mutateProject((project) => {
      assertEditable(project, get().selectedIds);
      const selected = project.objects.filter((o) => get().selectedIds.includes(o.id));
      if (selected.length < 2) return;
      const groupId = newId();
      selected.forEach((o) => {
        o.groupId = groupId;
      });
    }),
  ungroupSelected: () =>
    get().mutateProject((project) => {
      const groups = new Set(
        project.objects
          .filter((o) => get().selectedIds.includes(o.id))
          .map((o) => o.groupId)
          .filter(Boolean),
      );
      assertEditable(
        project,
        project.objects.filter((o) => o.groupId && groups.has(o.groupId)).map((o) => o.id),
      );
      for (const o of project.objects) if (o.groupId && groups.has(o.groupId)) delete o.groupId;
    }),
  undo: () => {
    if (get().transactionActive) get().cancelTransaction();
    const state = get();
    if (!state.project || !state.history.length) return;
    const project = clone(state.history[state.history.length - 1]);
    project.updatedAt = timestampAfter(state.project.updatedAt);
    set({
      project,
      history: state.history.slice(0, -1),
      future: [...state.future, clone(state.project)],
      dirty: true,
      selectedIds: state.selectedIds.filter((id) => project.objects.some((o) => o.id === id)),
    });
  },
  redo: () => {
    if (get().transactionActive) get().cancelTransaction();
    const state = get();
    if (!state.project || !state.future.length) return;
    const project = clone(state.future[state.future.length - 1]);
    project.updatedAt = timestampAfter(state.project.updatedAt);
    set({
      project,
      future: state.future.slice(0, -1),
      history: appendHistory(state.history, state.project),
      dirty: true,
      selectedIds: state.selectedIds.filter((id) => project.objects.some((o) => o.id === id)),
    });
  },
  markSaved: (updatedAt) => {
    if (!updatedAt || get().project?.updatedAt === updatedAt) set({ dirty: false });
  },
  beginTransaction: () => {
    const state = get();
    if (!state.transactionActive && state.project)
      set({
        transactionActive: true,
        transactionStart: clone(state.project),
        transactionDirty: state.dirty,
        transactionFuture: state.future,
      });
  },
  commitTransaction: () => {
    const state = get();
    if (!state.transactionActive) return;
    const changed =
      state.project &&
      state.transactionStart &&
      contentOf(state.project) !== contentOf(state.transactionStart);
    if (!changed) {
      get().cancelTransaction();
      return;
    }
    set({
      history: appendHistory(state.history, state.transactionStart!),
      transactionActive: false,
      transactionStart: null,
      transactionFuture: [],
    });
  },
  cancelTransaction: () => {
    const state = get();
    if (!state.transactionActive) return;
    set({
      project: state.transactionStart ? clone(state.transactionStart) : state.project,
      dirty: state.transactionDirty,
      future: state.transactionFuture,
      transactionActive: false,
      transactionStart: null,
      transactionFuture: [],
    });
  },
}));
