import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/Landingpage'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import AdminProfile from './pages/Admin/AdminProfile'
import ContractorDashboard from './pages/Contractor/ContractorDashboard'
import ContractorRecords from './pages/Contractor/ContractorRecords'
import ContractorApplications from './pages/Contractor/ContractorApplications'
import ContractorStalls from './pages/Contractor/ContractorStalls'
import ContractorProfile from './pages/Contractor/ContractorProfile'
import AdminDashboard from './pages/Admin/AdminDashboard'
import VerifyEmail from './pages/VerifyEmail'
import AdminRecord from './pages/Admin/AdminRecord'
import AdminApplication from './pages/Admin/AdminApplication'
import AdminStalls from './pages/Admin/AdminStalls'
import AdminSecurity from './pages/Admin/AdminSecurity'
import AdminMessages from './pages/Admin/AdminMessages'
import ContractorSecurity from './pages/Contractor/ContractorSecurity'
import RenterLayout from './pages/Renter/Renterlayout'
import MarketTour360 from './pages/MarketTour360'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/contractor/dashboard" element={<ContractorDashboard />} />
        <Route path="/contractor/profile" element={<ContractorProfile />} />
        <Route path="/contractor/records" element={<ContractorRecords />} />
        <Route path="/contractor/applications" element={<ContractorApplications />} />
        <Route path="/contractor/stalls" element={<ContractorStalls />} />
        <Route path="/contractor/*" element={<ContractorDashboard />} />

        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
        <Route path="/admin/profile/security" element={<AdminSecurity />} />
        <Route path="/admin/messages" element={<AdminMessages />} />
        <Route path="/contractor/profile/security" element={<ContractorSecurity />} />
        <Route path="/contractor/profile/security" element={<ContractorSecurity />} />
        <Route path="/admin/records" element={<AdminRecord />} />
        <Route path="/admin/applications" element={<AdminApplication />} />
        <Route path="/admin/stalls" element={<AdminStalls />} />
        <Route path="/admin/*" element={<AdminDashboard />} />

        <Route path="/renter/market-tour" element={<MarketTour360 />} />
        <Route path="/renter/*" element={<RenterLayout />} />
        <Route path="/tour" element={<MarketTour360 />} />
      </Routes>
    </BrowserRouter>
  )
}