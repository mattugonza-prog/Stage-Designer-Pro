import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  AudioLines,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Layers3,
  Link2Off,
  LockKeyhole,
  Plus,
  Trash2,
  UnlockKeyhole,
  WandSparkles,
} from 'lucide-react';
import { useEditorStore } from '../core/store';
import { inspectProject } from '../core/validation';
import InterferencePanel from '../app/InterferencePanel';
import type { AudioInput, AudioOutput, AudioProfile, AudioSource } from '../core/types';
import { activeProfile, cloneProfile, getInventory, newInput, suggestPatch } from './model';
import './audio.css';

function TextCell({
  value,
  label,
  onCommit,
  placeholder,
  required = false,
  maxLength = 200,
}: {
  value: string;
  label: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <input
      aria-label={label}
      maxLength={maxLength}
      required={required}
      value={draft}
      placeholder={placeholder}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        const next = required ? draft.trim() : draft;
        if (required && !next) {
          setDraft(value);
          return;
        }
        if (next !== value) onCommit(next);
        setDraft(next);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') {
          event.preventDefault();
          setDraft(value);
        }
      }}
    />
  );
}
function NumberCell({
  value,
  label,
  onCommit,
  max = 512,
  min = 1,
  nullable = false,
}: {
  value: number | null;
  label: string;
  onCommit: (v: number | null) => void;
  max?: number;
  min?: number;
  nullable?: boolean;
}) {
  const [draft, setDraft] = useState(value === null ? '' : String(value));
  useEffect(() => setDraft(value === null ? '' : String(value)), [value]);
  const commit = () => {
    if (draft === '' && nullable) {
      onCommit(null);
      return;
    }
    const n = Number(draft);
    if (Number.isInteger(n) && n >= min && n <= max) {
      if (n !== value) onCommit(n);
    } else setDraft(value === null ? '' : String(value));
  };
  return (
    <input
      className="audio-number"
      type="number"
      min={min}
      max={max}
      aria-label={label}
      placeholder="—"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
    />
  );
}
const tabs = ['Entradas', 'Salidas', 'Patch', 'Inventario', 'Advertencias'] as const;
type Tab = (typeof tabs)[number];

export default function AudioPanel() {
  const project = useEditorStore((state) => state.project);
  const mutate = useEditorStore((state) => state.mutateProject);
  const select = useEditorStore((state) => state.select);
  const [tab, setTab] = useState<Tab>('Entradas');
  const [expanded, setExpanded] = useState(true);
  const inspection = useMemo(() => (project ? inspectProject(project) : null), [project]);
  if (!project || !inspection) return null;
  const profile = activeProfile(project);
  const issues = inspection.issues;
  const inventory = getInventory(project);
  const updateProfile = (fn: (profile: AudioProfile) => void) =>
    mutate((p) => {
      const current = activeProfile(p);
      if (current) fn(current);
    });
  const updateSource = (id: string, patch: Partial<AudioSource>) =>
    mutate((p) => {
      const source = p.audioSources.find((s) => s.id === id);
      if (source) Object.assign(source, patch);
    });
  const updateInput = (id: string, patch: Partial<AudioInput>) =>
    updateProfile((p) => {
      const input = p.inputs.find((i) => i.id === id);
      if (input) Object.assign(input, patch);
    });
  const updateOutput = (id: string, patch: Partial<AudioOutput>) =>
    updateProfile((p) => {
      const output = p.outputs.find((o) => o.id === id);
      if (output) Object.assign(output, patch);
    });
  const addSource = () =>
    mutate((p) => {
      const source: AudioSource = {
        id: crypto.randomUUID(),
        name: `Fuente ${p.audioSources.length + 1}`,
        microphone: '',
        phantom: false,
        notes: '',
      };
      p.audioSources.push(source);
      const current = activeProfile(p);
      if (current) current.inputs.push(newInput(current, source));
    });
  const deleteSource = (source: AudioSource) => {
    if (
      !window.confirm(
        `Eliminar la fuente «${source.name}» y sus asignaciones en todos los perfiles? Los objetos del escenario se conservan.`,
      )
    )
      return;
    mutate((p) => {
      p.audioSources = p.audioSources.filter((s) => s.id !== source.id);
      for (const audioProfile of p.audioProfiles)
        audioProfile.inputs = audioProfile.inputs.filter((i) => i.sourceId !== source.id);
    });
  };
  const addProfile = () =>
    mutate((p) => {
      const next: AudioProfile = {
        id: crypto.randomUUID(),
        name: `Perfil ${p.audioProfiles.length + 1}`,
        inputCapacity: 32,
        outputCapacity: 16,
        stageboxInputs: 32,
        inputs: [],
        outputs: [],
      };
      for (const source of p.audioSources) next.inputs.push(newInput(next, source));
      p.audioProfiles.push(next);
      p.activeAudioProfileId = next.id;
    });
  const autoPatch = () => {
    if (!profile) return;
    const proposed = suggestPatch(profile);
    const changes = proposed.inputs.filter((input, i) => input.port !== profile.inputs[i].port);
    if (!changes.length) {
      window.alert('No hay puertos pendientes que puedan asignarse. Revisá bloqueos y capacidad.');
      return;
    }
    const preview =
      changes
        .slice(0, 20)
        .map((input) => `Canal ${input.channel} → puerto ${input.port}`)
        .join('\n') +
      (changes.length > 20 ? `\n… y ${changes.length - 20} asignaciones adicionales.` : '');
    if (
      !window.confirm(
        `Asignar ${changes.length} puertos pendientes?\n\n${preview}\n\nLas asignaciones existentes y los bloqueos se conservan. Podés deshacer esta operación.`,
      )
    )
      return;
    updateProfile((p) => {
      p.inputs = proposed.inputs;
    });
  };
  const addOutput = () =>
    updateProfile((p) => {
      const occupied = new Set(
        p.outputs.flatMap((o) => (o.stereo ? [o.channel, o.channel + 1] : [o.channel])),
      );
      let channel = 1;
      while (occupied.has(channel)) channel++;
      p.outputs.push({
        id: crypto.randomUUID(),
        channel,
        name: `Mezcla ${p.outputs.length + 1}`,
        bus: `AUX ${p.outputs.length + 1}`,
        stereo: false,
        destinationIds: [],
      });
    });
  let content: ReactNode;
  if (tab === 'Inventario')
    content = (
      <div className="audio-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Equipo / modelo</th>
              <th>Categoría</th>
              <th>Cantidad</th>
              <th>Dimensiones · ancho × profundidad × alto</th>
              <th>Origen del dato</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.category}</td>
                <td>
                  <strong>{row.quantity}</strong> {row.unit}
                </td>
                <td className="audio-mono">{row.dimensions}</td>
                <td>
                  <span className="audio-badge">{row.provenance}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!inventory.length && (
          <p className="audio-empty">
            Agregá equipamiento al escenario para generar el inventario.
          </p>
        )}
      </div>
    );
  else if (tab === 'Advertencias')
    content = (
      <div className="audio-issues">
        {inspection.baseIssues.length ? (
          inspection.baseIssues.map((issue, i) => (
            <button
              key={`${issue.id}-${i}`}
              className={`audio-issue ${issue.severity}`}
              onClick={() => {
                if (issue.objectId) select(issue.objectId);
              }}
              disabled={!issue.objectId}
            >
              <AlertTriangle size={15} />
              <span>{issue.message}</span>
              <small>{issue.severity === 'error' ? 'Conflicto' : 'Revisar'}</small>
            </button>
          ))
        ) : (
          <div className="audio-empty">
            <Check size={18} /> Sin avisos de audio o límites de plataforma.
          </div>
        )}
        <InterferencePanel project={project} inspection={inspection} />
      </div>
    );
  else if (!profile)
    content = (
      <div className="audio-empty">
        Creá un perfil de audio para configurar entradas y salidas.
        <button onClick={addProfile}>Crear perfil</button>
      </div>
    );
  else if (tab === 'Salidas')
    content = (
      <>
        <div className="audio-actions">
          <span>
            {profile.outputs.reduce((total, output) => total + (output.stereo ? 2 : 1), 0)} /{' '}
            {profile.outputCapacity} salidas físicas utilizadas · estéreo ocupa dos puertos
            consecutivos
          </span>
          <button onClick={addOutput}>
            <Plus size={14} /> Nueva mezcla
          </button>
        </div>
        <div className="audio-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Salida física inicial</th>
                <th>Nombre de mezcla</th>
                <th>Bus</th>
                <th>Estéreo</th>
                <th>Destinos · Ctrl/Cmd para varios</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {profile.outputs.map((output) => (
                <tr key={output.id}>
                  <td>
                    <NumberCell
                      value={output.channel}
                      label={`Salida física ${output.name}`}
                      onCommit={(value) => updateOutput(output.id, { channel: value! })}
                    />
                    {output.stereo && <small> + {output.channel + 1}</small>}
                  </td>
                  <td>
                    <TextCell
                      required
                      value={output.name}
                      label={`Nombre de salida ${output.channel}`}
                      onCommit={(value) => updateOutput(output.id, { name: value })}
                    />
                  </td>
                  <td>
                    <TextCell
                      value={output.bus}
                      label={`Bus de ${output.name}`}
                      onCommit={(value) => updateOutput(output.id, { bus: value })}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={output.stereo}
                      aria-label={`Estéreo ${output.name}`}
                      onChange={(event) =>
                        updateOutput(output.id, { stereo: event.target.checked })
                      }
                    />
                  </td>
                  <td>
                    <select
                      multiple
                      aria-label={`Destinos de ${output.name}`}
                      value={output.destinationIds}
                      onChange={(event) =>
                        updateOutput(output.id, {
                          destinationIds: Array.from(
                            event.target.selectedOptions,
                            (option) => option.value,
                          ),
                        })
                      }
                    >
                      {project.objects.map((object) => (
                        <option value={object.id} key={object.id}>
                          {object.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="audio-icon"
                      aria-label={`Eliminar salida ${output.name}`}
                      onClick={() => {
                        if (window.confirm(`Eliminar la mezcla «${output.name}»?`))
                          updateProfile((p) => {
                            p.outputs = p.outputs.filter((o) => o.id !== output.id);
                          });
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!profile.outputs.length && (
            <p className="audio-empty">Definí una mezcla y asociá uno o varios destinos físicos.</p>
          )}
        </div>
      </>
    );
  else
    content = (
      <>
        <div className="audio-actions">
          <span>
            {profile.inputs.length} fuentes asignadas ·{' '}
            {profile.inputs.filter((input) => input.port !== null).length} puertos ocupados /{' '}
            {profile.stageboxInputs}
          </span>
          <div>
            {tab === 'Patch' && (
              <button onClick={autoPatch}>
                <WandSparkles size={14} /> Proponer patch
              </button>
            )}
            <button onClick={addSource}>
              <Plus size={14} /> Nueva fuente
            </button>
          </div>
        </div>
        <div className="audio-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Canal</th>
                <th>Fuente</th>
                <th>{tab === 'Patch' ? 'Elemento de escena' : 'Micrófono / DI'}</th>
                <th>{tab === 'Patch' ? 'Puerto físico' : '48 V'}</th>
                <th>{tab === 'Patch' ? 'Bloqueo' : 'Elemento de escena'}</th>
                <th>{tab === 'Patch' ? 'Ruta' : 'Observaciones'}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {profile.inputs.map((input) => {
                const source = project.audioSources.find((s) => s.id === input.sourceId);
                if (!source)
                  return (
                    <tr key={input.id}>
                      <td>{input.channel}</td>
                      <td colSpan={6}>Fuente ausente. Revisá la integridad del proyecto.</td>
                    </tr>
                  );
                return (
                  <tr key={input.id}>
                    <td>
                      <NumberCell
                        value={input.channel}
                        label={`Canal de ${source.name}`}
                        onCommit={(value) => updateInput(input.id, { channel: value! })}
                      />
                    </td>
                    <td>
                      <TextCell
                        required
                        value={source.name}
                        label={`Nombre fuente canal ${input.channel}`}
                        onCommit={(value) => updateSource(source.id, { name: value })}
                      />
                    </td>
                    <td>
                      {tab === 'Patch' ? (
                        <button
                          className="audio-link"
                          disabled={!source.objectId}
                          onClick={() => {
                            if (source.objectId) select(source.objectId);
                          }}
                        >
                          {project.objects.find((object) => object.id === source.objectId)?.label ??
                            'Sin asociar'}
                        </button>
                      ) : (
                        <TextCell
                          value={source.microphone}
                          label={`Micrófono de ${source.name}`}
                          placeholder="Sin definir"
                          onCommit={(value) => updateSource(source.id, { microphone: value })}
                        />
                      )}
                    </td>
                    <td>
                      {tab === 'Patch' ? (
                        <NumberCell
                          value={input.port}
                          label={`Puerto físico de ${source.name}`}
                          nullable
                          onCommit={(value) => updateInput(input.id, { port: value })}
                        />
                      ) : (
                        <input
                          type="checkbox"
                          aria-label={`Phantom de ${source.name}`}
                          checked={source.phantom}
                          onChange={(event) =>
                            updateSource(source.id, { phantom: event.target.checked })
                          }
                        />
                      )}
                    </td>
                    <td>
                      {tab === 'Patch' ? (
                        <button
                          className="audio-icon"
                          aria-label={`${input.locked ? 'Desbloquear' : 'Bloquear'} patch de ${source.name}`}
                          aria-pressed={input.locked}
                          onClick={() => updateInput(input.id, { locked: !input.locked })}
                        >
                          {input.locked ? <LockKeyhole size={14} /> : <UnlockKeyhole size={14} />}
                        </button>
                      ) : (
                        <select
                          aria-label={`Elemento de ${source.name}`}
                          value={source.objectId ?? ''}
                          onChange={(event) =>
                            updateSource(source.id, { objectId: event.target.value || undefined })
                          }
                        >
                          <option value="">Sin asociar</option>
                          {project.objects.map((object) => (
                            <option key={object.id} value={object.id}>
                              {object.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      {tab === 'Patch' ? (
                        <span className="audio-route">
                          {input.port === null
                            ? 'Pendiente'
                            : `Stagebox ${input.port} → CH ${input.channel}`}
                        </span>
                      ) : (
                        <TextCell
                          maxLength={2000}
                          value={source.notes}
                          label={`Notas de ${source.name}`}
                          placeholder="—"
                          onCommit={(value) => updateSource(source.id, { notes: value })}
                        />
                      )}
                    </td>
                    <td>
                      {tab === 'Patch' && (
                        <button
                          className="audio-icon"
                          title="Quitar canal de este perfil, conservando la fuente"
                          aria-label={`Desasignar ${source.name} de este perfil`}
                          onClick={() =>
                            updateProfile((p) => {
                              p.inputs = p.inputs.filter((item) => item.id !== input.id);
                            })
                          }
                        >
                          <Link2Off size={14} />
                        </button>
                      )}
                      <button
                        className="audio-icon"
                        aria-label={`Eliminar fuente ${source.name}`}
                        onClick={() => deleteSource(source)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {project.audioSources
                .filter((source) => !profile.inputs.some((input) => input.sourceId === source.id))
                .map((source) => (
                  <tr key={source.id}>
                    <td>—</td>
                    <td>{source.name}</td>
                    <td colSpan={4}>Fuente conservada, sin canal en este perfil</td>
                    <td>
                      <button
                        onClick={() => updateProfile((p) => p.inputs.push(newInput(p, source)))}
                        aria-label={`Asignar ${source.name}`}
                      >
                        <Plus size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!project.audioSources.length && (
            <p className="audio-empty">Agregá una fuente para comenzar la lista técnica.</p>
          )}
        </div>
      </>
    );

  return (
    <section
      className={`audio-panel ${expanded ? 'expanded' : 'collapsed'}`}
      data-testid="audio-panel"
    >
      <header className="audio-tabs">
        <AudioLines size={17} />
        <div role="tablist" aria-label="Documentación técnica">
          {tabs.map((name) => (
            <button
              key={name}
              role="tab"
              aria-selected={tab === name}
              onClick={() => {
                setTab(name);
                setExpanded(true);
              }}
              className={tab === name ? 'active' : ''}
            >
              {name}
              {name === 'Advertencias' && issues.length > 0 && (
                <span className="audio-count">{issues.length}</span>
              )}
              {name === 'Entradas' && (
                <span className="audio-count">{project.audioSources.length}</span>
              )}
            </button>
          ))}
        </div>
        <button
          className="audio-icon"
          aria-label={
            expanded ? 'Contraer documentación técnica' : 'Expandir documentación técnica'
          }
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
        </button>
      </header>
      {expanded && (
        <div className="audio-body" role="tabpanel">
          {!['Inventario', 'Advertencias'].includes(tab) && (
            <div className="audio-profile">
              <Layers3 size={14} />
              <select
                aria-label="Perfil de audio"
                value={profile?.id ?? ''}
                onChange={(event) =>
                  mutate((p) => {
                    p.activeAudioProfileId = event.target.value;
                  })
                }
              >
                {!profile && <option value="">Sin perfil</option>}
                {project.audioProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {profile && (
                <>
                  <TextCell
                    required
                    value={profile.name}
                    label="Nombre del perfil"
                    onCommit={(value) =>
                      updateProfile((p) => {
                        p.name = value;
                      })
                    }
                  />
                  <label>
                    Entradas{' '}
                    <NumberCell
                      value={profile.inputCapacity}
                      label="Capacidad de entradas"
                      onCommit={(value) =>
                        updateProfile((p) => {
                          p.inputCapacity = value!;
                        })
                      }
                    />
                  </label>
                  <label>
                    Salidas{' '}
                    <NumberCell
                      value={profile.outputCapacity}
                      label="Capacidad de salidas"
                      onCommit={(value) =>
                        updateProfile((p) => {
                          p.outputCapacity = value!;
                        })
                      }
                    />
                  </label>
                  <label>
                    Stagebox{' '}
                    <NumberCell
                      value={profile.stageboxInputs}
                      label="Puertos de stagebox"
                      min={0}
                      onCommit={(value) =>
                        updateProfile((p) => {
                          p.stageboxInputs = value!;
                        })
                      }
                    />
                  </label>
                  <button
                    title="Duplicar perfil con patch independiente"
                    aria-label="Duplicar perfil de audio"
                    onClick={() =>
                      mutate((p) => {
                        const current = activeProfile(p);
                        if (!current) return;
                        const copied = cloneProfile(
                          current,
                          `${current.name.slice(0, 192)} · copia`,
                        );
                        p.audioProfiles.push(copied);
                        p.activeAudioProfileId = copied.id;
                      })
                    }
                  >
                    <Copy size={14} />
                  </button>
                </>
              )}
              <button onClick={addProfile}>
                <Plus size={14} /> Perfil
              </button>
              <small>Capacidades definidas por el usuario</small>
            </div>
          )}
          {content}
        </div>
      )}
    </section>
  );
}
