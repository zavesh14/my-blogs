import { auth } from './firebase'

const endpoint = import.meta.env.VITE_CONTENT_ENDPOINT || '/.netlify/functions/content'

function mapStory(item) {
  return {
    ...item,
    id: item.id || item._id,
    excerpt: item.excerpt ?? item.subtitle ?? '',
    image: item.image ?? item.coverImageUrl ?? '',
    date: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Published',
    read: item.read || `${item.readTimeMinutes || 1} min read`,
    color: item.color || 'from-slate-500 to-slate-700',
  }
}

function mapGallery(item) {
  return { ...item, id: item.id || item._id, label: item.label || item.title || item.caption || '', src: item.src || item.imageUrl || '' }
}

async function request(type, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (options.admin) {
    const token = await auth.currentUser?.getIdToken()
    if (!token) throw new Error('Authentication required.')
    headers.Authorization = `Bearer ${token}`
  }
  const response = await fetch(`${endpoint}?type=${type}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify({ ...options.body, type }) : undefined,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || `Content request failed (${response.status}).`)
  return payload
}

export async function fetchStories(options = {}) {
  const { items = [] } = await request('stories', options)
  return items.map(mapStory)
}

export async function fetchGallery(options = {}) {
  const { items = [] } = await request('gallery', options)
  return items.map(mapGallery)
}

export async function saveStory(story) {
  const isMongoDocument = story.id && /^[a-f\d]{24}$/i.test(String(story.id))
  const { item } = await request('stories', { method: isMongoDocument ? 'PUT' : 'POST', admin: true, body: story })
  return mapStory(item)
}

export async function deleteStory(id) {
  return request(`stories&id=${encodeURIComponent(id)}`, { method: 'DELETE', admin: true })
}

export async function saveGalleryItem(item) {
  const isMongoDocument = item.id && /^[a-f\d]{24}$/i.test(String(item.id))
  const { item: saved } = await request('gallery', { method: isMongoDocument ? 'PUT' : 'POST', admin: true, body: item })
  return mapGallery(saved)
}

export async function deleteGalleryItem(id) {
  return request(`gallery&id=${encodeURIComponent(id)}`, { method: 'DELETE', admin: true })
}
