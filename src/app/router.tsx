import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { HomeScreen } from './HomeScreen';
import { Layout } from './Layout';

// Fábrica, e não um array compartilhado: o router modifica os objetos `lazy`
// ao resolvê-los, então cada router precisa da sua própria cópia.
export function createRoutes(): RouteObject[] {
  return [
    {
      path: '/',
      Component: Layout,
      children: [
        { index: true, Component: HomeScreen },
        {
          path: 'escanear',
          lazy: {
            Component: async () => (await import('@/modules/scanner')).ScanScreen,
          },
        },
        {
          path: 'descartar',
          lazy: {
            Component: async () => (await import('@/modules/rewards')).DiscardScreen,
          },
        },
        {
          path: 'carteira',
          lazy: {
            Component: async () => (await import('@/modules/rewards')).WalletScreen,
          },
        },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ];
}

export function createAppRouter() {
  return createBrowserRouter(createRoutes());
}
