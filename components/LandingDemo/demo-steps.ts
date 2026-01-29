import type { DemoStep } from "./types"

// Demo reward images - using SVG placeholders
// Can be replaced with AI-generated images later via scripts/generate-demo-images.ts
export const REWARD_IMAGES = {
  puppy: "/demo/rewards/puppy.svg",
  rainbow: "/demo/rewards/rainbow.svg",
  spaceship: "/demo/rewards/spaceship.svg",
}

export const DEMO_STEPS: DemoStep[] = [
  // Letter Match - Question
  {
    id: "letter-match-question",
    type: "letter-match",
    state: "question",
    caption: "Find the lowercase letter B",
    duration: 5000,
    data: {
      target: "B",
      options: ["a", "b", "c", "d"],
      correctIndex: 1,
    },
  },
  // Letter Match - Correct Answer
  {
    id: "letter-match-correct",
    type: "letter-match",
    state: "answer-correct",
    caption: "Great job!",
    duration: 4000,
    data: {
      target: "B",
      options: ["a", "b", "c", "d"],
      correctIndex: 1,
      selectedIndex: 1,
    },
  },
  // Word Match - Question
  {
    id: "word-match-question",
    type: "word-match",
    state: "question",
    caption: "Find the word for this picture",
    duration: 5000,
    data: {
      targetEmoji: "🐱",
      options: ["dog", "cat", "bird", "fish"],
      correctIndex: 1,
    },
  },
  // Word Match - Wrong Answer (demonstrates supportive feedback)
  {
    id: "word-match-wrong",
    type: "word-match",
    state: "answer-wrong",
    caption: "Try again!",
    duration: 2000,
    data: {
      targetEmoji: "🐱",
      options: ["dog", "cat", "bird", "fish"],
      correctIndex: 1,
      selectedIndex: 0, // Selected "dog" incorrectly
    },
  },
  // Word Match - Retry (same question, correct selection)
  {
    id: "word-match-retry",
    type: "word-match",
    state: "retry",
    caption: "Find the word for this picture",
    duration: 3000,
    data: {
      targetEmoji: "🐱",
      options: ["dog", "cat", "bird", "fish"],
      correctIndex: 1,
      selectedIndex: 1, // Now selecting correct answer
    },
  },
  // Word Match - Correct Answer
  {
    id: "word-match-correct",
    type: "word-match",
    state: "answer-correct",
    caption: "Amazing!",
    duration: 4000,
    data: {
      targetEmoji: "🐱",
      options: ["dog", "cat", "bird", "fish"],
      correctIndex: 1,
      selectedIndex: 1,
    },
  },
  // Reward - Generating
  {
    id: "reward-generating",
    type: "reward",
    state: "generating",
    caption: "Creating your picture...",
    duration: 3000,
    data: {
      rewardPrompt: "A happy puppy playing in the grass",
    },
  },
  // Reward - Result 1 (Puppy)
  {
    id: "reward-puppy",
    type: "reward",
    state: "result",
    caption: "\"A happy puppy\"",
    duration: 4000,
    data: {
      rewardImage: REWARD_IMAGES.puppy,
      rewardPrompt: "A happy puppy playing in the grass",
    },
  },
  // Reward - Result 2 (Rainbow)
  {
    id: "reward-rainbow",
    type: "reward",
    state: "result",
    caption: "\"A colorful rainbow\"",
    duration: 4000,
    data: {
      rewardImage: REWARD_IMAGES.rainbow,
      rewardPrompt: "A colorful rainbow in the sky",
    },
  },
  // Reward - Result 3 (Spaceship)
  {
    id: "reward-spaceship",
    type: "reward",
    state: "result",
    caption: "\"A rocket spaceship\"",
    duration: 4000,
    data: {
      rewardImage: REWARD_IMAGES.spaceship,
      rewardPrompt: "A rocket spaceship flying through stars",
    },
  },
  // Final CTA
  {
    id: "cta",
    type: "cta",
    state: "final",
    caption: "Ready to start your adventure?",
    duration: Infinity,
    data: {},
  },
]
