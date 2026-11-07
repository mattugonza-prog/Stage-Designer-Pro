import { useEffect, useState } from 'react';
import { isObjectLocked } from '../core/layers';
import LayersPanel from './LayersPanel';
import AnchorControls from './AnchorControls';
import PivotControls from './PivotControls';
import SceneTree from './SceneTree';
import {
  Copy,
  Trash2,
  LockKeyhole,
  UnlockKeyhole,
  Eye,
  EyeOff,
  Box,
  SlidersHorizontal,
} from 'lucide-react';
import { useEditorStore } from '../core/store';
import { getDimensions } from '../core/geometry';
import { NumberField } from './controls';
import { EquipmentIcon } from './Catalog';

export default function Inspector() {
  const state = useEditorStore();
  const project = state.project!;
  const object = project.objects.find((o) => o.id === state.selectedIds[0]);
  const dims = object ? getDimensions(object) : null;
  const parameters = object?.parameters;
  const [tab, setTab] = useState<'properties' | 'layers'>('properties');
  const [editOnly, setEditOnly] = useState(false);
  useEffect(() => setEditOnly(false), [object?.id]);
  const locked = object ? isObjectLocked(project, object) : false;
  const update = editOnly ? state.updateObjectOnly : state.updateObject;
  return (
    <aside className="inspector-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">INSPECTOR</span>
          <h2>{object ? 'Propiedades' : 'Escenario'}</h2>
        </div>
        <SlidersHorizontal size={18} />
      </div>
      <div className="inspector-tabs" aria-label="Panel del inspector">
        <button aria-pressed={tab === 'properties'} onClick={() => setTab('properties')}>
          Propiedades
        </button>
        <button aria-pressed={tab === 'layers'} onClick={() => setTab('layers')}>
          Capas
        </button>
      </div>
      {tab === 'layers' ? (
        <LayersPanel />
      ) : (
        <>
          {object && dims ? (
            <>
              <div className="selected-object">
                <span className="selected-icon">
                  <EquipmentIcon kind={object.definition.kind} size={25} />
                </span>
                <div>
                  <strong>{object.definition.name}</strong>
                  <small>
                    {object.definition.provenance === 'generic'
                      ? 'Modelo genérico · editable'
                      : 'Equipo personalizado'}
                  </small>
                </div>
              </div>
              <label className="text-field">
                <span>Nombre del elemento</span>
                <input
                  aria-label="Nombre del elemento"
                  value={object.label}
                  onChange={(e) => {
                    if (e.target.value.trim()) update(object.id, { label: e.target.value });
                  }}
                  disabled={locked}
                  maxLength={160}
                />
              </label>
              {state.selectedIds.length > 1 && (
                <p className="info-note">
                  {state.selectedIds.length} elementos seleccionados. Las propiedades corresponden
                  al primero.
                </p>
              )}
              {object.groupId && (
                <label className="check-field edit-individual">
                  <input
                    type="checkbox"
                    checked={editOnly}
                    onChange={(e) => setEditOnly(e.target.checked)}
                  />{' '}
                  Editar solo este elemento
                </label>
              )}
              {locked && !object.locked && (
                <p className="info-note">La capa de este equipo está bloqueada.</p>
              )}
              <section className="property-section">
                <h3>
                  POSICIÓN <span>metros</span>
                </h3>
                <div className="triple-fields">
                  {(['x', 'y', 'z'] as const).map((axis) => (
                    <NumberField
                      key={axis}
                      label={`Posición ${axis.toUpperCase()}`}
                      value={object.position[axis]}
                      disabled={locked}
                      min={axis === 'z' ? -100 : -1000}
                      max={1000}
                      onChange={(n) =>
                        update(object.id, { position: { ...object.position, [axis]: n } })
                      }
                    />
                  ))}
                </div>
                <NumberField
                  label="Rotación"
                  value={object.rotation}
                  suffix="°"
                  step={1}
                  disabled={locked}
                  onChange={(rotation) => update(object.id, { rotation })}
                />
              </section>
              <section className="property-section">
                <h3>
                  DIMENSIONES <Box size={12} />
                </h3>
                <div className="triple-fields">
                  {(
                    [
                      ['width', 'Ancho'],
                      ['depth', 'Profundidad'],
                      ['height', 'Alto'],
                    ] as const
                  ).map(([key, label]) => (
                    <NumberField
                      key={key}
                      label={label}
                      value={dims[key]}
                      disabled={!!parameters || locked}
                      min={0.001}
                      max={100}
                      onChange={(n) =>
                        update(object.id, {
                          dimensions: { ...object.dimensions, [key]: n },
                        })
                      }
                    />
                  ))}
                </div>
                {parameters && (
                  <p className="field-help">Medidas calculadas a partir de los gabinetes.</p>
                )}
              </section>
              {parameters && (
                <section className="property-section">
                  <h3>{parameters.type === 'led' ? 'PANTALLA MODULAR' : 'LINE ARRAY'}</h3>
                  <div className="double-fields">
                    {parameters.type === 'led' ? (
                      <>
                        <NumberField
                          disabled={locked}
                          label="Columnas"
                          value={parameters.columns}
                          suffix="uds"
                          min={1}
                          max={40}
                          step={1}
                          onChange={(columns) =>
                            update(object.id, {
                              parameters: { ...parameters, columns: Math.round(columns) },
                            })
                          }
                        />
                        <NumberField
                          disabled={locked}
                          label="Filas"
                          value={parameters.rows}
                          suffix="uds"
                          min={1}
                          max={40}
                          step={1}
                          onChange={(rows) =>
                            update(object.id, {
                              parameters: { ...parameters, rows: Math.round(rows) },
                            })
                          }
                        />
                      </>
                    ) : (
                      <>
                        <NumberField
                          disabled={locked}
                          label="Gabinetes"
                          value={parameters.count}
                          suffix="uds"
                          min={1}
                          max={24}
                          step={1}
                          onChange={(count) =>
                            update(object.id, {
                              parameters: { ...parameters, count: Math.round(count) },
                            })
                          }
                        />
                        <NumberField
                          disabled={locked}
                          label="Ángulo entre cajas"
                          value={parameters.splayAngle}
                          suffix="°"
                          min={0}
                          max={15}
                          step={0.5}
                          onChange={(splayAngle) =>
                            update(object.id, { parameters: { ...parameters, splayAngle } })
                          }
                        />
                      </>
                    )}
                  </div>
                  <div className="triple-fields">
                    <NumberField
                      disabled={locked}
                      label="Ancho gabinete"
                      value={parameters.cabinetWidth}
                      min={0.05}
                      max={5}
                      onChange={(cabinetWidth) =>
                        update(object.id, { parameters: { ...parameters, cabinetWidth } })
                      }
                    />
                    <NumberField
                      disabled={locked}
                      label="Alto gabinete"
                      value={parameters.cabinetHeight}
                      min={0.05}
                      max={5}
                      onChange={(cabinetHeight) =>
                        update(object.id, { parameters: { ...parameters, cabinetHeight } })
                      }
                    />
                    <NumberField
                      disabled={locked}
                      label="Fondo gabinete"
                      value={parameters.cabinetDepth}
                      min={0.02}
                      max={5}
                      onChange={(cabinetDepth) =>
                        update(object.id, { parameters: { ...parameters, cabinetDepth } })
                      }
                    />
                  </div>
                  <div className="quantity-summary">
                    <span>Gabinetes totales</span>
                    <strong>
                      {parameters.type === 'led'
                        ? parameters.rows * parameters.columns
                        : parameters.count}
                    </strong>
                  </div>
                </section>
              )}
              <section className="property-section">
                <h3>CAPA DEL ELEMENTO</h3>
                <select
                  className="object-layer-select"
                  aria-label="Capa del elemento"
                  value={object.layerId || ''}
                  disabled={locked}
                  onChange={(e) => {
                    state.clearSelection();
                    state.select(object.id);
                    state.assignSelectionToLayer(e.target.value || undefined);
                  }}
                >
                  <option value="">Sin capa</option>
                  {project.layers.map((layer) => (
                    <option key={layer.id} value={layer.id}>
                      {layer.name}
                      {layer.locked ? ' · bloqueada' : ''}
                    </option>
                  ))}
                </select>
              </section>
              <PivotControls object={object} />
              <AnchorControls object={object} />
              <section className="property-section">
                <h3>VISIBILIDAD Y EDICIÓN</h3>
                <div className="action-pair">
                  <button
                    className={object.locked ? 'active' : ''}
                    onClick={() => update(object.id, { locked: !object.locked })}
                  >
                    {object.locked ? <LockKeyhole size={15} /> : <UnlockKeyhole size={15} />}
                    {object.locked ? 'Bloqueado' : 'Bloquear'}
                  </button>
                  <button onClick={() => update(object.id, { hidden: !object.hidden })}>
                    {object.hidden ? <EyeOff size={15} /> : <Eye size={15} />}
                    {object.hidden ? 'Mostrar' : 'Ocultar'}
                  </button>
                </div>
                <div className="action-pair">
                  <button onClick={state.duplicateSelected}>
                    <Copy size={15} />
                    Duplicar
                  </button>
                  <button className="danger-text" onClick={state.deleteSelected}>
                    <Trash2 size={15} />
                    Eliminar
                  </button>
                </div>
              </section>
              <div className="inspector-note">
                <span className="status-dot" /> Escala física real
                <p>El zoom y el tamaño del escenario no modifican las medidas del equipo.</p>
              </div>
            </>
          ) : (
            <>
              <div className="stage-preview">
                <div>
                  <span>{project.stage.width} m</span>
                  <strong>{project.stage.depth} m</strong>
                </div>
                <small>ESCENARIO RECTANGULAR</small>
              </div>
              <section className="property-section">
                <h3>DIMENSIONES DEL ESCENARIO</h3>
                <div className="double-fields">
                  <NumberField
                    label="Ancho escenario"
                    value={project.stage.width}
                    min={1}
                    max={100}
                    onChange={(width) => state.updateStage({ width })}
                  />
                  <NumberField
                    label="Profundidad escenario"
                    value={project.stage.depth}
                    min={1}
                    max={100}
                    onChange={(depth) => state.updateStage({ depth })}
                  />
                </div>
                <NumberField
                  label="Elevación escenario"
                  value={project.stage.height}
                  min={0}
                  max={20}
                  onChange={(height) => state.updateStage({ height })}
                />
              </section>
              <section className="property-section">
                <h3>CUADRÍCULA</h3>
                <label className="text-field">
                  <span>División métrica</span>
                  <select
                    aria-label="División métrica"
                    value={project.stage.gridStep}
                    onChange={(e) => state.updateStage({ gridStep: Number(e.target.value) })}
                  >
                    {[1, 0.5, 0.25, 0.1, 0.01].map((n) => (
                      <option key={n} value={n}>
                        {n >= 1 ? `${n} m` : `${n * 100} cm`}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="check-field">
                  <input
                    type="checkbox"
                    checked={project.stage.gridVisible}
                    onChange={(e) => state.updateStage({ gridVisible: e.target.checked })}
                  />{' '}
                  Mostrar cuadrícula
                </label>
                <label className="check-field">
                  <input
                    type="checkbox"
                    checked={project.stage.snap}
                    onChange={(e) => state.updateStage({ snap: e.target.checked })}
                  />{' '}
                  Ajustar a la cuadrícula
                </label>
              </section>
              <section className="property-section">
                <h3>SUPERFICIE</h3>
                <label className="color-field">
                  <span>Color del escenario</span>
                  <input
                    type="color"
                    aria-label="Color del escenario"
                    value={project.stage.color}
                    onChange={(e) => state.updateStage({ color: e.target.value })}
                  />
                </label>
              </section>
              <div className="inspector-note">
                <span className="status-dot" /> Precisión métrica
                <p>Seleccioná un elemento en el plano o en la vista 3D para editarlo.</p>
              </div>
            </>
          )}
          <SceneTree />
        </>
      )}
    </aside>
  );
}
