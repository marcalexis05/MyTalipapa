import { Link } from 'react-router-dom'
import { ArrowLeft, Store } from 'lucide-react'

// Lightweight content pages for the login footer links (Help / Privacy / Terms).
const CONTENT = {
  help: {
    title: 'Help & Support',
    intro: 'Need a hand with MyTalipapa? Here are answers to the most common questions.',
    sections: [
      { h: 'Signing in', p: 'Use the email and password you registered with. If you forgot your password, tap "Forgot password" on the login screen to reset it via email.' },
      { h: 'Applying for a stall', p: 'Renters can browse available stalls under Market Stalls and submit a rental application. You will be notified once the managing contractor reviews it.' },
      { h: 'Payments & balances', p: 'Your dashboard shows your rented stalls, next due date, and outstanding balance (utang). Payment History lets you verify every recorded payment.' },
      { h: 'Still stuck?', p: 'Contact your market administrator or the contractor who manages your stall for assistance.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'We respect your privacy. This summary explains what MyTalipapa collects and how it is used.',
    sections: [
      { h: 'What we collect', p: 'Account details you provide (name, email, contact number, role) and activity within the app such as applications, stall assignments, and payment records.' },
      { h: 'How we use it', p: 'To operate the market management features — matching renters to stalls, notifying contractors and admins, and keeping accurate occupancy and payment records.' },
      { h: 'Data retention', p: 'Records are never permanently deleted; removed items are archived and can be restored by an administrator. This protects against accidental loss.' },
      { h: 'Your choices', p: 'You may request that your account be archived. Archived accounts can no longer sign in. Contact your administrator for data requests.' },
    ],
  },
  terms: {
    title: 'Terms of Service',
    intro: 'By using MyTalipapa you agree to the following terms.',
    sections: [
      { h: 'Acceptable use', p: 'Use the platform only for legitimate market operations. Do not misuse accounts, submit false applications, or attempt to access records that are not yours.' },
      { h: 'Accounts', p: 'You are responsible for keeping your login credentials secure. Roles (renter, contractor, admin) determine what you can access.' },
      { h: 'Stall agreements', p: 'Rental approvals, payments, and move-outs are handled between renters, contractors, and administrators. MyTalipapa records these but does not replace any formal contract.' },
      { h: 'Changes', p: 'These terms may be updated as the platform evolves. Continued use after changes constitutes acceptance.' },
    ],
  },
}

export default function InfoPage({ type }) {
  const data = CONTENT[type] || CONTENT.help

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <Link to="/login" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" aria-label="Back to login">
          <ArrowLeft size={18} />
        </Link>
        <div className="w-8 h-8 bg-[#1a5c2a] rounded-lg flex items-center justify-center">
          <Store size={15} color="white" />
        </div>
        <span className="font-extrabold text-gray-900 text-base tracking-tight">MyTalipapa</span>
      </header>

      <main className="flex-1 px-4 md:px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">{data.title}</h1>
          <p className="text-sm text-gray-500 mb-8">{data.intro}</p>

          <div className="space-y-5">
            {data.sections.map(s => (
              <div key={s.h} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 className="text-sm font-extrabold text-gray-800 mb-1.5">{s.h}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{s.p}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center gap-6 text-xs text-gray-400 font-semibold">
            <Link to="/help" className="hover:text-[#1a5c2a] hover:underline transition-colors">Help</Link>
            <Link to="/privacy" className="hover:text-[#1a5c2a] hover:underline transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-[#1a5c2a] hover:underline transition-colors">Terms</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
