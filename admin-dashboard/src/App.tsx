import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard }  from './pages/Dashboard';
import { Articles }   from './pages/Articles';
import { Sources }    from './pages/Sources';
import { Analytics }  from './pages/Analytics';
import { Users }      from './pages/Users';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="articles"   element={<Articles />} />
          <Route path="sources"    element={<Sources />} />
          <Route path="analytics"  element={<Analytics />} />
          <Route path="users"      element={<Users />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

