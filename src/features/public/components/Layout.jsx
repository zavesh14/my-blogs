import PortfolioAssistant from '../../../ai/PortfolioAssistant'
import Header from './Header'
import Footer from './Footer'
import { gallery, getStored, initialPosts, initialProfile, initialProjects } from '../../../lib/storage'

export default function Layout({ children }) {
  const getContext = () => {
    const profile = getStored('wwi-profile', initialProfile)
    return { profile: { name: profile.name, role: profile.role, bio: profile.bio }, posts: getStored('wwi-posts', initialPosts).slice(0, 20).map(({ image: _image, ...post }) => post), projects: getStored('wwi-projects', initialProjects).slice(0, 20), gallery: getStored('wwi-gallery', gallery).map(({ id, label }) => ({ id, label })), linkedin: import.meta.env.VITE_LINKEDIN_URL || '', github: import.meta.env.VITE_GITHUB_URL || '' }
  }
  return <><Header /><main>{children}</main><Footer /><PortfolioAssistant getContext={getContext} /></>
}
