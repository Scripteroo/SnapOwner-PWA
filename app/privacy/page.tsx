"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-50 bg-lens-bg/80 backdrop-blur-xl border-b border-lens-border/50" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="flex items-center gap-3 px-4 h-14 max-w-2xl mx-auto">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center active:scale-90 transition-transform" type="button">
            <ArrowLeft className="w-5 h-5 text-lens-text" />
          </button>
          <Link href="/" className="text-[17px] font-bold text-lens-text tracking-tight">SnapOwner</Link>
        </div>
      </div>

      <div className="px-5 py-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-6">Last updated: March 26, 2026</p>

        <p className="text-sm text-gray-700 mb-4">
          SnapOwner LLC (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the SnapOwner application (&quot;Service&quot;).
          This Privacy Policy describes how we collect, use, and share information when you use our Service.
        </p>

        <h2 className="text-lg font-bold mt-6 mb-3">1. Information We Collect</h2>

        <h3 className="text-md font-semibold mt-4 mb-2">a. Location Data</h3>
        <p className="text-sm text-gray-700 mb-4">
          With your permission, we access your device&apos;s GPS location to identify properties near you. Location
          data is used in real-time to perform reverse geocoding and property lookups. We do not store your
          precise location on our servers. Location data is processed via the Google Geocoding API and
          OpenStreetMap Nominatim as a fallback.
        </p>

        <h3 className="text-md font-semibold mt-4 mb-2">b. Camera and Photos</h3>
        <p className="text-sm text-gray-700 mb-4">
          With your permission, we access your device&apos;s camera to capture property photos. Photos are
          compressed locally on your device and stored in your browser&apos;s IndexedDB storage. Photos are not
          uploaded to our servers unless you explicitly choose to back up data.
        </p>

        <h3 className="text-md font-semibold mt-4 mb-2">c. Usage Data</h3>
        <p className="text-sm text-gray-700 mb-4">
          We collect anonymous usage data including lookup counts, feature usage, and credit balances. This
          data is stored locally in your browser&apos;s IndexedDB and is used to manage free tier limits and
          credit allocations.
        </p>

        <h3 className="text-md font-semibold mt-4 mb-2">d. Device Information</h3>
        <p className="text-sm text-gray-700 mb-4">
          We may collect basic device information such as browser type, operating system, and screen resolution
          for analytics and to optimize the Service experience.
        </p>

        <h2 className="text-lg font-bold mt-6 mb-3">2. Third-Party Services</h2>
        <p className="text-sm text-gray-700 mb-2">
          We use the following third-party services to provide our features:
        </p>
        <ul className="text-sm text-gray-700 mb-4 list-disc pl-6 space-y-2">
          <li>
            <strong>Google Geocoding API</strong> — Converts GPS coordinates to street addresses. Subject to{" "}
            <a href="https://policies.google.com/privacy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
              Google&apos;s Privacy Policy
            </a>.
          </li>
          <li>
            <strong>Realie API</strong> — Provides property data including ownership, valuation, tax records,
            sales history, and mortgage information from public records.
          </li>
          <li>
            <strong>Tracerfy API</strong> — Provides skip trace services including phone numbers, email
            addresses, carrier information, and Do Not Call status for property owners.
          </li>
          <li>
            <strong>Supabase</strong> — Optional cloud backup for saved properties. Subject to{" "}
            <a href="https://supabase.com/privacy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
              Supabase&apos;s Privacy Policy
            </a>.
          </li>
        </ul>
        <p className="text-sm text-gray-700 mb-4">
          When you perform a property lookup or skip trace, we transmit the property address and/or owner name
          to these third-party APIs. We do not control how these third parties handle your data and recommend
          reviewing their respective privacy policies.
        </p>

        <h2 className="text-lg font-bold mt-6 mb-3">3. Information About Property Owners</h2>
        <p className="text-sm text-gray-700 mb-4">
          The Service displays information about property owners sourced from public records and third-party
          data providers. This information may include names, mailing addresses, phone numbers, and email
          addresses. This data is obtained from publicly available sources and is provided for legitimate
          business purposes only.
        </p>

        <h2 className="text-lg font-bold mt-6 mb-3">4. Data Storage and Security</h2>
        <p className="text-sm text-gray-700 mb-4">
          Most data is stored locally on your device using IndexedDB. This includes saved properties, photos,
          credit balances, and preferences. We implement reasonable security measures to protect your data,
          but no method of storage or transmission is 100% secure.
        </p>

        <h2 className="text-lg font-bold mt-6 mb-3">5. Your Rights Under CCPA</h2>
        <p className="text-sm text-gray-700 mb-2">
          If you are a California resident, the California Consumer Privacy Act (CCPA) provides you with the
          following rights:
        </p>
        <ul className="text-sm text-gray-700 mb-4 list-disc pl-6 space-y-1">
          <li><strong>Right to Know</strong> — You may request what personal information we collect, use, and disclose about you.</li>
          <li><strong>Right to Delete</strong> — You may request deletion of your personal information. Since most data is stored locally on your device, you can delete it by clearing your browser data or using the Dev Tools page to reset the database.</li>
          <li><strong>Right to Opt-Out</strong> — You may opt out of the sale of your personal information. We do not sell personal information.</li>
          <li><strong>Right to Non-Discrimination</strong> — We will not discriminate against you for exercising your CCPA rights.</li>
        </ul>
        <p className="text-sm text-gray-700 mb-4">
          To exercise your CCPA rights, contact us at{" "}
          <a href="mailto:support@snapowner.com" className="text-blue-600 underline">support@snapowner.com</a>.
        </p>

        <h2 className="text-lg font-bold mt-6 mb-3">6. Property Owner Opt-Out</h2>
        <p className="text-sm text-gray-700 mb-4">
          If you are a property owner and wish to opt out of having your information displayed through our
          Service, please contact us at{" "}
          <a href="mailto:abuse@snapowner.com" className="text-blue-600 underline">abuse@snapowner.com</a>{" "}
          with your name, property address, and a description of the information you would like removed. We
          will process opt-out requests within 30 days, subject to verification of ownership.
        </p>

        <h2 className="text-lg font-bold mt-6 mb-3">7. Children&apos;s Privacy</h2>
        <p className="text-sm text-gray-700 mb-4">
          The Service is not intended for use by individuals under the age of 18. We do not knowingly collect
          personal information from children.
        </p>

        <h2 className="text-lg font-bold mt-6 mb-3">8. Changes to This Policy</h2>
        <p className="text-sm text-gray-700 mb-4">
          We may update this Privacy Policy from time to time. Changes will be posted on this page with an
          updated effective date. Your continued use of the Service constitutes acceptance of the revised policy.
        </p>

        <h2 className="text-lg font-bold mt-6 mb-3">9. Contact Us</h2>
        <p className="text-sm text-gray-700 mb-8">
          For privacy-related questions or requests, contact us at{" "}
          <a href="mailto:support@snapowner.com" className="text-blue-600 underline">support@snapowner.com</a>.
          <br />
          To report misuse of data or request owner opt-out, contact{" "}
          <a href="mailto:abuse@snapowner.com" className="text-blue-600 underline">abuse@snapowner.com</a>.
        </p>

        <p className="text-xs text-gray-400 mb-4">&copy; 2026 SnapOwner LLC. All rights reserved.</p>
      </div>

      <BottomNav onTabChange={() => router.push("/")} />
    </div>
  );
}
