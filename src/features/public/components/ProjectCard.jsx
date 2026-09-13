import { ArrowUpRight, BookOpen } from 'lucide-react'

export default function ProjectCard({ project }) {
  return <article className="post-card"><div className={`post-art bg-gradient-to-br ${project.color}`}><BookOpen size={26} /><span>{project.category}</span></div><div className="post-meta"><span>{project.date}</span><span>GitHub</span></div><h3>{project.title}</h3><p>{project.excerpt}</p><a href={project.github} target="_blank" rel="noreferrer" className="read-link">Read more on GitHub <ArrowUpRight size={14} /></a></article>
}
