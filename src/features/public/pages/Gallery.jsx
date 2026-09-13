import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import Layout from '../components/Layout'
import { gallery, getStored } from '../../../lib/storage'
import { toDisplayImageUrl } from '../../../lib/imageUrl'

export default function Gallery() {
  const [photos] = useState(() => getStored('wwi-gallery', gallery))
  return <Layout><section className="page-intro"><p className="eyebrow">VISUAL NOTES</p><h1>Things I’ve<br /><em>seen & felt.</em></h1><p className="hero-description">A small collection of frames from ordinary days and extraordinary places.</p></section><section className="gallery-grid">{photos.length ? photos.map((item) => <figure key={item.id || item.src}><img src={toDisplayImageUrl(item.src)} alt={item.label} /><figcaption>{item.label} <ArrowUpRight size={14} /></figcaption></figure>) : <p className="empty-state">No photos uploaded yet.</p>}</section></Layout>
}
