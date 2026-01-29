# Landing Page Demo Spec

## Overview

An interactive animated demo on the landing page that showcases Wild Reader's core experience to unauthenticated visitors. The demo demonstrates the learning progression from letter recognition through vocabulary matching to AI-generated image rewards.

## Goals

- **Full confidence**: Show complete game flows so parents fully understand what their child will experience
- **Conversion**: Drive sign-ups by demonstrating the value proposition without requiring an account
- **Authenticity**: Use real game data and actual UI components to set accurate expectations

---

## Content & Flow

### Games Featured

Curated 3-part progression:
1. **Letter Match** - Uppercase/lowercase matching (demonstrates letter recognition)
2. **Word Match** - Emoji-to-word matching (demonstrates vocabulary building)
3. **Reward** - AI image generation (demonstrates the reward system)

### Specific Content Choices

| Segment | Content | Rationale |
|---------|---------|-----------|
| Letter Match | B/b | Visually distinct uppercase vs lowercase |
| Word Match | Cat 🐱 | Universal, simple 3-letter word, recognizable emoji |
| Reward Examples | Puppy, Rainbow, Spaceship | Mix of real, nature, and adventure to show range |

### Step-by-Step Flow (~8-10 steps)

1. **Letter Match - Question**: Show "B" with 4 lowercase options (a, b, c, d)
2. **Letter Match - Answer**: Highlight "b" as selected, show correct feedback
3. **Word Match - Question**: Show 🐱 emoji with 4 word options
4. **Word Match - Wrong Answer**: User "selects" wrong answer, brief red flash
5. **Word Match - Retry**: Same question, correct answer selected
6. **Word Match - Correct**: Show success feedback
7. **Reward - Generating**: "Creating your picture..." animation with first prompt (Puppy)
8. **Reward - Result 1**: Show generated puppy image
9. **Reward - Cycle**: Fade to rainbow image, then spaceship image
10. **End State**: "Get Started" CTA overlay

---

## Visual Design

### Container Style
- **Floating card**: Rounded card with shadow matching existing UI style
- No device frame (phone mockup) - keeps it platform-agnostic
- Matches the app's existing card/shadow aesthetic

### Position on Page
- Below the welcome text ("Welcome to Wild Reader!")
- Above the main sign-up CTA
- Centered in the content area

### Progress Indicator
- **Dot indicators**: Row of dots at bottom showing current step
- Active dot highlighted, others dimmed
- Clickable to jump to specific step

### Captions (for Audio)
- **Subtitle bar**: Traditional subtitle strip at bottom of demo area
- Shows what audio instruction would say (e.g., "Find the lowercase B")
- Muted by default due to autoplay restrictions

### Loading States
- **Skeleton loaders**: Animated placeholder shapes while images load
- Demo doesn't start until critical assets are ready

---

## Interaction Model

### Playback Behavior
- **Semi-interactive**: Auto-plays at 4-5 seconds per step
- Clicking/tapping anywhere advances to next step immediately
- No play/pause controls, previous/next buttons, or scrubbing

### Loop Behavior
- **Play once, then show CTA**: After full playthrough, freeze on final state
- Final state shows "Get Started" button overlay
- Does not auto-restart

### Scroll Behavior
- **Pause when hidden**: Uses Intersection Observer
- Pauses when demo scrolls out of viewport
- Resumes from current position when scrolled back into view

---

## Error State Demo

### Wrong Answer Handling
- Occurs during **Word Match** segment (middle of journey)
- **Immediate retry**: Wrong → brief red flash → same question → correct → continue
- Demonstrates the app's supportive, non-punitive approach to mistakes
- Total recovery time: ~2-3 seconds

---

## Reward Generation Demo

### Simulated Generation
- Fake "generating..." animation (spinner, sparkles, progress)
- Reveals pre-made example images (not actual API calls)
- **Cycles through 3 examples**:
  1. "A happy puppy" → puppy image
  2. "A colorful rainbow" → rainbow image
  3. "A rocket spaceship" → spaceship image
- Each example shows for 3-4 seconds before cycling

### Asset Strategy
- **Hybrid approach**:
  - Game assets (letters, emojis): Static in `/public/demo/`
  - Reward images: Pre-generated, stored on BunnyCDN
  - Zero runtime API calls during demo

---

## Responsive Design

### Mobile
- **Same experience, smaller**: Scale down proportionally
- Card width: 100% of container (with padding)
- Touch targets remain accessible
- Same timing and interaction model

### Desktop
- Card width: ~500-600px max
- Centered with comfortable margins
- Same experience as mobile, just larger

---

## Accessibility

### Reduced Motion (prefers-reduced-motion)
- **Static screenshots**: Replace animated demo with gallery of static images
- Show key moments: Letter Match question, Word Match question, Reward result
- Include text descriptions of what each image shows
- Link to sign up still prominent

### Screen Readers
- Descriptive alt text for all demo images
- ARIA labels for progress dots
- Caption text accessible to screen readers

---

## Technical Implementation

### Component Structure

```
components/
  LandingDemo/
    LandingDemo.tsx        # Main container, state management
    DemoStep.tsx           # Individual step renderer
    DemoProgress.tsx       # Dot indicator component
    DemoCaption.tsx        # Subtitle bar component
    useDemoPlayer.ts       # Auto-advance timer, intersection observer
```

### State Management

```typescript
type DemoStep = {
  id: string
  type: 'letter-match' | 'word-match' | 'reward' | 'cta'
  caption: string
  duration: number // ms
  isError?: boolean
}

type DemoState = {
  currentStep: number
  isPlaying: boolean
  isComplete: boolean
  isVisible: boolean
}
```

### Assets Required

Static assets in `/public/demo/`:
- Letter options images (or use text)
- Emoji images (or use native emoji)
- Demo reward images (3): puppy.jpg, rainbow.jpg, spaceship.jpg

### Preloading Strategy

1. On component mount, start preloading all demo images
2. Show skeleton loaders until critical assets ready
3. Begin auto-play once preloading complete

---

## Metrics & Analytics (Future)

Track for optimization:
- Demo start rate (how many visitors see the demo)
- Demo completion rate (how many watch to the end)
- Click-to-advance rate (engagement level)
- Conversion rate (demo viewers → sign-ups)
- Drop-off points (which step loses people)

---

## Implementation Checklist

- [ ] Create `LandingDemo` component with step state management
- [ ] Implement auto-advance timer with 4-5 second intervals
- [ ] Add Intersection Observer for pause-when-hidden
- [ ] Create demo step data with all 8-10 steps
- [ ] Style floating card container matching app aesthetic
- [ ] Add dot progress indicator
- [ ] Add subtitle caption bar
- [ ] Implement skeleton loading state
- [ ] Create/source demo reward images (puppy, rainbow, spaceship)
- [ ] Add reduced-motion fallback with static images
- [ ] Integrate into landing page below welcome text
- [ ] Test on mobile viewports
- [ ] Test click-to-advance behavior
- [ ] Verify final CTA state displays correctly

---

## Open Questions

1. Should we A/B test demo vs no-demo to measure conversion impact?
2. Should demo images be optimized/compressed specifically for fast loading?
3. Do we need analytics events before launch, or add them later?
