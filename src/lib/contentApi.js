import { auth } from './firebase'

const endpoint = import.meta.env.VITE_CONTENT_ENDPOINT || '/.netlify/functions/content'

function mapStory(item) {
  return {
    ...item,
    id: item.id || item._id,
    title: item.headerTitle || item.title || '',
    excerpt: item.shortDescription || item.excerpt || '',
    content: item.longDescription || item.content || '',
    image: item.imageUrl || item.image || '',
    date: item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : 'Draft',
    read: item.read || '1 min read',
    color: item.color || 'from-slate-500 to-slate-700',
  }
}

async function request(type, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (options.admin) {
    const token = await auth.currentUser?.getIdToken()
    if (!token) throw new Error('Authentication required.')
    headers.Authorization = `Bearer ${token}`
  }
  const response = await fetch(`${endpoint}?type=${type}${options.id ? `&id=${encodeURIComponent(options.id)}` : ''}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || `Content request failed (${response.status}).`)
  return payload
}

export async function fetchStories(options = {}) {
  const { items = [] } = await request('stories', options)
  return items.map(mapStory)
}

export async function saveStory(story) {
  const { item } = await request('stories', { method: story.id && /^[a-f\d]{24}$/i.test(String(story.id)) ? 'PUT' : 'POST', admin: true, body: story })
  return mapStory(item)
}

export function deleteStory(id) {
  return request('stories', { method: 'DELETE', admin: true, id })
}
