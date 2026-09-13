import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

function getFirebaseAdmin() {
  if (getApps().length) return getApps()[0]

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  return initializeApp({ credential: cert(serviceAccount) })
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body),
  }
}

export async function handler(event) {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed.' })

  try {
    const authorization = event.headers.authorization || event.headers.Authorization || ''
    if (!authorization.startsWith('Bearer ')) return json(401, { error: 'Authentication required.' })

    const decodedToken = await getAuth(getFirebaseAdmin()).verifyIdToken(authorization.slice(7))
    const allowedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
    if (!allowedEmail || decodedToken.email?.toLowerCase() !== allowedEmail) {
      return json(403, { error: 'Admin access is not allowed.' })
    }

    const propertyId = process.env.GA4_PROPERTY_ID?.trim()
    if (!propertyId) return json(503, { error: 'GA4_PROPERTY_ID is not configured.' })

    const analyticsClient = new BetaAnalyticsDataClient()
    const [report] = await analyticsClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: 'activeUsers' }],
    })
    const activeUsers = Number(report.rows?.[0]?.metricValues?.[0]?.value || 0)

    return json(200, {
      activeUsers,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Realtime analytics request failed.', error)
    return json(500, { error: 'Realtime analytics is temporarily unavailable.' })
  }
}
