export const initialPosts = []
export const initialProjects = []
export const gallery = []
export const initialProfile = { name: '', role: '', bio: '', photo: '' }

export function getStored(key, fallback) {
  return JSON.parse(localStorage.getItem(key) || 'null') || fallback
}

export function removeDemoContent() {
  const demoPostTitles = ['Building a calmer digital garden', 'The details are the design', 'Notes from a year of making']
  const posts = JSON.parse(localStorage.getItem('wwi-posts') || 'null')
  if (Array.isArray(posts)) localStorage.setItem('wwi-posts', JSON.stringify(posts.filter((post) => !demoPostTitles.includes(post.title))))
  const projects = JSON.parse(localStorage.getItem('wwi-projects') || 'null')
  if (Array.isArray(projects)) localStorage.setItem('wwi-projects', JSON.stringify(projects.filter((project) => !['WWI personal studio', 'Deepak Studio', 'A project worth sharing'].includes(project.title))))
  const photos = JSON.parse(localStorage.getItem('wwi-gallery') || 'null')
  if (Array.isArray(photos)) localStorage.setItem('wwi-gallery', JSON.stringify(photos.filter((photo) => !photo.src.includes('images.unsplash.com'))))
  const profile = JSON.parse(localStorage.getItem('wwi-profile') || 'null')
  if (profile?.name === 'Deepak Sharma' && profile?.photo?.includes('images.unsplash.com')) localStorage.removeItem('wwi-profile')
}
