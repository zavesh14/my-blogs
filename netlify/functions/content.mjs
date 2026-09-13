import mongoose from 'mongoose'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const connectionKey = Symbol.for('my-blogs.mongo.connection')

function response(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) }
}

async function getDatabase() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured.')
  if (!/^mongodb(?:\+srv)?:\/\//.test(process.env.MONGODB_URI.trim())) {
    throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://.')
  }
  const cached = globalThis[connectionKey]
  if (cached?.readyState === 1) return cached
  const connection = await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME || 'blogs', serverSelectionTimeoutMS: 5000 })
  globalThis[connectionKey] = connection.connection
  return connection.connection
}

function getModel(connection) {
  const collection = process.env.MONGODB_STORY_COLLECTION || 'my-blogs'
  const schema = new mongoose.Schema({
    headerTitle: { type: String, required: true, trim: true },
    shortDescription: { type: String, default: '' },
    longDescription: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    published: { type: Boolean, default: false },
    publishedAt: Date,
  }, { timestamps: true, collection })
  return connection.models.StoryContent || connection.model('StoryContent', schema)
}

function getAdminApp() {
  if (getApps().length) return getApps()[0]
  let account
  try {
    account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}')
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must be valid one-line JSON.')
  }
  if (!account.project_id) throw new Error('Firebase admin credentials are not configured.')
  return initializeApp({ credential: cert(account) })
}

async function requireAdmin(event) {
  const header = event.headers?.authorization || event.headers?.Authorization || ''
  if (!header.startsWith('Bearer ')) return response(401, { error: 'Authentication required.' })
  const user = await getAuth(getAdminApp()).verifyIdToken(header.slice(7))
  const allowedEmail = (process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase()
  if (!allowedEmail || user.email?.toLowerCase() !== allowedEmail) return response(403, { error: 'Admin access is not allowed.' })
  return null
}

function serialize(item) {
  const value = item.toObject ? item.toObject() : item
  return { ...value, id: String(value._id), _id: undefined, title: value.headerTitle, excerpt: value.shortDescription, content: value.longDescription, image: value.imageUrl }
}

export async function handler(event) {
  try {
    const body = event.body ? JSON.parse(event.body) : {}
    if ((event.httpMethod || 'GET') === 'GET') {
      const connection = await getDatabase()
      const Model = getModel(connection)
      const hasAuthorization = Boolean(event.headers?.authorization || event.headers?.Authorization)
      const adminError = hasAuthorization ? await requireAdmin(event) : null
      if (adminError) return adminError
      const filter = hasAuthorization ? {} : { published: true }
      const items = await Model.find(filter).sort({ createdAt: -1 }).lean()
      return response(200, { items: items.map(serialize) })
    }
    const adminError = await requireAdmin(event)
    if (adminError) return adminError
    const connection = await getDatabase()
    const Model = getModel(connection)
    const id = body.id || event.queryStringParameters?.id
    if (event.httpMethod === 'DELETE') {
      if (!id || !mongoose.isValidObjectId(id)) return response(400, { error: 'A valid story id is required.' })
      const deleted = await Model.findByIdAndDelete(id)
      return deleted ? response(200, { item: serialize(deleted) }) : response(404, { error: 'Story was not found.' })
    }
    if (!['POST', 'PUT', 'PATCH'].includes(event.httpMethod)) return response(405, { error: 'Method not allowed.' })
    const document = {
      headerTitle: String(body.headerTitle || body.title || '').trim(),
      shortDescription: String(body.shortDescription || body.excerpt || '').trim(),
      longDescription: String(body.longDescription || body.content || '').trim(),
      imageUrl: String(body.imageUrl || body.image || '').trim(),
      published: Boolean(body.published),
      publishedAt: body.published ? (body.publishedAt || new Date()) : null,
    }
    if (!document.headerTitle || !document.longDescription) return response(400, { error: 'Header title and long description are required.' })
    const item = id && mongoose.isValidObjectId(id)
      ? await Model.findByIdAndUpdate(id, document, { new: true, runValidators: true })
      : await Model.create(document)
    return item ? response(id ? 200 : 201, { item: serialize(item) }) : response(404, { error: 'Story was not found.' })
  } catch (error) {
    console.error('Story content request failed.', error)
    if (error.message.includes('not configured') || error.message.includes('MONGODB_URI must')) return response(503, { error: error.message })
    if (error.code === 'app/invalid-credential' || error.message.includes('Firebase admin credentials') || error.message.includes('FIREBASE_SERVICE_ACCOUNT_JSON')) {
      return response(503, { error: error.message })
    }
    if (error.code?.startsWith('auth/')) return response(401, { error: `Firebase authentication failed: ${error.message}` })
    if (error.name === 'MongoParseError') return response(503, { error: 'MONGODB_URI is not a valid Atlas connection string.' })
    if (error.name === 'MongooseServerSelectionError') return response(503, { error: 'MongoDB Atlas could not be reached. Check Network Access and the database user.' })
    return response(500, { error: error.message || 'Story storage is temporarily unavailable.' })
  }
}
