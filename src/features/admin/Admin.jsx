import { useEffect, useState } from 'react'
import { ArrowUpRight, BookOpen, Camera, Check, FileText, LayoutDashboard, LogOut, Plus, Save, Trash2, UserRound } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { fetchRealtimeAnalytics } from '../../lib/analytics'
import { auth, signOut } from '../../lib/firebase'
import { gallery, getStored, initialPosts, initialProfile, initialProjects } from '../../lib/storage'
import { toDisplayImageUrl } from '../../lib/imageUrl'

function openResume(resume) {
  if (!resume) return
  if (!resume.startsWith('data:')) { window.open(resume, '_blank', 'noopener,noreferrer'); return }
  const [metadata, encoded] = resume.split(',')
  const mimeType = metadata.match(/data:(.*?);base64/)?.[1] || 'application/pdf'
  const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0))
  const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }))
  window.open(url, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export default function Admin() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState(() => getStored('wwi-posts', initialPosts))
  const [photos, setPhotos] = useState(() => getStored('wwi-gallery', gallery))
  const [projects, setProjects] = useState(() => getStored('wwi-projects', initialProjects))
  const [profile, setProfile] = useState(() => getStored('wwi-profile', initialProfile))
  const [resume, setResume] = useState(() => localStorage.getItem('wwi-resume') || '')
  const [saved, setSaved] = useState(false)
  const [savedItem, setSavedItem] = useState('')
  const [realtime, setRealtime] = useState({ status: 'loading', activeUsers: 0 })

  useEffect(() => {
    let active = true
    async function load() {
      try { const data = await fetchRealtimeAnalytics(); if (active) setRealtime({ status: 'ready', ...data }) }
      catch { if (active) setRealtime({ status: 'error', activeUsers: 0 }) }
    }
    load()
    const interval = window.setInterval(load, 30_000)
    return () => { active = false; window.clearInterval(interval) }
  }, [])

  function update(setter, items, id, field, value) {
    const next = items.map((item) => item.id === id ? { ...item, [field]: value } : item)
    setter(next)
  }

  function addPost() {
    setPosts([{ id: Date.now(), category: 'New note', title: 'A new story waiting to be written', excerpt: 'Add a subtitle for your story.', content: 'Write the full story here.', image: '', date: 'Draft', read: '1 min read', color: 'from-slate-500 to-slate-700', published: false }, ...posts])
  }

  function addPhoto() {
    setPhotos([...photos, { id: Date.now(), src: '', label: 'New photo', published: false }])
  }

  function addProject() {
    const next = [{ id: Date.now(), category: 'New project', title: 'Untitled project', excerpt: 'Describe what you built and the problem it solves.', date: 'Draft', read: 'View on GitHub', color: 'from-slate-700 to-slate-950', github: '' }, ...projects]
    setProjects(next); localStorage.setItem('wwi-projects', JSON.stringify(next))
  }

  function saveProfile() {
    localStorage.setItem('wwi-profile', JSON.stringify(profile))
    setSaved(true); setTimeout(() => setSaved(false), 1800)
  }

  function saveContent(kind, item) {
    const label = kind === 'story' ? `Story "${item.title}" saved` : `Photo "${item.label}" saved`
    const key = kind === 'story' ? 'wwi-posts' : 'wwi-gallery'
    localStorage.setItem(key, JSON.stringify(kind === 'story' ? posts : photos))
    setSavedItem(label)
    window.setTimeout(() => setSavedItem(''), 1800)
  }

  function removeContent(kind, item) {
    const key = kind === 'story' ? 'wwi-posts' : 'wwi-gallery'
    if (kind === 'story') {
      const next = posts.filter((value) => value.id !== item.id)
      setPosts(next)
      localStorage.setItem(key, JSON.stringify(next))
    } else {
      const next = photos.filter((value) => value.id !== item.id)
      setPhotos(next)
      localStorage.setItem(key, JSON.stringify(next))
    }
  }

  async function logout() {
    await signOut(auth); sessionStorage.removeItem('wwi-admin'); sessionStorage.removeItem('wwi-admin-email'); navigate('/admin/login')
  }

  return <div className="admin-shell"><aside className="admin-sidebar"><Link to="/" className="brand"><span className="brand-mark">D</span><span>Deepak<span className="brand-dot">.</span></span></Link><div className="sidebar-label">WORKSPACE</div><NavLink to="/admin" end><LayoutDashboard size={17} /> Overview</NavLink><a href="#posts"><BookOpen size={17} /> Posts <span className="nav-count">{posts.length}</span></a><a href="#gallery"><Camera size={17} /> Gallery <span className="nav-count">{photos.length}</span></a><a href="#projects"><BookOpen size={17} /> Projects <span className="nav-count">{projects.length}</span></a><a href="#profile"><UserRound size={17} /> Profile</a><a href="#resume"><FileText size={17} /> Resume</a><div className="sidebar-bottom"><button onClick={logout}><LogOut size={17} /> Sign out</button></div></aside><div className="admin-content"><div className="admin-topbar"><span className="mobile-admin-title">Deepak Studio / Workspace</span><span className="admin-status"><span className="status-dot" /> Your site is live</span><Link to="/" className="view-site">View site <ArrowUpRight size={14} /></Link></div><div className="admin-main"><div className="admin-heading"><div><p className="eyebrow">SUNDAY, SEPTEMBER 13, 2026</p><h1>Good morning, {profile.name.split(' ')[0]}.</h1><p className="muted">Here’s what’s happening with your site.</p></div><button className="button button-dark" onClick={addPost}><Plus size={16} /> New post</button></div><div className="stats-row"><div><span>Total posts</span><strong>{posts.length}</strong></div><div><span>Gallery photos</span><strong>{photos.length}</strong></div><div><span>Visitors right now</span><strong>{realtime.status === 'ready' ? realtime.activeUsers : '—'}</strong></div></div>

  <section className="admin-panel" id="posts"><div className="panel-heading"><h2>Recent posts</h2><button className="subtle-button" onClick={addPost}><Plus size={14} /> Add post</button></div>{posts.map((post) => <div className="admin-post" key={post.id}><div><label className="admin-label">Header / title<input value={post.title || ''} onChange={(e) => update(setPosts, posts, post.id, 'title', e.target.value)} /></label><label className="admin-label">Category<input value={post.category || ''} onChange={(e) => update(setPosts, posts, post.id, 'category', e.target.value)} /></label><label className="admin-label">Subtitle<textarea value={post.excerpt || ''} onChange={(e) => update(setPosts, posts, post.id, 'excerpt', e.target.value)} rows="2" /></label><label className="admin-label">Story image URL<input type="url" placeholder="https://... or Google Drive share link" value={post.image || ''} onChange={(e) => update(setPosts, posts, post.id, 'image', e.target.value)} /></label>{post.image && <img className="admin-image-preview" src={toDisplayImageUrl(post.image)} alt="Story preview" />}<label className="admin-label">Full story<textarea value={post.content || ''} onChange={(e) => update(setPosts, posts, post.id, 'content', e.target.value)} rows="8" /></label><label className="admin-label"><input type="checkbox" checked={Boolean(post.published)} onChange={(e) => update(setPosts, posts, post.id, 'published', e.target.checked)} /> Published</label><div className="admin-actions"><button type="button" className="save-button" onClick={() => saveContent('story', post)}><Save size={15} /> {savedItem === `Story "${post.title}" saved` ? 'Saved' : 'Save story'}</button>{savedItem.startsWith(`Story "${post.title}"`) && <span className="save-confirmation">{savedItem}</span>}<button type="button" className="delete-button" onClick={() => removeContent('story', post)}><Trash2 size={14} /> Delete story</button></div></div></div>)}</section>

  <section className="admin-panel" id="profile"><div className="panel-heading"><h2>Edit profile</h2><button className="save-button" onClick={saveProfile}>{saved ? <Check size={15} /> : <Save size={15} />} {saved ? 'Saved' : 'Save profile'}</button></div><label className="admin-label">Name<input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></label><label className="admin-label">Role / tagline<input value={profile.role} onChange={(e) => setProfile({ ...profile, role: e.target.value })} /></label><label className="admin-label">Bio<textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows="4" /></label></section>

  <section className="admin-panel gallery-panel" id="gallery"><div className="panel-heading"><h2>Edit gallery</h2><button className="subtle-button" onClick={addPhoto}><Plus size={14} /> Add photo</button></div>{photos.map((photo) => <div className="gallery-admin-card" key={photo.id}><label className="admin-label">Photo URL<input type="url" placeholder="https://... or Google Drive share link" value={photo.src || ''} onChange={(e) => update(setPhotos, photos, photo.id, 'src', e.target.value)} /></label>{photo.src && <img className="admin-image-preview gallery-preview" src={toDisplayImageUrl(photo.src)} alt="Gallery preview" />}<label className="admin-label">Caption<input value={photo.label || ''} onChange={(e) => update(setPhotos, photos, photo.id, 'label', e.target.value)} /></label><label className="admin-label">Alt text<input value={photo.altText || ''} onChange={(e) => update(setPhotos, photos, photo.id, 'altText', e.target.value)} /></label><label className="admin-label"><input type="checkbox" checked={Boolean(photo.published)} onChange={(e) => update(setPhotos, photos, photo.id, 'published', e.target.checked)} /> Published</label><div className="admin-actions"><button type="button" className="save-button" onClick={() => saveContent('gallery', photo)}><Save size={15} /> {savedItem === `Photo "${photo.label}" saved` ? 'Saved' : 'Save photo'}</button>{savedItem.startsWith(`Photo "${photo.label}"`) && <span className="save-confirmation">{savedItem}</span>}<button className="delete-button" onClick={() => removeContent('gallery', photo)}><Trash2 size={14} /> Delete</button></div></div>)}</section>

  <section className="admin-panel project-admin-panel" id="projects"><div className="panel-heading"><h2>Projects</h2><button className="subtle-button" onClick={addProject}><Plus size={14} /> Add project</button></div>{projects.map((project) => <div className="project-admin-card" key={project.id}><label className="admin-label">Title<input value={project.title} onChange={(e) => update(setProjects, projects, project.id, 'title', e.target.value)} /></label><label className="admin-label">Description<textarea value={project.excerpt} onChange={(e) => update(setProjects, projects, project.id, 'excerpt', e.target.value)} /></label><div className="admin-actions"><button type="button" className="save-button" onClick={() => { localStorage.setItem('wwi-projects', JSON.stringify(projects)); setSavedItem(`Project "${project.title}" uploaded`); window.setTimeout(() => setSavedItem(''), 1800) }}><Save size={15} /> Upload project</button><button type="button" className="delete-button" onClick={() => { const next = projects.filter((item) => item.id !== project.id); setProjects(next); localStorage.setItem('wwi-projects', JSON.stringify(next)) }}><Trash2 size={14} /> Delete project</button></div></div>)}</section>

  <section className="admin-panel resume-panel" id="resume"><div className="panel-heading"><h2>My resume</h2><span>{resume ? 'Uploaded' : 'Not uploaded'}</span></div><div className="resume-actions"><label className="button button-dark upload-button"><FileText size={16} /> Choose PDF<input type="file" accept="application/pdf,.pdf" onChange={(event) => { const file = event.target.files?.[0]; if (!file || file.size > 4 * 1024 * 1024) return; const reader = new FileReader(); reader.onload = () => { const value = String(reader.result); setResume(value); localStorage.setItem('wwi-resume', value) }; reader.readAsDataURL(file) }} /></label>{resume && <button className="subtle-button" onClick={() => openResume(resume)}>Open resume</button>}</div></section></div></div></div>
}
