"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Settings, Sparkles, BookOpen, LogIn } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GameCard } from "@/components/GameCard";
import { GAME_CONFIGS } from "@/lib/games";
import { useSession } from "@/lib/auth-client";
import { useChild } from "@/lib/contexts/ChildContext";
import { LearnerSelector } from "@/components/LearnerSelector";
import { MobileNav } from "@/components/MobileNav";
import { LandingDemo } from "@/components/LandingDemo";

// Floating decorative elements
function FloatingDecorations() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Floating stars */}
      <div className="absolute top-[10%] left-[5%] text-4xl animate-float opacity-60">
        ⭐
      </div>
      <div className="absolute top-[15%] right-[8%] text-3xl animate-float-slow delay-300 opacity-50">
        ✨
      </div>
      <div className="absolute top-[60%] left-[3%] text-2xl animate-twinkle delay-500 opacity-40">
        🌟
      </div>
      <div className="absolute bottom-[20%] right-[5%] text-3xl animate-float delay-700 opacity-50">
        ⭐
      </div>

      {/* Floating clouds */}
      <div className="absolute top-[8%] left-[20%] text-5xl animate-float-slow opacity-30">
        ☁️
      </div>
      <div className="absolute top-[5%] right-[25%] text-4xl animate-float-slow delay-400 opacity-25">
        ☁️
      </div>

      {/* Nature elements */}
      <div className="absolute bottom-[15%] left-[10%] text-3xl animate-wiggle opacity-40">
        🌿
      </div>
      <div className="absolute bottom-[25%] right-[12%] text-2xl animate-wiggle delay-200 opacity-35">
        🍃
      </div>

      {/* Decorative shapes - using CSS */}
      <div className="absolute top-[30%] right-[3%] w-8 h-8 bg-coral/20 rounded-full animate-bounce-soft" />
      <div className="absolute bottom-[40%] left-[2%] w-6 h-6 bg-sage/20 rounded-full animate-bounce-soft delay-300" />
      <div className="absolute top-[70%] right-[8%] w-5 h-5 bg-sunshine/30 rounded-full animate-bounce-soft delay-600" />
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { data: authSession, isPending } = useSession();
  const { activeChildId, loadChildren, session: gameSession } = useChild();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      if (isPending) return;

      // If not logged in, show landing page (don't redirect)
      if (!authSession?.user) {
        setLoading(false);
        return;
      }

      await loadChildren();

      if (!activeChildId) {
        router.push("/select-child");
        return;
      }

      setLoading(false);
    }

    init();
  }, [authSession, activeChildId, isPending, router, loadChildren]);

  if (loading || isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce-soft mb-4">📚</div>
          <p className="text-2xl font-display text-bark">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!authSession?.user) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <FloatingDecorations />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
          {/* Header with Sign In button */}
          <header className="flex items-center justify-between mb-6">
            <div className="animate-slide-up">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="h-10 w-10 text-coral" />
                <h1 className="text-5xl md:text-6xl font-display font-bold text-gradient">
                  Wild Reader
                </h1>
              </div>
              <p className="text-xl text-muted-foreground font-medium ml-1">
                A magical reading adventure awaits!
              </p>
            </div>

            <div className="animate-slide-up delay-200">
              <Link href="/login">
                <Button className="h-14 px-6 rounded-2xl font-display font-bold text-lg bg-gradient-to-r from-coral to-rose-400 text-white hover:from-rose-400 hover:to-coral shadow-tactile hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In
                </Button>
              </Link>
            </div>
          </header>

          {/* Interactive Demo */}
          <LandingDemo />

          {/* CTA Section */}
          <div className="text-center mt-4 animate-pop-in delay-200">
            <Link href="/login">
              <Button className="h-16 px-10 rounded-2xl font-display font-bold text-xl bg-gradient-to-r from-sunshine to-amber-400 text-bark hover:from-amber-400 hover:to-sunshine shadow-tactile hover:shadow-lg transition-all duration-300 hover:scale-105">
                Get Started
              </Button>
            </Link>
            <p className="mt-4 text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-coral hover:underline font-semibold"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <FloatingDecorations />

      {/* Mobile navigation bar */}
      <MobileNav />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 pt-16 sm:pt-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="animate-slide-up">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="h-10 w-10 text-coral" />
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-gradient">
                Wild Reader
              </h1>
            </div>
            <p className="text-base sm:text-xl text-muted-foreground font-medium ml-1">
              A magical reading adventure awaits!
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-4 animate-slide-up delay-200">
            <LearnerSelector />
            {/* Star counter */}
            <div className="flex items-center gap-3 bg-card/80 backdrop-blur-sm px-5 py-3 rounded-2xl shadow-soft border-2 border-sunshine/30">
              <div className="relative">
                <Star className="h-8 w-8 fill-sunshine text-sunshine animate-pulse-glow" />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-sunshine animate-twinkle" />
              </div>
              <span className="text-3xl font-display font-bold text-bark">
                {gameSession.totalStars}
              </span>
            </div>

            {/* Settings button */}
            <Link href="/settings">
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-2xl border-2 border-muted hover:border-coral hover:bg-coral/10 transition-all duration-300 hover:scale-105"
              >
                <Settings className="h-6 w-6 text-muted-foreground" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Games Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
          {Object.values(GAME_CONFIGS).map((config, index) => (
            <div
              key={config.slug}
              className="animate-pop-in opacity-0"
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <GameCard gameType={config.slug} />
            </div>
          ))}
        </div>

        {/* Footer encouragement */}
        <footer className="mt-16 text-center animate-slide-up delay-700">
          <p className="text-lg text-muted-foreground font-medium">
            Pick a game and let&apos;s learn together! 📚
          </p>
        </footer>
      </div>
    </div>
  );
}
