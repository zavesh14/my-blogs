import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { getStored, initialProfile } from '../../../lib/storage'

export default function About() {
  const profile = getStored('wwi-profile', initialProfile)
  return <Layout><section className="about-grid"><div className="about-image">{profile.photo ? <img src={profile.photo} alt={profile.name} /> : <span className="empty-image">Add your profile photo</span>}</div><div><p className="eyebrow">NICE TO MEET YOU</p><h1>I’m {profile.name.split(' ')[0] || 'you'}.<br /><em>A maker at heart.</em></h1><p className="about-copy">{profile.bio || 'Add your biography from the admin panel.'}</p><p className="about-copy">This is my corner of the internet — a place to share what I’m working on, what I’m learning, and the moments that make up a life well-lived.</p><div className="about-signature">{profile.name.charAt(0) || 'D'}.</div><Link className="button button-dark" to="/writing">Read my notes <ArrowUpRight size={16} /></Link></div></section></Layout>
}
