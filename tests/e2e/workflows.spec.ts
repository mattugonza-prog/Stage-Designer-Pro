import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Project } from '../../src/core/types';
import { PerspectiveCamera, Vector3 } from 'three';

async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('editor-3d')).toHaveAttribute('data-ready', 'true');
  await expect(page.getByRole('status')).toContainText('Guardado local');
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
async function number(page: Page, label: string, value: number) {
  const input = page.getByRole('spinbutton', { name: label, exact: true });
  await input.fill(String(value));
  await input.press('Enter');
}
async function blank(page: Page, name = 'Escenario QA') {
  await page.getByRole('button', { name: 'Abrir proyectos', exact: true }).click();
  await page.getByLabel('Nombre del proyecto nuevo').fill(name);
  await page.getByRole('button', { name: 'Crear proyecto', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByTestId('editor-2d').locator('[data-object-id]')).toHaveCount(0);
}
async function addBox(page: Page) {
  await page.getByRole('button', { name: 'Añadir Objeto personalizado', exact: true }).click();
  return page.getByTestId('editor-2d').locator('[data-object-id]').last();
}

test('escala, campos exactos, sincronización, guardado y reapertura', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await ready(page);
  await blank(page);
  const object = await addBox(page);
  const id = await object.getAttribute('data-object-id');
  await number(page, 'Posición X', 1.237);
  await number(page, 'Posición Y', 2.125);
  await number(page, 'Rotación', 35);
  await expect(object).toHaveAttribute('data-x', '1.237');
  await expect(page.getByTestId('editor-3d')).toHaveAttribute('data-position', '1.237,2.125,0.8');
  await expect(page.getByTestId('editor-3d')).toHaveAttribute('data-rotation', '35');
  await page.getByRole('button', { name: 'Acercar plano', exact: true }).click();
  await expect(page.getByTestId('zoom-2d')).toHaveText('125%');
  await page.getByRole('button', { name: 'Configurar escenario', exact: true }).click();
  await number(page, 'Ancho escenario', 10);
  await number(page, 'Profundidad escenario', 8);
  await expect.poll(async () => (await stored(page)).stage.width).toBe(10);
  const saved = await stored(page);
  expect(saved.objects[0].dimensions).toEqual({ width: 1, depth: 1, height: 1 });
  expect(saved.objects[0].position).toEqual({ x: 1.237, y: 2.125, z: 0.8 });
  await page.reload();
  await expect(page.getByTestId(`object-2d-${id}`)).toHaveAttribute('data-rotation', '35');
  await expect(page.getByLabel('Ancho escenario', { exact: true })).toHaveValue('10');
  expect(errors).toEqual([]);
});

test('arrastre 2D en vivo, un deshacer, bloqueo y duplicación', async ({ page }) => {
  await ready(page);
  await blank(page);
  const object = await addBox(page);
  const box = (await object.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 - 35, { steps: 6 });
  const x = await object.getAttribute('data-x'),
    y = await object.getAttribute('data-y');
  expect(x).not.toBe('0');
  await expect(page.getByTestId('editor-3d')).toHaveAttribute('data-position', `${x},${y},0.8`);
  await page.mouse.up();
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect(object).toHaveAttribute('data-x', '0');
  await expect(object).toHaveAttribute('data-y', '3');
  await page.getByRole('button', { name: 'Bloquear', exact: true }).click();
  await expect(page.getByLabel('Posición X', { exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Rotar selección 15 grados' }).click();
  await expect(object).toHaveAttribute('data-rotation', '0');
  await page.getByRole('button', { name: 'Bloqueado', exact: true }).click();
  await page.getByRole('button', { name: 'Duplicar selección', exact: true }).click();
  await expect(page.getByTestId('editor-2d').locator('[data-object-id]')).toHaveCount(2);
  const ids = await page
    .getByTestId('editor-2d')
    .locator('[data-object-id]')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-object-id')));
  expect(new Set(ids).size).toBe(2);
});

test('LED y line array actualizan geometría e inventario', async ({ page }) => {
  await ready(page);
  await blank(page);
  await page.getByRole('button', { name: 'Añadir Pantalla LED modular', exact: true }).click();
  await number(page, 'Columnas', 8);
  await number(page, 'Filas', 4);
  await expect(page.getByLabel('Ancho', { exact: true })).toHaveValue('4');
  await expect(page.getByLabel('Alto', { exact: true })).toHaveValue('2');
  await page.getByRole('button', { name: 'Añadir Line array modular', exact: true }).click();
  await number(page, 'Gabinetes', 8);
  await expect(page.getByLabel('Alto', { exact: true })).toHaveValue('2.4');
  await page.getByRole('tab', { name: 'Inventario', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Pantalla LED modular' })).toContainText(
    '32',
  );
  await expect(page.getByRole('row').filter({ hasText: 'Line array modular' })).toContainText('8');
  await expect
    .poll(async () => (await stored(page)).objects.at(-1)?.dimensions.height)
    .toBeCloseTo(2.4);
});

test('gizmo 3D mueve el objeto y actualiza el plano con un solo deshacer', async ({ page }) => {
  await ready(page);
  await blank(page);
  const object = await addBox(page);
  await page.getByLabel('Cámara 3D').selectOption('front');
  await page.getByRole('button', { name: 'Mover objeto en 3D', exact: true }).click();
  const canvas = page.locator('[aria-label="Escena 3D interactiva"]');
  const bounds = (await canvas.boundingBox())!;
  // Project a point on the visible red X gizmo using the documented frontal camera.
  const camera = new PerspectiveCamera(44, bounds.width / bounds.height, 0.05, 1000);
  camera.position.set(0, 1.3 + 8 * 0.16, -3 + 8 * 1.45);
  camera.lookAt(0, 1.3, -3);
  camera.updateMatrixWorld();
  const handle = new Vector3(0.6, 0.8, -3).project(camera);
  const x = bounds.x + ((handle.x + 1) * bounds.width) / 2,
    y = bounds.y + ((1 - handle.y) * bounds.height) / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 55, y, { steps: 10 });
  await expect(object).not.toHaveAttribute('data-x', '0');
  await expect(page.getByTestId('editor-3d')).toHaveAttribute(
    'data-position',
    `${await object.getAttribute('data-x')},3,0.8`,
  );
  await page.mouse.up();
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect(object).toHaveAttribute('data-x', '0');
  await expect(page.getByTestId('editor-3d')).toHaveAttribute('data-position', '0,3,0.8');
  const capture = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Capturar imagen 3D', exact: true }).click();
  const image = await readFile((await (await capture).path())!);
  expect(image.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
});

test('equipo personalizado persiste en biblioteca y en nuevos proyectos', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'Crear equipo personalizado', exact: true }).click();
  await page.getByLabel('Nombre equipo personalizado').fill('Mesa QA');
  await page.getByLabel('Ancho equipo personalizado').fill('1.2');
  await page.getByLabel('Profundidad equipo personalizado').fill('0.7');
  await page.getByLabel('Alto equipo personalizado').fill('0.9');
  await page.getByRole('button', { name: 'Guardar en biblioteca', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(async () => (await stored(page)).objects.at(-1)?.label).toBe('Mesa QA');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Añadir Mesa QA', exact: true })).toBeVisible();
  await blank(page, 'Otro proyecto');
  await page.getByRole('button', { name: 'Añadir Mesa QA', exact: true }).click();
  await expect(page.getByLabel('Ancho', { exact: true })).toHaveValue('1.2');
  await expect
    .poll(async () => (await stored(page)).objects[0]?.definition.provenance)
    .toBe('user');
});

test('respaldo nativo, importación inválida y recuperación de revisión', async ({ page }) => {
  await ready(page);
  await blank(page, 'Respaldo QA');
  await addBox(page);
  await page.getByRole('button', { name: 'Revisiones', exact: true }).click();
  await page.getByLabel('Nombre de revisión').fill('Montaje original');
  await page.getByRole('button', { name: 'Guardar revisión', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Restaurar', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar diálogo' }).click();
  await number(page, 'Posición X', 2);
  await page.getByRole('button', { name: 'Revisiones', exact: true }).click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Restaurar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByTestId('editor-2d').locator('[data-object-id]')).toHaveAttribute(
    'data-x',
    '0',
  );
  await page.getByRole('button', { name: 'Exportar', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Respaldar proyecto .stagepro' }).click();
  const download = await downloadPromise,
    bytes = await readFile((await download.path())!);
  const project = JSON.parse(bytes.toString());
  expect(project.objects).toHaveLength(1);
  await page.getByRole('button', { name: 'Cerrar diálogo' }).click();
  await page.getByRole('button', { name: 'Abrir proyectos', exact: true }).click();
  const input = page.locator('input[type=file]');
  await input.setInputFiles({
    name: 'roto.stagepro',
    mimeType: 'application/json',
    buffer: Buffer.from('{"schemaVersion":999}'),
  });
  await expect(page.getByRole('alert')).toContainText('Importación rechazada');
  await expect(page.getByLabel('Nombre del proyecto', { exact: true })).toHaveValue('Respaldo QA');
  await input.setInputFiles({
    name: 'respaldo.stagepro',
    mimeType: 'application/json',
    buffer: bytes,
  });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByLabel('Nombre del proyecto', { exact: true })).toHaveValue(
    'Respaldo QA · importado',
  );
  const imported = await stored(page);
  expect(imported.id).not.toBe(project.id);
  expect(imported.objects).toEqual(project.objects);
});

test('exportaciones reales PDF, SVG, PNG y CSV del proyecto demo', async ({ page }, testInfo) => {
  await ready(page);
  await page.getByRole('button', { name: 'Exportar', exact: true }).click();
  for (const [label, extension] of [
    ['Rider técnico', 'pdf'],
    ['Plano vectorial', 'svg'],
    ['Imagen del plano', 'png'],
    ['Lista de entradas', 'csv'],
  ] as const) {
    const promise = page.waitForEvent('download');
    await page.getByRole('button', { name: new RegExp(label) }).click();
    const download = await promise;
    expect(download.suggestedFilename()).toMatch(new RegExp(`\\.${extension}$`));
    const path = testInfo.outputPath(`demo.${extension}`);
    await download.saveAs(path);
    const data = await readFile(path);
    expect(data.length).toBeGreaterThan(100);
    if (extension === 'pdf') {
      expect(data.subarray(0, 5).toString()).toBe('%PDF-');
      expect(data.toString('latin1')).toContain('Bombo');
    }
    if (extension === 'svg') {
      expect(data.toString()).toContain('<svg');
      expect(data.toString()).toContain('data-width-m="5"');
    }
    if (extension === 'png') expect(data.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    if (extension === 'csv') {
      expect(data.toString()).toContain('Bombo');
      expect(data.toString()).toContain('Overhead L');
    }
  }
  await page.getByRole('button', { name: 'Cerrar diálogo' }).click();
  await page.screenshot({ path: testInfo.outputPath('editor-demo.png'), fullPage: true });
});

test('sin conexión: reabre, edita, guarda y exporta con 3D disponible', async ({
  page,
  context,
}) => {
  await ready(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('editor-3d')).toHaveAttribute('data-ready', 'true');
  await number(page, 'Ancho escenario', 9);
  await expect.poll(async () => (await stored(page)).stage.width).toBe(9);
  await page.getByRole('button', { name: 'Exportar', exact: true }).click();
  const promise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Rider técnico/ }).click();
  expect((await promise).suggestedFilename()).toMatch(/\.pdf$/);
  await page.getByRole('button', { name: 'Cerrar diálogo' }).click();
  await page.reload();
  await expect(page.getByLabel('Ancho escenario', { exact: true })).toHaveValue('9');
});
