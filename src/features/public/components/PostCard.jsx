import { ArrowUpRight, BookOpen } from 'lucide-react'
import { toDisplayImageUrl } from '../../../lib/imageUrl'

export default function PostCard({ post, onRead }) {
  return <article className="post-card"><div className={`post-art bg-gradient-to-br ${post.color}`}>{post.image ? <img src={toDisplayImageUrl(post.image)} alt="" /> : <BookOpen size={26} />}<span>{post.category}</span></div><div className="post-meta"><span>{post.date}</span><span>{post.read}</span></div><h3>{post.title}</h3><p>{post.excerpt}</p><button type="button" onClick={onRead} className="read-link">Read story <ArrowUpRight size={14} /></button></article>
}
