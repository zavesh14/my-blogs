import mongoose from 'mongoose'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const MAX_BODY_BYTES = 6 * 1024 * 1024
const connectionKey = Symbol.for('my-blogs.mongo.connection')

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body),
  }
}

async function getDatabase() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured.')
  const cached = globalThis[connectionKey]
  if (cached?.readyState === 1) return cached
  const connection = await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || 'blogs',
    serverSelectionTimeoutMS: 5000,
  })
  globalThis[connectionKey] = connection.connection
  return connection.connection
}

function getModel(connection, type) {
  const collection = type === 'gallery'
    ? process.env.MONGODB_GALLERY_COLLECTION || 'gallery'
    : process.env.MONGODB_STORY_COLLECTION || 'my-blogs'
  const modelName = `Content_${collection.replace(/[^a-zA-Z0-9]/g, '_')}`
  return connection.models[modelName] || connection.model(modelName, new mongoose.Schema({}, {
    strict: false,
    timestamps: true,
    collection,
  }))
}

function getFirebaseAdmin() {
  if (getApps().length) return getApps()[0]
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}')
  if (!serviceAccount.project_id) throw new Error('Firebase admin credentials are not configured.')
  return initializeApp({ credential: cert(serviceAccount) })
}

async function requireAdmin(event) {
  const authorization = event.headers?.authorization || event.headers?.Authorization || ''
  if (!authorization.startsWith('Bearer ')) return { error: json(401, { error: 'Authentication required.' }) }
  const decodedToken = await getAuth(getFirebaseAdmin()).verifyIdToken(authorization.slice(7))
  const allowedEmail = (process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase()
  if (!allowedEmail || decodedToken.email?.toLowerCase() !== allowedEmail) {
    return { error: json(403, { error: 'Admin access is not allowed.' }) }
  }
  return { user: decodedToken }
}

function getType(event, body = {}) {
  const value = event.queryStringParameters?.type || body.type
  return value === 'gallery' ? 'gallery' : value === 'stories' || value === 'story' ? 'stories' : null
}

function cleanDocument(type, input) {
  const fields = type === 'gallery'
    ? ['title', 'label', 'caption', 'imageUrl', 'src', 'altText', 'sortOrder', 'published']
    : ['title', 'slug', 'category', 'subtitle', 'excerpt', 'content', 'coverImageUrl', 'image', 'published', 'publishedAt', 'readTimeMinutes']
  const output = {}
  for (const field of fields) {
    if (input[field] !== undefined) output[field] = input[field]
  }
  if (type === 'stories') {
    output.subtitle = output.subtitle ?? output.excerpt ?? ''
    output.excerpt = output.excerpt ?? output.subtitle
    output.coverImageUrl = output.coverImageUrl ?? output.image ?? ''
    output.image = output.image ?? output.coverImageUrl
    if (!output.slug && output.title) output.slug = String(output.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    if (output.readTimeMinutes !== undefined) output.readTimeMinutes = Math.max(1, Math.min(240, Number(output.readTimeMinutes) || 1))
  } else {
    output.title = output.title ?? output.label ?? ''
    output.label = output.label ?? output.title
    output.caption = output.caption ?? output.label
    output.imageUrl = output.imageUrl ?? output.src ?? ''
    output.src = output.src ?? output.imageUrl
    output.sortOrder = Number.isFinite(Number(output.sortOrder)) ? Number(output.sortOrder) : 0
  }
  return output
}

function serialize(document) {
  const value = document.toObject ? document.toObject() : document
  return { ...value, id: String(value._id), _id: undefined }
}

export async function handler(event) {
  const method = event.httpMethod || 'GET'
  let body = {}
  if (event.body) {
    const size = Buffer.byteLength(event.body, event.isBase64Encoded ? 'base64' : 'utf8')
    if (size > MAX_BODY_BYTES) return json(413, { error: 'Request body is too large.' })
    try {
      body = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body)
    } catch {
      return json(400, { error: 'Request body must be valid JSON.' })
    }
  }
  const type = getType(event, body)
  if (!type) return json(400, { error: 'Content type must be stories or gallery.' })

  try {
    const connection = await getDatabase()
    const Model = getModel(connection, type)
    if (method === 'GET') {
      let filter = { published: true }
      const authorizationHeader = event.headers?.authorization || event.headers?.Authorization
      if (authorizationHeader) {
        const authorization = await requireAdmin(event)
        if (authorization.error) return authorization.error
        filter = {}
      }
      const documents = await Model.find(filter)
        .sort(type === 'gallery' ? { sortOrder: 1, createdAt: -1 } : { publishedAt: -1, createdAt: -1 })
        .lean()
      return json(200, { items: documents.map(serialize) })
    }

    const authorization = await requireAdmin(event)
    if (authorization.error) return authorization.error
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return json(405, { error: 'Method not allowed.' })

    const id = body.id || event.queryStringParameters?.id
    if (method === 'DELETE') {
      if (!id || !mongoose.isValidObjectId(id)) return json(400, { error: 'A valid content id is required.' })
      const deleted = await Model.findByIdAndDelete(id)
      return deleted ? json(200, { item: serialize(deleted) }) : json(404, { error: 'Content was not found.' })
    }

    const document = cleanDocument(type, body)
    if (!document.title || (type === 'gallery' && !document.imageUrl) || (type === 'stories' && !document.content)) {
      return json(400, { error: 'Title, image, and story content are required.' })
    }
    if (id && mongoose.isValidObjectId(id)) {
      const updated = await Model.findByIdAndUpdate(id, document, { new: true, runValidators: true })
      return updated ? json(200, { item: serialize(updated) }) : json(404, { error: 'Content was not found.' })
    }
    const created = await Model.create(document)
    return json(201, { item: serialize(created) })
  } catch (error) {
    console.error('Content request failed.', error)
    if (error.name === 'ValidationError') return json(400, { error: 'Content validation failed.' })
    if (error.message.includes('not configured')) return json(503, { error: 'Content storage is not configured.' })
    return json(500, { error: 'Content is temporarily unavailable.' })
  }
}
