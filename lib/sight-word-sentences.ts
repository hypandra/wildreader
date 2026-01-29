/**
 * Sentence examples for sight words
 * Pattern: "Word. [Sentence using word]. Word."
 * Used to help children hear words in context
 */

// Map of sight words to example sentences
// Sentences should be simple, use familiar contexts for 3-4 year olds
const SIGHT_WORD_SENTENCES: Record<string, string> = {
  // Dolch Pre-Primer
  a: "I see a dog.",
  and: "Mom and Dad are here.",
  away: "The bird flew away.",
  big: "The elephant is big.",
  blue: "The sky is blue.",
  can: "I can run fast.",
  come: "Come play with me.",
  down: "The ball rolled down.",
  find: "Can you find it?",
  for: "This is for you.",
  funny: "That joke is funny.",
  go: "Let's go outside.",
  help: "Can you help me?",
  here: "Come over here.",
  i: "I like ice cream.",
  in: "The cat is in the box.",
  is: "This is my toy.",
  it: "I found it.",
  jump: "I can jump high.",
  little: "The mouse is little.",
  look: "Look at the stars.",
  make: "Let's make a cake.",
  me: "Give it to me.",
  my: "This is my book.",
  not: "I am not tired.",
  one: "I have one apple.",
  play: "Let's play a game.",
  red: "The apple is red.",
  run: "I like to run.",
  said: "Mom said yes.",
  see: "I see you.",
  the: "The dog is happy.",
  three: "I have three cookies.",
  to: "I want to go.",
  two: "I have two hands.",
  up: "Look up at the sky.",
  we: "We are friends.",
  where: "Where is my toy?",
  yellow: "The sun is yellow.",
  you: "I like you.",

  // Dolch Primer
  all: "We ate all the cookies.",
  am: "I am happy.",
  are: "You are my friend.",
  at: "Look at me.",
  ate: "I ate my lunch.",
  be: "I want to be tall.",
  black: "The cat is black.",
  brown: "The bear is brown.",
  but: "I tried but I fell.",
  came: "She came to my house.",
  did: "I did my best.",
  do: "What do you want?",
  eat: "Let's eat dinner.",
  four: "I have four toys.",
  get: "Go get your shoes.",
  good: "You did a good job.",
  have: "I have a pet.",
  he: "He is my brother.",
  into: "Jump into the pool.",
  like: "I like pizza.",
  must: "You must be careful.",
  new: "I got new shoes.",
  no: "No, thank you.",
  now: "Let's go now.",
  on: "The book is on the table.",
  our: "This is our house.",
  out: "Let's go out to play.",
  please: "Please help me.",
  pretty: "The flower is pretty.",
  ran: "The dog ran fast.",
  ride: "I can ride a bike.",
  saw: "I saw a rainbow.",
  say: "What did you say?",
  she: "She is my sister.",
  so: "I am so happy.",
  soon: "We will eat soon.",
  that: "I like that one.",
  there: "Put it over there.",
  they: "They are playing.",
  this: "This is fun.",
  too: "I want some too.",
  under: "The cat is under the bed.",
  want: "I want a cookie.",
  was: "It was a sunny day.",
  well: "You did well.",
  went: "We went to the park.",
  what: "What is your name?",
  white: "Snow is white.",
  who: "Who is that?",
  will: "I will try.",
  with: "Come with me.",
  yes: "Yes, I can.",

  // Common CVC words
  cat: "The cat says meow.",
  dog: "The dog likes to play.",
  hat: "He put his hat on his head.",
  bat: "I hit the ball with a bat.",
  mat: "Wipe your feet on the mat.",
  sat: "She sat on the chair.",
  rat: "The rat ran away.",
  pan: "Mom cooked in a pan.",
  man: "The man waved hello.",
  fan: "The fan keeps us cool.",
  van: "We rode in a van.",
  bed: "Time to go to bed.",
  pen: "I write with a pen.",
  hen: "The hen laid an egg.",
  ten: "I can count to ten.",
  men: "The men are working.",
  pig: "The pig says oink.",
  wig: "She wore a funny wig.",
  dig: "Let's dig in the sand.",
  fig: "I ate a fig.",
  pot: "The soup is in the pot.",
  hot: "The stove is hot.",
  dot: "Put a dot on the paper.",
  cot: "The baby sleeps in a cot.",
  lot: "I have a lot of toys.",
  got: "I got a present.",
  bug: "The bug is crawling.",
  rug: "Sit on the rug.",
  mug: "Drink from the mug.",
  hug: "Give me a hug.",
  jug: "Pour from the jug.",
  tug: "Tug the rope.",
  cup: "Drink from your cup.",
  cut: "She cut the paper with scissors.",
  sun: "The sun is bright.",
  fun: "This game is fun.",
  bun: "I ate a bun.",

  // Action words
  stop: "Stop at the red light.",
  hop: "The bunny can hop.",
  skip: "Let's skip down the path.",
  clap: "Clap your hands.",
  snap: "Snap your fingers.",
  wave: "Wave goodbye.",
  kick: "Kick the ball.",
  push: "Push the button.",
  pull: "Pull the door open.",
  sit: "Sit down please.",
  stand: "Stand up tall.",
  walk: "Walk to the door.",
  talk: "Let's talk together.",
  sing: "I like to sing songs.",
  read: "Let's read a book.",
  draw: "I like to draw pictures.",
  write: "Write your name.",
  sleep: "Time to sleep.",
  wake: "Wake up sleepy head.",
  wash: "Wash your hands.",
  brush: "Brush your teeth.",
  open: "Open the door.",
  close: "Close the window.",
  give: "Give me a high five.",
  take: "Take this to Mommy.",
  put: "Put on your shoes.",
  pick: "Pick up your toys.",
  throw: "Throw the ball.",
  catch: "Catch the ball.",
  hold: "Hold my hand.",
  kiss: "Give me a kiss.",
  love: "I love you.",

  // Colors
  green: "The grass is green.",
  orange: "The pumpkin is orange.",
  purple: "Grapes are purple.",
  pink: "The flower is pink.",
  gray: "The elephant is gray.",

  // Numbers
  five: "I have five fingers.",
  six: "I am six years old.",
  seven: "There are seven days in a week.",
  eight: "The octopus has eight arms.",
  nine: "I can count to nine.",
  zero: "Zero means none.",

  // Family
  mom: "I love my mom.",
  dad: "Dad reads me stories.",
  baby: "The baby is sleeping.",
  sister: "My sister is nice.",
  brother: "My brother plays with me.",
  grandma: "Grandma bakes cookies.",
  grandpa: "Grandpa tells stories.",

  // Body parts
  head: "Put the hat on your head.",
  hand: "Hold my hand.",
  foot: "I hurt my foot.",
  eye: "Close your eye.",
  ear: "I hear with my ear.",
  nose: "Touch your nose.",
  mouth: "Open your mouth.",
  arm: "Raise your arm.",
  leg: "Stand on one leg.",
  toe: "Wiggle your toe.",

  // Animals
  bird: "The bird can fly.",
  fish: "The fish swims.",
  frog: "The frog jumps.",
  bear: "The bear is big.",
  duck: "The duck says quack.",
  cow: "The cow says moo.",
  horse: "The horse runs fast.",
  sheep: "The sheep has wool.",
  goat: "The goat eats grass.",
  lion: "The lion roars.",
  tiger: "The tiger has stripes.",
  snake: "The snake slithers.",
  bee: "The bee makes honey.",
  ant: "The ant is tiny.",

  // Food
  apple: "I eat an apple.",
  banana: "The banana is yellow.",
  cake: "The cake is yummy.",
  cookie: "May I have a cookie?",
  milk: "I drink milk.",
  water: "I drink water.",
  juice: "I like juice.",
  bread: "I eat bread.",
  egg: "I had an egg for breakfast.",
  pizza: "Pizza is delicious.",

  // Places
  home: "I am going home.",
  school: "I go to school.",
  park: "Let's go to the park.",
  store: "We went to the store.",
  zoo: "I saw animals at the zoo.",

  // Things
  ball: "Throw the ball.",
  book: "Read me a book.",
  toy: "This is my toy.",
  car: "The car goes vroom.",
  bus: "The bus is big.",
  tree: "The tree is tall.",
  flower: "Smell the flower.",
  house: "This is my house.",
  door: "Open the door.",
  window: "Look out the window.",
  chair: "Sit on the chair.",
  table: "Put it on the table.",
  box: "The toy is in the box.",
  bag: "Put it in the bag.",
  shoe: "Put on your shoe.",
  sock: "Put on your sock.",
  shirt: "Wear your shirt.",
  coat: "Put on your coat.",

  // Weather
  rain: "The rain is falling.",
  snow: "The snow is cold.",
  wind: "The wind is blowing.",
  cloud: "Look at the cloud.",
  star: "The star is bright.",
  moon: "The moon is round.",

  // Feelings
  happy: "I am happy.",
  sad: "Do not be sad.",
  mad: "I am not mad.",
  scared: "Do not be scared.",
  tired: "I am tired.",
  sick: "I feel sick.",

  // Time
  day: "It is a nice day.",
  night: "Good night.",
  morning: "Good morning.",
  today: "Today is fun.",
  tomorrow: "We will go tomorrow.",
}

/**
 * Get an example sentence for a sight word
 * Returns null if no sentence is available
 */
export function getSightWordSentence(word: string): string | null {
  const normalizedWord = word.toLowerCase().trim()
  return SIGHT_WORD_SENTENCES[normalizedWord] || null
}

/**
 * Generate a simple fallback sentence for words not in the dictionary
 * Uses a basic template: "The word is [word]."
 */
export function generateFallbackSentence(word: string): string {
  const normalizedWord = word.toLowerCase().trim()
  // Simple templates that work with most words
  const templates = [
    `Can you say ${normalizedWord}?`,
    `The word is ${normalizedWord}.`,
    `This word says ${normalizedWord}.`,
  ]
  // Use word length as a simple hash to pick a template consistently
  const index = normalizedWord.length % templates.length
  return templates[index]
}

/**
 * Get sentence for a word, with fallback
 */
export function getSentenceForWord(word: string): string {
  return getSightWordSentence(word) || generateFallbackSentence(word)
}
