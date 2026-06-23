import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" className="font-bold text-gray-900 flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 44 44" fill="none">
                <path d="M19 26H17a6 6 0 0 1 0-12h2" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <path d="M25 18h2a6 6 0 0 1 0 12h-2" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <line x1="18.5" y1="22" x2="25.5" y2="22" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            CACFPLink
          </Link>
          <Link to="/" className="text-sm text-brand-600 hover:underline">← Back to home</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-14">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: June 23, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Overview</h2>
            <p>CACFPLink ("we," "our," or "us") is committed to protecting your privacy. This policy explains what information we collect, how we use it, and what rights you have over your data. CACFPLink is designed for CACFP program operations and we take seriously our responsibility to handle program data with care.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Account information:</strong> Name, email address, organization name, and role when you register.</li>
              <li><strong>Program data:</strong> Meal counts, compliance documents, applications, and messages you submit through the platform.</li>
              <li><strong>Usage data:</strong> Pages visited, features used, and actions taken — collected via Google Analytics to help us improve the platform.</li>
              <li><strong>Contact information:</strong> Any information you provide when contacting our support team.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>To provide and operate the CACFPLink platform</li>
              <li>To send transactional emails (account verification, password resets, application status updates)</li>
              <li>To respond to support requests</li>
              <li>To improve our platform based on usage patterns</li>
              <li>We do not sell your data to third parties</li>
              <li>We do not use your program data for advertising purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Data Security</h2>
            <p className="text-sm">All data transmitted to and from CACFPLink is encrypted using HTTPS/TLS. Access to program data is controlled through role-based permissions — users can only access data relevant to their role. We use industry-standard practices to protect your information.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Data Retention</h2>
            <p className="text-sm">We retain your account and program data for as long as your account is active. If you close your account, you may request deletion of your data by contacting us at <a href="mailto:cacfplink@gmail.com" className="text-brand-600">cacfplink@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Third-Party Services</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Google Analytics:</strong> Used to understand how visitors use our site. Data is anonymized and aggregated.</li>
              <li><strong>Resend:</strong> Used to send transactional emails.</li>
              <li><strong>Crisp:</strong> Used for live chat support on the website.</li>
              <li><strong>Railway:</strong> Our hosting provider for backend infrastructure.</li>
              <li><strong>Vercel:</strong> Our hosting provider for the frontend application.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Your Rights</h2>
            <p className="text-sm">You have the right to access, correct, or delete your personal information at any time. To make a request, email us at <a href="mailto:cacfplink@gmail.com" className="text-brand-600">cacfplink@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Contact</h2>
            <p className="text-sm">If you have questions about this privacy policy, please contact us at <a href="mailto:cacfplink@gmail.com" className="text-brand-600">cacfplink@gmail.com</a>.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
