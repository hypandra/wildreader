# Wild Reader - TODO

## Priority Tasks

### 🚨 High Priority

#### ✅ Parent Guide - Game Descriptions (COMPLETE)
Create a simple, clear guide for parents explaining how all the games work.

**Requirements:**
- [x] Create `/app/guide/page.tsx` - Parent guide page
- [x] Add link in navigation/settings to "Parent Guide" or "How It Works"
- [x] Include for each game:
  - [x] Game name and emoji
  - [x] What skill it teaches (letter recognition, phonics, etc.)
  - [x] How to play (simple 1-2 sentence explanation)
  - [x] Example screenshot or illustration (dev-only detailed pages)
- [x] Add overview section:
  - [x] How the reward system works (3-streak = AI picture)
  - [x] How mastery tracking works (weighted selection)
  - [x] Recommended play time/frequency
  - [x] Age appropriateness (3-4 years old)
- [x] Add "Science of Reading" explanation (why these games)
- [x] **BONUS:** Created detailed game documentation pages at `/app/guide/[gameSlug]` (development-only)
  - Complete technical specs for testing/debugging
  - UI elements, correct/incorrect behavior, data sources, mastery tracking
  - Only accessible in development environment

**Files Created:**
- `app/guide/page.tsx` - Parent guide page with all 8 games
- `app/guide/[gameSlug]/page.tsx` - Detailed technical documentation (dev-only)

---

#### ✅ Audio Instructions & Labels (COMPLETE)
Add audio instructions and clickable audio labels for each game to support pre-readers.

**Requirements:**
- [x] Add speaker icon button to game questions (top-right corner)
- [x] Click to play audio instruction for current question
- [x] Audio for each game type:
  - [x] Letter Match: "Find the lowercase letter [X]"
  - [x] Letter Hunt: "Tap all the [X] letters"
  - [x] Letter to Picture: "Which picture starts with [X]?"
  - [x] Picture to Letter: "Which letter does [word] start with?"
  - [x] Starts With: "Find the words that start like [word]"
  - [x] Ends With: "Find the words that end like [word]"
  - [x] Word Match: "Find the picture for [word]"
  - [x] Picture Match: "Find the word for this picture"
- [x] Add audio for answer options (click word/letter to hear it)
- [x] Add audio feedback:
  - [x] Correct answer: Random encouraging phrases ("Great job!", "You got it!", "Excellent!", etc.)
  - [x] Incorrect answer: Gentle redirects ("Try again!", "Not quite, try again!", etc.)
- [x] Use Web Speech API (text-to-speech) - child-friendly voices
- [x] Add audio toggle in settings (on/off)
- [x] Add subtle animation to speaker icon when playing (pulse effect)

**Implementation:**
- Used `speechSynthesis` API for dynamic TTS (free, works offline)
- Child-friendly voice selection (prefer female US English voices)
- Audio preference stored in localStorage via AudioContext
- Speaker buttons hidden when audio disabled

**Files Created:**
- `components/AudioButton.tsx` - Reusable audio player button with autoplay support
- `lib/audio.ts` - TTS/audio playback utilities with game instruction templates
- `lib/contexts/AudioContext.tsx` - Audio settings context provider
- `components/ui/switch.tsx` - Toggle switch component

**Files Modified:**
- `app/game/[slug]/page.tsx` - Added audio button to questions, answer options, and feedback
- `app/settings/page.tsx` - Added Audio Settings section with toggle
- `app/layout.tsx` - Added AudioProvider wrapper

---

#### Image Reporting System
Add a report button and flow to let users report problems with AI-generated images.

**Requirements:**
- [ ] Add "Report Image" button to reward image display (subtle, not prominent)
- [ ] Create report modal/dialog with:
  - [ ] Issue type selection (inappropriate content, didn't match description, technical error, other)
  - [ ] Optional text description field
  - [ ] Submit button
- [ ] Backend API endpoint to receive reports
- [ ] Store reports in database:
  - [ ] Create `image_reports` table
  - [ ] Fields: id, reward_id, child_id, user_id, issue_type, description, image_url, timestamp
- [ ] Add report indicator to vocabulary page (show if image has been reported)
- [ ] Admin view to review reports (future)

**Implementation Notes:**
- Place report button in corner of image or below "Keep Playing" button
- Make it subtle so kids don't accidentally click it
- Consider parent PIN/password before allowing report
- Store reported image URL even if later deleted from CDN

**Files to Create/Modify:**
- `components/RewardDialog.tsx` - Add report button
- `components/ReportImageDialog.tsx` - Report modal (new)
- `app/api/report-image/route.ts` - Report endpoint (new)
- `lib/db/reports.ts` - Database operations (new)
- `supabase/migrations/XXXXXX_create_reports_table.sql` - Schema (new)

---

## Future Enhancements

### Authentication & User Management
- [ ] Add forgot password flow
- [ ] Add email verification
- [ ] Add OAuth providers (Google, Apple)
- [ ] Add profile picture for child profiles
- [ ] Allow editing child profiles (name, emoji)
- [ ] Allow deleting child profiles

### Security
- [ ] Encrypt API keys in database (currently plain text)
- [ ] Add rate limiting to image generation API
- [ ] Add parent PIN to protect settings/deletion
- [ ] Enable Supabase Row Level Security (RLS)

### Reward System
- [ ] Add gallery view of all rewards (grid layout)
- [ ] Add ability to favorite rewards
- [ ] Add ability to delete individual rewards
- [ ] Add sharing functionality (download image, share URL)
- [ ] Add daily image generation limit (prevent API abuse)
- [ ] Show image generation cost/usage stats

### Games & Content
- [ ] Add more vocabulary words
- [ ] Add themed word packs (animals, colors, etc.)
- [ ] Add rhyming words game
- [ ] Add sight words recognition game
- [ ] **Read the Signs** - Environmental print recognition game
  - Show pictures of common signs (STOP, EXIT, CAUTION, OPEN, CLOSED, PUSH, PULL, etc.)
  - Kids use speech-to-text (Whisper) to say the sign's word
  - Great for real-world literacy - kids start recognizing these everywhere
  - Could include: traffic signs, store signs, safety signs, bathroom signs
- [ ] Add difficulty progression (auto-adjust based on mastery)
- [ ] Add sound effects for correct/incorrect answers
- [ ] Add background music toggle

### Progress Tracking
- [ ] Add weekly progress reports
- [ ] Add mastery visualizations (charts/graphs)
- [ ] Add achievements/badges system
- [ ] Add streak calendar view
- [ ] Export progress as PDF report

### Parent Dashboard
- [ ] Add parent dashboard page
- [ ] Show all children's progress side-by-side
- [ ] Add time spent playing stats
- [ ] Add most practiced letters/words
- [ ] Add struggle areas identification

### UI/UX Improvements
- [ ] Add dark mode toggle
- [ ] Add font size adjustment
- [ ] Add confetti animation when earning reward
- [ ] Add sound toggle (for speech feedback)
- [ ] Add tutorial/onboarding flow for first-time users
- [ ] Add loading skeletons for all data fetching

### Technical Improvements
- [ ] Add error boundary components
- [ ] Add analytics/telemetry (PostHog, Plausible, etc.)
- [ ] Add performance monitoring (Sentry)
- [ ] Add comprehensive error logging
- [ ] Add automated testing (Jest, Playwright)
- [ ] Add CI/CD pipeline
- [ ] Add database backups automation
- [ ] Add image optimization (compress before CDN upload)
- [ ] Add service worker for offline support

### Accessibility
- [ ] Add keyboard navigation support
- [ ] Add screen reader labels (ARIA)
- [ ] Add high contrast mode
- [ ] Add text-to-speech for questions
- [ ] Test with accessibility tools (aXe, Lighthouse)

### Mobile
- [ ] Create iOS app (React Native)
- [ ] Create Android app (React Native)
- [ ] Add touch gestures for games
- [ ] Add haptic feedback

---

## Bugs & Issues

### Known Bugs
- [ ] None currently tracked

### Need Investigation
- [ ] Test BunnyCDN upload error handling
- [ ] Verify mastery tracking accuracy
- [ ] Test concurrent user sessions (race conditions)

---

## Deployment

### Pre-Production Checklist
- [ ] Set up production Supabase project
- [ ] Set up production BunnyCDN zone
- [ ] Add production environment variables
- [ ] Test production database migrations
- [ ] Enable HTTPS/SSL
- [ ] Set up custom domain
- [ ] Configure Vercel/deployment platform
- [ ] Add error monitoring (Sentry)
- [ ] Add uptime monitoring
- [ ] Create backup/restore procedures

### Production Environment
- [ ] Deploy to Vercel/Railway/Fly.io
- [ ] Set up automatic deployments from main branch
- [ ] Set up staging environment
- [ ] Configure DNS records
- [ ] Enable rate limiting
- [ ] Enable DDoS protection (Cloudflare)

---

## Documentation

- [ ] Add API documentation
- [ ] Add database schema documentation
- [ ] Add deployment guide
- [ ] Add contribution guidelines
- [ ] Add user guide/help page
- [ ] Add privacy policy
- [ ] Add terms of service

---

## Notes

**BunnyCDN Setup Complete:** ✅
- Storage Zone: wildreader
- CDN Hostname: wildreader.b-cdn.net
- Region: Los Angeles

**Database:** Supabase PostgreSQL
**Auth:** Better Auth (email/password)
**Image Generation:** OpenRouter → Gemini 2.5 Flash Image
