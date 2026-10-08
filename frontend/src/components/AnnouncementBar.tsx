import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import './AnnouncementBar.css'

const MESSAGES = [
  '💬 Talk to us in the chat — ask about sizes, colors, or stock',
  '✨ Get personalized recs from the Campus Customs assistant',
  '🐾 See what’s new and what’s happening at Campus Customs',
]

// Problem 10: a moving top banner ("talk to us / get recs / what's
// happening") with the Log In / Create Account links living here instead
// of just the nav bar — doubling as a "join the club" sign-up nudge for
// guests, right where every visitor's eye lands first.
export default function AnnouncementBar() {
  const { user } = useAuth()
  const track = [...MESSAGES, ...MESSAGES]

  return (
    <div className="announcement-bar">
      <div className="announcement-bar__marquee">
        <div className="announcement-bar__track">
          {track.map((msg, i) => (
            <span className="announcement-bar__item" key={i}>
              {msg}
            </span>
          ))}
        </div>
      </div>
      {!user && (
        <div className="announcement-bar__actions">
          <Link to="/login" className="announcement-bar__link">
            Log In
          </Link>
          <Link to="/create-account" className="announcement-bar__cta">
            Join the Bulldog Club
          </Link>
        </div>
      )}
    </div>
  )
}
