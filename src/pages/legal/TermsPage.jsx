import { Link } from 'react-router-dom';

export default function TermsPage() {
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
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: June 23, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Acceptance of Terms</h2>
            <p className="text-sm">By creating an account or using CACFPLink ("the Service"), you agree to these Terms of Service. If you do not agree, please do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Description of Service</h2>
            <p className="text-sm">CACFPLink is a web-based platform designed to help CACFP (Child and Adult Care Food Program) sponsors, coordinators, kitchens, and meal sites manage program operations including meal counts, compliance documentation, applications, and communications.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Account Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must provide accurate information when registering.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>You must not share your account with unauthorized users.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Acceptable Use</h2>
            <p className="text-sm">You agree to use CACFPLink only for lawful purposes related to CACFP program operations. You may not:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
              <li>Submit false or misleading program data</li>
              <li>Attempt to access data belonging to other organizations</li>
              <li>Use the platform to violate any applicable laws or USDA regulations</li>
              <li>Attempt to reverse-engineer, hack, or disrupt the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Data Accuracy</h2>
            <p className="text-sm">CACFPLink is a tool to help manage your program data. You remain responsible for the accuracy of all meal counts, compliance documents, and other data submitted through the platform. CACFPLink does not verify the accuracy of program data entered by users.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Availability</h2>
            <p className="text-sm">We aim to maintain high availability of the platform but do not guarantee uninterrupted service. We will make reasonable efforts to notify users of planned maintenance or significant outages.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Limitation of Liability</h2>
            <p className="text-sm">CACFPLink is provided "as is." To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability to you for any claim shall not exceed the amount you paid us in the three months prior to the claim.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Changes to Terms</h2>
            <p className="text-sm">We may update these terms from time to time. We will notify registered users by email of any material changes. Continued use of the platform after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Contact</h2>
            <p className="text-sm">Questions about these terms? Email us at <a href="mailto:support@cacfplink.com" className="text-brand-600">support@cacfplink.com</a>.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
