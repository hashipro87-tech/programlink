import { Link } from 'react-router-dom';
import { Shield, CheckCircle, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 44 44" fill="none">
                <path d="M19 26H17a6 6 0 0 1 0-12h2" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <path d="M25 18h2a6 6 0 0 1 0 12h-2" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <line x1="18.5" y1="22" x2="25.5" y2="22" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900">CACFPLink</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/demo" className="text-sm font-semibold text-brand-600 hover:underline">Try Demo</Link>
            <Link to="/register" className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-16">

        {/* Hero */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-100 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            <span className="text-xs font-semibold text-brand-700">Our story</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
            Built by someone who's worked in CACFP operations.
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed">
            CACFPLink exists because I lived the problem firsthand — and I knew there had to be a better way.
          </p>
        </div>

        {/* Story */}
        <div className="prose prose-lg max-w-none text-gray-700 space-y-6 mb-14">
          <p>
            Hi, I'm Hashi. Before building CACFPLink, I worked in food service and experienced many of
            the day-to-day challenges firsthand. I saw meal counts tracked in spreadsheets, compliance
            paperwork chased through email chains, and coordinators calling sites just to confirm deliveries.
          </p>
          <p>
            Every piece of this process was fragmented, manual, and stressful — especially for the kitchens
            and sites who are just trying to feed kids. I couldn't find software that actually understood
            how CACFP programs work. Generic tools, outdated portals, systems designed for other industries
            and adapted poorly.
          </p>
          <p className="font-semibold text-gray-900">
            I started CACFPLink to create software that feels modern, intuitive, and built specifically
            for the way CACFP programs actually operate.
          </p>
        </div>

        {/* Pilot partners */}
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <span className="text-xs font-bold text-brand-700 uppercase tracking-wide">Currently welcoming pilot partners</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Shape the future of CACFPLink.</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            We're working closely with early sponsors and CACFP professionals to shape the future of CACFPLink.
            Early partners help guide development and receive hands-on support as new features are released.
          </p>
          <a
            href="mailto:cacfplink@gmail.com"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl transition-colors"
          >
            Become a pilot partner →
          </a>
        </div>

        {/* Built with the community */}
        <div className="border border-gray-200 rounded-2xl p-8 mb-14">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Built with the CACFP community.</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Every feature in CACFPLink is shaped by conversations with sponsors, coordinators, kitchens,
            sites, and CACFP professionals. We believe the best software is built by listening to the
            people who use it every day.
          </p>
        </div>

        {/* What we believe */}
        <div className="bg-gray-50 rounded-2xl p-8 mb-14">
          <h2 className="text-xl font-bold text-gray-900 mb-6">What we believe</h2>
          <div className="space-y-4">
            {[
              { title: 'CACFP programs deserve purpose-built software', body: 'Not adapted spreadsheets, not generic tools — software designed around real CACFP operational workflows.' },
              { title: 'Compliance shouldn\'t be stressful', body: 'When your tools track what needs tracking, audits stop being something you dread.' },
              { title: 'Every role matters', body: 'Sponsors, coordinators, kitchens, and sites all have different needs. We built dashboards for each one.' },
              { title: 'Real support from a real person', body: 'When you message us, you\'re talking to someone who understands CACFP — not a bot reading from a script.' },
            ].map(({ title, body }) => (
              <div key={title} className="flex gap-3">
                <CheckCircle className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">{title}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="border border-gray-200 rounded-2xl p-8 mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Security & Privacy</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Encrypted connections (HTTPS) across the entire platform',
              'Role-based access controls — users only see what they need',
              'Secure document storage with access logging',
              'No data sold to third parties — ever',
              'Privacy-first design built for government-adjacent programs',
              'Regular security reviews and updates',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-2" />
                <p className="text-sm text-gray-600">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-brand-600 rounded-2xl p-8 text-white mb-14">
          <h2 className="text-xl font-bold mb-2">Questions? Talk to a real person.</h2>
          <p className="text-brand-200 mb-4">
            Have questions about CACFPLink, your program, or whether this is the right fit?
            Reach out directly — I respond personally.
          </p>
          <a
            href="mailto:cacfplink@gmail.com"
            className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            cacfplink@gmail.com
          </a>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to see it in action?</h2>
          <p className="text-gray-500 mb-6">No account needed — explore any role with real sample data.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/demo"
              className="flex items-center gap-2 px-7 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-colors shadow-sm"
            >
              Try Interactive Demo <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/register"
              className="px-6 py-3.5 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-400">
          <span>© 2026 CACFPLink. All rights reserved.</span>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-gray-600">Terms of Service</Link>
            <a href="mailto:cacfplink@gmail.com" className="hover:text-gray-600">cacfplink@gmail.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
