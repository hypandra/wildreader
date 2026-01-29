"use client"

import { useCallback, useEffect, useState } from "react"
import { AudioButton } from "@/components/AudioButton"
import { getTodaysLetterOrDigraph, wordStartsWithTodaysLetter } from "@/lib/games"
import {
  saveTodaysSoundAttempt,
  getPreviousAttempts,
  type TodaysSoundAttempt,
  type PreviousAttempts,
} from "@/lib/db/todays-sound"
import { getTodaysSoundWordList, type TodaysSoundWord } from "@/data/todays-sound-words"
import { cn } from "@/lib/utils"

type Phase = "intro" | "brainstorm" | "results"

type TodaysSoundGameProps = {
  childId: string
}

export function TodaysSoundGame({
  childId,
}: TodaysSoundGameProps) {
  const [phase, setPhase] = useState<Phase>("intro")
  const [wordsEntered, setWordsEntered] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("")
  const [inputError, setInputError] = useState<string | null>(null)
  const [previousAttempts, setPreviousAttempts] = useState<PreviousAttempts>({})
  const [savedAttempt, setSavedAttempt] = useState<TodaysSoundAttempt | null>(null)
  const [loading, setLoading] = useState(false)

  const todaysLetter = getTodaysLetterOrDigraph()

  // Get pre-generated word list for today's letter/digraph
  const todaysWordList = getTodaysSoundWordList(todaysLetter.filter)

  // Load previous attempts on mount
  useEffect(() => {
    async function loadPrevious() {
      try {
        const previous = await getPreviousAttempts(childId, todaysLetter.filter)
        setPreviousAttempts(previous)
      } catch (error) {
        console.error("Failed to load previous attempts:", error)
      }
    }
    loadPrevious()
  }, [childId, todaysLetter.filter])

  const handleAddWord = useCallback(() => {
    const word = inputValue.trim().toLowerCase()

    if (!word) {
      setInputError(null)
      return
    }

    if (!wordStartsWithTodaysLetter(word)) {
      setInputError(`"${word}" doesn't start with ${todaysLetter.display}`)
      return
    }

    if (wordsEntered.includes(word)) {
      setInputError(`You already added "${word}"`)
      return
    }

    setWordsEntered([...wordsEntered, word])
    setInputValue("")
    setInputError(null)
  }, [inputValue, wordsEntered, todaysLetter.display])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddWord()
    }
  }

  const handleRemoveWord = (word: string) => {
    setWordsEntered(wordsEntered.filter((w) => w !== word))
  }

  const handleFinish = async () => {
    setLoading(true)

    // Find which entered words match our pre-generated word list
    const matchedWords = wordsEntered.filter((word) =>
      todaysWordList.some((w) => w.word.toLowerCase() === word)
    )

    try {
      const attempt = await saveTodaysSoundAttempt(
        childId,
        todaysLetter.filter,
        wordsEntered,
        matchedWords,
        todaysWordList.length
      )
      setSavedAttempt(attempt)
      setPhase("results")
    } catch (error) {
      console.error("Failed to save attempt:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTryAgain = () => {
    setWordsEntered([])
    setInputValue("")
    setInputError(null)
    setSavedAttempt(null)
    setPhase("brainstorm")
  }

  // Get words the user hasn't found yet
  const getMissedWords = (): TodaysSoundWord[] => {
    if (!savedAttempt) return todaysWordList
    return todaysWordList.filter(
      (w) => !savedAttempt.matchedVocabulary.includes(w.word.toLowerCase())
    )
  }

  // Get word items for matched words
  const getMatchedWords = (): TodaysSoundWord[] => {
    if (!savedAttempt) return []
    return todaysWordList.filter((w) =>
      savedAttempt.matchedVocabulary.includes(w.word.toLowerCase())
    )
  }

  if (phase === "intro") {
    return (
      <div className="text-center animate-pop-in">
        <div className="mb-6">
          <div className="inline-block bg-gradient-to-br from-sunshine/20 to-coral/20 rounded-3xl px-8 py-6 shadow-soft-lg border-2 border-sunshine/30">
            <div className="text-6xl md:text-8xl font-display text-bark mb-2">
              {todaysLetter.display}
            </div>
            <p className="text-lg text-muted-foreground">Today&apos;s Sound</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xl md:text-2xl font-display text-bark">
            How many words can you think of that start with{" "}
            <span className="text-coral">{todaysLetter.display}</span>?
          </p>
        </div>

        <div className="bg-sky/10 rounded-2xl p-4 mb-6 max-w-md mx-auto">
          <p className="text-sm text-sky-700">
            This is a fun activity to do with a parent or sibling! Take turns
            thinking of words together.
          </p>
        </div>

        <button
          onClick={() => setPhase("brainstorm")}
          className="bg-gradient-to-br from-sage to-emerald-500 text-white font-display font-bold text-xl px-8 py-4 rounded-2xl shadow-soft hover:scale-105 transition-transform"
        >
          Start Brainstorming!
        </button>

        {previousAttempts.best && (
          <p className="text-sm text-muted-foreground mt-4">
            Your best: {previousAttempts.best.matchedVocabulary.length} words found
          </p>
        )}
      </div>
    )
  }

  if (phase === "brainstorm") {
    return (
      <div className="animate-slide-up">
        <div className="text-center mb-6">
          <div className="inline-block bg-gradient-to-br from-sunshine/20 to-coral/20 rounded-2xl px-6 py-3 shadow-soft border-2 border-sunshine/30 mb-2">
            <span className="text-3xl font-display text-bark">
              {todaysLetter.display}
            </span>
          </div>
          <p className="text-muted-foreground">
            Type words that start with {todaysLetter.display}
          </p>
        </div>

        <div className="max-w-md mx-auto mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setInputError(null)
              }}
              onKeyDown={handleKeyDown}
              placeholder={`Type a word starting with ${todaysLetter.display}...`}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-border focus:border-sunshine focus:outline-none font-display text-lg"
              autoFocus
            />
            <button
              onClick={handleAddWord}
              className="bg-sunshine text-bark font-display font-bold px-6 py-3 rounded-xl hover:bg-sunshine/80 transition-colors"
            >
              Add
            </button>
          </div>
          {inputError && (
            <p className="text-destructive text-sm mt-2">{inputError}</p>
          )}
        </div>

        {wordsEntered.length > 0 && (
          <div className="max-w-md mx-auto mb-6">
            <p className="text-sm text-muted-foreground mb-2">
              Your words ({wordsEntered.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {wordsEntered.map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1 bg-sky/20 text-sky-700 px-3 py-1 rounded-full font-display"
                >
                  {word}
                  <button
                    onClick={() => handleRemoveWord(word)}
                    className="text-sky-500 hover:text-sky-700 ml-1"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={handleFinish}
            disabled={loading || wordsEntered.length === 0}
            className={cn(
              "font-display font-bold text-lg px-8 py-4 rounded-2xl shadow-soft transition-all",
              wordsEntered.length > 0
                ? "bg-gradient-to-br from-sage to-emerald-500 text-white hover:scale-105"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {loading ? "Saving..." : "Done! See Results"}
          </button>
        </div>
      </div>
    )
  }

  // Results phase
  const matchedItems = getMatchedWords()
  const missedItems = getMissedWords()

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">
          {matchedItems.length > 0 ? "Great job!" : "Nice try!"}
        </div>
        <p className="text-xl font-display text-bark">
          You entered <span className="font-bold text-coral">{savedAttempt?.wordsEntered.length || 0}</span> words
        </p>
        <p className="text-muted-foreground">
          {matchedItems.length} matched our vocabulary
        </p>
      </div>

      {/* Comparison with previous attempts */}
      {previousAttempts.earlierToday && (
        <div className="bg-sky/10 rounded-xl p-3 mb-4 text-center">
          <p className="text-sm text-sky-700">
            Earlier today you found {previousAttempts.earlierToday.matchedVocabulary.length} words.
            {matchedItems.length > previousAttempts.earlierToday.matchedVocabulary.length
              ? " You beat your score!"
              : matchedItems.length === previousAttempts.earlierToday.matchedVocabulary.length
              ? " You matched your score!"
              : " Keep practicing!"}
          </p>
        </div>
      )}

      {previousAttempts.lastMonth && (
        <div className="bg-sunshine/10 rounded-xl p-3 mb-4 text-center">
          <p className="text-sm text-yellow-700">
            Last month on this day you found {previousAttempts.lastMonth.matchedVocabulary.length} words.
            {matchedItems.length > previousAttempts.lastMonth.matchedVocabulary.length
              ? " Great progress!"
              : ""}
          </p>
        </div>
      )}

      {/* Words they found that match our list */}
      {matchedItems.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display font-bold text-bark mb-3">
            Words You Found ({matchedItems.length})
          </h3>
          <div className="space-y-2">
            {matchedItems.map((item) => (
              <div
                key={item.word}
                className="flex items-center justify-between bg-sage/20 rounded-xl p-3"
              >
                <span className="font-display text-bark">
                  {item.word}
                </span>
                <AudioButton text={item.word} size="sm" variant="ghost" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Words they entered that didn't match vocabulary */}
      {savedAttempt && savedAttempt.wordsEntered.length > matchedItems.length && (
        <div className="mb-6">
          <h3 className="font-display font-bold text-bark mb-3">
            Your Other Words
          </h3>
          <div className="flex flex-wrap gap-2">
            {savedAttempt.wordsEntered
              .filter(
                (word) =>
                  !savedAttempt.matchedVocabulary.includes(word)
              )
              .map((word) => (
                <span
                  key={word}
                  className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-display"
                >
                  {word}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Words they haven't found yet */}
      {missedItems.length > 0 && (
        <div className="mb-6">
          <h3 className="font-display font-bold text-bark mb-3">
            Words You Haven&apos;t Found Yet ({missedItems.length})
          </h3>
          <div className="space-y-2">
            {missedItems.map((item) => (
              <div
                key={item.word}
                className="flex items-center justify-between bg-card rounded-xl p-3 border border-border"
              >
                <span className="font-display text-bark">{item.word}</span>
                <AudioButton text={item.word} size="sm" variant="ghost" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={handleTryAgain}
          className="bg-gradient-to-br from-sky to-blue-500 text-white font-display font-bold text-lg px-8 py-4 rounded-2xl shadow-soft hover:scale-105 transition-transform"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
