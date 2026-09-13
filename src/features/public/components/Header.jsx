import { Link, NavLink } from 'react-router-dom'

function openResume(resume) {
  if (!resume) return
  if (!resume.startsWith('data:')) { window.open(resume, '_blank', 'noopener,noreferrer'); return }
  const [metadata, encoded] = resume.split(',')
  const mimeType = metadata.match(/data:(.*?);base64/)?.[1] || 'application/pdf'
  const binary = atob(encoded)
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }))
  window.open(url, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export default function Header() {
  const resume = localStorage.getItem('wwi-resume')
  return <header className="site-header">
    <Link to="/" className="brand"><span className="brand-mark">D</span><span>Deepak<span className="brand-dot">.</span></span></Link>
    <nav className="main-nav"><NavLink to="/" end>Home</NavLink><NavLink to="/writing">Writing</NavLink><NavLink to="/gallery">Gallery</NavLink><NavLink to="/about">About</NavLink>{resume ? <a href="#resume" onClick={(event) => { event.preventDefault(); openResume(resume) }}>My Resume</a> : <span className="disabled-nav-link" title="Resume not uploaded yet">My Resume</span>}</nav>
  </header>
}
