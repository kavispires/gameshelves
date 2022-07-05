import { Layout } from 'antd';
import { Header } from 'components/Header/Header';
import { QueryClient, QueryClientProvider } from 'react-query';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Home } from './Home/Home';
import { Login } from './Login/Login';
import { NotFound } from './NotFound/NotFound';
import { Shelves } from './Shelves/Shelves';
import { Sync } from './Sync/Sync';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      cacheTime: Infinity,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout className="app">
        <HashRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/shelves" element={<Shelves />} />
            <Route path="/sync" element={<Sync />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </Layout>
    </QueryClientProvider>
  );
}
