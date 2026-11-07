import { useEffect, useState, type FormEvent } from 'react';
import {
  Plus,
  FolderOpen,
  Copy,
  Trash2,
  Archive,
  Upload,
  ArrowUpRight,
  Download,
  FileText,
  FileImage,
  Table2,
  Clock3,
} from 'lucide-react';
import { createProject, createDemoProject } from '../core/project';
import type { EquipmentDefinition, EquipmentKind, Project, ProjectRevision } from '../core/types';
import {
  listProjects,
  saveProject,
  deleteProject,
  duplicateProject,
  parseProject,
  saveDefinition,
  listRevisions,
  saveRevision,
} from '../storage/projects';
import { exportSVG, exportPNG, exportCSV, exportPDF } from '../documents/export';
import { Modal } from './controls';

export function ProjectsDialog({
  onClose,
  onOpen,
  currentId,
  notify,
}: {
  onClose: () => void;
  onOpen: (project: Project) => Promise<void>;
  currentId: string;
  notify: (s: string) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('Mi escenario');
  const [width, setWidth] = useState(8),
    [depth, setDepth] = useState(6),
    [height, setHeight] = useState(0.8);
  const [busy, setBusy] = useState(false),
    [showArchived, setShowArchived] = useState(false);
  const refresh = () =>
    listProjects()
      .then(setProjects)
      .catch((e) => notify(String(e)));
  useEffect(() => {
    void refresh();
  }, []);
  async function create(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const p = createProject(name.trim(), { width, depth, height });
      await saveProject(p);
      await onOpen(p);
      onClose();
    } catch (e) {
      notify(`No se pudo crear: ${e}`);
    } finally {
      setBusy(false);
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('El archivo supera el límite de 10 MB.');
      const p = parseProject(await file.text());
      p.id = crypto.randomUUID();
      p.name = p.name.slice(0, 180) + ' · importado';
      p.createdAt = p.updatedAt = new Date().toISOString();
      await saveProject(p);
      await onOpen(p);
      onClose();
    } catch (e) {
      notify(`Importación rechazada: ${e instanceof Error ? e.message : e}`);
    }
  }
  return (
    <Modal title="Tus proyectos" onClose={onClose} wide>
      <div className="project-manager">
        <form className="new-project-form" onSubmit={create}>
          <span className="eyebrow">EMPEZAR DE CERO</span>
          <h3>Un escenario, infinitas posibilidades.</h3>
          <label className="text-field">
            <span>Nombre del proyecto</span>
            <input
              aria-label="Nombre del proyecto nuevo"
              required
              maxLength={160}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <div className="double-fields">
            <label className="text-field">
              <span>Ancho (m)</span>
              <input
                type="number"
                aria-label="Ancho nuevo escenario"
                required
                min="1"
                max="100"
                step=".01"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
              />
            </label>
            <label className="text-field">
              <span>Profundidad (m)</span>
              <input
                type="number"
                aria-label="Profundidad nuevo escenario"
                required
                min="1"
                max="100"
                step=".01"
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
              />
            </label>
          </div>
          <label className="text-field">
            <span>Elevación (m)</span>
            <input
              type="number"
              aria-label="Elevación nuevo escenario"
              required
              min="0"
              max="20"
              step=".01"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
            />
          </label>
          <button className="primary-button" disabled={busy}>
            <Plus size={17} /> Crear proyecto
          </button>
          <div className="project-import">
            <label className="subtle-button">
              <Upload size={16} /> Importar .stagepro
              <input
                type="file"
                accept=".stagepro,.json"
                hidden
                onChange={(e) => void importFile(e.target.files?.[0])}
              />
            </label>
            <button
              type="button"
              className="subtle-button"
              onClick={async () => {
                const p = createDemoProject();
                try {
                  await saveProject(p);
                  await onOpen(p);
                  onClose();
                } catch (e) {
                  notify(String(e));
                }
              }}
            >
              <ArrowUpRight size={16} /> Crear demo de banda
            </button>
          </div>
        </form>
        <div className="recent-projects">
          <div className="section-title">
            <h3>Proyectos locales</h3>
            <label className="check-field">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />{' '}
              Archivados
            </label>
          </div>
          {projects
            .filter((p) => p.archived === showArchived)
            .map((p) => (
              <article className="project-card" key={p.id}>
                <button
                  className="project-open"
                  onClick={async () => {
                    try {
                      await onOpen(p);
                      onClose();
                    } catch (e) {
                      notify(String(e));
                    }
                  }}
                >
                  <span className="project-thumbnail">
                    <FolderOpen size={25} />
                  </span>
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      {p.stage.width} × {p.stage.depth} m · {p.objects.length} elementos
                    </small>
                    <small>
                      {new Date(p.updatedAt).toLocaleString('es-AR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                      {p.id === currentId ? ' · Abierto' : ''}
                    </small>
                  </span>
                </button>
                <div className="project-card-actions">
                  <button
                    title="Duplicar proyecto"
                    aria-label={`Duplicar ${p.name}`}
                    onClick={async () => {
                      try {
                        await duplicateProject(p);
                        await refresh();
                      } catch (e) {
                        notify(String(e));
                      }
                    }}
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    title={p.archived ? 'Desarchivar' : 'Archivar'}
                    aria-label={`Archivar ${p.name}`}
                    disabled={p.id === currentId}
                    onClick={async () => {
                      try {
                        await saveProject({
                          ...p,
                          archived: !p.archived,
                          updatedAt: new Date().toISOString(),
                        });
                        await refresh();
                      } catch (e) {
                        notify(String(e));
                      }
                    }}
                  >
                    <Archive size={14} />
                  </button>
                  <button
                    title="Eliminar proyecto"
                    aria-label={`Eliminar ${p.name}`}
                    disabled={p.id === currentId}
                    onClick={async () => {
                      if (
                        confirm(
                          `¿Eliminar «${p.name}» y sus revisiones de este navegador? Esta acción no se puede deshacer.`,
                        )
                      ) {
                        try {
                          await deleteProject(p.id);
                          await refresh();
                        } catch (e) {
                          notify(String(e));
                        }
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </article>
            ))}
          {!projects.filter((p) => p.archived === showArchived).length && (
            <p className="empty-message">No hay proyectos en esta sección.</p>
          )}
          <p className="local-storage-note">
            Guardados en este navegador. Exportá un respaldo .stagepro para conservar una copia
            externa o trasladar tu trabajo.
          </p>
        </div>
      </div>
    </Modal>
  );
}

export function CustomDialog({
  onClose,
  onCreated,
  notify,
}: {
  onClose: () => void;
  onCreated: (d: EquipmentDefinition) => void;
  notify: (s: string) => void;
}) {
  const [name, setName] = useState('Mi equipo');
  const [kind, setKind] = useState<EquipmentKind>('box');
  const [width, setWidth] = useState(1),
    [depth, setDepth] = useState(0.5),
    [height, setHeight] = useState(0.5);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const def: EquipmentDefinition = {
      id: crypto.randomUUID(),
      version: 1,
      name: name.trim(),
      category: 'Escenario',
      kind,
      dimensions: { width, depth, height },
      color: '#7dbba6',
      provenance: 'user',
      description: 'Medidas introducidas por el usuario. Representación genérica.',
    };
    try {
      await saveDefinition(def);
      onCreated(def);
      onClose();
    } catch (e) {
      notify(`No se pudo guardar el equipo: ${e}`);
    }
  }
  return (
    <Modal title="Crear equipo personalizado" onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <p>
          Guardá un equipo dimensionado en tu biblioteca local. Estará disponible en todos tus
          proyectos.
        </p>
        <label className="text-field">
          <span>Nombre</span>
          <input
            aria-label="Nombre equipo personalizado"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={160}
            required
          />
        </label>
        <label className="text-field">
          <span>Representación genérica</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as EquipmentKind)}>
            {(
              [
                ['box', 'Caja / equipo'],
                ['speaker', 'Altavoz'],
                ['monitor', 'Monitor de piso'],
                ['riser', 'Tarima'],
                ['keyboard', 'Teclado'],
                ['microphone', 'Micrófono'],
                ['person', 'Persona'],
                ['console', 'Consola'],
              ] as const
            ).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="triple-fields">
          {(
            [
              ['Ancho', width, setWidth],
              ['Profundidad', depth, setDepth],
              ['Alto', height, setHeight],
            ] as const
          ).map(([label, value, setter]) => (
            <label className="text-field" key={label}>
              <span>{label} (m)</span>
              <input
                type="number"
                aria-label={`${label} equipo personalizado`}
                min=".001"
                max="100"
                step=".001"
                value={value}
                required
                onChange={(e) => setter(Number(e.target.value))}
              />
            </label>
          ))}
        </div>
        <button className="primary-button">
          <Plus size={16} /> Guardar en biblioteca
        </button>
      </form>
    </Modal>
  );
}

export function ExportDialog({
  project,
  onClose,
  onBackup,
  notify,
}: {
  project: Project;
  onClose: () => void;
  onBackup: () => void;
  notify: (s: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const formats = [
    {
      label: 'Rider técnico',
      extension: 'PDF',
      detail: 'Plano, entradas, salidas, patch e inventario.',
      Icon: FileText,
      action: exportPDF,
    },
    {
      label: 'Plano vectorial',
      extension: 'SVG',
      detail: 'Geometría y cotas a escala proporcional.',
      Icon: FileImage,
      action: exportSVG,
    },
    {
      label: 'Imagen del plano',
      extension: 'PNG',
      detail: 'Vista superior para compartir.',
      Icon: FileImage,
      action: exportPNG,
    },
    {
      label: 'Lista de entradas',
      extension: 'CSV',
      detail: 'Canales y patch del perfil activo.',
      Icon: Table2,
      action: exportCSV,
    },
  ];
  return (
    <Modal title="Exportar proyecto" onClose={onClose}>
      <div className="modal-form">
        <p>
          Los documentos se generan desde una instantánea de <strong>{project.name}</strong>.
        </p>
        <div className="export-grid">
          {formats.map((f) => (
            <button
              key={f.extension}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await f.action(structuredClone(project));
                  notify(`${f.extension} generado.`);
                } catch (e) {
                  notify(`No se pudo exportar: ${e}`);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <f.Icon size={25} />
              <span>
                <strong>{f.label}</strong>
                <small>{f.detail}</small>
              </span>
              <b>{f.extension}</b>
            </button>
          ))}
        </div>
        <button className="primary-button" onClick={onBackup}>
          <Download size={17} /> Respaldar proyecto .stagepro
        </button>
        <p className="field-help">
          El respaldo conserva los datos editables. El plano se ajusta a página; esta versión no
          declara una escala fija de impresión. Las capturas 3D se exportan desde su visor.
        </p>
      </div>
    </Modal>
  );
}

export function RevisionsDialog({
  project,
  onClose,
  onRestore,
  notify,
}: {
  project: Project;
  onClose: () => void;
  onRestore: (p: Project) => Promise<void>;
  notify: (s: string) => void;
}) {
  const [revisions, setRevisions] = useState<ProjectRevision[]>([]),
    [name, setName] = useState('Revisión de montaje');
  const refresh = () =>
    listRevisions(project.id)
      .then(setRevisions)
      .catch((e) => notify(String(e)));
  useEffect(() => {
    void refresh();
  }, [project.id]);
  return (
    <Modal title="Revisiones del proyecto" onClose={onClose}>
      <div className="modal-form">
        <p>
          Guardá una instantánea para recuperar o exportar el montaje tal como estaba en ese
          momento.
        </p>
        <form
          className="inline-form"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await saveRevision(project, name);
              await refresh();
              notify('Revisión guardada.');
            } catch (e) {
              notify(String(e));
            }
          }}
        >
          <input
            aria-label="Nombre de revisión"
            value={name}
            maxLength={160}
            required
            onChange={(e) => setName(e.target.value)}
          />
          <button className="primary-button">
            <Plus size={16} /> Guardar revisión
          </button>
        </form>
        <div className="revision-list">
          {revisions.map((r) => (
            <article key={r.id}>
              <Clock3 size={17} />
              <div>
                <strong>{r.name}</strong>
                <small>{new Date(r.createdAt).toLocaleString('es-AR')}</small>
              </div>
              <button
                className="subtle-button"
                onClick={() => {
                  if (
                    confirm(
                      '¿Restaurar esta revisión? Se guardará una revisión del estado actual antes de reemplazarlo.',
                    )
                  )
                    void (async () => {
                      try {
                        await saveRevision(project, 'Antes de restaurar');
                        await onRestore({
                          ...structuredClone(r.project),
                          updatedAt: new Date().toISOString(),
                        });
                        onClose();
                      } catch (e) {
                        notify(String(e));
                      }
                    })();
                }}
              >
                Restaurar
              </button>
              <button
                className="icon-button"
                aria-label={`Exportar PDF de ${r.name}`}
                onClick={() =>
                  void exportPDF(structuredClone(r.project)).catch((e) => notify(String(e)))
                }
              >
                <Download size={16} />
              </button>
            </article>
          ))}
          {!revisions.length && <p className="empty-message">Todavía no guardaste revisiones.</p>}
        </div>
      </div>
    </Modal>
  );
}
