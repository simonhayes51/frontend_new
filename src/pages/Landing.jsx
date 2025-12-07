import React from 'react';
import ParallaxHero from '../components/ParallaxHero';
import screenshot from '../assets/dashboard-preview.jpg';
import '../styles/landing.css';
import { useNavigate } from 'react-router-dom';

const LOGIN_URL = 'https://api.futhub.co.uk/api/login';
const CHROME_URL = 'https://chrome.google.com/webstore/detail/fut-trader-hub'; // Chrome Web Store URL

const FeatureCard = ({icon, title, children}) => (
  <article className="card-surface rounded-2xl p-5">
    <div className="text-2xl mb-1">{icon}</div>
    <h3 className="text-xl font-bold mb-1">{title}</h3>
    <p className="text-slate-300">{children}</p>
  </article>
);

const Landing = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    window.location.href = LOGIN_URL;
  };

  return (
    <div className="landing-body bg-[#0e1320] min-h-screen">
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur border-b border-white/5">
        <div className="container mx-auto px-5 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-extrabold text-white no-underline">
            <span className="grid place-items-center w-7 h-7 rounded-lg bg-gradient-to-br from-[#9b5cff] to-[#5a2fd6] shadow"></span>
            <span>FUT Trader Hub</span>
          </a>
          <nav className="hidden sm:flex items-center gap-4">
            <a href="#features" className="text-slate-300 hover:text-white">Features</a>
            <a href="#how" className="text-slate-300 hover:text-white">How it works</a>
            <a href="#faq" className="text-slate-300 hover:text-white">FAQ</a>
            <a href={LOGIN_URL} className="border border-white/20 rounded-lg px-3 py-2 text-white no-underline">Login</a>
          </nav>
        </div>
      </header>

      <ParallaxHero onLoginClick={handleLogin} chromeUrl={CHROME_URL} screenshotUrl={screenshot} />

      <section id="features" className="section-alt py-16">
        <div className="container mx-auto px-5">
          <header className="mb-8">
            <h2 className="text-3xl font-black">
              Everything you need to <span className="text-[#2bf57a]">win the market</span>
            </h2>
            <p className="text-slate-400">Dark, clean, and neon highlights — same vibe as your dashboard.</p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard icon="🤖" title="AI Trade Copilot">
              Chat with AI for instant trading advice, market analysis, and strategy guidance.
            </FeatureCard>
            <FeatureCard icon="✨" title="Portfolio Optimizer">
              AI-powered portfolio analysis with risk metrics, diversification insights, and optimization.
            </FeatureCard>
            <FeatureCard icon="📈" title="Live Price Checks">
              Ultra-fast lookups with console prices and trend spark lines. Extinct flag included.
            </FeatureCard>
            <FeatureCard icon="🧠" title="Smart Buy AI">
              AI-powered recommendations for profitable trades with real-time price analysis.
            </FeatureCard>
            <FeatureCard icon="💰" title="Profit Calculator">
              Advanced calculator with EA tax scenarios, break-even points, and ROI targets.
            </FeatureCard>
            <FeatureCard icon="🧮" title="EA Tax & Analytics">
              Automatic tax and net profit on every sale, plus weekly P&amp;L and ROI.
            </FeatureCard>
            <FeatureCard icon="📊" title="Market Sentiment">
              Real-time sentiment analysis from Twitter, Discord, and community signals.
            </FeatureCard>
            <FeatureCard icon="🏆" title="Leaderboards">
              Compete globally with monthly prizes for top traders. Climb the ranks!
            </FeatureCard>
            <FeatureCard icon="⚡" title="Market Maker Mode">
              Bulk trade entry for power traders. Import CSV, calculate ROI instantly.
            </FeatureCard>
            <FeatureCard icon="🔔" title="Real-time Alerts">
              Price spikes, falls and trade opportunities sent to Discord or in-app.
            </FeatureCard>
            <FeatureCard icon="🎁" title="Refer & Earn">
              Get free Premium days and earn 30% commission on referrals.
            </FeatureCard>
            <FeatureCard icon="🧩" title="Chrome Extension">
              Track sold listings, log trades in one click, and sync to your portfolio.
            </FeatureCard>
          </div>
        </div>
      </section>

      <section id="how" className="py-16">
        <div className="container mx-auto px-5">
          <header className="mb-6">
            <h2 className="text-3xl font-black">How it works</h2>
          </header>
          <ol className="grid gap-3 list-none p-0 m-0">
            <li className="card-surface rounded-xl p-4"><span className="inline-grid place-items-center w-7 h-7 rounded-lg bg-gradient-to-br from-[#9b5cff] to-[#6c41ff] font-black mr-3">1</span> Login with Discord • choose your platform.</li>
            <li className="card-surface rounded-xl p-4"><span className="inline-grid place-items-center w-7 h-7 rounded-lg bg-gradient-to-br from-[#9b5cff] to-[#6c41ff] font-black mr-3">2</span> Add the Chrome extension • capture sold prices automatically.</li>
            <li className="card-surface rounded-xl p-4"><span className="inline-grid place-items-center w-7 h-7 rounded-lg bg-gradient-to-br from-[#9b5cff] to-[#6c41ff] font-black mr-3">3</span> Start trading • watchlist, trends and alerts keep you ahead.</li>
          </ol>
        </div>
      </section>

      <section id="faq" className="section-alt py-16">
        <div className="container mx-auto px-5">
          <header className="mb-6">
            <h2 className="text-3xl font-black">FAQ</h2>
          </header>
          <details className="card-surface rounded-xl p-4 mb-3">
            <summary className="font-bold cursor-pointer">Does this work on console data?</summary>
            <p className="text-slate-300 mt-2">Yes — PS &amp; Xbox prices are primary. PC is ignored for accuracy unless you enable it.</p>
          </details>
          <details className="card-surface rounded-xl p-4 mb-3">
            <summary className="font-bold cursor-pointer">How do I install the Chrome extension?</summary>
            <p className="text-slate-300 mt-2">Click “Add Chrome Extension” above and follow the Web Store prompts. You can also sideload a dev build on chrome://extensions.</p>
          </details>
          <details className="card-surface rounded-xl p-4">
            <summary className="font-bold cursor-pointer">Is my account safe?</summary>
            <p className="text-slate-300 mt-2">We use Discord OAuth only — we never ask for your EA login.</p>
          </details>
        </div>
      </section>

      <section className="text-center py-16 bg-[#141826]">
        <div className="container mx-auto px-5">
          <h2 className="text-3xl font-black">Ready to level up your trades?</h2>
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <a className="btn-solid-primary rounded-xl px-4 py-3 font-extrabold shadow" href={LOGIN_URL}>Login to Dashboard</a>
            <a className="btn-solid-secondary rounded-xl px-4 py-3 font-extrabold shadow" href={CHROME_URL} target="_blank" rel="noreferrer">Add Chrome Extension</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 bg-black/30">
        <div className="container mx-auto px-5 py-5 flex items-center justify-between text-slate-400">
          <p>© {new Date().getFullYear()} FUT Trader Hub — Built for the grind.</p>
          <nav className="hidden sm:flex gap-4">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#how" className="hover:text-white">How it works</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
