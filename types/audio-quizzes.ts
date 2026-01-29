export interface AudioQuizSummary {
  id: string
  title: string
  status: string
  createdAt: string
  storyTitle: string
}

export interface AudioQuizDetail {
  id: string
  title: string
  status: string
  storyTitle: string
  createdAt: string
}

export interface AudioQuizManifestItem {
  orderIndex: number
  itemType: "story_segment" | "question"
  audioUrl: string
  pauseMs: number
}

export interface AudioQuizManifest {
  quizId: string
  title: string
  items: AudioQuizManifestItem[]
}
