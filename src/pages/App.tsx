import { StyleProvider } from '@ant-design/cssinjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { App as AntApp, ConfigProvider, Layout } from 'antd';
import { DataQueryWrapper } from 'components';
import { AuthWrapper } from 'components/AuthWrapper';
import { Header } from 'components/Header/Header';
import { iconConfig } from 'components/icons';
import { LucideProvider } from 'lucide-react';
import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuthContext } from 'services/AuthProvider';
import { FindGame } from './FindGame/FindGame';
import { Friends } from './Friends/Friends';
import { GameNight } from './GameNight/GameNight';
import { LibraryDetails } from './LibraryDetails/LibraryDetails';
import { NotFound } from './NotFound/NotFound';
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
              <Route path="/" element={<FindGame />} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/game-night" element={<GameNight />} />
              <Route path="/shelves" element={<Shelves />} />
              <Route path="/shelves/:shelfId" element={<Shelves />} />
              <Route path="/boxes/:id" element={<LibraryDetails kind="box" />} />
              <Route path="/games/:id" element={<LibraryDetails kind="game" />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/settings" element={<Sync />} />
              <Route path="/sync" element={<Navigate to="/settings" replace />} />
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
    <LucideProvider size={16} strokeWidth={2}>
      <StyleProvider layer>
        <ConfigProvider
          {...iconConfig}
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
    </LucideProvider>
  );
}
