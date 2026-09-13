import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { auth, onAuthStateChanged } from '../../lib/firebase'

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking')

  useEffect(() => onAuthStateChanged(auth, (user) => {
    const allowedEmail = import.meta.env.VITE_ADMIN_EMAIL?.trim().toLowerCase()
    const isAuthorized = Boolean(user?.email && allowedEmail && user.email.toLowerCase() === allowedEmail)
    setStatus(isAuthorized ? 'authorized' : 'unauthorized')
    if (!isAuthorized) {
      sessionStorage.removeItem('wwi-admin')
      sessionStorage.removeItem('wwi-admin-email')
    }
  }), [])

  if (status === 'checking') return null
  return status === 'authorized' ? children : <Navigate to="/admin/login" replace />
}
