import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service | Wild Reader",
  description: "Terms of service for Wild Reader",
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
          <section>
            <h2 className="text-xl font-display font-bold text-bark mb-2">
              For Parents and Guardians
            </h2>
            <p>
              Wild Reader is designed for children ages 3-5 to use with parental supervision.
              By creating an account, you confirm that you are a parent or legal guardian
              and consent to your child&apos;s use of this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-bark mb-2">
              Data We Collect
            </h2>
            <p>
              We collect your email address for account purposes and store a username
              you choose for your child along with their learning progress. We do not
              sell or share personal information with third parties. All data is stored securely.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-bark mb-2">
              AI-Generated Images
            </h2>
            <p>
              Wild Reader uses AI to generate reward images based on your child&apos;s interests.
              These images are created automatically and, while we strive for appropriate content,
              we recommend parental review. Images are stored on your account and can be deleted
              at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-bark mb-2">
              No Warranty
            </h2>
            <p>
              Wild Reader is provided &quot;as is&quot; without warranties of any kind. We are not
              responsible for any educational outcomes. This is a supplemental learning tool,
              not a replacement for professional instruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-bold text-bark mb-2">
              Changes to Terms
            </h2>
            <p>
              We may update these terms occasionally. Continued use of Wild Reader after
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <p className="text-sm text-bark/60 pt-4 border-t border-bark/10">
            Last updated: January 2026
          </p>
        </div>
      </div>
    </div>
  )
}
