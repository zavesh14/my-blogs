import { Route, Routes } from 'react-router-dom'
import Admin from './Admin'
import AdminLogin from './AdminLogin'
import ProtectedRoute from './ProtectedRoute'

export default function AdminEntry() {
  return <Routes><Route path="login" element={<AdminLogin />} /><Route path="*" element={<ProtectedRoute><Admin /></ProtectedRoute>} /></Routes>
}
