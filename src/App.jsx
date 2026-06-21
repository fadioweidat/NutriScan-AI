import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import NetworkBanner from './components/NetworkBanner';
import { requestNotificationPermission, scheduleHydrationReminder, scheduleMealReminder } from './lib/notification-manager';

// Lazy loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AddMealPage = lazy(() => import('./pages/AddMealPage'));
const DailyDiaryPage = lazy(() => import('./pages/DailyDiaryPage'));
const WeeklyReportPage = lazy(() => import('./pages/WeeklyReportPage'));
const NutrientCalendarPage = lazy(() => import('./pages/NutrientCalendarPage'));
const AiChatPage = lazy(() => import('./pages/AiChatPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const DietSettingsPage = lazy(() => import('./pages/DietSettingsPage'));
const HealthProfilePage = lazy(() => import('./pages/HealthProfilePage'));
const MedicationsPage = lazy(() => import('./pages/MedicationsPage'));
const LifestylePage = lazy(() => import('./pages/LifestylePage'));
const BloodTestsPage = lazy(() => import('./pages/BloodTestsPage'));
const MealPlannerPage = lazy(() => import('./pages/MealPlannerPage'));

// Protected route wrapper — redirects to /landing if not authenticated
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
    return <Navigate to="/landing" replace />;
  }

  return (
    <Layout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-lime-500/30 border-t-lime-500 rounded-full animate-spin" />
        </div>
      }>
        <Outlet />
      </Suspense>
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

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-lime-500/30 border-t-lime-500 rounded-full animate-spin" />
      </div>
    }>
      <Outlet />
    </Suspense>
  );
}

export default function App() {
  useEffect(() => {
    // Request permission and schedule generic non-sensitive reminders
    requestNotificationPermission().then((granted) => {
      if (granted) {
        scheduleHydrationReminder(2);
        scheduleMealReminder();
      }
    });
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
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
            <Route path="/blood-tests" element={<BloodTestsPage />} />
            <Route path="/meal-planner" element={<MealPlannerPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <NetworkBanner />
      </AuthProvider>
    </BrowserRouter>
  );
}
