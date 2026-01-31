import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service | Wild Reader",
  description: "Terms of service template for Wild Reader",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 text-bark/70 hover:text-bark">
          <span>&larr;</span>
          <span>Back to Wild Reader</span>
        </Link>

        <h1 className="text-3xl font-display font-bold text-bark mb-8">
          Terms of Service
        </h1>

        <div className="space-y-6 text-bark/80">
          {/* Template Notice */}
          <section className="bg-amber-100 border border-amber-300 rounded-lg p-4 space-y-2">
            <h2 className="text-lg font-display font-bold text-amber-800 mb-2">
              Template Notice
            </h2>
            <p className="text-sm text-amber-800">
              This is example content for self-hosted deployments serving external users. Replace{" "}
              <span className="font-mono bg-amber-200 px-1 rounded">[Your Organization]</span>{" "}
              with your entity name and customize for your jurisdiction. This is not legal advice.
            </p>
            <p className="text-sm text-amber-800">
              If you run Wild Reader locally or restrict access to your family, you don&apos;t need
              to customize these terms. You can also contribute to the{" "}
              <a href="https://github.com/hypandra/wildreader" className="underline hover:text-amber-900">
                open source project
              </a>{" "}
              without updating the ToS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-bark mb-2">
              For Parents and Guardians
            </h2>
            <p>
              Wild Reader is designed for children ages 3-5 to use with parental supervision.
              By creating an account with <span className="font-mono bg-bark/10 px-1 rounded">[Your Organization]</span>,
              you confirm that you are a parent or legal guardian
              and consent to your child&apos;s use of this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-bark mb-2">
              Data Collection
            </h2>
            <p>
              <span className="font-mono bg-bark/10 px-1 rounded">[Your Organization]</span> collects
              your email address for account purposes and stores a username
              you choose for your child along with their learning progress.{" "}
              <span className="font-mono bg-bark/10 px-1 rounded">[Your Organization]</span> does not
              sell or share personal information with third parties. All data is stored securely.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-bark mb-2">
              AI-Generated Images
            </h2>
            <p>
              Wild Reader uses AI to generate reward images based on your child&apos;s interests.
              These images are created automatically and, while{" "}
              <span className="font-mono bg-bark/10 px-1 rounded">[Your Organization]</span> strives
              for appropriate content, parental review is recommended. Images are stored on your
              account and can be deleted at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-bark mb-2">
              No Warranty
            </h2>
            <p>
              Wild Reader is provided &quot;as is&quot; without warranties of any kind.{" "}
              <span className="font-mono bg-bark/10 px-1 rounded">[Your Organization]</span> is not
              responsible for any educational outcomes. This is a supplemental learning tool,
              not a replacement for professional instruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-bark mb-2">
              Changes to Terms
            </h2>
            <p>
              <span className="font-mono bg-bark/10 px-1 rounded">[Your Organization]</span> may
              update these terms occasionally. Continued use of Wild Reader after
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <p className="text-sm text-bark/60 pt-4 border-t border-bark/10">
            Template version: January 2026
          </p>
        </div>
      </div>
    </div>
  )
}
