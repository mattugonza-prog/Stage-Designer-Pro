import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Project, SceneObject } from '../core/types';
import { getDimensions } from '../core/geometry';
import { isObjectHidden } from '../core/layers';
import { activeProfile, getInventory } from '../audio/model';
import { getInterferenceReviewStatus, inspectProject } from '../core/validation';

type Point = { x: number; y: number };
type Plot = { x: (value: number) => number; y: (value: number) => number; scale: number };

const number = (value: number) => Number(value.toFixed(3)).toString();
const escapeXML = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (character) =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]!,
  );
const filename = (project: Project) =>
  project.name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').slice(0, 100) || 'stage-designer';

/** Physical, rotated footprint in the project's XY plane. UI zoom never enters this calculation. */
export function documentFootprint(object: SceneObject): Point[] {
  const dimensions = getDimensions(object);
  const angle = (object.rotation * Math.PI) / 180;
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([x, y]) => ({
    x:
      object.position.x +
      ((x * dimensions.width) / 2) * Math.cos(angle) -
      ((y * dimensions.depth) / 2) * Math.sin(angle),
    y:
      object.position.y +
      ((x * dimensions.width) / 2) * Math.sin(angle) +
      ((y * dimensions.depth) / 2) * Math.cos(angle),
  }));
}

function layout(project: Project, left: number, top: number, width: number, height: number): Plot {
  const points = project.objects
    .filter((object) => !isObjectHidden(project, object))
    .flatMap(documentFootprint);
  const minX = Math.min(-project.stage.width / 2, ...points.map((point) => point.x)) - 0.6;
  const maxX = Math.max(project.stage.width / 2, ...points.map((point) => point.x)) + 0.6;
  const minY = Math.min(0, ...points.map((point) => point.y)) - 0.6;
  const maxY = Math.max(project.stage.depth, ...points.map((point) => point.y)) + 0.6;
  const scale = Math.min(width / (maxX - minX), height / (maxY - minY));
  const originX = left + (width - (maxX - minX) * scale) / 2;
  const originY = top + (height - (maxY - minY) * scale) / 2;
  return {
    x: (value) => originX + (value - minX) * scale,
    y: (value) => originY + (maxY - value) * scale,
    scale,
  };
}

function inputMarkers(project: Project, objectId: string): string {
  const sourceIds = new Set(
    project.audioSources
      .filter((source) => source.objectId === objectId)
      .map((source) => source.id),
  );
  return (
    activeProfile(project)
      ?.inputs.filter((input) => sourceIds.has(input.sourceId))
      .map((input) => input.channel)
      .sort((a, b) => a - b)
      .join(', ') ?? ''
  );
}

function outputMarkers(project: Project, objectId: string): string {
  return (
    activeProfile(project)
      ?.outputs.filter((output) => output.destinationIds.includes(objectId))
      .map((output) =>
        output.stereo ? `${output.channel}/${output.channel + 1}` : String(output.channel),
      )
      .join(', ') ?? ''
  );
}

/** Standalone vector document with no references to external fonts, images or active content. */
export function buildStageSVG(project: Project): string {
  const plot = layout(project, 80, 145, 1040, 650);
  const stageLeft = plot.x(-project.stage.width / 2);
  const stageTop = plot.y(project.stage.depth);
  const stageWidth = project.stage.width * plot.scale;
  const stageDepth = project.stage.depth * plot.scale;
  const objects = project.objects
    .filter((object) => !isObjectHidden(project, object))
    .map((object, index) => {
      const points = documentFootprint(object)
        .map((point) => `${number(plot.x(point.x))},${number(plot.y(point.y))}`)
        .join(' ');
      const cx = plot.x(object.position.x),
        cy = plot.y(object.position.y);
      const input = inputMarkers(project, object.id),
        output = outputMarkers(project, object.id);
      const marker = (value: string, y: number, inverted: boolean) =>
        value
          ? `<g><rect x="${number(cx - Math.max(12, value.length * 3.8))}" y="${number(y - 10)}" width="${number(Math.max(24, value.length * 7.6))}" height="20" rx="10" fill="${inverted ? '#182326' : '#fff'}" stroke="#182326"/><text x="${number(cx)}" y="${number(y + 4)}" fill="${inverted ? '#fff' : '#182326'}" font-size="12" font-weight="700" text-anchor="middle">${escapeXML(value)}</text></g>`
          : '';
      return `<g data-object-id="${escapeXML(object.id)}" data-width-m="${number(getDimensions(object).width)}" data-depth-m="${number(getDimensions(object).depth)}"><title>${escapeXML(object.label)} · ${number(object.position.z)} m de elevación</title><polygon points="${points}" fill="${object.definition.kind === 'riser' ? '#f5f6f6' : '#e4e9e8'}" stroke="#304340" stroke-width="1.4"/><text x="${number(cx)}" y="${number(cy + 4)}" font-size="11" text-anchor="middle" fill="#132622">${index + 1}. ${escapeXML(object.label.slice(0, 27))}</text>${marker(input, cy - 19, false)}${marker(output, cy + 20, true)}</g>`;
    })
    .join('\n');
  const profile = activeProfile(project);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900" role="img" aria-label="Plano técnico de escenario">
<rect width="1200" height="900" fill="#fff"/>
<g font-family="Arial, Helvetica, sans-serif">
<text x="50" y="43" font-size="12" font-weight="700" letter-spacing="3" fill="#37685d">STAGE DESIGNER PRO / PLANO TÉCNICO</text>
<text x="50" y="81" font-size="28" font-weight="700" fill="#152421">${escapeXML(project.name.slice(0, 65))}</text>
<text x="50" y="107" font-size="13" fill="#52645f">${escapeXML(profile?.name ?? 'Sin perfil de audio')} · Escenario ${number(project.stage.width)} × ${number(project.stage.depth)} m · Elevación ${number(project.stage.height)} m</text>
<rect x="${number(stageLeft)}" y="${number(stageTop)}" width="${number(stageWidth)}" height="${number(stageDepth)}" fill="#fafbfa" stroke="#203a32" stroke-width="2"/>
<path d="M ${number(stageLeft)} ${number(stageTop - 15)} H ${number(stageLeft + stageWidth)} M ${number(stageLeft)} ${number(stageTop - 20)} v 10 M ${number(stageLeft + stageWidth)} ${number(stageTop - 20)} v 10" fill="none" stroke="#52645f"/>
<text x="${number(stageLeft + stageWidth / 2)}" y="${number(stageTop - 24)}" text-anchor="middle" font-size="12">${number(project.stage.width)} m · FONDO / UPSTAGE</text>
<text x="${number(stageLeft - 18)}" y="${number(stageTop + stageDepth / 2)}" text-anchor="middle" font-size="12" transform="rotate(-90 ${number(stageLeft - 18)} ${number(stageTop + stageDepth / 2)})">${number(project.stage.depth)} m</text>
${objects}
<text x="${number(stageLeft + stageWidth / 2)}" y="${number(stageTop + stageDepth + 24)}" text-anchor="middle" font-size="12" font-weight="700">FRENTE / PÚBLICO</text>
<text x="50" y="832" font-size="12" fill="#52645f">Derecha escénica ← artista mirando al público → Izquierda escénica</text>
<path d="M 50 856 h ${number(plot.scale)} M 50 851 v 10 M ${number(50 + plot.scale)} 851 v 10" fill="none" stroke="#203a32" stroke-width="2"/>
<text x="${number(60 + plot.scale)}" y="860" font-size="11">1 m · Ajustado a página; sin escala de impresión fija</text>
<text x="1150" y="860" text-anchor="end" font-size="11" fill="#52645f">Rev. ${escapeXML(project.updatedAt.slice(0, 19))} · Huellas físicas / cotas en metros</text>
</g></svg>`;
}

/** All text cells are quoted and spreadsheet formulas are neutralized, including leading whitespace. */
export function csvCell(value: string | number | boolean | null): string {
  let text = String(value ?? '');
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildCSV(project: Project): string {
  const profile = activeProfile(project);
  const rows: (string | number | boolean | null)[][] = [
    ['Proyecto', project.name],
    ['Perfil', profile?.name ?? 'Sin perfil de audio'],
    ['Revisión', project.updatedAt],
    [],
    ['ENTRADAS'],
    ['Canal', 'Fuente', 'Micrófono / DI', 'Phantom 48V', 'Puerto físico', 'Objeto', 'Notas'],
  ];
  for (const input of [...(profile?.inputs ?? [])].sort((a, b) => a.channel - b.channel)) {
    const source = project.audioSources.find((item) => item.id === input.sourceId);
    const object = project.objects.find((item) => item.id === source?.objectId);
    rows.push([
      input.channel,
      source?.name ?? 'Fuente no disponible',
      source?.microphone ?? '',
      source?.phantom ? 'Sí' : 'No',
      input.port,
      object?.label ?? '',
      source?.notes ?? '',
    ]);
  }
  rows.push([], ['SALIDAS'], ['Puerto', 'Mezcla', 'Bus', 'Formato', 'Destinos']);
  for (const output of profile?.outputs ?? [])
    rows.push([
      output.stereo ? `${output.channel}/${output.channel + 1}` : output.channel,
      output.name,
      output.bus,
      output.stereo ? 'Estéreo' : 'Mono',
      output.destinationIds
        .map(
          (id) =>
            project.objects.find((object) => object.id === id)?.label ?? 'Destino no disponible',
        )
        .join('; '),
    ]);
  rows.push(
    [],
    ['INVENTARIO'],
    ['Equipo', 'Categoría', 'Cantidad', 'Unidad', 'Dimensiones', 'Origen de datos'],
  );
  for (const row of getInventory(project))
    rows.push([row.name, row.category, row.quantity, row.unit, row.dimensions, row.provenance]);
  return '\ufeff' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}

function drawPolygon(doc: jsPDF, points: Point[], fill = true) {
  doc.path([
    ...points.map((point, index) => ({
      op: index ? ('l' as const) : ('m' as const),
      c: [point.x, point.y],
    })),
    { op: 'h', c: [] },
  ]);
  if (fill) doc.fillStroke();
  else doc.stroke();
}

/** Build a selectable-text/vector PDF using one immutable project snapshot. */
export function createPDF(inputProject: Project): jsPDF {
  const project = structuredClone(inputProject);
  const profile = activeProfile(project);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: false });
  doc.setProperties({
    title: `${project.name} - Rider técnico`,
    subject: profile?.name ?? 'Stage plot',
    author: project.organization || 'Stage Designer Pro',
    creator: 'Stage Designer Pro',
  });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(45, 91, 78);
  doc.setFontSize(10);
  doc.text('STAGE DESIGNER PRO / RIDER TÉCNICO', 15, 16);
  doc.setTextColor(24, 35, 31);
  doc.setFontSize(19);
  const titleLines = doc.splitTextToSize(project.name, 265).slice(0, 2);
  doc.text(titleLines, 15, 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const titleBottom = 28 + (titleLines.length - 1) * 7;
  doc.text(
    `${number(project.stage.width)} × ${number(project.stage.depth)} m | Elevación: ${number(project.stage.height)} m | Perfil: ${(profile?.name ?? 'Sin perfil').slice(0, 70)}`,
    15,
    titleBottom + 7,
  );
  doc.text(
    [project.organization, project.eventDate].filter(Boolean).join(' | ').slice(0, 150),
    15,
    titleBottom + 13,
  );
  const plotTop = titleBottom + 20;
  const plot = layout(project, 24, plotTop, 249, 176 - plotTop);
  const stageX = plot.x(-project.stage.width / 2),
    stageY = plot.y(project.stage.depth);
  doc.setDrawColor(55, 74, 67);
  doc.setFillColor(249, 250, 249);
  doc.setLineWidth(0.35);
  doc.rect(
    stageX,
    stageY,
    project.stage.width * plot.scale,
    project.stage.depth * plot.scale,
    'FD',
  );
  doc.setFontSize(8);
  doc.text(`${number(project.stage.width)} m / FONDO`, plot.x(0), stageY - 3, { align: 'center' });
  doc.text(`${number(project.stage.depth)} m`, stageX - 3, plot.y(project.stage.depth / 2), {
    angle: 90,
    align: 'center',
  });
  for (const [index, object] of project.objects
    .filter((item) => !isObjectHidden(project, item))
    .entries()) {
    const gray = object.definition.kind === 'riser' ? 245 : 225;
    doc.setDrawColor(57, 77, 66);
    doc.setFillColor(gray, gray, gray);
    drawPolygon(
      doc,
      documentFootprint(object).map((point) => ({ x: plot.x(point.x), y: plot.y(point.y) })),
    );
    doc.setFontSize(6);
    doc.setTextColor(20, 31, 25);
    const label = `${index + 1}. ${object.label}`;
    const text = doc.splitTextToSize(
      label,
      Math.max(15, getDimensions(object).width * plot.scale + 4),
    );
    doc.text(text.slice(0, 2), plot.x(object.position.x), plot.y(object.position.y), {
      align: 'center',
    });
    const marker = (value: string, y: number, output: boolean) => {
      if (!value) return;
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      const width = Math.max(5, doc.getTextWidth(value) + 3);
      const background = output ? 25 : 255;
      doc.setFillColor(background, background, background);
      doc.setDrawColor(25);
      doc.roundedRect(plot.x(object.position.x) - width / 2, y - 2.2, width, 4.5, 2, 2, 'FD');
      doc.setTextColor(output ? 255 : 25);
      doc.text(value, plot.x(object.position.x), y + 0.7, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(20, 31, 25);
    };
    marker(inputMarkers(project, object.id), plot.y(object.position.y) - 5, false);
    marker(outputMarkers(project, object.id), plot.y(object.position.y) + 6, true);
  }
  doc.setFontSize(8);
  doc.text('FRENTE / PÚBLICO', plot.x(0), plot.y(0) + 5, { align: 'center' });
  doc.setFontSize(7);
  doc.text(
    'Derecha escénica: izquierda del plano. Izquierda escénica: derecha del plano. Vista desde el público.',
    15,
    185,
  );
  doc.text(
    'Ajustado a página, sin escala de impresión fija. Cotas y huellas físicas en metros. Círculo claro: entrada; oscuro: salida.',
    15,
    190,
  );
  doc.setDrawColor(25);
  doc.line(15, 179, 15 + plot.scale, 179);
  doc.line(15, 177.5, 15, 180.5);
  doc.line(15 + plot.scale, 177.5, 15 + plot.scale, 180.5);
  doc.text('1 m', 17 + plot.scale, 180);

  const table = (
    title: string,
    head: string[],
    body: (string | number)[][],
    widths?: Record<number, { cellWidth: number }>,
  ) => {
    if (!body.length) return;
    doc.addPage('a4', 'portrait');
    const pageHeading = () => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(24, 35, 31);
      doc.text(title, 14, 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(
        `${project.name.slice(0, 70)} / ${(profile?.name ?? 'Sin perfil').slice(0, 65)}`,
        14,
        27,
      );
    };
    autoTable(doc, {
      head: [head],
      body,
      startY: 33,
      margin: { top: 33, bottom: 19, left: 14, right: 14 },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2.2,
        overflow: 'linebreak',
        lineWidth: 0.1,
        lineColor: [220, 226, 223],
      },
      headStyles: { fillColor: [35, 76, 64], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [246, 248, 247] },
      columnStyles: widths,
      rowPageBreak: 'avoid',
      showHead: 'everyPage',
      willDrawPage: pageHeading,
    });
  };
  const sourceById = new Map(project.audioSources.map((source) => [source.id, source]));
  table(
    'Input list / patch físico',
    ['CH', 'Fuente', 'Micrófono / DI', '48V', 'Puerto', 'Notas'],
    [...(profile?.inputs ?? [])]
      .sort((a, b) => a.channel - b.channel)
      .map((input) => {
        const source = sourceById.get(input.sourceId);
        return [
          input.channel,
          source?.name ?? 'Fuente no disponible',
          source?.microphone ?? '',
          source?.phantom ? 'Sí' : 'No',
          input.port ?? 'Pendiente',
          source?.notes ?? '',
        ];
      }),
    { 0: { cellWidth: 12 }, 3: { cellWidth: 12 }, 4: { cellWidth: 17 } },
  );
  table(
    'Output list / monitoreo',
    ['Puertos', 'Mezcla', 'Bus', 'Formato', 'Destinos'],
    (profile?.outputs ?? []).map((output) => [
      output.stereo ? `${output.channel}/${output.channel + 1}` : output.channel,
      output.name,
      output.bus,
      output.stereo ? 'Estéreo' : 'Mono',
      output.destinationIds
        .map(
          (id) =>
            project.objects.find((object) => object.id === id)?.label ?? 'Destino no disponible',
        )
        .join(', '),
    ]),
  );
  table(
    'Inventario de equipamiento',
    ['Equipo', 'Categoría', 'Cantidad', 'Unidad', 'Dimensiones', 'Datos'],
    getInventory(project).map((item) => [
      item.name,
      item.category,
      item.quantity,
      item.unit,
      item.dimensions,
      item.provenance,
    ]),
  );
  const inspection = inspectProject(project);
  table(
    'Observaciones de audio y geometría',
    ['Nivel', 'Observación'],
    inspection.issues.map((issue) => [
      issue.severity === 'error' ? 'Error' : 'Revisar',
      issue.message,
    ]),
  );
  if (inspection.interferences.total || project.interferenceReviews.length)
    table(
      'Criterio de interferencias',
      ['Alcance'],
      [
        [
          'La comprobación usa los volúmenes físicos declarados de los equipos y cada gabinete de line array. El contacto entre superficies no se considera penetración. Las advertencias no bloquean el guardado ni constituyen una certificación estructural o de seguridad. Una revisión intencional expresa una decisión del usuario para la geometría registrada.',
        ],
      ],
    );
  table(
    'Revisiones de interferencias',
    ['Registrada (UTC)', 'Equipos', 'Estado', 'Motivo / reapertura'],
    project.interferenceReviews.map((review) => {
      const status = getInterferenceReviewStatus(project, review);
      return [
        review.reviewedAt.replace('T', ' ').replace(/\.\d{3}Z$/, ''),
        review.objectIds
          .map((id) => project.objects.find((o) => o.id === id)?.label ?? id)
          .join(' / '),
        status === 'current'
          ? 'Intencional vigente'
          : status === 'revoked'
            ? 'Reabierta'
            : 'Histórica: geometría modificada',
        review.note +
          (review.revokedAt
            ? `\nReabierta (UTC): ${review.revokedAt.replace('T', ' ').replace(/\.\d{3}Z$/, '')}`
            : ''),
      ];
    }),
    { 0: { cellWidth: 29 }, 1: { cellWidth: 43 }, 2: { cellWidth: 32 } },
  );
  if (project.description.trim())
    table('Notas de producción', ['Descripción'], [[project.description]]);
  for (let index = 1; index <= doc.getNumberOfPages(); index++) {
    doc.setPage(index);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(91, 106, 97);
    const pageWidth = doc.internal.pageSize.getWidth(),
      pageHeight = doc.internal.pageSize.getHeight();
    doc.text(
      `Borrador técnico | Revisión de datos: ${project.updatedAt.slice(0, 19)} | Datos genéricos / del usuario`,
      14,
      pageHeight - 9,
    );
    doc.text(`${index} / ${doc.getNumberOfPages()}`, pageWidth - 14, pageHeight - 9, {
      align: 'right',
    });
  }
  return doc;
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  // Allow the browser to acquire the download before releasing its backing data.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function exportSVG(project: Project): void {
  const snapshot = structuredClone(project);
  downloadBlob(
    new Blob([buildStageSVG(snapshot)], { type: 'image/svg+xml;charset=utf-8' }),
    `${filename(snapshot)}-plano.svg`,
  );
}

export function exportCSV(project: Project): void {
  const snapshot = structuredClone(project);
  downloadBlob(
    new Blob([buildCSV(snapshot)], { type: 'text/csv;charset=utf-8' }),
    `${filename(snapshot)}-listas.csv`,
  );
}

export async function exportPDF(project: Project): Promise<void> {
  const snapshot = structuredClone(project);
  downloadBlob(createPDF(snapshot).output('blob'), `${filename(snapshot)}-rider.pdf`);
}

export async function exportPNG(project: Project): Promise<void> {
  const snapshot = structuredClone(project);
  const image = new Image();
  const url = URL.createObjectURL(
    new Blob([buildStageSVG(snapshot)], { type: 'image/svg+xml;charset=utf-8' }),
  );
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('No se pudo convertir el plano a imagen.'));
      image.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = 2400;
    canvas.height = 1800;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('El navegador no permite exportar imágenes.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (result) =>
          result ? resolve(result) : reject(new Error('No se pudo crear el archivo PNG.')),
        'image/png',
      ),
    );
    downloadBlob(blob, `${filename(snapshot)}-plano.png`);
  } finally {
    URL.revokeObjectURL(url);
  }
}
