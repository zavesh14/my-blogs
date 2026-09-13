import { useEffect, useState } from 'react'
import { ArrowUpRight, MessageCircle, Send } from 'lucide-react'

const assistantSuggestions = [
  'What are his coding skills?',
  'What projects has he made?',
  'What are his hobbies and talents?',
  'Can he build cloud infrastructure?',
  'What programming languages does Deepak know?',
  'What technologies are listed in his resume?',
  'What is Deepak’s professional experience?',
  'What certifications does Deepak have?',
]

function renderAssistantText(text) {
  return text.split('\n').map((line, lineIndex) => {
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/)
    const heading = line.match(/^#{1,3}\s+(.*)$/)
    const content = bullet ? bullet[1] : heading ? heading[1] : line
    const parts = []
    const tokenPattern = /(\*\*.+?\*\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g
    let cursor = 0
    let match = tokenPattern.exec(content)
    while (match) {
      if (match.index > cursor) parts.push(content.slice(cursor, match.index))
      if (match[0].startsWith('**')) {
        parts.push(<strong key={`${lineIndex}-bold-${match.index}`}>{match[0].slice(2, -2)}</strong>)
      } else {
        const link = match[0].match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/)
        parts.push(<a href={link[2]} target="_blank" rel="noreferrer" key={`${lineIndex}-link-${match.index}`}>{link[1]}</a>)
      }
      cursor = match.index + match[0].length
      match = tokenPattern.exec(content)
    }
    if (cursor < content.length) parts.push(content.slice(cursor))
    const className = `assistant-line${bullet ? ' assistant-line-bullet' : ''}${heading ? ' assistant-line-heading' : ''}`
    return <span className={className} key={lineIndex}>{bullet && <span className="assistant-bullet">•</span>}{parts}</span>
  })
}

function BotIcon() {
  return <span className="assistant-avatar" aria-hidden="true"><svg viewBox="0 0 48 48" role="img"><rect x="7" y="12" width="34" height="27" rx="11" fill="#d9fc83" /><path d="M24 12V7m-3 0h6" stroke="#d9fc83" strokeWidth="3" strokeLinecap="round" /><circle cx="18" cy="25" r="3" fill="#232321" /><circle cx="30" cy="25" r="3" fill="#232321" /><path d="M17 32c4 3 10 3 14 0" fill="none" stroke="#232321" strokeWidth="2.5" strokeLinecap="round" /></svg><span>✦</span></span>
}

export default function PortfolioAssistant({ getContext }) {
  const [open, setOpen] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hi! Ask me about Deepak’s skills, projects, hobbies, or cloud experience.' }])
  const [sending, setSending] = useState(false)
  const [online, setOnline] = useState(null)
  const maxResumePayload = 3 * 1024 * 1024
  const chatEndpoint = import.meta.env.VITE_CHAT_ENDPOINT || '/.netlify/functions/portfolio-chat'

  useEffect(() => {
    const timeout = window.setTimeout(() => setShowWelcome(false), 9000)
    return () => window.clearTimeout(timeout)
  }, [])

  useEffect(() => {
    let active = true
    fetch(chatEndpoint, { method: 'GET', cache: 'no-store' })
      .then((response) => response.json().catch(() => ({})).then((data) => ({ response, data })))
      .then(({ response, data }) => {
        if (active) setOnline(response.ok && data.online === true)
      })
      .catch(() => {
        if (active) setOnline(false)
      })
    return () => { active = false }
  }, [chatEndpoint])

  async function ask(question) {
    const trimmed = question.trim()
    if (!trimmed || sending || online !== true) return
    const nextMessages = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)
    try {
      const response = await fetch(chatEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.slice(-10),
          context: {
            ...getContext(),
            resume: (localStorage.getItem('wwi-resume') || '').length <= maxResumePayload
              ? localStorage.getItem('wwi-resume') || ''
              : '',
          },
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || `Chat request failed (${response.status}).`)
      setMessages([...nextMessages, { role: 'assistant', content: data.message }])
    } catch (error) {
      setMessages([...nextMessages, { role: 'assistant', content: error instanceof TypeError ? 'The chat service cannot be reached. Make sure the site is deployed with Netlify Functions enabled.' : error.message || 'I could not answer right now. Please try again shortly.' }])
    } finally {
      setSending(false)
    }
  }

  return <div className={`assistant ${open ? 'assistant-open' : ''}`}>
    {open && <section className="assistant-panel" aria-label="Ask about Deepak">
      <div className="assistant-heading"><div className="assistant-title"><BotIcon /><div><strong>Ask about Deepak</strong><span>AI portfolio guide <i className={`assistant-live-dot ${online ? '' : 'offline'}`} /> {online ? 'online' : 'offline'}</span></div></div><button type="button" onClick={() => setOpen(false)} aria-label="Close chat">×</button></div>
      <div className="assistant-messages">{online === true ? messages.map((message, index) => <p className={`assistant-message ${message.role === 'assistant' ? 'bot' : 'user'}`} key={`${message.role}-${index}`}>{message.role === 'assistant' ? renderAssistantText(message.content) : message.content}</p>) : <div className="assistant-offline"><strong>{online === null ? 'Checking AI assistant status…' : 'AI assistant is offline'}</strong><span>{online === null ? 'Please wait a moment.' : 'Please check back later.'}</span></div>}{sending && <p className="assistant-message bot">Thinking…</p>}</div>
      <div className="assistant-suggestions">{assistantSuggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => ask(suggestion)} disabled={sending || online !== true}>{suggestion}</button>)}</div>
      <form className="assistant-form" onSubmit={(event) => { event.preventDefault(); ask(input) }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder={online === true ? 'Ask about Deepak...' : 'AI assistant is offline'} aria-label="Ask a question" disabled={online !== true} /><button type="submit" disabled={sending || !input.trim() || online !== true} aria-label="Send question"><Send size={15} /></button></form>
    </section>}
    {!open && showWelcome && <div className="assistant-welcome"><button type="button" className="assistant-welcome-close" onClick={() => setShowWelcome(false)} aria-label="Dismiss AI assistant introduction">×</button><span className="assistant-welcome-kicker"><span className="assistant-welcome-pulse" /> DEEPAK'S AI GUIDE</span><strong>Curious about my work?</strong><span>Ask me about skills, projects, hobbies, and more.</span><button type="button" className="assistant-welcome-action" onClick={() => { setOpen(true); setShowWelcome(false) }}>Start a conversation <ArrowUpRight size={13} /></button></div>}
    <button type="button" className={`assistant-toggle ${showWelcome && !open ? 'assistant-attention' : ''}`} onClick={() => { setOpen(!open); setShowWelcome(false) }} aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}><span className="assistant-toggle-icon"><MessageCircle size={19} /></span> <span>{open ? 'Close' : 'Ask AI'}</span><span className="assistant-sparkle">✦</span></button>
  </div>
}
