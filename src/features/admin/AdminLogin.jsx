import { ArrowUpRight, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth, googleProvider, signInWithPopup, signOut } from '../../lib/firebase'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  async function submit() {
    setError('')
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const allowedEmail = import.meta.env.VITE_ADMIN_EMAIL?.trim().toLowerCase()
      if (allowedEmail && result.user.email?.toLowerCase() !== allowedEmail) { await signOut(auth); throw new Error('unauthorized-admin') }
      sessionStorage.setItem('wwi-admin', 'true')
      sessionStorage.setItem('wwi-admin-email', result.user.email || '')
      navigate('/admin')
    } catch (signInError) {
      setError(signInError.message === 'unauthorized-admin' ? 'This Google account is not authorized for admin access.' : signInError.code === 'auth/popup-closed-by-user' ? 'Google sign-in was cancelled.' : 'Google sign-in could not be completed. Check your Firebase configuration.')
    }
  }
  return <div className="auth-shell"><Link to="/" className="brand"><span className="brand-mark">D</span><span>Deepak<span className="brand-dot">.</span></span></Link><div className="auth-card"><div className="auth-icon"><LockKeyhole size={20} /></div><p className="eyebrow">PRIVATE ACCESS</p><h1>Welcome back.</h1><p className="muted">Use your Google account to manage your corner of the internet.</p>{error && <p className="form-error">{error}</p>}<button type="button" className="button button-dark full-width" onClick={submit}><span className="google-mark">G</span> Continue with Google <ArrowUpRight size={16} /></button><p className="auth-hint">Only the Google account you authorize in Firebase can sign in.</p></div></div>
}
