import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard }  from './pages/Dashboard';
import { Articles }   from './pages/Articles';
import { Sources }    from './pages/Sources';
import { Ads }        from './pages/Ads';
import { Analytics }  from './pages/Analytics';
import { Users }      from './pages/Users';
import { Login }      from './pages/Login';
import { isAuthenticated } from './lib/auth';

function RequireAuth({ children }: { children: JSX.Element }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RequireGuest({ children }: { children: JSX.Element }) {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <RequireGuest>
              <Login />
            </RequireGuest>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="articles"   element={<Articles />} />
          <Route path="ads"        element={<Ads />} />
          <Route path="sources"    element={<Sources />} />
          <Route path="analytics"  element={<Analytics />} />
          <Route path="users"      element={<Users />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

