import { getAnalytics, isSupported, logEvent } from 'firebase/analytics'
import { app, auth } from './firebase'

const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID?.trim()

const analyticsPromise = measurementId && typeof window !== 'undefined'
  ? isSupported()
    .then((supported) => supported ? getAnalytics(app) : null)
    .catch((error) => {
      console.warn('Firebase Analytics is unavailable in this browser.', error)
      return null
    })
  : Promise.resolve(null)

export async function trackPageView(path) {
  const analytics = await analyticsPromise
  if (!analytics) return

  logEvent(analytics, 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  })
}

export async function fetchRealtimeAnalytics() {
  const user = auth.currentUser
  if (!user) throw new Error('Admin authentication is required.')

  const token = await user.getIdToken()
  const response = await fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT || '/.netlify/functions/analytics-realtime', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) throw new Error('Realtime analytics could not be loaded.')
  return response.json()
}
