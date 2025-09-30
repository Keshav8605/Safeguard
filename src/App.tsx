import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import PageTransition from '@/components/shared/PageTransition'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Reset from '@/pages/Reset'
import LocationPage from '@/pages/Location'

// Pages
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import SignUp from '@/pages/SignUp'
import Dashboard from '@/pages/Dashboard'
import Profile from '@/pages/Profile'
import Incidents from '@/pages/Incidents'
import Guardians from '@/pages/Guardians'
import Settings from '@/pages/Settings'
import ReportIncidentPage from '@/pages/ReportIncident'
import CheckInPage from '@/pages/CheckIn'
import MyReportsPage from '@/pages/MyReports'
import CommunityPage from '@/pages/Community'
import EvidencePage from '@/pages/Evidence'
import FakeCallPage from '@/pages/FakeCall'
import NotificationsPage from '@/pages/Notifications'
import AnalyticsPage from '@/pages/Analytics'
import AdminGuard from '@/components/auth/AdminGuard'
import AdminIndex from '@/pages/admin/Index'
import AdminUsers from '@/pages/admin/Users'
import AdminIncidents from '@/pages/admin/Incidents'
import AdminCommunity from '@/pages/admin/Community'

const InlinePublicGuard = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth()
  return currentUser ? <Navigate to="/dashboard" /> : <>{children}</>
}

export default function App() {
  return (
    <PageTransition>
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<InlinePublicGuard><Login /></InlinePublicGuard>} />
      <Route path="/signup" element={<InlinePublicGuard><SignUp /></InlinePublicGuard>} />
      <Route path="/reset" element={<InlinePublicGuard><Reset /></InlinePublicGuard>} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/incidents" element={<ProtectedRoute><Incidents /></ProtectedRoute>} />
      <Route path="/guardians" element={<ProtectedRoute><Guardians /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/check-in" element={<ProtectedRoute><CheckInPage /></ProtectedRoute>} />
      <Route path="/location" element={<ProtectedRoute><LocationPage /></ProtectedRoute>} />
      <Route path="/my-reports" element={<ProtectedRoute><MyReportsPage /></ProtectedRoute>} />
      <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
      <Route path="/evidence" element={<ProtectedRoute><EvidencePage /></ProtectedRoute>} />
      <Route path="/fake-call" element={<ProtectedRoute><FakeCallPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminGuard><AdminIndex /></AdminGuard></ProtectedRoute>}>
        <Route path="users" element={<AdminUsers />} />
        <Route path="incidents" element={<AdminIncidents />} />
        <Route path="community" element={<AdminCommunity />} />
      </Route>
      <Route path="/report-incident" element={<ProtectedRoute><ReportIncidentPage /></ProtectedRoute>} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </PageTransition>
  )
}

