import { useState } from 'react'
import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import PostCard from '../components/PostCard'
import ProjectCard from '../components/ProjectCard'
import WritingModal from '../components/WritingModal'
import { gallery, getStored, initialPosts, initialProfile, initialProjects } from '../../../lib/storage'

export default function Home() {
  const profile = getStored('wwi-profile', initialProfile)
  const photos = getStored('wwi-gallery', gallery)
  const posts = getStored('wwi-posts', initialPosts)
  const projects = getStored('wwi-projects', initialProjects)
  const [selectedPost, setSelectedPost] = useState(null)
  return <Layout><section className="hero-section"><div className="hero-copy"><p className="eyebrow">HELLO, I'M {(profile.name || 'YOU').toUpperCase()} <span>✦</span></p><h1>Making sense of<br /><em>the world</em> through<br />code & curiosity.</h1><p className="hero-description">{profile.bio || 'Add your introduction from the admin panel.'}</p><div className="hero-actions"><Link className="button button-dark" to="/writing">Read my writing <ArrowUpRight size={16} /></Link><Link className="text-link" to="/about">More about me <ChevronRight size={15} /></Link></div></div><div className="hero-visual"><div className="portrait-frame">{profile.photo ? <img src={profile.photo} alt={`Portrait of ${profile.name}`} /> : <span className="empty-image">Add your profile photo</span>}</div><div className="scribble">always<br />curious <span>↗</span></div><div className="circle-badge">EST.<br /><strong>2024</strong></div></div></section><section className="section-block"><div className="section-heading"><div><p className="eyebrow">LATEST NOTES</p><h2>From the journal</h2></div><Link className="text-link" to="/writing">View all writing <ArrowUpRight size={15} /></Link></div><div className="journal-block">{posts.length ? <div><p className="eyebrow">WRITINGS</p><div className="post-grid">{posts.slice(0, 3).map((post) => <PostCard key={post.id} post={post} onRead={() => setSelectedPost(post)} />)}</div></div> : <p className="empty-state">Your writings will appear here after you publish your first post.</p>}{projects.length > 0 && <div className="journal-projects"><div className="journal-subheading"><p className="eyebrow">PROJECTS</p><span>Built and shared on GitHub</span></div><div className="post-grid">{projects.slice(0, 3).map((project) => <ProjectCard key={project.id} project={project} />)}</div></div>}</div></section><section className="split-section"><div><p className="eyebrow">A LITTLE MORE</p><h2>Life beyond<br /><em>the screen.</em></h2><p className="muted">When I am not building things, I am usually behind a camera, searching for a good cup of coffee, or planning my next walk somewhere new.</p><Link className="text-link" to="/gallery">Explore the gallery <ArrowUpRight size={15} /></Link></div>{photos.length ? <div className="mini-gallery">{photos.slice(0, 3).map((item) => <img key={item.id || item.src} src={item.src} alt={item.label} />)}</div> : <p className="empty-state">Your gallery will appear here after you add your first photo.</p>}</section>{selectedPost && <WritingModal posts={posts} selectedPost={selectedPost} onSelect={setSelectedPost} onClose={() => setSelectedPost(null)} />}</Layout>
}
