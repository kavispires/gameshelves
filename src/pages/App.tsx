import { StyleProvider } from '@ant-design/cssinjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { App as AntApp, ConfigProvider, Layout } from 'antd';
import { DataQueryWrapper } from 'components';
import { Header } from 'components/Header/Header';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Home } from './Home/Home';
import { Login } from './Login/Login';
import { NotFound } from './NotFound/NotFound';
import { Shelf } from './Shelves/Shelf';
import { Shelves } from './Shelves/Shelves';
import { Sync } from './Sync/Sync';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
            <Layout className="min-h-screen">
              <HashRouter>
                <Header />
                <DataQueryWrapper>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/shelves" element={<Shelves />} />
                    <Route path="/shelves/:id" element={<Shelf />} />
                    <Route path="/sync" element={<Sync />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </DataQueryWrapper>
              </HashRouter>
            </Layout>
          </AntApp>
        </ConfigProvider>
      </StyleProvider>
      {import.meta.env.DEV && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
