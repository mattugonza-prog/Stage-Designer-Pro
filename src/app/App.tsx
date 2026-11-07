import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Layers3,
  ChevronDown,
  Undo2,
  Redo2,
  Save,
  ArrowUpRight,
  LayoutPanelLeft,
  Square,
  Box,
  MousePointer2,
  Copy,
  RotateCw,
  Trash2,
  Group,
  Ungroup,
  Magnet,
  Grid2X2,
  Sun,
  Moon,
  FolderOpen,
  Clock3,
  Check,
  X,
  Keyboard,
  PanelBottomClose,
  PanelBottomOpen,
  AlignCenterVertical,
  AlignCenterHorizontal,
  SlidersHorizontal,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
} from 'lucide-react';
import { useEditorStore } from '../core/store';
import { relatedIds } from '../core/hierarchy';
import { createDemoProject } from '../core/project';
import type { EquipmentDefinition, Project, SceneObject } from '../core/types';
import {
  listDefinitions,
  listProjects,
  loadProject,
  saveProject,
  exportProject,
} from '../storage/projects';
import { inspectProject } from '../core/validation';
import Editor2D from '../editor-2d/Editor2D';
import AudioPanel from '../audio/AudioPanel';
import Catalog from './Catalog';
import Inspector from './Inspector';
import { ProjectsDialog, CustomDialog, ExportDialog, RevisionsDialog } from './Dialogs';
import { Modal } from './controls';
const Editor3D = lazy(() => import('../editor-3d/Editor3D'));

export default function App() {
  const state = useEditorStore();
  const project = state.project;
  const inspection = useMemo(() => (project ? inspectProject(project) : null), [project]);
  const [modal, setModal] = useState<
    'projects' | 'custom' | 'export' | 'revisions' | 'help' | null
  >(null);
  const [custom, setCustom] = useState<EquipmentDefinition[]>([]);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('stagepro-theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [dock, setDock] = useState(true),
    [toast, setToast] = useState(''),
    [saving, setSaving] = useState(false),
    [bootError, setBootError] = useState('');
  const clipboard = useRef<SceneObject[]>([]);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const notify = useCallback((message: string) => setToast(message), []);
  const closeModal = useCallback(() => setModal(null), []);
  useEffect(() => {
    if (state.notice) {
      notify(state.notice);
      state.clearNotice();
    }
  }, [state.notice, state.clearNotice, notify]);
  const persist = useCallback(async (snapshot: Project) => {
    setSaving(true);
    const operation = saveQueue.current
      .catch(() => undefined)
      .then(async () => {
        await saveProject(snapshot);
        const current = useEditorStore.getState();
        if (current.project?.id === snapshot.id) current.markSaved(snapshot.updatedAt);
      });
    saveQueue.current = operation;
    try {
      await operation;
    } finally {
      if (saveQueue.current === operation) setSaving(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [projects, definitions] = await Promise.all([listProjects(), listDefinitions()]);
        if (cancelled) return;
        setCustom(definitions);
        let lastId: string | null = null;
        try {
          lastId = localStorage.getItem('stagepro-last-project');
        } catch {
          /* Session preference only. */
        }
        const current =
          (lastId && (await loadProject(lastId))) ||
          projects.find((p) => !p.archived) ||
          createDemoProject();
        if (cancelled) return;
        await saveProject(current);
        if (!cancelled) useEditorStore.getState().setProject(current);
      } catch (e) {
        if (!cancelled)
          setBootError(
            `No se pudo acceder al almacenamiento local: ${e instanceof Error ? e.message : e}`,
          );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('stagepro-theme', theme);
    } catch {
      /* Preference only. */
    }
  }, [theme]);
  useEffect(() => {
    if (project) {
      try {
        localStorage.setItem('stagepro-last-project', project.id);
      } catch {
        /* IndexedDB remains source of truth. */
      }
    }
  }, [project?.id]);
  useEffect(() => {
    if (!project || !state.dirty || state.transactionActive) return;
    const timeout = setTimeout(
      () =>
        void persist(structuredClone(project)).catch((e) =>
          notify(`Error al guardar: ${e}. Exportá un respaldo.`),
        ),
      650,
    );
    return () => clearTimeout(timeout);
  }, [project, state.dirty, state.transactionActive, persist, notify]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 6000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (useEditorStore.getState().dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', before);
    return () => window.removeEventListener('beforeunload', before);
  }, []);

  const save = useCallback(() => {
    const p = useEditorStore.getState().project;
    if (p)
      void persist(structuredClone(p))
        .then(() => notify('Proyecto guardado.'))
        .catch((e) => notify(`No se pudo guardar: ${e}`));
  }, [persist, notify]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (modal || target.matches('input,textarea,select,[contenteditable="true"]')) return;
      const s = useEditorStore.getState();
      if (!s.project) return;
      const command = e.ctrlKey || e.metaKey;
      if (command && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? s.redo() : s.undo();
      } else if (command && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        s.redo();
      } else if (command && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      } else if (command && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        s.duplicateSelected();
      } else if (command && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        clipboard.current = structuredClone(
          s.project.objects.filter((o) => relatedIds(s.project!, s.selectedIds).has(o.id)),
        );
      } else if (command && e.key.toLowerCase() === 'v' && clipboard.current.length) {
        e.preventDefault();
        const copies = structuredClone(clipboard.current);
        if (copies.some((o) => s.project!.layers.find((l) => l.id === o.layerId)?.locked)) {
          notify('Desbloqueá la capa de destino antes de pegar elementos.');
          return;
        }
        const idMap = new Map(copies.map((o) => [o.id, crypto.randomUUID()]));
        const groupMap = new Map(
          copies.filter((o) => o.groupId).map((o) => [o.groupId!, crypto.randomUUID()]),
        );
        copies.forEach((o) => {
          o.id = idMap.get(o.id)!;
          o.label = o.label.slice(0, 190) + ' · copia';
          if (o.layerId && !s.project!.layers.some((l) => l.id === o.layerId)) delete o.layerId;
          o.position.x += 0.5;
          o.position.y += 0.5;
          o.locked = false;
          if (o.parentId) o.parentId = idMap.get(o.parentId);
          if (o.groupId) o.groupId = groupMap.get(o.groupId);
        });
        s.mutateProject((p) => p.objects.push(...copies));
        s.clearSelection();
        copies.forEach((o) => s.select(o.id, true));
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        s.deleteSelected();
      } else if (e.key === 'Escape') s.clearSelection();
      else if (e.key.toLowerCase() === 'r') {
        const o = s.project.objects.find((o) => o.id === s.selectedIds[0]);
        if (o) s.updateObject(o.id, { rotation: o.rotation + (e.shiftKey ? -15 : 15) });
      } else if (e.key.startsWith('Arrow')) {
        const o = s.project.objects.find((o) => o.id === s.selectedIds[0]);
        if (o) {
          e.preventDefault();
          const step = e.shiftKey ? 0.1 : 0.01;
          s.updateObject(o.id, {
            position: {
              ...o.position,
              x: o.position.x + (e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0),
              y: o.position.y + (e.key === 'ArrowUp' ? step : e.key === 'ArrowDown' ? -step : 0),
            },
          });
        }
      } else if (e.key === '/') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[aria-label="Buscar equipo"]')?.focus();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [modal, save, notify]);

  async function openProject(next: Project) {
    try {
      const current = useEditorStore.getState();
      if (current.project && current.dirty) await persist(structuredClone(current.project));
      if (current.project?.id === next.id) return;
      current.setProject((await loadProject(next.id)) || next);
    } catch (e) {
      notify(`No se pudo cambiar de proyecto: ${e}`);
      throw e;
    }
  }
  function backup() {
    if (!project) return;
    const blob = new Blob([exportProject(project)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/[^\p{L}\p{N} _-]/gu, '') || 'proyecto'}.stagepro`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify('Respaldo generado.');
  }
  if (!project)
    return (
      <div className="boot-screen">
        <span className="brand-symbol">
          <Layers3 />
        </span>
        <h1>
          Stage Designer <em>Pro</em>
        </h1>
        <p>{bootError || 'Preparando tu espacio de trabajo…'}</p>
        {bootError && (
          <button className="primary-button" onClick={() => location.reload()}>
            Reintentar
          </button>
        )}
      </div>
    );
  const issues = inspection!.issues;
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setModal('projects')} title="Proyectos">
          <span className="brand-symbol">
            <Layers3 size={23} />
          </span>
          <span>
            STAGE<span className="brand-light">DESIGNER</span>
            <small>PRO</small>
          </span>
        </button>
        <span className="top-divider" />
        <div className="project-title">
          <input
            aria-label="Nombre del proyecto"
            value={project.name}
            maxLength={160}
            onChange={(e) =>
              state.mutateProject((p) => {
                p.name = e.target.value;
              })
            }
            onBlur={() => {
              if (!project.name.trim())
                state.mutateProject((p) => {
                  p.name = 'Proyecto sin título';
                });
            }}
          />
          <button
            className="icon-button"
            aria-label="Abrir proyectos"
            onClick={() => setModal('projects')}
          >
            <ChevronDown size={15} />
          </button>
          <span className="project-kind">STAGE PLOT</span>
        </div>
        <div className="topbar-actions">
          <span className="save-status" role="status">
            <span className={`status-dot ${state.dirty ? 'pending' : ''}`} />
            {saving ? 'Guardando…' : state.dirty ? 'Cambios pendientes' : 'Guardado local'}
          </span>
          <button
            className="icon-button"
            disabled={!state.history.length}
            title="Deshacer · Ctrl Z"
            aria-label="Deshacer"
            onClick={state.undo}
          >
            <Undo2 size={18} />
          </button>
          <button
            className="icon-button"
            disabled={!state.future.length}
            title="Rehacer · Ctrl Shift Z"
            aria-label="Rehacer"
            onClick={state.redo}
          >
            <Redo2 size={18} />
          </button>
          <span className="top-divider" />
          <button className="icon-button" aria-label="Guardar proyecto" onClick={save}>
            <Save size={18} />
          </button>
          <button
            className="icon-button"
            aria-label="Revisiones"
            onClick={() => setModal('revisions')}
          >
            <Clock3 size={18} />
          </button>
          <button
            className="icon-button theme-toggle"
            aria-label="Cambiar tema"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="primary-button export-button" onClick={() => setModal('export')}>
            Exportar <ArrowUpRight size={17} />
          </button>
        </div>
      </header>
      <div className="workspace">
        <Catalog custom={custom} onCustom={() => setModal('custom')} />
        <main className="workspace-center">
          <div className="workspace-toolbar">
            <div className="view-tabs" aria-label="Vista del editor">
              {(
                [
                  ['2d', Square, 'Plano 2D'],
                  ['3d', Box, 'Vista 3D'],
                  ['split', LayoutPanelLeft, 'Dividida'],
                ] as const
              ).map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  className={state.view === mode ? 'active' : ''}
                  onClick={() => state.setView(mode)}
                  aria-pressed={state.view === mode}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
            <div className="stage-summary">
              <span>
                {project.stage.width} × {project.stage.depth} m
              </span>
              <span>↑ {project.stage.height} m</span>
            </div>
            <button
              className="icon-button"
              aria-label="Configurar escenario"
              title="Configurar escenario"
              onClick={state.clearSelection}
            >
              <SlidersIcon />
            </button>
          </div>
          <div className="editing-toolbar">
            <span className="tool-selected">
              <MousePointer2 size={17} />
            </span>
            <span className="toolbar-separator" />
            <button
              className="icon-button"
              aria-label="Duplicar selección"
              title="Duplicar · Ctrl D"
              disabled={!state.selectedIds.length}
              onClick={state.duplicateSelected}
            >
              <Copy size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Rotar selección 15 grados"
              title="Rotar 15° · R"
              disabled={!state.selectedIds.length}
              onClick={() => {
                const o = project.objects.find((o) => o.id === state.selectedIds[0]);
                if (o) state.updateObject(o.id, { rotation: o.rotation + 15 });
              }}
            >
              <RotateCw size={16} />
            </button>
            <button
              className="icon-button"
              aria-label="Agrupar selección"
              title="Agrupar"
              disabled={state.selectedIds.length < 2}
              onClick={state.groupSelected}
            >
              <Group size={17} />
            </button>
            <button
              className="icon-button"
              aria-label="Desagrupar selección"
              title="Desagrupar"
              disabled={
                !state.selectedIds.some((id) => project.objects.find((o) => o.id === id)?.groupId)
              }
              onClick={state.ungroupSelected}
            >
              <Ungroup size={17} />
            </button>
            <button
              className="icon-button"
              aria-label="Alinear horizontalmente"
              title="Alinear horizontalmente"
              disabled={state.selectedIds.length < 2}
              onClick={() => state.alignSelected('y')}
            >
              <AlignCenterHorizontal size={17} />
            </button>
            <button
              className="icon-button"
              aria-label="Alinear verticalmente"
              title="Alinear verticalmente"
              disabled={state.selectedIds.length < 2}
              onClick={() => state.alignSelected('x')}
            >
              <AlignCenterVertical size={17} />
            </button>
            <button
              className="icon-button"
              aria-label="Distribuir centros horizontalmente"
              title="Distribuir centros en X"
              disabled={state.selectedIds.length < 3}
              onClick={() => state.distributeSelected('x')}
            >
              <AlignHorizontalDistributeCenter size={17} />
            </button>
            <button
              className="icon-button"
              aria-label="Distribuir centros en profundidad"
              title="Distribuir centros en Y"
              disabled={state.selectedIds.length < 3}
              onClick={() => state.distributeSelected('y')}
            >
              <AlignVerticalDistributeCenter size={17} />
            </button>
            <button
              className="icon-button"
              aria-label="Eliminar selección"
              title="Eliminar · Supr"
              disabled={!state.selectedIds.length}
              onClick={state.deleteSelected}
            >
              <Trash2 size={16} />
            </button>
            <span className="toolbar-spacer" />
            <button
              className={`icon-button ${project.stage.snap ? 'active' : ''}`}
              aria-label="Ajuste magnético"
              aria-pressed={project.stage.snap}
              title="Ajuste magnético"
              onClick={() => state.updateStage({ snap: !project.stage.snap })}
            >
              <Magnet size={16} />
            </button>
            <button
              className={`icon-button ${project.stage.gridVisible ? 'active' : ''}`}
              aria-label="Cuadrícula visible"
              aria-pressed={project.stage.gridVisible}
              title="Cuadrícula"
              onClick={() => state.updateStage({ gridVisible: !project.stage.gridVisible })}
            >
              <Grid2X2 size={16} />
            </button>
            <span className="grid-step">{project.stage.gridStep * 100} cm</span>
          </div>
          <div className={`editor-area view-${state.view}`}>
            <div className={`canvas-panel canvas-2d ${state.view === '3d' ? 'concealed' : ''}`}>
              <div className="canvas-caption">
                <span className="caption-square" /> VISTA SUPERIOR <span>2D</span>
              </div>
              <Editor2D />
            </div>
            {state.view !== '2d' && (
              <div className="canvas-panel canvas-3d">
                <div className="canvas-caption">
                  <span className="caption-square teal" /> PERSPECTIVA <span>3D</span>
                </div>
                <Suspense fallback={<div className="viewer-loading">Preparando escena 3D…</div>}>
                  <Editor3D />
                </Suspense>
              </div>
            )}
          </div>
          <section className={`bottom-dock ${dock ? '' : 'collapsed'}`}>
            <div className="dock-handle">
              <span>
                <span className="status-dot" /> DOCUMENTACIÓN TÉCNICA
              </span>
              <button
                className="icon-button"
                aria-label={dock ? 'Contraer documentación' : 'Expandir documentación'}
                onClick={() => setDock(!dock)}
              >
                {dock ? <PanelBottomClose size={15} /> : <PanelBottomOpen size={15} />}
              </button>
            </div>
            {dock && <AudioPanel />}
          </section>
        </main>
        <Inspector />
      </div>
      <footer className="statusbar">
        <div>
          <span className="status-dot" />
          <span>ESPACIO DE TRABAJO LOCAL</span>
          <span className="statusbar-divider" />
          <span>{project.objects.length} elementos</span>
          <span>
            {state.selectedIds.length
              ? `${state.selectedIds.length} seleccionado${state.selectedIds.length > 1 ? 's' : ''}`
              : 'Sin selección'}
          </span>
        </div>
        <div>
          <span>
            {issues.filter((i) => i.severity === 'error').length} errores ·{' '}
            {issues.filter((i) => i.severity === 'warning').length} avisos
          </span>
          <button onClick={() => setModal('help')}>
            <Keyboard size={13} /> Atajos
          </button>
          <span>METROS · v0.1</span>
        </div>
      </footer>
      {toast && (
        <div className="toast" role="alert">
          <Check size={17} />
          <span>{toast}</span>
          <button aria-label="Cerrar aviso" onClick={() => setToast('')}>
            <X size={15} />
          </button>
        </div>
      )}
      {modal === 'projects' && (
        <ProjectsDialog
          currentId={project.id}
          onClose={closeModal}
          onOpen={openProject}
          notify={notify}
        />
      )}
      {modal === 'custom' && (
        <CustomDialog
          onClose={closeModal}
          notify={notify}
          onCreated={(d) => {
            setCustom((items) => [...items, d]);
            state.addObject(d);
            notify('Equipo guardado y añadido al escenario.');
          }}
        />
      )}
      {modal === 'export' && (
        <ExportDialog project={project} onClose={closeModal} onBackup={backup} notify={notify} />
      )}
      {modal === 'revisions' && (
        <RevisionsDialog
          project={project}
          onClose={closeModal}
          notify={notify}
          onRestore={async (p) => {
            await persist(p);
            state.setProject(p);
          }}
        />
      )}
      {modal === 'help' && (
        <Modal title="Atajos de teclado" onClose={closeModal}>
          <div className="modal-form shortcut-list">
            {[
              ['Ctrl / ⌘ + S', 'Guardar'],
              ['Ctrl / ⌘ + Z', 'Deshacer'],
              ['Ctrl / ⌘ + Shift + Z', 'Rehacer'],
              ['Ctrl / ⌘ + D', 'Duplicar'],
              ['Ctrl / ⌘ + C / V', 'Copiar / pegar'],
              ['Supr', 'Eliminar selección'],
              ['R / Shift + R', 'Rotar ±15°'],
              ['Flechas / Shift + flechas', 'Mover 1 cm / 10 cm'],
              ['Shift + clic', 'Selección múltiple'],
              ['Esc', 'Limpiar selección'],
              ['/', 'Buscar en biblioteca'],
            ].map(([key, text]) => (
              <p key={key}>
                <kbd>{key}</kbd>
                <span>{text}</span>
              </p>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
function SlidersIcon() {
  return <SlidersHorizontal size={16} />;
}
