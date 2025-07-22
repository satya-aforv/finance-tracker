// src/App.tsx - Updated with Comprehensive Investor View Routes
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import InvestorsPage from './pages/investors/InvestorsPage';
import PlansPage from './pages/plans/PlansPage';
import InvestmentsPage from './pages/investments/InvestmentsPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';

// NEW: Import the comprehensive investor view component
import ComprehensiveInvestorView from './pages/investors/ComprehensiveInvestorView';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              
              {/* Investor routes */}
              <Route path="investors" element={
                <ProtectedRoute roles={['admin', 'finance_manager']}>
                  <InvestorsPage />
                </ProtectedRoute>
              } />
              
              {/* NEW: Direct route for comprehensive investor view (optional) */}
              <Route path="investors/:investorId/comprehensive" element={
                <ProtectedRoute roles={['admin', 'finance_manager']}>
                  <ComprehensiveInvestorView />
                </ProtectedRoute>
              } />
              
              {/* Other existing routes */}
              <Route path="plans" element={
                <ProtectedRoute roles={['admin', 'finance_manager']}>
                  <PlansPage />
                </ProtectedRoute>
              } />
              <Route path="investments" element={<InvestmentsPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="reports" element={
                <ProtectedRoute roles={['admin', 'finance_manager']}>
                  <ReportsPage />
                </ProtectedRoute>
              } />
              <Route path="settings" element={
                <ProtectedRoute roles={['admin']}>
                  <SettingsPage />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;