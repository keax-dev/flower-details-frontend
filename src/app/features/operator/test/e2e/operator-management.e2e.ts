import { expect, Page, test } from '@playwright/test';

const ADMIN = {
  id: 1,
  personId: 10,
  names: 'Ana',
  lastNames: 'Perez',
  email: 'ana@example.com',
  phone: '0999999999',
  role: 'ADMIN',
};

const OPERATOR = {
  id: 2,
  personId: 11,
  names: 'Maria',
  lastNames: 'Lopez',
  email: 'maria@example.com',
  phone: '0987654321',
  role: 'OPERATOR',
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

async function mockAuthenticatedAdmin(page: Page): Promise<void> {
  await page.route('**/api/auth/csrf', (route) => route.fulfill({ json: { headerName: 'X-XSRF-TOKEN', token: 'test-token' } }));
  await page.route('**/api/me', (route) => route.fulfill({ json: ADMIN }));
}

async function selectOption(page: Page, selectId: string, optionLabel: string): Promise<void> {
  await page.locator(selectId).click();
  await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)').getByText(optionLabel, { exact: true }).click();
}

async function confirmPopconfirm(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Aceptar', exact: true }).click();
}

function staffPage(items: (typeof OPERATOR)[]) {
  return { items, page: 0, size: 10, totalElements: items.length, totalPages: 1 };
}

test('lets an administrator create another administrator with an initial status', async ({ page }) => {
  await mockAuthenticatedAdmin(page);
  await page.route('**/api/users/staff**', async (route) => {
    if (route.request().method() === 'POST') {
      expect(route.request().postDataJSON()).toEqual({
        names: 'Carlos',
        lastNames: 'Mendez',
        email: 'carlos@example.com',
        password: 'Password123',
        phone: '0976543210',
        role: 'ADMIN',
        active: false,
      });
      await route.fulfill({ json: { ...OPERATOR, id: 3, names: 'Carlos', lastNames: 'Mendez', role: 'ADMIN', active: false } });
      return;
    }

    await route.fulfill({ json: staffPage([]) });
  });

  await page.goto('/admin/staff');
  await page.getByRole('button', { name: 'Nuevo usuario' }).click();
  await page.getByLabel('Nombres').fill('Carlos');
  await page.getByLabel('Apellidos').fill('Mendez');
  await page.getByLabel('Correo').fill('carlos@example.com');
  await page.locator('#operator-password').fill('Password123');
  await page.getByLabel('Telefono').fill('0976543210');
  await selectOption(page, '#operator-role', 'Administrador');
  await selectOption(page, '#operator-status', 'Inactivo');
  await page.getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByText('Usuario creado correctamente.')).toBeVisible();
});

test('lets an administrator edit a role, change status and delete a user', async ({ page }) => {
  let staff = [OPERATOR];
  await mockAuthenticatedAdmin(page);
  await page.route('**/api/users/staff**', async (route) => {
    if (route.request().method() === 'PUT') {
      expect(route.request().postDataJSON()).toMatchObject({ role: 'ADMIN' });
      staff = [{ ...OPERATOR, role: 'ADMIN' }];
      await route.fulfill({ json: staff[0] });
      return;
    }

    await route.fulfill({ json: staffPage(staff) });
  });
  await page.route('**/api/users/2/deactivate', async (route) => {
    staff = [{ ...staff[0], active: false }];
    await route.fulfill({ json: staff[0] });
  });
  await page.route('**/api/users/2', async (route) => {
    staff = [];
    await route.fulfill({ status: 204 });
  });

  await page.goto('/admin/staff');
  await page.getByRole('button', { name: 'Editar operador' }).click();
  await selectOption(page, '#operator-role', 'Administrador');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('Usuario actualizado correctamente.')).toBeVisible();

  await page.getByRole('button', { name: 'Desactivar operador' }).click();
  await confirmPopconfirm(page);
  await expect(page.getByText('Operador desactivado correctamente.')).toBeVisible();

  await page.getByRole('button', { name: 'Eliminar operador' }).click();
  await confirmPopconfirm(page);
  await expect(page.getByText('Operador eliminado correctamente.')).toBeVisible();
  await expect(page.getByText('Todavia no hay usuarios registrados.')).toBeVisible();
});

test('shows every server validation error when an administrative user cannot be created', async ({ page }) => {
  await mockAuthenticatedAdmin(page);
  await page.route('**/api/users/staff**', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ validationErrors: { email: 'El correo ya está registrado.', phone: 'El teléfono ya está registrado.' } }),
      });
      return;
    }

    await route.fulfill({ json: staffPage([]) });
  });

  await page.goto('/admin/staff');
  await page.getByRole('button', { name: 'Nuevo usuario' }).click();
  await page.getByLabel('Nombres').fill('Carlos');
  await page.getByLabel('Apellidos').fill('Mendez');
  await page.getByLabel('Correo').fill('carlos@example.com');
  await page.locator('#operator-password').fill('Password123');
  await page.getByLabel('Telefono').fill('0976543210');
  await page.getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByText('El correo ya está registrado.')).toBeVisible();
  await expect(page.getByText('El teléfono ya está registrado.')).toBeVisible();
});
