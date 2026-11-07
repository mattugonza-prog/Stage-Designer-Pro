import { useState } from 'react';
import { AlertTriangle, Check, LocateFixed, RotateCcw } from 'lucide-react';
import type { Interference } from '../core/collisions';
import { isObjectHidden } from '../core/layers';
import { useEditorStore } from '../core/store';
import type { InterferenceReview, Project } from '../core/types';
import { getInterferenceReviewStatus, type ProjectInspection } from '../core/validation';

function reviewDate(value: string) {
  return new Date(value).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

function InterferenceRow({
  issue,
  review,
  project,
}: {
  issue: Interference;
  review?: InterferenceReview;
  project: Project;
}) {
  const mark = useEditorStore((state) => state.reviewInterference);
  const reopen = useEditorStore((state) => state.revokeInterferenceReview);
  const [note, setNote] = useState('');
  const objects = project.objects.filter((object) => issue.objectIds.includes(object.id));
  const names = objects.map((object) => object.label).join(' / ');
  const hidden = objects.some((object) => isObjectHidden(project, object));
  return (
    <article
      className={`interference-card ${review ? 'reviewed' : ''}`}
      data-testid="interference-card"
      data-interference-id={issue.id}
      data-reviewed={Boolean(review)}
      aria-label={`Interferencia: ${names}`}
    >
      <div className="interference-heading">
        {review ? <Check size={15} /> : <AlertTriangle size={15} />}
        <p>{issue.message}</p>
        <span className="interference-state">{review ? 'Intencional' : 'Por revisar'}</span>
      </div>
      <div className="interference-actions">
        <button
          onClick={() => {
            const state = useEditorStore.getState();
            state.clearSelection();
            for (const id of issue.objectIds) state.select(id, true);
          }}
        >
          <LocateFixed size={13} /> Localizar
        </button>
        {hidden && (
          <span className="interference-help">
            Incluye equipos ocultos. Activá su visibilidad o la de su capa para verlos.
          </span>
        )}
      </div>
      {review ? (
        <div className="interference-review">
          <p>{review.note}</p>
          <span>Revisado el {reviewDate(review.reviewedAt)}</span>
          <button onClick={() => reopen(review.id)}>
            <RotateCcw size={12} /> Reabrir
          </button>
        </div>
      ) : (
        <form
          className="interference-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (note.trim()) mark(issue, note.trim());
          }}
        >
          <label>
            <span>Motivo de la superposición intencional</span>
            <textarea
              aria-label={`Motivo de revisión ${names}`}
              placeholder="Describí por qué este montaje es intencional…"
              value={note}
              rows={2}
              maxLength={2000}
              onChange={(event) => setNote(event.target.value)}
              required
            />
          </label>
          <button disabled={!note.trim()} type="submit">
            Marcar intencional
          </button>
        </form>
      )}
    </article>
  );
}

export default function InterferencePanel({
  project,
  inspection,
}: {
  project: Project;
  inspection: ProjectInspection;
}) {
  const { interferences, activeReviews } = inspection;
  return (
    <section className="interference-panel" aria-label="Interferencias físicas">
      <header>
        <h3>Interferencias físicas</h3>
        <span>
          {interferences.total} detectadas · {activeReviews.size} intencionales
          {interferences.truncated ? ' en esta lista' : ''}
        </span>
      </header>
      <p className="interference-help">
        Se comparan los volúmenes físicos declarados y cada gabinete de los arrays, incluso si están
        ocultos. El contacto entre superficies no se cuenta como penetración. Revisar una
        advertencia registra el motivo; no certifica seguridad estructural.
      </p>
      {interferences.truncated && (
        <p className="interference-limit" role="status">
          Mostrando {interferences.issues.length} de {interferences.total} interferencias. Corregí o
          separá elementos para revisar las restantes; marcarlos intencionales no elimina su
          geometría.
        </p>
      )}
      {interferences.issues.length ? (
        interferences.issues.map((issue) => (
          <InterferenceRow
            key={issue.signature}
            issue={issue}
            project={project}
            review={activeReviews.get(issue.signature)}
          />
        ))
      ) : (
        <p className="interference-empty">
          Sin interferencias en las comprobaciones implementadas.
        </p>
      )}
      {project.interferenceReviews.length > 0 && (
        <details className="interference-history">
          <summary>Historial de revisiones ({project.interferenceReviews.length})</summary>
          <p className="interference-help">
            Al cambiar posición, giro o dimensiones, la revisión deja de aplicarse a esa geometría.
            Se conserva el registro anterior.
          </p>
          {[...project.interferenceReviews].reverse().map((review) => (
            <article key={review.id}>
              <strong>
                {review.objectIds
                  .map((id) => project.objects.find((o) => o.id === id)?.label ?? id)
                  .join(' / ')}
              </strong>
              <span>
                {
                  {
                    revoked: 'Reabierta',
                    current: 'Vigente',
                    outdated: 'Geometría anterior o interferencia resuelta',
                  }[getInterferenceReviewStatus(project, review)]
                }
                {' · '}
                {reviewDate(review.reviewedAt)}
              </span>
              <p>{review.note}</p>
              {review.revokedAt && <small>Reabierta el {reviewDate(review.revokedAt)}</small>}
            </article>
          ))}
        </details>
      )}
    </section>
  );
}
