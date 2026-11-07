import { describe, it, expect } from 'vitest';
import { createDemoProject, createObject, createProject, newId } from '../core/project';
import { catalog } from '../catalog/data';
import { detectInterferences } from '../core/collisions';
import { buildStageSVG, buildCSV, createPDF, csvCell } from './export';

describe('documentos desde una instantánea coherente', () => {
  it('el PDF conserva motivo y estado de las revisiones sin modificar el proyecto', () => {
    const p = createProject();
    const def = catalog.find((d) => d.id === 'box')!;
    p.objects = [0, 0.2].map((x) => createObject(def, { x, y: 3, z: 0.8 }));
    const issue = detectInterferences(p).issues[0];
    p.interferenceReviews.push({
      id: newId(),
      objectIds: issue.objectIds,
      kind: issue.kind,
      signature: issue.signature,
      note: 'Montaje compartido QA',
      reviewedAt: p.createdAt,
    });
    const before = JSON.stringify(p);
    const output = createPDF(p).output();
    expect(output).toContain('Intencional vigente');
    expect(output).toContain('Montaje compartido QA');
    expect(JSON.stringify(p)).toBe(before);
    p.interferenceReviews[0].revokedAt = p.updatedAt;
    expect(createPDF(p).output()).toContain('Reabierta');
    delete p.interferenceReviews[0].revokedAt;
    p.objects[1].position.x = 0.4;
    expect(createPDF(p).output()).not.toContain('Intencional vigente');
  });
  it('escapa texto SVG y conserva medidas métricas y rotaciones', () => {
    const p = createDemoProject();
    p.objects[0].label = '<script>alert(1)</script>';
    p.objects[0].rotation = 45;
    const svg = buildStageSVG(p);
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
    expect(svg).toContain('data-width-m="2.4"');
    expect(svg).toContain('FRENTE');
  });
  it('protege CSV contra fórmulas y usa el perfil seleccionado', () => {
    const p = createDemoProject();
    const alternate = structuredClone(p.audioProfiles[0]);
    alternate.id = newId();
    alternate.inputs[0].channel = 87;
    p.audioProfiles.push(alternate);
    p.activeAudioProfileId = alternate.id;
    expect(buildCSV(p)).toContain('87');
    expect(csvCell('=1+1')).toContain("'=1+1");
    expect(csvCell('a"b')).toContain('a""b');
  });
  it('omite capas ocultas del plano y su encuadre, conservando inventario y audio', () => {
    const project = createDemoProject();
    const drums = project.objects.find((object) => object.definition.kind === 'drums')!;
    drums.label = 'Hidden <drums> QA';
    drums.definition.name = 'HiddenInventoryModel';
    drums.position.x = 1000;
    drums.layerId = 'hidden-test-layer';
    project.layers.push({
      id: drums.layerId,
      name: 'Capa oculta de prueba',
      hidden: true,
      locked: false,
    });
    const withoutObject = structuredClone(project);
    withoutObject.objects = withoutObject.objects.filter((object) => object.id !== drums.id);

    // Equality also checks that distant hidden equipment cannot shrink the visible plot.
    const svg = buildStageSVG(project);
    expect(svg).toBe(buildStageSVG(withoutObject));
    expect(svg).not.toContain(drums.id);
    expect(svg).not.toContain('Hidden &lt;drums&gt;');
    const pdf = createPDF(project);
    const plotPage = (pdf.internal.pages as unknown as string[][])[1].join('\n');
    expect(plotPage).not.toContain('Hidden');
    expect(pdf.output()).toContain('HiddenInventoryModel');
    expect(pdf.output()).toContain('Bombo');
    expect(buildCSV(project)).toContain('HiddenInventoryModel');
    expect(buildCSV(project)).toContain('Bombo');
  });
  it('bloquear una capa no oculta ni altera su geometría documental', () => {
    const project = createDemoProject();
    const svgBefore = buildStageSVG(project);
    const pdfBefore = createPDF(project);
    const plotBefore = (pdfBefore.internal.pages as unknown as string[][])[1].join('\n');
    project.layers.forEach((layer) => {
      layer.locked = true;
    });
    expect(buildStageSVG(project)).toBe(svgBefore);
    expect((createPDF(project).internal.pages as unknown as string[][])[1].join('\n')).toBe(
      plotBefore,
    );
  });
  it('genera PDF válido con tabla multipágina y no modifica el proyecto', () => {
    const p = createDemoProject();
    for (let n = 0; n < 120; n++) {
      const id = newId();
      p.audioSources.push({
        id,
        name: `Fuente QA ${n}`,
        microphone: 'DI',
        phantom: false,
        notes: 'Una observación con varias palabras para verificar el salto de línea.',
      });
      p.audioProfiles[0].inputs.push({
        id: newId(),
        sourceId: id,
        channel: n + 18,
        port: n + 18,
        locked: false,
      });
    }
    p.audioProfiles[0].inputCapacity = 256;
    p.audioProfiles[0].stageboxInputs = 256;
    const before = JSON.stringify(p),
      pdf = createPDF(p),
      output = pdf.output();
    expect(output).toMatch(/^%PDF-/);
    expect(output).toContain('Fuente QA 119');
    expect(pdf.getNumberOfPages()).toBeGreaterThan(6);
    expect(JSON.stringify(p)).toBe(before);
    for (let index = 1; index <= pdf.getNumberOfPages(); index++) {
      const page = (pdf.internal.pages as unknown as string[][])[index].join('\n');
      expect(page.length).toBeGreaterThan(300);
    }
  });
});
