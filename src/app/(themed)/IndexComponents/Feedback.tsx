import { ArrowUpRight, BookOpen, Lightbulb, MessageCircle } from 'lucide-react'

export default function Feedback() {
  return (
    <section className="home-feedback-section" aria-labelledby="feedback-title">
      <div className="home-feedback aero-panel">
        <div className="feedback-illustration" aria-hidden="true">
          <span className="feedback-orbit" />
          <span className="feedback-main-bubble"><MessageCircle strokeWidth={1.4} /></span>
          <span className="feedback-small-bubble"><HeartMark /></span>
        </div>
        <div className="feedback-copy">
          <p className="eyebrow">A masjid shaped by its community</p>
          <h2 id="feedback-title">Your voice makes a difference.</h2>
          <p>Have a verse you’d love to see, an idea to share, or something we could do better? We’d love to hear from you.</p>
          <ul className="feedback-topics" aria-label="Feedback ideas">
            <li><BookOpen size={16} aria-hidden="true" /> Suggest a verse</li>
            <li><Lightbulb size={16} aria-hidden="true" /> Share an idea</li>
          </ul>
        </div>
        <div className="feedback-action">
          <a href="https://forms.gle/o2PUq1vq3QDomWKk9" target="_blank" rel="noopener noreferrer" className="aero-button">Share feedback <ArrowUpRight size={18} aria-hidden="true" /></a>
          <span>Opens our feedback form</span>
        </div>
      </div>
    </section>
  )
}

function HeartMark() {
  return <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11Z" /></svg>
}
