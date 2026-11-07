import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PerspectiveCamera, Vector3 } from 'three';
import type { Project } from '../../src/core/types';

async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('editor-3d')).toHaveAttribute('data-ready', 'true');
  await expect(page.getByRole('status')).toContainText('Guardado local');
}
async function blank(page: Page) {
  await page.getByRole('button', { name: 'Abrir proyectos', exact: true }).click();
  await page.getByLabel('Nombre del proyecto nuevo').fill('Precisión y revisiones QA');
  await page.getByRole('button', { name: 'Crear proyecto', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}
async function number(page: Page, label: string, value: number) {
  const field = page.getByRole('spinbutton', { name: label, exact: true });
  await field.fill(String(value));
  await field.press('Enter');
}
async function add(page: Page, label: string) {
  await page.getByRole('button', { name: 'Añadir Objeto personalizado', exact: true }).click();
  await page.getByLabel('Nombre del elemento', { exact: true }).fill(label);
  return (await page.getByTestId('editor-3d').getAttribute('data-selection'))!;
}
async function select(page: Page, label: string) {
  await page.getByRole('button', { name: `Seleccionar en lista ${label}`, exact: true }).click();
}
async function stored(page: Page): Promise<Project> {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open('stage-designer-pro');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const get = db
            .transaction('projects')
            .objectStore('projects')
            .get(localStorage.getItem('stagepro-last-project')!);
          get.onsuccess = () => {
            db.close();
            resolve(get.result);
          };
          get.onerror = () => {
            db.close();
            reject(get.error);
          };
        };
      }),
  );
}
async function screenPoint(page: Page, x: number, y: number) {
  return page.locator('svg.editor2d-canvas').evaluate(
    (svg, point) => {
      const element = svg as SVGSVGElement;
      const p = element.createSVGPoint();
      p.x = point.x;
      p.y = -point.y;
      const result = p.matrixTransform(element.getScreenCTM()!);
      return { x: result.x, y: result.y };
    },
    { x, y },
  );
}

test('pivote local mantiene punto fijo, traslada con gizmo 3D y persiste al reabrir', async ({
  page,
}) => {
  await ready(page);
  await blank(page);
  const id = await add(page, 'Pivote QA');
  const object = page.getByTestId(`object-2d-${id}`);
  await number(page, 'Pivote X', 0.5);
  await expect(object).toHaveAttribute('data-x', '0');
  await expect(page.getByTestId('editor-3d')).toHaveAttribute('data-rotation-pivot', '0.5,3,0.8');
  await page.getByLabel('Cámara 3D').selectOption('front');
  await page.getByRole('button', { name: 'Mover objeto en 3D', exact: true }).click();
  const bounds = (await page.locator('[aria-label="Escena 3D interactiva"]').boundingBox())!;
  const camera = new PerspectiveCamera(44, bounds.width / bounds.height, 0.05, 1000);
  camera.position.set(0, 1.3 + 8 * 0.16, -3 + 8 * 1.45);
  camera.lookAt(0, 1.3, -3);
  camera.updateMatrixWorld();
  // The pivot lies right of the frontal camera: TransformControls shows the negative X handle.
  const handle = new Vector3(-0.1, 0.8, -3).project(camera);
  const x = bounds.x + ((handle.x + 1) * bounds.width) / 2;
  const y = bounds.y + ((1 - handle.y) * bounds.height) / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 55, y, { steps: 8 });
  await expect(object).not.toHaveAttribute('data-x', '0');
  await page.mouse.up();
  const moved = Number(await object.getAttribute('data-x'));
  await expect(page.getByTestId('editor-3d')).toHaveAttribute(
    'data-rotation-pivot',
    `${moved + 0.5},3,0.8`,
  );
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect(object).toHaveAttribute('data-x', '0');
  const circle = (await page.getByTestId(`rotate-2d-${id}`).boundingBox())!;
  const pivot = await screenPoint(page, 0.5, 3);
  const handleX = circle.x + circle.width / 2,
    handleY = circle.y + circle.height / 2;
  await page.mouse.move(handleX, handleY);
  await page.keyboard.down('Shift');
  await page.mouse.down();
  await page.mouse.move(pivot.x + handleY - pivot.y, pivot.y - handleX + pivot.x, { steps: 8 });
  await page.mouse.up();
  await page.keyboard.up('Shift');
  await expect(object).toHaveAttribute('data-rotation', '90');
  await expect(object).toHaveAttribute('data-x', '0.5');
  await expect(object).toHaveAttribute('data-y', '2.5');
  await expect(page.getByTestId(`pivot-2d-${id}`)).toHaveAttribute('data-x', '0.5');
  await expect(page.getByTestId(`pivot-2d-${id}`)).toHaveAttribute('data-y', '3');
  await expect(page.getByTestId('editor-3d')).toHaveAttribute('data-rotation-pivot', '0.5,3,0.8');
  await expect.poll(async () => (await stored(page)).objects[0].rotation).toBe(90);
  await page.reload();
  await select(page, 'Pivote QA');
  await expect(page.getByLabel('Pivote X', { exact: true })).toHaveValue('0.5');
  await expect(object).toHaveAttribute('data-y', '2.5');
});

test('guías alinean un arrastre y Alt conserva el movimiento libre sin alterar campos numéricos', async ({
  page,
}) => {
  await ready(page);
  await blank(page);
  const reference = await add(page, 'Referencia QA');
  await number(page, 'Posición X', 2.12);
  await number(page, 'Posición Y', 4.17);
  const id = await add(page, 'Móvil QA');
  await number(page, 'Posición X', -2);
  await number(page, 'Posición Y', 1);
  await page.getByRole('button', { name: 'Ajuste magnético', exact: true }).click();
  await page.getByRole('button', { name: 'Guías magnéticas', exact: true }).click();
  const start = await screenPoint(page, -2, 1),
    target = await screenPoint(page, 2.04, 1);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(target.x, target.y, { steps: 12 });
  const object = page.getByTestId(`object-2d-${id}`);
  await expect(object).toHaveAttribute('data-x', '2.12');
  await expect(page.getByTestId('magnetic-guide-x')).toHaveAttribute('data-target-id', reference);
  await page.keyboard.down('Alt');
  await page.mouse.move(target.x + 1, target.y);
  await expect(page.getByTestId('magnetic-guide-x')).toHaveCount(0);
  await expect(object).not.toHaveAttribute('data-x', '2.12');
  await page.mouse.up();
  await page.keyboard.up('Alt');
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect(object).toHaveAttribute('data-x', '-2');
  await number(page, 'Posición X', 2.04);
  await expect(object).toHaveAttribute('data-x', '2.04');
});

test('revisa interferencia, localiza equipos, conserva historial y reabre al cambiar geometría', async ({
  page,
}, testInfo) => {
  await ready(page);
  await blank(page);
  await add(page, 'Equipo A');
  await add(page, 'Equipo B');
  await page.getByRole('tab', { name: /Advertencias/ }).click();
  const card = page.getByTestId('interference-card');
  await expect(card).toHaveCount(1);
  await expect(
    card.getByRole('button', { name: 'Marcar intencional', exact: true }),
  ).toBeDisabled();
  await card.getByRole('button', { name: 'Localizar', exact: true }).click();
  await expect(page.locator('.statusbar')).toContainText('2 seleccionados');
  await card.getByRole('textbox').fill('Solapamiento previsto QA');
  await card.getByRole('button', { name: 'Marcar intencional', exact: true }).click();
  await expect(card).toHaveAttribute('data-reviewed', 'true');
  await expect.poll(async () => (await stored(page)).interferenceReviews.length).toBe(1);
  await page.reload();
  await page.getByRole('tab', { name: /Advertencias/ }).click();
  await expect(card).toHaveAttribute('data-reviewed', 'true');
  await select(page, 'Equipo B');
  await number(page, 'Posición X', 0.25);
  await expect(card).toHaveAttribute('data-reviewed', 'false');
  await page.getByText('Historial de revisiones (1)', { exact: true }).click();
  await expect(page.locator('.interference-history')).toContainText('Geometría anterior');
  await card.getByRole('textbox').fill('Nueva posición revisada QA');
  await card.getByRole('button', { name: 'Marcar intencional', exact: true }).click();
  await card.getByRole('button', { name: 'Reabrir', exact: true }).click();
  await expect(card).toHaveAttribute('data-reviewed', 'false');
  await expect(page.locator('.interference-history')).toContainText('Reabierta');
  await expect
    .poll(async () => (await stored(page)).interferenceReviews[1]?.revokedAt)
    .toBeTruthy();
  await page.getByRole('button', { name: 'Exportar', exact: true }).click();
  const promise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Rider técnico/ }).click();
  const downloaded = await promise;
  await downloaded.saveAs(testInfo.outputPath('interferencias.pdf'));
  const pdf = await readFile((await downloaded.path())!);
  expect(pdf.toString('latin1')).toContain('Solapamiento previsto QA');
  expect(pdf.toString('latin1')).toContain('Reabierta');
  await page.getByRole('button', { name: 'Cerrar diálogo' }).click();
  await page.screenshot({
    path: testInfo.outputPath('interferencias.png'),
    fullPage: true,
    animations: 'disabled',
  });
});
