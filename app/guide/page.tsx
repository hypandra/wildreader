"use client"

import Link from "next/link"
import { ArrowLeft, BookOpen, Star, Brain, Target, Sparkles, Award, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GAME_CONFIGS } from "@/lib/games"
import { MobileNav } from "@/components/MobileNav"
import type { GameType } from "@/types"

// Game skill mappings
const GAME_SKILLS: Record<GameType, { skill: string; how: string; why: string }> = {
  "letter-match": {
    skill: "Letter Recognition (Uppercase ↔ Lowercase)",
    how: "Child sees an uppercase letter and must find the matching lowercase letter from 4 options.",
    why: "Understanding that A and a are the same letter is fundamental to reading. This game builds that connection."
  },
  "letter-hunt": {
    skill: "Visual Discrimination & Letter Recognition",
    how: "Child taps all instances of a specific letter (e.g., all the 'b's) in a grid of mixed letters.",
    why: "Develops the ability to quickly identify and distinguish between similar-looking letters, essential for fluent reading."
  },
  "letter-to-picture": {
    skill: "Phonics (Letter → Sound → Word)",
    how: "Child sees a letter and must find a picture of something that starts with that letter sound.",
    why: "Connects letters to their sounds and to real words. This is the foundation of phonemic awareness."
  },
  "picture-to-letter": {
    skill: "Phonics (Word → Sound → Letter)",
    how: "Child sees a picture (e.g., apple) and must find the letter it starts with.",
    why: "Reverses the letter-to-picture skill, strengthening the sound-letter connection from both directions."
  },
  "starts-with": {
    skill: "Initial Sound Recognition (Phonological Awareness)",
    how: "Child sees a target word and must find other words that start with the same sound.",
    why: "Helps children hear and identify beginning sounds in words, a critical pre-reading skill."
  },
  "ends-with": {
    skill: "Ending Sound Recognition (Phonological Awareness)",
    how: "Child sees a target word and must find other words that end with the same sound.",
    why: "Develops awareness of ending sounds, preparing children for rhyming and word families."
  },
  "word-match": {
    skill: "Word Recognition & Sight Vocabulary",
    how: "Child sees a written word and must find the matching picture.",
    why: "Builds the connection between written words and their meanings, developing sight word recognition."
  },
  "picture-match": {
    skill: "Word Recognition & Decoding",
    how: "Child sees a picture and must find the correct written word from options.",
    why: "Strengthens word-to-meaning connections and helps children practice reading words independently."
  },
  "face-match": {
    skill: "Name & Face Recognition",
    how: "Child sees a photo of someone they know and must select their name from options.",
    why: "Builds connections between faces and names of important people, supporting social recognition and reading of familiar names."
  },
  "name-to-face": {
    skill: "Name & Face Recognition (Reverse)",
    how: "Child sees a name and must find the matching face from photo options.",
    why: "Reverses face-match to strengthen name-to-face connections. Practices reading names and matching them to known people."
  },
  "todays-sound": {
    skill: "Daily Phonics Practice & Word Generation",
    how: "Child and parent brainstorm words that start with today's letter or digraph (A-Z for days 1-26, then th/sh/ch/ph for days 27-31).",
    why: "Encourages active word retrieval and expands vocabulary. Working with a parent makes it social and supports oral language development."
  },
  "freeplay-canvas": {
    skill: "Creative Expression & Motor Skills",
    how: "Open-ended drawing canvas where children freely create art using colors and brush tools.",
    why: "Provides a creative break from structured learning while developing fine motor control and self-expression."
  },
  "sight-word-splatter": {
    skill: "Sight Word Recognition & Reading Fluency",
    how: "Child hears a word spoken aloud and must click the matching word button to make it 'splat' with a colorful explosion. Immersive full-screen experience with 4-10 word options based on difficulty.",
    why: "Builds rapid word recognition essential for fluent reading. The dramatic visual feedback makes correct answers highly rewarding, while audio reinforcement on mistakes supports learning without frustration."
  }
}

function GameGuideCard({ gameType }: { gameType: GameType }) {
  const config = GAME_CONFIGS[gameType]
  const skills = GAME_SKILLS[gameType]
  const isDev = process.env.NODE_ENV === 'development'

  const cardContent = (
    <div className={`bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border shadow-soft p-6 animate-pop-in ${isDev ? 'hover:border-coral hover:shadow-lg transition-all duration-200 cursor-pointer' : ''}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
        <div className="text-5xl">{config.emoji}</div>
        <div>
          <h3 className="text-2xl font-display font-bold text-bark">{config.name}</h3>
          <p className="text-sm text-muted-foreground font-medium">{skills.skill}</p>
        </div>
      </div>

      {/* How to Play */}
      <div className="mb-4">
        <h4 className="text-sm font-display font-bold text-coral mb-2 flex items-center gap-2">
          <Target className="h-4 w-4" />
          How to Play
        </h4>
        <p className="text-bark leading-relaxed">{skills.how}</p>
      </div>

      {/* Why It Matters */}
      <div className={isDev ? "mb-4" : ""}>
        <h4 className="text-sm font-display font-bold text-lavender mb-2 flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Why It Matters
        </h4>
        <p className="text-bark leading-relaxed">{skills.why}</p>
      </div>

      {/* View Details Link - Dev Only */}
      {isDev && (
        <div className="text-sm text-coral font-semibold hover:text-coral/80 transition-colors">
          View full details →
        </div>
      )}
    </div>
  )

  // Only wrap in Link if in development
  if (isDev) {
    return <Link href={`/guide/${gameType}`}>{cardContent}</Link>
  }

  return cardContent
}

export default function GuidePage() {
  return (
    <div className="min-h-screen relative">
      {/* Mobile navigation bar */}
      <MobileNav />

      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] right-[5%] text-3xl animate-float-slow opacity-30">📚</div>
        <div className="absolute bottom-[20%] left-[3%] text-2xl animate-twinkle delay-400 opacity-25">✨</div>
        <div className="absolute top-[50%] right-[8%] text-xl animate-bounce-soft opacity-20">🌟</div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 pt-16 sm:pt-8">
        {/* Header */}
        <header className="mb-8 animate-slide-up">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/settings">
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-2xl hover:bg-coral/10 hover:text-coral transition-all duration-200"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <BookOpen className="h-10 w-10 text-coral" />
              <h1 className="text-4xl md:text-5xl font-display font-bold text-bark">
                Parent Guide
              </h1>
            </div>
          </div>
          <p className="text-xl text-muted-foreground font-medium ml-16">
            Everything you need to know about Wild Reader
          </p>
        </header>

        {/* Overview Section */}
        <section className="mb-12 animate-pop-in">
          <div className="bg-gradient-to-r from-sunshine/10 via-coral/5 to-lavender/10 rounded-3xl border-2 border-border shadow-soft p-8">
            <h2 className="text-3xl font-display font-bold text-bark mb-4 flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-sunshine" />
              What is Wild Reader?
            </h2>
            <div className="space-y-4 text-lg text-bark leading-relaxed">
              <p>
                Wild Reader is a literacy learning app designed for children ages <strong>3-4 years old</strong>.
                It uses game-based learning to teach foundational reading skills through eight different activities
                that focus on letter recognition, phonics, and early word reading.
              </p>
              <p>
                The app is built on <strong>Science of Reading</strong> principles, which emphasize systematic phonics
                instruction and the development of phonological awareness—the ability to hear and manipulate sounds in words.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-display font-bold text-bark mb-6 flex items-center gap-3">
            <Award className="h-8 w-8 text-lavender" />
            How the Reward System Works
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Streak System */}
            <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border shadow-soft p-6">
              <div className="flex items-center gap-3 mb-4">
                <Star className="h-8 w-8 text-sunshine fill-sunshine" />
                <h3 className="text-2xl font-display font-bold text-bark">3-Streak Reward</h3>
              </div>
              <p className="text-bark leading-relaxed mb-4">
                When your child answers <strong>3 questions correctly in a row</strong>, they earn a special reward:
                they get to create their own AI-generated picture!
              </p>
              <p className="text-bark leading-relaxed">
                Your child can describe what they want to see, and the app
                generates a unique image for them. This provides immediate, exciting feedback and encourages persistence.
              </p>
            </div>

            {/* Mastery Tracking */}
            <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border shadow-soft p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="h-8 w-8 text-sage" />
                <h3 className="text-2xl font-display font-bold text-bark">Smart Practice</h3>
              </div>
              <p className="text-bark leading-relaxed mb-4">
                Wild Reader uses <strong>adaptive mastery tracking</strong> to personalize practice. The app tracks
                which letters and words your child struggles with and shows them more frequently.
              </p>
              <p className="text-bark leading-relaxed">
                As your child masters specific letters or words, they appear less often, making room for new challenges.
                This ensures practice time is focused on what your child needs most.
              </p>
            </div>
          </div>
        </section>

        {/* Games Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-display font-bold text-bark mb-6 flex items-center gap-3">
            <Brain className="h-8 w-8 text-coral" />
            The Learning Games
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {Object.keys(GAME_CONFIGS).map((gameType, index) => (
              <div
                key={gameType}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <GameGuideCard gameType={gameType as GameType} />
              </div>
            ))}
          </div>
        </section>

        {/* Best Practices Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-display font-bold text-bark mb-6">
            Best Practices for Parents
          </h2>

          <div className="bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-border shadow-soft p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-display font-bold text-coral mb-2">
                  ⏰ Recommended Play Time
                </h3>
                <p className="text-bark leading-relaxed">
                  <strong>10-15 minutes per session, 3-5 times per week.</strong> Short, frequent practice is more
                  effective than long sessions. Watch for signs of fatigue or frustration and take breaks as needed.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-coral mb-2">
                  👥 Play Together
                </h3>
                <p className="text-bark leading-relaxed">
                  Sit with your child during play sessions, especially at first. Celebrate correct answers, and when
                  they make mistakes, encourage them to try again without pressure. Your presence makes learning social and fun.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-coral mb-2">
                  🎯 Focus on Progress, Not Perfection
                </h3>
                <p className="text-bark leading-relaxed">
                  Every child learns at their own pace. The mastery system ensures your child practices what they need.
                  Trust the process and celebrate small wins—recognizing one new letter is progress!
                </p>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-coral mb-2">
                  📚 Connect to Books
                </h3>
                <p className="text-bark leading-relaxed">
                  Use Wild Reader alongside regular read-aloud time. Point out letters and words your child is practicing
                  when reading together. This helps them see the connection between the app and real reading.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-coral mb-2">
                  ⭐ Check the Vocabulary Log
                </h3>
                <p className="text-bark leading-relaxed">
                  Visit the Vocabulary & Rewards page to see all the words your child has practiced. This helps you
                  understand what they&apos;re learning and gives you ideas for real-world reinforcement.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Science of Reading Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-display font-bold text-bark mb-6">
            The Science of Reading
          </h2>

          <div className="bg-gradient-to-r from-lavender/10 via-sage/5 to-sky/10 rounded-3xl border-2 border-border shadow-soft p-8">
            <p className="text-lg text-bark leading-relaxed mb-4">
              Wild Reader is grounded in <strong>evidence-based reading instruction</strong>, specifically the Science of Reading.
              This approach is supported by decades of research showing that reading is <em>not</em> a natural process—it must be
              explicitly taught through systematic phonics and phonological awareness training.
            </p>

            <h3 className="text-xl font-display font-bold text-bark mb-3 mt-6">
              Key Principles We Follow:
            </h3>

            <ul className="space-y-3 text-bark">
              <li className="flex gap-3">
                <span className="text-coral font-bold">•</span>
                <div>
                  <strong>Phonological Awareness:</strong> Children must learn to hear and manipulate individual sounds
                  in words before they can read. Games like &quot;Starts With&quot; and &quot;Ends With&quot; build this skill.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-coral font-bold">•</span>
                <div>
                  <strong>Systematic Phonics:</strong> Explicitly teaching letter-sound relationships is essential.
                  Games like &quot;Letter to Picture&quot; and &quot;Picture to Letter&quot; make these connections concrete.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-coral font-bold">•</span>
                <div>
                  <strong>Visual Discrimination:</strong> Children need to distinguish between similar letters (b/d, p/q).
                  &quot;Letter Hunt&quot; develops this critical skill.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-coral font-bold">•</span>
                <div>
                  <strong>Orthographic Mapping:</strong> The brain must connect letters to sounds to meanings.
                  &quot;Word Match&quot; and &quot;Picture Match&quot; strengthen these neural pathways.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-coral font-bold">•</span>
                <div>
                  <strong>Spaced Repetition:</strong> Reviewing material at increasing intervals strengthens long-term memory.
                  Our mastery system automatically spaces practice for optimal retention.
                </div>
              </li>
            </ul>

            <p className="text-lg text-bark leading-relaxed mt-6">
              By combining these research-backed principles with engaging gameplay and immediate rewards, Wild Reader
              makes proven literacy instruction accessible, fun, and effective for young learners.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-display font-bold text-bark mb-6">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <details className="bg-card/80 backdrop-blur-sm rounded-2xl border-2 border-border shadow-soft p-6 cursor-pointer">
              <summary className="text-xl font-display font-bold text-bark cursor-pointer">
                What age is Wild Reader best for?
              </summary>
              <p className="mt-3 text-bark leading-relaxed">
                Wild Reader is designed for children ages <strong>3-4 years old</strong> who are beginning to show
                interest in letters and reading. Some advanced 2.5-year-olds or emerging 5-year-olds may also benefit.
              </p>
            </details>

            <details className="bg-card/80 backdrop-blur-sm rounded-2xl border-2 border-border shadow-soft p-6 cursor-pointer">
              <summary className="text-xl font-display font-bold text-bark cursor-pointer">
                How long until I see progress?
              </summary>
              <p className="mt-3 text-bark leading-relaxed">
                Most children show noticeable improvement in letter recognition within <strong>2-3 weeks</strong> of
                regular use (3-5 sessions per week). Phonics skills develop more gradually over months of consistent practice.
              </p>
            </details>

            <details className="bg-card/80 backdrop-blur-sm rounded-2xl border-2 border-border shadow-soft p-6 cursor-pointer">
              <summary className="text-xl font-display font-bold text-bark cursor-pointer">
                Can I use this as my only reading instruction?
              </summary>
              <p className="mt-3 text-bark leading-relaxed">
                Wild Reader is a <strong>supplement</strong> to—not a replacement for—rich literacy experiences. Continue
                reading aloud daily, talking with your child, singing songs, and playing with letters. The app reinforces
                and accelerates skills you&apos;re already building together.
              </p>
            </details>

            <details className="bg-card/80 backdrop-blur-sm rounded-2xl border-2 border-border shadow-soft p-6 cursor-pointer">
              <summary className="text-xl font-display font-bold text-bark cursor-pointer">
                What if my child keeps getting questions wrong?
              </summary>
              <p className="mt-3 text-bark leading-relaxed">
                This is normal! The app intentionally includes challenging content. If your child struggles, sit with them
                and model the thinking process out loud. The mastery system will adapt and show easier questions more frequently.
                Mistakes are part of learning.
              </p>
            </details>

            <details className="bg-card/80 backdrop-blur-sm rounded-2xl border-2 border-border shadow-soft p-6 cursor-pointer">
              <summary className="text-xl font-display font-bold text-bark cursor-pointer">
                How does the AI image generation work?
              </summary>
              <p className="mt-3 text-bark leading-relaxed">
                When your child earns a reward, they can describe a picture. The app sends this description to an AI
                model (Google Gemini) which generates a unique image. Images are saved to your
                child&apos;s Rewards log for later viewing.
              </p>
            </details>

            <details className="bg-card/80 backdrop-blur-sm rounded-2xl border-2 border-border shadow-soft p-6 cursor-pointer">
              <summary className="text-xl font-display font-bold text-bark cursor-pointer">
                Is my child&apos;s data private and secure?
              </summary>
              <p className="mt-3 text-bark leading-relaxed">
                Wild Reader is currently in development. Data is stored in a Supabase PostgreSQL database with basic security.
                AI-generated images are stored on BunnyCDN and are accessible via their URLs. API keys are stored in the database.
                We do not currently sell or share data, but <strong>this is not a production-ready app</strong> and should not be used
                with sensitive information. Row-level security, data encryption, and profile deletion features are planned for future releases.
              </p>
            </details>
          </div>
        </section>

        {/* Footer CTA */}
        <footer className="text-center animate-slide-up delay-300">
          <Link href="/settings">
            <Button className="h-14 px-8 text-lg font-display font-bold rounded-2xl bg-gradient-to-r from-coral to-rose-500 text-white shadow-md hover:shadow-lg transition-all duration-200">
              Back to Settings
            </Button>
          </Link>
        </footer>
      </div>
    </div>
  )
}
