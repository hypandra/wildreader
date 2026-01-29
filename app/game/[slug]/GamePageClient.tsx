"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { GameHeader } from "@/components/GameHeader"
import { RewardDialog } from "@/components/RewardDialog"
import { LetterHuntGame } from "@/components/games/LetterHuntGame"
import { LetterMatchGame } from "@/components/games/LetterMatchGame"
import { FaceMatchGame } from "@/components/games/FaceMatchGame"
import { NameToFaceGame } from "@/components/games/NameToFaceGame"
import { WordMatchGame } from "@/components/games/WordMatchGame"
import { PictureMatchGame } from "@/components/games/PictureMatchGame"
import { LetterToPictureGame } from "@/components/games/LetterToPictureGame"
import { PictureToLetterGame } from "@/components/games/PictureToLetterGame"
import { StartsWithGame } from "@/components/games/StartsWithGame"
import { EndsWithGame } from "@/components/games/EndsWithGame"
import { TodaysSoundGame } from "@/components/games/TodaysSoundGame"
import { SightWordSplatterGame } from "@/components/games/SightWordSplatterGame"
import FreeplayCanvas from "@/components/games/FreeplayCanvas"
import { useSession } from "@/lib/auth-client"
import { useChild } from "@/lib/contexts/ChildContext"
import { GAME_CONFIGS } from "@/lib/games"
import { getVocabularyWithMastery } from "@/lib/db/vocabulary"
import { getLettersWithMastery } from "@/lib/db/letters"
import { getPeopleWithMastery } from "@/lib/db/people"
import { updateMastery as updateDbMastery } from "@/lib/db/mastery"
import { updateMastery } from "@/lib/mastery"
import { setGameData, setPeopleData } from "@/lib/game-data"
import { useGameSession } from "@/lib/hooks/useGameSession"
import type { VocabularyItem, Letter, Person, GameType, Difficulty } from "@/types"

// Floating decorations for game page
function GameDecorations() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute top-[15%] left-[3%] text-2xl animate-float opacity-40">
        ✨
      </div>
      <div className="absolute top-[25%] right-[5%] text-xl animate-twinkle delay-200 opacity-30">
        ⭐
      </div>
      <div className="absolute bottom-[30%] left-[5%] text-lg animate-float-slow delay-400 opacity-25">
        🌟
      </div>
      <div className="absolute top-[60%] right-[3%] text-xl animate-bounce-soft opacity-30">
        💫
      </div>
    </div>
  )
}

type GameItemType = "letter" | "vocabulary" | "person"

type GamePageClientProps = {
  gameType: GameType
}

export function GamePageClient({ gameType }: GamePageClientProps) {
  const router = useRouter()
  const config = GAME_CONFIGS[gameType]

  const { data: authSession, isPending } = useSession()
  const { activeChildId, session, updateSession } = useChild()

  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([])
  const [letters, setLetters] = useState<Letter[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isPending) return

    if (!authSession?.user || !activeChildId) {
      router.push("/")
      return
    }

    async function loadData() {
      if (!activeChildId) return

      try {
        const [vocab, ltrs, ppl] = await Promise.all([
          getVocabularyWithMastery(activeChildId),
          getLettersWithMastery(activeChildId),
          (gameType === "face-match" || gameType === "name-to-face") ? getPeopleWithMastery(activeChildId) : Promise.resolve([]),
        ])

        setVocabulary(vocab)
        setLetters(ltrs)
        setPeople(ppl)
        setGameData(vocab, ltrs)
        setPeopleData(ppl)
        setLoading(false)
      } catch (error) {
        console.error("Failed to load game data:", error)
        setLoading(false)
      }
    }

    loadData()
  }, [activeChildId, authSession?.user, gameType, isPending, router])

  useEffect(() => {
    if (loading) return

    if (session.currentGame !== gameType) {
      updateSession({ currentGame: gameType, streak: 0 })
    }
  }, [gameType, loading, session.currentGame, updateSession])

  const updateMasteryForItem = (itemId: string, itemType: GameItemType, isCorrect: boolean) => {
    if (!activeChildId) return

    if (itemType === "letter") {
      const letter = letters.find((item) => item.id === itemId)
      if (!letter) return

      updateDbMastery(
        activeChildId,
        "letter",
        letter.id,
        gameType,
        isCorrect
      ).catch(console.error)

      const updatedLetters = letters.map((item) =>
        item.id === letter.id
          ? { ...item, mastery: { ...item.mastery, [gameType]: updateMastery(item.mastery[gameType], isCorrect) } }
          : item
      )
      setLetters(updatedLetters)
      return
    }

    if (itemType === "person") {
      const person = people.find((item) => item.id === itemId)
      if (!person) return

      updateDbMastery(
        activeChildId,
        "person",
        person.id,
        gameType,
        isCorrect
      ).catch(console.error)

      const updatedPeople = people.map((item) =>
        item.id === person.id
          ? { ...item, mastery: { ...item.mastery, [gameType]: updateMastery(item.mastery[gameType], isCorrect) } }
          : item
      )
      setPeople(updatedPeople)
      setPeopleData(updatedPeople)
      return
    }

    const vocabItem = vocabulary.find((item) => item.id === itemId)
    if (!vocabItem) return

    updateDbMastery(
      activeChildId,
      "vocabulary",
      vocabItem.id,
      gameType,
      isCorrect
    ).catch(console.error)

    const updatedVocabulary = vocabulary.map((item) =>
      item.id === vocabItem.id
        ? { ...item, mastery: { ...item.mastery, [gameType]: updateMastery(item.mastery[gameType], isCorrect) } }
        : item
    )
    setVocabulary(updatedVocabulary)
  }

  const handleCorrect = (itemId: string, itemType: GameItemType) => {
    updateMasteryForItem(itemId, itemType, true)
  }

  const handleWrong = (itemId: string, itemType: GameItemType) => {
    updateMasteryForItem(itemId, itemType, false)
  }

  const {
    streak,
    totalStars,
    pendingReward,
    rewardStreak,
    showRewardDialog,
    setShowRewardDialog,
    handleCorrectAnswer,
    handleWrongAnswer,
    handleRewardComplete,
    handleRewardDismiss,
    handleRecoverReward,
  } = useGameSession({
    session,
    updateSession,
    onAdvance: () => {},
    streakTarget: gameType === "sight-word-splatter" ? 5 : 3,
    disableRewards: gameType === "sight-word-splatter" || gameType === "freeplay-canvas",
  })

  const savedDifficulty = session.difficultyByGame?.[gameType] ?? "easy"

  const handleDifficultyChange = (level: Difficulty) => {
    updateSession({
      difficultyByGame: {
        ...(session.difficultyByGame ?? {}),
        [gameType]: level,
      },
    })
  }

  const handleGameComplete = (wasCorrect: boolean, hadMistakes: boolean) => {
    if (wasCorrect && !hadMistakes) {
      handleCorrectAnswer()
    } else {
      handleWrongAnswer()
    }
  }

  const difficultyLevels = ["easy", "medium", "hard", "expert"] as Difficulty[]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce-soft mb-4">📚</div>
          <p className="text-2xl font-display text-bark">Loading game...</p>
        </div>
      </div>
    )
  }

  const mainClassName = gameType === "sight-word-splatter" || gameType === "freeplay-canvas"
    ? "relative z-10 w-full px-0 py-0"
    : "relative z-10 max-w-4xl mx-auto px-4 py-4"

  return (
    <div className="min-h-screen relative">
      <GameDecorations />
      <GameHeader
        streak={streak}
        totalStars={totalStars}
        gameName={config.name}
        pendingReward={pendingReward}
        onRecoverReward={handleRecoverReward}
        difficulty={gameType === "sight-word-splatter" ? savedDifficulty : undefined}
        difficultyLevels={gameType === "sight-word-splatter" ? difficultyLevels : undefined}
        onDifficultyChange={gameType === "sight-word-splatter" ? handleDifficultyChange : undefined}
      />

      <main className={mainClassName}>
        {gameType === "letter-hunt" && (
          <LetterHuntGame
            vocabulary={vocabulary}
            letters={letters}
            initialDifficulty={savedDifficulty}
            onDifficultyChange={handleDifficultyChange}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            onComplete={handleGameComplete}
            rewardDialogOpen={showRewardDialog}
          />
        )}
        {gameType === "letter-match" && (
          <LetterMatchGame
            letters={letters}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            onComplete={handleGameComplete}
            rewardDialogOpen={showRewardDialog}
          />
        )}
        {gameType === "face-match" && (
          <FaceMatchGame
            people={people}
            initialDifficulty={savedDifficulty}
            onDifficultyChange={handleDifficultyChange}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            onComplete={handleGameComplete}
            rewardDialogOpen={showRewardDialog}
          />
        )}
        {gameType === "name-to-face" && (
          <NameToFaceGame
            people={people}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            onComplete={handleGameComplete}
            rewardDialogOpen={showRewardDialog}
          />
        )}
        {gameType === "word-match" && (
          <WordMatchGame
            vocabulary={vocabulary}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            onComplete={handleGameComplete}
            rewardDialogOpen={showRewardDialog}
          />
        )}
        {gameType === "picture-match" && (
          <PictureMatchGame
            vocabulary={vocabulary}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            onComplete={handleGameComplete}
            rewardDialogOpen={showRewardDialog}
          />
        )}
        {gameType === "letter-to-picture" && (
          <LetterToPictureGame
            vocabulary={vocabulary}
            letters={letters}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            onComplete={handleGameComplete}
            rewardDialogOpen={showRewardDialog}
          />
        )}
        {gameType === "picture-to-letter" && (
          <PictureToLetterGame
            vocabulary={vocabulary}
            letters={letters}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            onComplete={handleGameComplete}
            rewardDialogOpen={showRewardDialog}
          />
        )}
        {gameType === "starts-with" && (
          <StartsWithGame
            vocabulary={vocabulary}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            onComplete={handleGameComplete}
            rewardDialogOpen={showRewardDialog}
          />
        )}
        {gameType === "ends-with" && (
          <EndsWithGame
            vocabulary={vocabulary}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            onComplete={handleGameComplete}
            rewardDialogOpen={showRewardDialog}
          />
        )}
        {gameType === "todays-sound" && activeChildId && (
          <TodaysSoundGame childId={activeChildId} />
        )}
        {gameType === "sight-word-splatter" && (
          <SightWordSplatterGame
            vocabulary={vocabulary}
            initialDifficulty={savedDifficulty}
            onDifficultyChange={handleDifficultyChange}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
            onComplete={handleGameComplete}
            rewardDialogOpen={showRewardDialog}
          />
        )}
        {gameType === "freeplay-canvas" && <FreeplayCanvas />}
      </main>

      {authSession?.user && activeChildId && gameType !== "sight-word-splatter" && gameType !== "freeplay-canvas" && (
        <RewardDialog
          open={showRewardDialog}
          onOpenChange={setShowRewardDialog}
          onComplete={handleRewardComplete}
          onDismiss={handleRewardDismiss}
          gameType={gameType}
          streak={rewardStreak}
          childId={activeChildId}
          initialImageUrl={pendingReward?.imageUrl}
        />
      )}
    </div>
  )
}
