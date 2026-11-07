import { StyleProvider } from '@ant-design/cssinjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { App as AntApp, ConfigProvider, Layout } from 'antd';
import { DataQueryWrapper } from 'components';
import { AuthWrapper } from 'components/AuthWrapper';
import { Header } from 'components/Header/Header';
import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuthContext } from 'services/AuthProvider';
import { Home } from './Home/Home';
import { NotFound } from './NotFound/NotFound';
import { Shelf } from './Shelves/Shelf';
import { Shelves } from './Shelves/Shelves';
import { Sync } from './Sync/Sync';

function AuthenticatedApp() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { refetchOnWindowFocus: false } },
      }),
  );

  useEffect(
    () => () => {
      void queryClient.cancelQueries();
      queryClient.clear();
    },
    [queryClient],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Layout className="min-h-screen">
        <HashRouter>
          <Header />
          <DataQueryWrapper>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/shelves" element={<Shelves />} />
              <Route path="/shelves/:id" element={<Shelf />} />
              <Route path="/sync" element={<Sync />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DataQueryWrapper>
        </HashRouter>
      </Layout>
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}

function AuthenticatedSession() {
  const { user } = useAuthContext();
  return user ? <AuthenticatedApp key={user.uid} /> : null;
}

export function App() {
  return (
    <StyleProvider layer>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#2a9d8f',
            colorError: '#e76f51',
            colorWarning: '#f4a261',
            colorSuccess: '#8ab17d',
            colorInfo: '#2a9d8f',
          },
        }}
      >
        <AntApp>
          <AuthProvider>
            <AuthWrapper>
              <AuthenticatedSession />
            </AuthWrapper>
          </AuthProvider>
        </AntApp>
      </ConfigProvider>
    </StyleProvider>
  );
}
