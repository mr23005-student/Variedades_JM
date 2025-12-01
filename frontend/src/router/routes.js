const routes = [
  // Ruta principal - redirige al login
  {
    path: '/',
    component: () => import('pages/LoginPage.vue'),
  },

  // Ruta de registro
  {
    path: '/register',
    component: () => import('pages/RegisterPage.vue'),
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
