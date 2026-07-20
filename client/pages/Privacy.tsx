import { Link } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";

const LAST_UPDATED = "1 June 2025";
const EMAIL = "privacy@checkinpurple.com";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to CheckinPurple
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Lock className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {LAST_UPDATED}</p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">1. Introduction</h2>
            <p>CheckinPurple ("we", "us", "our") is committed to protecting your personal information in accordance with the <strong className="text-foreground">Protection of Personal Information Act 4 of 2013 (POPIA)</strong> of South Africa, and where applicable, the EU General Data Protection Regulation (GDPR).</p>
            <p className="mt-2">This policy explains what information we collect, why we collect it, how we use it, and your rights over it.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">2. Information We Collect</h2>

            <h3 className="font-semibold text-foreground mb-1">Information you provide</h3>
            <ul className="list-disc list-inside space-y-1 mb-3">
              <li>Full name, email address, phone number, and username at registration</li>
              <li>Profile information: bio, location, profile photo, social media handles, streaming platform links</li>
              <li>Payment references: PayPal transaction IDs (we do not store card numbers or bank account details directly)</li>
              <li>Content you upload: music, photos, product listings, stream titles</li>
              <li>Communications: messages, booking requests, deal proposals, support enquiries</li>
            </ul>

            <h3 className="font-semibold text-foreground mb-1">Information collected automatically</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>IP address and general location (country/region)</li>
              <li>Device type, browser, and operating system</li>
              <li>Pages visited, streams watched, and actions taken on the Platform</li>
              <li>Coin transaction records</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">3. Why We Collect Your Information</h2>
            <table className="w-full text-xs border border-border/40 rounded-lg overflow-hidden">
              <thead className="bg-card/50">
                <tr>
                  <th className="text-left p-3 text-foreground font-semibold">Purpose</th>
                  <th className="text-left p-3 text-foreground font-semibold">Legal Basis (POPIA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {[
                  ["Creating and managing your account", "Contractual necessity"],
                  ["Processing coin purchases and artist payouts", "Contractual necessity"],
                  ["Sending booking confirmations and payout emails", "Contractual necessity"],
                  ["Showing your profile to other users", "Legitimate interest / consent"],
                  ["Improving the Platform and fixing bugs", "Legitimate interest"],
                  ["Sending platform updates and policy changes", "Legal obligation"],
                  ["Fraud detection and prevention", "Legal obligation / legitimate interest"],
                  ["Compliance with FICA, RICA, and SARS requirements", "Legal obligation"],
                ].map(([purpose, basis]) => (
                  <tr key={purpose} className="hover:bg-card/20">
                    <td className="p-3">{purpose}</td>
                    <td className="p-3 text-foreground">{basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">4. Who We Share Your Information With</h2>
            <p>We do <strong className="text-foreground">not sell</strong> your personal information. We share data only with:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong className="text-foreground">Supabase</strong> — our database and authentication provider (EU/US hosting, GDPR compliant)</li>
              <li><strong className="text-foreground">PayPal</strong> — for payment processing (their privacy policy applies to payment data)</li>
              <li><strong className="text-foreground">Livepeer</strong> — for video/audio stream delivery (stream metadata only)</li>
              <li><strong className="text-foreground">Resend</strong> — for transactional emails (email address only)</li>
              <li><strong className="text-foreground">Law enforcement / regulators</strong> — when legally required under South African law</li>
            </ul>
            <p className="mt-2">All third-party providers are bound by data processing agreements and may only use your data to provide services to us.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">5. How Long We Keep Your Data</h2>
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-foreground">Account data:</strong> kept for as long as your account is active, plus 3 years after deletion (for legal compliance)</li>
              <li><strong className="text-foreground">Financial records:</strong> kept for 5 years in accordance with SARS requirements</li>
              <li><strong className="text-foreground">Stream recordings:</strong> kept until you delete them or close your account</li>
              <li><strong className="text-foreground">Support messages:</strong> kept for 2 years</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">6. Your Rights (POPIA)</h2>
            <p>Under POPIA, you have the right to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong className="text-foreground">Access</strong> — request a copy of the personal information we hold about you</li>
              <li><strong className="text-foreground">Correction</strong> — request we correct inaccurate information</li>
              <li><strong className="text-foreground">Deletion</strong> — request deletion of your account and personal data (subject to legal retention requirements)</li>
              <li><strong className="text-foreground">Objection</strong> — object to processing based on legitimate interest</li>
              <li><strong className="text-foreground">Complaint</strong> — lodge a complaint with the <strong className="text-foreground">Information Regulator of South Africa</strong> at inforeg.org.za</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, email <a href="mailto:privacy@checkinpurple.com" className="text-primary underline">{EMAIL}</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">7. Cookies & Tracking</h2>
            <p>We use minimal cookies solely for authentication session management (Supabase JWT tokens stored in localStorage). We do not use advertising cookies, tracking pixels, or third-party analytics. No cookie consent banner is required as we do not use non-essential cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">8. Security</h2>
            <p>We protect your data using:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>TLS/HTTPS encryption for all data in transit</li>
              <li>Row Level Security (RLS) on all database tables via Supabase</li>
              <li>Hashed passwords via Supabase Auth (we never store plaintext passwords)</li>
              <li>Service role keys restricted to server-side only (never exposed to browser)</li>
            </ul>
            <p className="mt-2">In the event of a data breach affecting your rights, we will notify you and the Information Regulator within 72 hours of becoming aware.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">9. Children's Privacy</h2>
            <p>CheckinPurple is not intended for use by persons under 18. We do not knowingly collect personal information from children. If you believe a child has registered, contact us at <a href="mailto:privacy@checkinpurple.com" className="text-primary underline">{EMAIL}</a> and we will delete the account promptly.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">10. International Transfers</h2>
            <p>Your data may be stored or processed outside South Africa (e.g. Supabase EU/US servers, Livepeer, Resend). We ensure that all international transfers are subject to appropriate safeguards consistent with POPIA Section 72.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">11. Changes to This Policy</h2>
            <p>We will notify you of material changes to this policy via email and in-app notice at least 14 days before they take effect.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">12. Contact & Information Officer</h2>
            <p>Our designated Information Officer (as required by POPIA) can be reached at:</p>
            <p className="mt-1"><strong className="text-foreground">Email:</strong> <a href={`mailto:${EMAIL}`} className="text-primary underline">{EMAIL}</a></p>
            <p><strong className="text-foreground">Platform:</strong> checkinpurple.vercel.app</p>
            <p className="mt-2 text-xs">You also have the right to complain to the <strong className="text-foreground">Information Regulator of South Africa</strong>:<br />
            Website: <a href="https://www.inforeg.org.za" target="_blank" rel="noreferrer" className="text-primary underline">www.inforeg.org.za</a><br />
            Email: inforeg@justice.gov.za</p>
          </section>

        </div>
      </div>
    </div>
  );
}
