import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createDemoProject } from '../../src/core/project';
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
async function blank(page: Page) {
  await page.getByRole('button', { name: 'Abrir proyectos', exact: true }).click();
  await page.getByLabel('Nombre del proyecto nuevo').fill('Montaje con anclajes');
  await page.getByRole('button', { name: 'Crear proyecto', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
}
async function number(page: Page, label: string, value: number) {
  const field = page.getByRole('spinbutton', { name: label, exact: true });
  await field.fill(String(value));
  await field.press('Enter');
}
async function add(page: Page, label: string, kind = 'Objeto personalizado') {
  await page.getByRole('button', { name: `Añadir ${kind}`, exact: true }).click();
  await page.getByLabel('Nombre del elemento', { exact: true }).fill(label);
  return (await page.getByTestId('editor-3d').getAttribute('data-selection'))!;
}
async function select(page: Page, label: string, shift = false) {
  await page
    .getByRole('button', { name: `Seleccionar en lista ${label}`, exact: true })
    .click({ modifiers: shift ? ['Shift'] : [] });
}
const object2D = (page: Page, id: string) => page.getByTestId(`object-2d-${id}`);

test('ancla, gira, eleva, edita posición relativa y conserva el montaje al reabrir', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await ready(page);
  await blank(page);
  const base = await add(page, 'Base QA', 'Tarima modular');
  await number(page, 'Alto', 0.4);
  const child = await add(page, 'Equipo QA');
  await number(page, 'Posición X', 1);
  await page.getByLabel('Soporte físico', { exact: true }).selectOption(base);
  await page.getByRole('button', { name: 'Anclar al soporte', exact: true }).click();
  await expect(page.getByLabel('Posición Z', { exact: true })).toHaveValue('1.2');
  await expect(page.getByTestId(`scene-tree-row-${child}`)).toHaveAttribute('data-depth', '1');
  await select(page, 'Base QA');
  // A descendant cannot become the root's support.
  await expect(
    page.getByLabel('Soporte físico', { exact: true }).locator(`option[value="${child}"]`),
  ).toHaveCount(0);
  await number(page, 'Posición X', 2);
  await expect(object2D(page, child)).toHaveAttribute('data-x', '3');
  await number(page, 'Rotación', 90);
  await expect(object2D(page, child)).toHaveAttribute('data-x', '2');
  await expect(object2D(page, child)).toHaveAttribute('data-y', '4');
  await number(page, 'Alto', 0.8);
  await select(page, 'Equipo QA');
  await expect(page.getByTestId('editor-3d')).toHaveAttribute('data-position', '2,4,1.6');
  await number(page, 'X relativo', 1.5);
  await expect(object2D(page, child)).toHaveAttribute('data-y', '4.5');
  await expect(page.getByLabel('Giro relativo', { exact: true })).toHaveValue('0');
  await expect
    .poll(async () => (await stored(page)).objects.find((o) => o.id === child)?.position.y)
    .toBe(4.5);
  await page.reload();
  await expect(page.getByTestId('editor-3d')).toHaveAttribute('data-ready', 'true');
  await select(page, 'Equipo QA');
  await expect(page.getByLabel('Soporte físico', { exact: true })).toHaveValue(base);
  await expect(page.getByLabel('X relativo', { exact: true })).toHaveValue('1.5');
  await page.screenshot({
    path: testInfo.outputPath('anclajes.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Desvincular conservando posición', exact: true }).click();
  await expect(page.getByTestId('editor-3d')).toHaveAttribute('data-position', '2,4.5,1.6');
  await select(page, 'Base QA');
  await number(page, 'Posición X', 3);
  await expect(object2D(page, child)).toHaveAttribute('data-x', '2');
  expect(errors).toEqual([]);
});

test('capas: ocultar en 2D, 3D y SVG conserva inventario; bloqueo y eliminación se deshacen', async ({
  page,
}, testInfo) => {
  await ready(page);
  await blank(page);
  const id = await add(page, 'Equipo capa QA');
  await page.getByRole('button', { name: 'Capas', exact: true }).click();
  await page.getByLabel('Nombre de nueva capa').fill('Montaje QA');
  await page.getByRole('button', { name: 'Crear capa', exact: true }).click();
  await page.getByLabel('Asignar selección a capa').selectOption({ label: 'Montaje QA' });
  await page.getByRole('button', { name: 'Ocultar capa Montaje QA', exact: true }).click();
  await expect(object2D(page, id)).toHaveCount(0);
  await expect(page.getByTestId('editor-3d')).toHaveAttribute('data-visible-ids', '');
  await page.getByRole('tab', { name: 'Inventario', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Objeto personalizado' })).toContainText(
    '1',
  );
  await page.getByRole('button', { name: 'Exportar', exact: true }).click();
  const promise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Plano vectorial/ }).click();
  const bytes = await readFile((await (await promise).path())!);
  expect(bytes.toString()).not.toContain('Equipo capa QA');
  await page.getByRole('button', { name: 'Cerrar diálogo' }).click();
  await expect
    .poll(async () => (await stored(page)).layers.find((l) => l.name === 'Montaje QA')?.hidden)
    .toBe(true);
  await page.reload();
  await expect(object2D(page, id)).toHaveCount(0);
  await page.getByRole('button', { name: 'Capas', exact: true }).click();
  await page.getByRole('button', { name: 'Mostrar capa Montaje QA', exact: true }).click();
  await expect(object2D(page, id)).toHaveCount(1);
  await page.getByRole('button', { name: 'Seleccionar capa Montaje QA', exact: true }).click();
  await page.getByRole('button', { name: 'Bloquear capa Montaje QA', exact: true }).click();
  await page.getByRole('button', { name: 'Propiedades', exact: true }).click();
  await expect(page.getByLabel('Posición X', { exact: true })).toBeDisabled();
  await expect(page.getByTestId('editor-3d')).toHaveAttribute('data-locked', 'true');
  await page.getByRole('button', { name: 'Rotar selección 15 grados' }).click();
  await expect(object2D(page, id)).toHaveAttribute('data-rotation', '0');
  // An individual lock survives unlocking its layer.
  await page.getByRole('button', { name: 'Bloquear', exact: true }).click();
  await page.getByRole('button', { name: 'Capas', exact: true }).click();
  await page.getByRole('button', { name: 'Desbloquear capa Montaje QA', exact: true }).click();
  await page.getByRole('button', { name: 'Propiedades', exact: true }).click();
  await expect(page.getByLabel('Posición X', { exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Bloqueado', exact: true }).click();
  await expect(page.getByLabel('Posición X', { exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Capas', exact: true }).click();
  await page.screenshot({
    path: testInfo.outputPath('capas.png'),
    fullPage: true,
    animations: 'disabled',
  });
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Eliminar capa Montaje QA', exact: true }).click();
  await expect(page.getByLabel('Nombre de capa Montaje QA')).toHaveCount(0);
  await expect(object2D(page, id)).toHaveCount(1);
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect(page.getByLabel('Nombre de capa Montaje QA')).toBeVisible();
  await expect.poll(async () => (await stored(page)).objects[0].layerId).not.toBeUndefined();
});

test('distribuye extremos fijos, deshace y permite editar dentro de un grupo', async ({ page }) => {
  await ready(page);
  await blank(page);
  const a = await add(page, 'Caja A');
  await number(page, 'Posición X', -3);
  const b = await add(page, 'Caja B');
  await number(page, 'Posición X', -2);
  const c = await add(page, 'Caja C');
  await number(page, 'Posición X', 5);
  await select(page, 'Caja A');
  await select(page, 'Caja B', true);
  await select(page, 'Caja C', true);
  await page
    .getByRole('button', { name: 'Distribuir centros horizontalmente', exact: true })
    .click();
  await expect(object2D(page, a)).toHaveAttribute('data-x', '-3');
  await expect(object2D(page, b)).toHaveAttribute('data-x', '1');
  await expect(object2D(page, c)).toHaveAttribute('data-x', '5');
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect(object2D(page, b)).toHaveAttribute('data-x', '-2');
  await page.getByRole('button', { name: 'Agrupar selección', exact: true }).click();
  await select(page, 'Caja B');
  await page.getByLabel('Editar solo este elemento').check();
  await number(page, 'Posición X', 0);
  await expect(object2D(page, a)).toHaveAttribute('data-x', '-3');
  await expect(object2D(page, c)).toHaveAttribute('data-x', '5');
  await page.getByLabel('Editar solo este elemento').uncheck();
  await number(page, 'Posición X', 1);
  await expect(object2D(page, a)).toHaveAttribute('data-x', '-2');
  await expect(object2D(page, c)).toHaveAttribute('data-x', '6');
});

test('duplicar durante un arrastre 3D y borrar durante un arrastre 2D son operaciones independientes', async ({
  page,
}) => {
  await ready(page);
  await blank(page);
  const id = await add(page, 'Equipo gestos QA');
  await page.getByLabel('Cámara 3D').selectOption('front');
  await page.getByRole('button', { name: 'Mover objeto en 3D', exact: true }).click();
  const bounds = (await page.locator('[aria-label="Escena 3D interactiva"]').boundingBox())!;
  const camera = new PerspectiveCamera(44, bounds.width / bounds.height, 0.05, 1000);
  camera.position.set(0, 1.3 + 8 * 0.16, -3 + 8 * 1.45);
  camera.lookAt(0, 1.3, -3);
  camera.updateMatrixWorld();
  const handle = new Vector3(0.6, 0.8, -3).project(camera);
  const x = bounds.x + ((handle.x + 1) * bounds.width) / 2;
  const y = bounds.y + ((1 - handle.y) * bounds.height) / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 55, y, { steps: 8 });
  await expect(object2D(page, id)).not.toHaveAttribute('data-x', '0');
  await page.keyboard.press('Control+d');
  await page.mouse.up();
  await expect(page.getByTestId('editor-2d').locator('[data-object-id]')).toHaveCount(2);
  await expect(object2D(page, id)).toHaveAttribute('data-x', '0');
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect(page.getByTestId('editor-2d').locator('[data-object-id]')).toHaveCount(1);
  const box = (await object2D(page, id).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2, { steps: 8 });
  await expect(object2D(page, id)).not.toHaveAttribute('data-x', '0');
  await page.keyboard.press('Delete');
  await page.mouse.up();
  await expect(object2D(page, id)).toHaveCount(0);
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect(object2D(page, id)).toHaveAttribute('data-x', '0');
});

test('importa formato anterior y guarda capas sin alterar anclajes, geometría ni canales', async ({
  page,
}) => {
  await ready(page);
  const {
    layers: _layers,
    interferenceReviews: _reviews,
    schemaVersion: _version,
    objects,
    ...rest
  } = createDemoProject();
  const legacy = {
    ...rest,
    schemaVersion: 1,
    objects: objects.map(({ layerId: _layerId, ...o }) => o),
  };
  await page.getByRole('button', { name: 'Abrir proyectos', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles({
    name: 'anterior.stagepro',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(legacy)),
  });
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(async () => (await stored(page)).name).toBe(`${legacy.name} · importado`);
  const saved = await stored(page);
  expect(saved.schemaVersion).toBe(3);
  expect(saved.layers).toHaveLength(5);
  expect(saved.objects.map(({ layerId: _layerId, ...o }) => o)).toEqual(legacy.objects);
  expect(saved.audioSources).toEqual(legacy.audioSources);
  expect(saved.audioProfiles).toEqual(legacy.audioProfiles);
  await page.reload();
  await expect(page.getByTestId('editor-2d').locator('[data-object-id]')).toHaveCount(
    objects.length,
  );
  await page.getByRole('button', { name: 'Capas', exact: true }).click();
  await expect(page.getByLabel('Nombre de capa Audio', { exact: true })).toBeVisible();
});
