import { useState } from 'react'
import Layout from '../components/Layout'
import PostCard from '../components/PostCard'
import ProjectCard from '../components/ProjectCard'
import WritingModal from '../components/WritingModal'
import { getStored, initialPosts, initialProjects } from '../../../lib/storage'

export default function Writing() {
  const [posts] = useState(() => getStored('wwi-posts', initialPosts))
  const projects = getStored('wwi-projects', initialProjects)
  const [selectedPost, setSelectedPost] = useState(null)
  return <Layout><section className="page-intro"><p className="eyebrow">THE JOURNAL</p><h1>Thoughts, <em>notes</em><br />& observations.</h1><p className="hero-description">A collection of ideas, lessons, and projects from the road.</p></section><section className="journal-page-section"><div className="section-heading"><div><p className="eyebrow">NORMAL WRITINGS</p><h2>Notes & observations</h2></div></div><div className="writing-list">{posts.length ? posts.map((post) => <PostCard key={post.id} post={post} onRead={() => setSelectedPost(post)} />) : <p className="empty-state">No writings published yet.</p>}</div></section>{projects.length > 0 && <section className="journal-page-section project-section"><div className="section-heading"><div><p className="eyebrow">PROJECT WRITING</p><h2>Things I’ve built</h2></div><span className="muted">Explore the code on GitHub.</span></div><div className="writing-list">{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div></section>}{selectedPost && <WritingModal posts={posts} selectedPost={selectedPost} onSelect={setSelectedPost} onClose={() => setSelectedPost(null)} />}</Layout>
}
