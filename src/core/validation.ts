import { validateAudio } from '../audio/model';
import { detectInterferences, type InterferenceReport } from './collisions';
import { validateProject } from './geometry';
import type { InterferenceReview, Project, ValidationIssue } from './types';

export interface ProjectInspection {
  issues: ValidationIssue[];
  baseIssues: ValidationIssue[];
  interferences: InterferenceReport;
  activeReviews: Map<string, InterferenceReview>;
}

/** Resolve history against its own one/two objects, independently of the display limit. */
export function getInterferenceReviewStatus(
  project: Project,
  review: InterferenceReview,
): 'current' | 'outdated' | 'revoked' {
  if (review.revokedAt) return 'revoked';
  const objects = project.objects.filter((object) => review.objectIds.includes(object.id));
  if (objects.length !== review.objectIds.length) return 'outdated';
  const report = detectInterferences({ ...project, objects }, 3);
  return report.issues.some(
    (issue) =>
      issue.kind === review.kind &&
      issue.signature === review.signature &&
      issue.objectIds.length === review.objectIds.length &&
      issue.objectIds.every((id) => review.objectIds.includes(id)),
  )
    ? 'current'
    : 'outdated';
}

/** One physical/audio validation contract for the editor and exported documents. */
export function inspectProject(project: Project): ProjectInspection {
  const baseIssues = [...validateProject(project), ...validateAudio(project)];
  const interferences = detectInterferences(project);
  const bySignature = new Map(interferences.issues.map((issue) => [issue.signature, issue]));
  const activeReviews = new Map<string, InterferenceReview>();
  for (const review of project.interferenceReviews) {
    const issue = bySignature.get(review.signature);
    if (
      !review.revokedAt &&
      issue &&
      issue.kind === review.kind &&
      issue.objectIds.length === review.objectIds.length &&
      issue.objectIds.every((id) => review.objectIds.includes(id))
    ) {
      const previous = activeReviews.get(review.signature);
      if (!previous || previous.reviewedAt <= review.reviewedAt)
        activeReviews.set(review.signature, review);
    }
  }
  const issues: ValidationIssue[] = [
    ...baseIssues,
    ...interferences.issues
      .filter((issue) => !activeReviews.has(issue.signature))
      .map(
        (issue): ValidationIssue => ({
          id: issue.id,
          severity: 'warning',
          message: issue.message,
          objectId: issue.objectIds[0],
        }),
      ),
  ];
  if (interferences.truncated)
    issues.push({
      id: 'interference-display-limit',
      severity: 'warning',
      message: `Se muestran ${interferences.issues.length} de ${interferences.total} interferencias. Corregí o separá elementos para revisar las restantes.`,
    });
  return { issues, baseIssues, interferences, activeReviews };
}
