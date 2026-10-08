import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  fetchChatHistory,
  pageContextFromPath,
  sendChatMessage,
  type ProductSummary,
} from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { useSearchResults } from '../search/SearchResultsContext'
import BulldogMascot from './BulldogMascot'
import ChatBulldog from './ChatBulldog'
import { renderChatContent } from './chatMarkdown'
import './ChatWidget.css'

interface ChatEntry {
  role: 'user' | 'assistant'
  content: string
  products?: ProductSummary[]
}

const GREETING: ChatEntry = {
  role: 'assistant',
  content: "Hey! I'm the Campus Customs shop assistant. Ask me about any product — sizes, colors, stock, you name it.",
}

// Floating chat panel, bottom-right of the site.
// Calls the real shop assistant agent (backend/agent.py) via /api/chat.
//
// Problem 7: when the agent's reply includes product matches, this widget
// stores them in SearchResultsContext and navigates to /products, so the
// website itself dynamically shows the matching items as real product
// cards. The small cards below are kept too, as a quick in-chat shortcut.
//
// Problem 8 (customer memory): every message is sent with the shopper's
// user_id (if logged in) and a PageContext describing what page they're
// on, so the agent knows who it's talking to and can resolve "this"/"it"
// on a product page. For a logged-in shopper, their stored conversation
// is reloaded from GET /api/chat/history on login so they pick up right
// where they left off; guests just see the greeting (nothing persists
// for them — see output/harness.md).
export default function ChatWidget() {
  const { user } = useAuth()
  const { setActiveSearch } = useSearchResults()
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatEntry[]>([GREETING])
  const [isSending, setIsSending] = useState(false)
  const loadedHistoryForUserId = useRef<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Usability improvement (Problem 9, front-end #1): auto-scroll to the
  // newest message whenever the conversation grows (a new turn, history
  // reloaded on login, or the "…" pending bubble appearing). Without this,
  // a shopper returning with a long saved history — or just chatting for a
  // while — has to manually scroll down to see the latest reply each time.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isSending, isOpen])

  // Reload a logged-in shopper's chat history once, right when they log in
  // (or when the widget mounts already logged in). Resets back to just the
  // greeting on logout.
  useEffect(() => {
    if (!user) {
      loadedHistoryForUserId.current = null
      setMessages([GREETING])
      return
    }
    if (loadedHistoryForUserId.current === user.id) return
    loadedHistoryForUserId.current = user.id

    fetchChatHistory(user.id)
      .then((history) => {
        if (history.length === 0) return
        setMessages(
          history.map((entry) => ({
            role: entry.role,
            content: entry.content,
            products: entry.products,
          })),
        )
      })
      .catch(() => {
        // Couldn't load history — not fatal, just keep the default greeting.
      })
  }, [user])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || isSending) return

    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setDraft('')
    setIsSending(true)

    try {
      const pageContext = pageContextFromPath(location.pathname)
      const reply = await sendChatMessage(text, user?.id, pageContext)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply.content, products: reply.products },
      ])

      if (reply.products.length > 0) {
        setActiveSearch({ query: text, products: reply.products })
        navigate('/products')
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." },
      ])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="chat-widget">
      {isOpen && (
        <div className="chat-widget__panel">
          <div className="chat-widget__header">
            <span className="chat-widget__header-title">
              <BulldogMascot className="chat-widget__header-icon" />
              Campus Customs Chat
            </span>
            <button
              className="chat-widget__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
          <div className="chat-widget__messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-widget__row chat-widget__row--${m.role}`}>
                {m.role === 'assistant' && (
                  <BulldogMascot className="chat-widget__avatar" />
                )}
                <div className="chat-widget__column">
                  <div className={`chat-widget__message chat-widget__message--${m.role}`}>
                    {renderChatContent(m.content)}
                  </div>
                  {m.products && m.products.length > 0 && (
                    <div className="chat-widget__products">
                      {m.products.slice(0, 4).map((p) => (
                        <Link
                          key={p.product_id}
                          to={`/products/${p.product_id}`}
                          className="chat-widget__product-card"
                        >
                          <img src={p.image_url} alt={p.name} />
                          <div>
                            <div className="chat-widget__product-name">{p.name}</div>
                            <div className="chat-widget__product-price">
                              ${p.price.toFixed(2)} {!p.in_stock && '· Out of stock'}
                            </div>
                          </div>
                        </Link>
                      ))}
                      {m.products.length > 4 && (
                        <Link to="/products" className="chat-widget__more-link">
                          + {m.products.length - 4} more on the Products page →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="chat-widget__row chat-widget__row--assistant">
                <BulldogMascot className="chat-widget__avatar" />
                <div className="chat-widget__message chat-widget__message--assistant chat-widget__message--pending">
                  <span className="chat-widget__typing-dot" />
                  <span className="chat-widget__typing-dot" />
                  <span className="chat-widget__typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form className="chat-widget__form" onSubmit={handleSubmit}>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about a product…"
              aria-label="Chat message"
              maxLength={2000}
            />
            <button type="submit" disabled={isSending || !draft.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
      {!isOpen && (
        <div className="chat-widget__speech-bubble" aria-hidden="true">
          How can I help!?
        </div>
      )}
      <button
        className="chat-widget__toggle"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <span className="chat-widget__toggle-close">×</span> : <ChatBulldog className="chat-widget__toggle-icon" />}
      </button>
    </div>
  )
}
