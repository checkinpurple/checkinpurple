import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

const LAST_UPDATED = "1 June 2025";
const COMPANY = "CheckinPurple";
const EMAIL = "legal@checkinpurple.com";
const COUNTRY = "South Africa";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to CheckinPurple
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold">Terms and Conditions</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed text-muted-foreground">

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>By creating an account or using {COMPANY} ("we", "us", "our", "the Platform"), you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, do not use the Platform. These terms are governed by the laws of {COUNTRY}.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">2. Who Can Use CheckinPurple</h2>
            <p>You must be at least <strong className="text-foreground">18 years old</strong> to create an account and use the Platform, including purchasing coins, making tips, or entering into any commercial arrangement. By registering, you confirm that you are 18 or older.</p>
            <p className="mt-2">Users between 13 and 17 may use the Platform only with verifiable parental or guardian consent. We reserve the right to terminate accounts of users who misrepresent their age.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">3. Account Profiles & Tiers</h2>
            <p>CheckinPurple offers four profile types — Fan, Artist, Merchant, and Influencer — unlocked through subscription tiers:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong className="text-foreground">Basic (Free):</strong> 1 profile</li>
              <li><strong className="text-foreground">Standard:</strong> 2 profiles</li>
              <li><strong className="text-foreground">Premium:</strong> All 4 profiles</li>
            </ul>
            <p className="mt-2">Subscription payments are processed via PayPal. Tier upgrades are non-refundable once access has been granted. You may cancel your subscription at any time; access continues until the end of the billing period.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">4. Coin System</h2>
            <p>CheckinPurple operates a virtual coin economy for tipping artists. Coins have no cash value to fans — they are a digital token of appreciation. Once purchased, coins are <strong className="text-foreground">non-refundable</strong>.</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Artists receive <strong className="text-foreground">70%</strong> of the ZAR value of every coin tip received.</li>
              <li>CheckinPurple retains 30% as a platform service fee.</li>
              <li>Minimum payout to artists: <strong className="text-foreground">R200 ZAR</strong> or <strong className="text-foreground">$11 USD</strong>.</li>
              <li>Payouts are processed via PayPal or bank transfer within 3–5 business days of request.</li>
              <li>CheckinPurple reserves the right to withhold payouts pending fraud or policy violation review.</li>
            </ul>
            <p className="mt-2">Coin purchases are processed by PayPal. The exchange rate used for USD/ZAR conversions is sourced from a live public rate feed and may vary.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">5. Influencer Commissions</h2>
            <p>Commission arrangements between Influencers and Artists are negotiated directly between those parties on the Platform. CheckinPurple does not take a cut of influencer commissions. CheckinPurple is not a party to such agreements and accepts no liability for commission disputes. Both parties are responsible for any tax obligations arising from their arrangements.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">6. Artist Responsibilities</h2>
            <p>By streaming or uploading content to CheckinPurple, you confirm that:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>You own or have valid licensing rights to all music you stream or upload.</li>
              <li>Your content does not infringe the intellectual property rights of any third party, including but not limited to SAMRO, CAPASSO, or international rights holders.</li>
              <li>You will not stream content that is defamatory, obscene, or illegal under South African law.</li>
              <li>You are responsible for obtaining any licences required by South African copyright law (Copyright Act 98 of 1978 and amendments).</li>
            </ul>
            <p className="mt-2">CheckinPurple will respond to valid DMCA takedown notices and equivalent South African copyright complaints.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">7. Merchant Responsibilities</h2>
            <p>Merchants must:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Only list and sell legitimate, legal products and services.</li>
              <li>Accurately describe products, including condition, size, and delivery timelines.</li>
              <li>Comply with the Consumer Protection Act 68 of 2008 (South Africa), including the right to returns within 5 business days for physical goods.</li>
              <li>Not list counterfeit, stolen, or prohibited goods.</li>
              <li>Handle customer personal data in accordance with POPIA (see section 10).</li>
            </ul>
            <p className="mt-2">CheckinPurple is a marketplace facilitator and is not liable for merchant transactions. Disputes between buyers and merchants must be resolved between those parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">8. Prohibited Content & Conduct</h2>
            <p>You may not use the Platform to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Stream, upload, or share content that is illegal, hateful, threatening, or sexually explicit without appropriate age gates.</li>
              <li>Harass, bully, or impersonate other users.</li>
              <li>Engage in fraudulent tipping, fake reviews, or manipulation of the coin economy.</li>
              <li>Scrape, reverse-engineer, or attempt to circumvent Platform security.</li>
              <li>Use the Platform for money laundering or any activity in violation of FICA (Financial Intelligence Centre Act) or RICA.</li>
            </ul>
            <p className="mt-2">Violations may result in immediate account suspension, forfeiture of coin balances, and referral to relevant authorities.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">9. Intellectual Property</h2>
            <p>The CheckinPurple name, logo, design, and platform code are the intellectual property of {COMPANY}. Users retain ownership of content they create and upload, but grant CheckinPurple a non-exclusive, royalty-free licence to display and distribute that content on the Platform for service delivery purposes.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">10. Privacy & POPIA Compliance</h2>
            <p>CheckinPurple collects and processes personal information in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA). We collect:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Name, email address, phone number, and username at registration.</li>
              <li>Payment transaction references (we do not store card details — PayPal handles this).</li>
              <li>Usage data for platform improvement.</li>
            </ul>
            <p className="mt-2">We do not sell your personal information. You have the right to access, correct, and request deletion of your data. Contact us at <a href={`mailto:${EMAIL}`} className="text-primary underline">{EMAIL}</a> for data requests. See our full Privacy Policy for details.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">11. Tax Obligations</h2>
            <p>Artists, Merchants, and Influencers earning income through CheckinPurple are solely responsible for declaring and paying any applicable taxes, including Income Tax and VAT, to the South African Revenue Service (SARS) or their relevant tax authority. CheckinPurple does not withhold tax on behalf of users and does not provide tax advice.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">12. Limitation of Liability</h2>
            <p>CheckinPurple provides the Platform "as is". To the maximum extent permitted by law, we are not liable for:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Loss of earnings, data, or business resulting from Platform downtime or errors.</li>
              <li>Disputes between users (artist/fan, merchant/buyer, artist/influencer).</li>
              <li>Copyright infringement by users.</li>
              <li>Any indirect, incidental, or consequential damages.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">13. Changes to These Terms</h2>
            <p>We may update these Terms from time to time. We will notify users via email and an in-app notice at least 14 days before material changes take effect. Continued use of the Platform after that date constitutes acceptance of the updated Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">14. Governing Law & Disputes</h2>
            <p>These Terms are governed by and construed in accordance with the laws of the Republic of South Africa. Any disputes shall be subject to the jurisdiction of the South African courts. We encourage users to first contact us at <a href={`mailto:${EMAIL}`} className="text-primary underline">{EMAIL}</a> to resolve disputes informally.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">15. Contact</h2>
            <p>For legal, compliance, or privacy matters:</p>
            <p className="mt-1"><strong className="text-foreground">Email:</strong> <a href={`mailto:${EMAIL}`} className="text-primary underline">{EMAIL}</a></p>
            <p><strong className="text-foreground">Platform:</strong> checkinpurple.vercel.app</p>
          </section>

        </div>
      </div>
    </div>
  );
}
