import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import About from '../features/public/pages/About'
import Gallery from '../features/public/pages/Gallery'
import Home from '../features/public/pages/Home'
import Writing from '../features/public/pages/Writing'
import AdminEntry from '../features/admin/AdminEntry'
import { trackPageView } from '../lib/analytics'
import { removeDemoContent } from '../lib/storage'
import '../styles/App.css'

function AnalyticsTracker() {
  const location = useLocation()
  useEffect(() => { trackPageView(`${location.pathname}${location.search}`) }, [location.pathname, location.search])
  return null
}

removeDemoContent()

export default function App() {
  return <><AnalyticsTracker /><Routes><Route path="/admin/*" element={<AdminEntry />} /><Route path="/" element={<Home />} /><Route path="/writing" element={<Writing />} /><Route path="/gallery" element={<Gallery />} /><Route path="/about" element={<About />} /><Route path="*" element={<Home />} /></Routes></>
}
