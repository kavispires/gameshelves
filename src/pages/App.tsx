import { ConfigProvider, Layout } from 'antd';
import { DataQueryWrapper } from 'components';
import { Header } from 'components/Header/Header';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Home } from './Home/Home';
import { Login } from './Login/Login';
import { NotFound } from './NotFound/NotFound';
import { Shelf } from './Shelves/Shelf';
import { Shelves } from './Shelves/Shelves';
import { Sync } from './Sync/Sync';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // staleTime: Infinity,
      // cacheTime: Infinity,
      refetchOnWindowFocus: false,
    },
  },
});

ConfigProvider.config({
  theme: {
    primaryColor: '#2A9D8F',
    errorColor: '#e76f51',
    warningColor: '#f4a261',
    successColor: '#8ab17d',
    infoColor: '#2a9d8f',
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout className="app">
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
        <ReactQueryDevtools />
      </Layout>
    </QueryClientProvider>
  );
}
