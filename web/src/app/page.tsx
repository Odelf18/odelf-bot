import { HeroLive } from "@/components/HeroLive";
import { LiveDashboard } from "@/components/LiveDashboard";

export default function HomePage() {
  return (
    <main>
      <header className="topbar">
        <a className="brand-mark" href="#top">
          Odelf Bot
        </a>
        <nav className="nav">
          <a href="#live">Terminal</a>
          <a href="#stack">Stack</a>
        </nav>
      </header>

      <HeroLive />

      <LiveDashboard />

      <section id="stack" className="section stack">
        <div className="section-head">
          <h2 className="section-title">Stack</h2>
          <p className="section-sub">
            What powers this showcase — transparent, deployable, paper only.
          </p>
        </div>
        <ul className="stack-list">
          <li>
            <span className="stack-name">Freqtrade</span>
            <span className="stack-desc">Open-source crypto trading engine</span>
          </li>
          <li>
            <span className="stack-name">Binance Futures</span>
            <span className="stack-desc">Isolated margin · dry-run simulation</span>
          </li>
          <li>
            <span className="stack-name">OdelfTrend</span>
            <span className="stack-desc">5m EMA20 cross + OBV · long &amp; short</span>
          </li>
          <li>
            <span className="stack-name">Heroku</span>
            <span className="stack-desc">Container dyno for the always-on bot</span>
          </li>
          <li>
            <span className="stack-name">Vercel</span>
            <span className="stack-desc">This board · secured API proxy</span>
          </li>
        </ul>
      </section>

      <footer className="disclaimer">
        <p>
          <strong>Disclaimer.</strong> Odelf Bot is a paper-trading / dry-run
          demonstration for portfolio purposes. Simulated results are not live
          trading performance and are not financial advice. Markets are risky —
          never trade money you cannot afford to lose.
        </p>
      </footer>
    </main>
  );
}
