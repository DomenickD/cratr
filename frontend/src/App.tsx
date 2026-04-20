import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RootLayout from './layouts/RootLayout';
import AdminPage from './pages/AdminPage';
import FormsPage from './pages/FormsPage';
import KanbanPage from './pages/KanbanPage';
import CalendarPage from './pages/CalendarPage';
import MetricsPage from './pages/MetricsPage';
import Dashboard from './pages/Dashboard';
import WorkflowsPage from './pages/WorkflowsPage';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import DevPage from './pages/DevPage';
import { AuthProvider, useAuth } from './hooks/useAuth';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const RootRedirect = () => {
  const { user } = useAuth();
  if (user) return <Navigate to="/app" replace />;
  return <LandingPage />;
};

const LoginRedirect = () => {
  const { user } = useAuth();
  if (user) return <Navigate to="/app" replace />;
  return <LoginPage />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginRedirect />} />
            <Route path="/app" element={<ProtectedRoute><RootLayout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="forms" element={<FormsPage />} />
              <Route path="workflows" element={<WorkflowsPage />} />
              <Route path="kanban" element={<KanbanPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="metrics" element={<MetricsPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="dev" element={<DevPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
