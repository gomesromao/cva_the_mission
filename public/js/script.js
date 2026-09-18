// Every line of text in the game. Kept apart from the engine so the copy can be
// edited without touching game logic.
//
// Voice: short, dry, spoken. Contractions everywhere. It is a handheld game,
// not a novel, so nothing here should sound narrated.
//
// Two things stay word for word no matter what: the three wins on the sampler
// and the customer quote on the armchair. Those are real and belong to the
// people who said them.
//
// Each entry is an array of paragraphs. The dialogue box wraps and paginates
// them on its own, so write plain sentences here.

const BOOK_A_CALL_URL =
  'https://calendly.com/conor-coconutva/30min?utm_source=the_mission';

const SCRIPT = {
  intro: [
    '11:47 PM. Still at the desk. Classic.',
    "You meant to do something today. No idea what. It's gone.",
    'FIND TIME.',
  ],

  // ------------------------------------------------------------- the office
  clock: [
    '11:47 PM.',
    "The whole day's gone and you never once picked where it went.",
  ],
  calendar: [
    'Nine meetings tomorrow.',
    'Zero of them are the actual work. That gets the weekend. If the weekend survives.',
  ],
  notes: [
    'Sticky notes, three deep.',
    'One says HIRE SOMEONE.',
    "You wrote that four months ago. The ink's faded. You haven't.",
  ],
  window: [
    'Dark out. It was dark when you sat down too.',
    "Somewhere in the middle there was a whole day. You'll have to take our word for it.",
  ],
  mug: [
    'Cold coffee.',
    'You made it at 3 to save time. Never touched it. Great plan.',
  ],
  monitor: [
    '412 unread. 38 need an answer.',
    'Six of them actually need YOU.',
    "You've never had time to work out which six.",
  ],
  desk: [
    'Your desk.',
    "Every single thing on it is somebody else's emergency.",
  ],
  chair: [
    "The chair's warm.",
    'Eleven hours warm.',
  ],
  plant: [
    "The plant's thriving.",
    'Somebody else waters it. Imagine.',
  ],
  laptop: [
    'One new message.',
    'FROM: COCONUT',
    '"You\'re not going to find more hours. Nobody ever has."',
    '"But the hours you spend on work that was never yours? You can have those back."',
    '"Come downstairs."',
  ],
  laptopAgain: [
    'Still open.',
    'Still says come downstairs.',
  ],
  // Shown when someone heads downstairs before opening the message. It never
  // blocks them: the stairs work from the first second.
  stairsEarly: [
    'Down you go, message unread.',
    "It'll keep. Things on that desk always do.",
  ],

  // -------------------------------------------------------------- the house
  fireplace: [
    "Somebody lit this. It's been going all evening.",
    'You were upstairs for every minute of it.',
  ],
  armchair: [
    'The good chair.',
    'You forgot this house had a good chair.',
    'There\'s a note on the arm: "I would recommend Coconut VA to anyone that wants help buying back their time. I have worked with my VA for 3 years."',
    'Bruce H.',
  ],
  gramophoneOn: [
    'Needle down.',
    'The room warms up a little.',
  ],
  gramophoneOff: [
    'Needle up.',
    'Quiet again.',
  ],
  gramophoneBroken: [
    'You wind it up. Nothing comes out.',
    'The record never showed up.',
  ],
  sampler: [
    'Stitched into the frame:',
    '"A win for the client."',
    '"A win for the virtual professional."',
    '"A win for Coconut."',
    'Smaller, underneath: "If it does not create value for all three, we rethink it."',
  ],
  philippines: [
    'A pin in the Philippines.',
    '"Best place on earth to find virtual professionals. English is just how work happens here, the training\'s real, and the work ethic isn\'t a slogan."',
    '"Most of our talent lives on these islands."',
  ],
  southAmerica: [
    'Another pin, an ocean over.',
    '"We run meetups in Brazil. We sit down in person with engineers, specialists and operators who can work inside your company."',
    '"Not a database. People we\'ve actually met."',
  ],
  worldmapEdge: [
    'A world map with two pins in it.',
    "Somebody's been travelling.",
  ],
  binder: [
    'A training binder. Well used.',
    '"We run security and work-methodology training so our virtual professionals stay lined up with how the market actually works."',
    '"We built these systems for ourselves first, so we know exactly where each one hurts and where each one pays off."',
    '"If you\'re at that stage too, just ask. Happy to share what we learned."',
  ],
  shelfEarly: [
    'A shelf of small things, sorted by year.',
    'AUGUST 2021. Eric Espinosa and Tyler Leber start Coconut.',
    'FIRST SIX MONTHS: six figures. Nobody saw that coming. Them least of all.',
  ],
  shelfNow: [
    'The shelf keeps going.',
    'TODAY: 600+ companies. 100,000+ verified professionals. 4.9 out of 5.',
    'And one number nobody prints: the hours handed back to the people who own the companies.',
  ],
  photo: [
    'A family on a wooden deck. Three chairs, all taken.',
    'Pencil on the back: "She moved out at 19. First in her family to."',
  ],
  coconut: [
    'A coconut. On the floor. In your house.',
    'You decide not to ask.',
  ],
  windowHouse: [
    'Same night as the window upstairs.',
    'From down here it looks like weather. From up there it looked like a deadline.',
  ],
  clockHouse: [
    'A clock down here too. Same time as the one in your office.',
    'Feels later up there. Always does.',
  ],
  warmCoffee: [
    'A second cup. Still warm.',
    'Somebody made this while you were upstairs not drinking the first one.',
  ],
  trialCard: [
    'A card propped in the frame, handwritten:',
    '"First 40 hours are free. Month to month. No long contracts."',
    '"We\'d rather you leave easy than stay somewhere stuck."',
  ],
  shelfRoles: [
    'A shelf of binders. One per job.',
    'Executive assistants. Digital marketers. Social media. Sales. Accounting.',
    'Front end, back end, full stack. Automation and AI. Designers.',
    "Every one of them is something you've been doing yourself at midnight.",
  ],

  // --------------------------------------------------------------- the door
  doorPrompt: [
    'The front door.',
    "It's morning out there, which makes no sense and also makes perfect sense.",
  ],
  doorQuestion: 'Leave the desk behind?',
  doorRefuse: [
    'Not yet then.',
    "The desk is still up there. It's very patient.",
  ],

  ending: [
    'You open the door.',
    'The time was never hiding somewhere in the day.',
    'It was inside the work that was never yours to do.',
    'Somebody out there does that work better than you. And wants it.',
    "That's the whole mission.",
  ],
};

// Shown on the final screen, above the button.
const ENDING_CARD = {
  title: 'THE MISSION',
  lines: [
    'Empowering entrepreneurs',
    'by uplifting',
    'virtual professionals.',
  ],
  wins: [
    'A win for the client.',
    'A win for the professional.',
    'A win for Coconut.',
  ],
  cta: 'BOOK A CALL',
};
