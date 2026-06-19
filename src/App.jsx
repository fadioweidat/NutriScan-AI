import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AddMealPage from './pages/AddMealPage';
import DailyDiaryPage from './pages/DailyDiaryPage';
import WeeklyReportPage from './pages/WeeklyReportPage';
import NutrientCalendarPage from './pages/NutrientCalendarPage';
import AiChatPage from './pages/AiChatPage';
import ProfilePage from './pages/ProfilePage';
import DietSettingsPage from './pages/DietSettingsPage';
import HealthProfilePage from './pages/HealthProfilePage';
import MedicationsPage from './pages/MedicationsPage';
import LifestylePage from './pages/LifestylePage';

// Protected route wrapper — redirects to /login if not authenticated
function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-lime-500/30 border-t-lime-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

// Public route wrapper — redirects to / if already authenticated
function PublicRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-lime-500/30 border-t-lime-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/add-meal" element={<AddMealPage />} />
            <Route path="/diary" element={<DailyDiaryPage />} />
            <Route path="/nutrient-map" element={<NutrientCalendarPage />} />
            <Route path="/report" element={<WeeklyReportPage />} />
            <Route path="/ai-analysis" element={<AiChatPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/diet-settings" element={<DietSettingsPage />} />
            <Route path="/health-profile" element={<HealthProfilePage />} />
            <Route path="/medications" element={<MedicationsPage />} />
            <Route path="/lifestyle" element={<LifestylePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
