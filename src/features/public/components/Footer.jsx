import { ArrowUpRight } from 'lucide-react'

export default function Footer() {
  const linkedinUrl = import.meta.env.VITE_LINKEDIN_URL
  const githubUrl = import.meta.env.VITE_GITHUB_URL
  return <footer><span>© 2024 Deepak Studio</span><span>Made with intention <span className="footer-heart">♥</span></span>{(linkedinUrl || githubUrl) && <div className="socials"><span className="connect-label">You can connect with me <ArrowUpRight size={13} /></span>{linkedinUrl && <a href={linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a>}{githubUrl && <a href={githubUrl} target="_blank" rel="noreferrer">GitHub</a>}</div>}</footer>
}
