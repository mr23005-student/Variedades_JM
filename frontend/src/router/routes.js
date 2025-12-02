const routes = [
  // Ruta principal - redirige al login
  {
    path: '/',
    component: () => import('pages/LoginPage.vue'),
  },

  // Ruta de login
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue'),
  },

  // Ruta de registro
  {
    path: '/register',
    component: () => import('pages/RegisterPage.vue'),
  },

  // Página principal después del login
  {
    path: '/main',
    component: () => import('pages/MainPage.vue'),
    meta: { requiresAuth: true }
  },

  // Página para agregar zapatos
  {
    path: '/agregar-zapato',
    component: () => import('pages/AddShoe.vue'),
    meta: { requiresAuth: true }
  },

  // Página para agregar clientes
  {
    path: '/agregar-cliente',
    component: () => import('pages/AddClient.vue'),
    meta: { requiresAuth: true }
  },

  // Ruta del dashboard (para uso futuro)
  {
    path: '/dashboard',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
