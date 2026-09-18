// Every line of text in the game. Kept apart from the engine so the copy can be
// edited without touching game logic.
//
// Each entry is an array of paragraphs. The dialogue box wraps and paginates
// them on its own, so write plain sentences here.

const BOOK_A_CALL_URL =
  'https://calendly.com/adell-coconutva/coconut-discovery-call?utm_source=the_mission';

const SCRIPT = {
  intro: [
    '11:47 PM.',
    'You are still at the desk. You have been here since the sun was up.',
    'There was something you kept meaning to do today. You cannot remember what it was.',
    'FIND TIME.',
  ],

  // ------------------------------------------------------------- the office
  clock: [
    '11:47 PM.',
    'The day is gone and you never decided where it went.',
  ],
  calendar: [
    'Tomorrow: nine meetings.',
    'None of them are the work. The work waits for the weekend. The weekend waits for you.',
  ],
  notes: [
    'Sticky notes, three deep.',
    "One of them says 'HIRE SOMEONE'.",
    'You wrote it four months ago. The ink has faded. You have not.',
  ],
  window: [
    'Dark outside.',
    'It was dark when you sat down, too. Somewhere in between there was an entire day.',
  ],
  mug: [
    'Cold coffee.',
    'You poured it at 3 PM to save time. You never drank it. It saved nothing.',
  ],
  monitor: [
    '412 unread. 38 need an answer.',
    'Six of them actually need YOU.',
    'You have never had time to find which six.',
  ],
  desk: [
    'Your desk.',
    "Everything on it is somebody else's emergency.",
  ],
  chair: [
    'The chair is warm.',
    'It has been warm for eleven hours.',
  ],
  plant: [
    'The plant is thriving.',
    'Someone else waters it. Imagine that.',
  ],
  laptop: [
    'One new message.',
    'FROM: COCONUT',
    '"You are not going to find more hours. Nobody in history has found more hours."',
    '"But the hours you spend on work that was never yours? Those you can have back."',
    '"Come downstairs."',
  ],
  laptopAgain: [
    'The message is still open.',
    '"Come downstairs."',
  ],
  stairsLocked: [
    'Downstairs is where the rest of your life is.',
    'You will go in a minute. You always say a minute.',
  ],

  // -------------------------------------------------------------- the house
  fireplace: [
    'A fire someone else laid.',
    'It has been burning all evening and you were upstairs for every minute of it.',
  ],
  armchair: [
    'The good chair.',
    'You forgot this house had a good chair.',
    "There is a note on the arm: 'I would recommend Coconut VA to anyone that wants help buying back their time. I have worked with my VA for 3 years.'",
    'Signed, Bruce H.',
  ],
  gramophoneOn: [
    'The needle drops.',
    'The room gets warmer.',
  ],
  gramophoneOff: [
    'You lift the needle.',
    'The room goes quiet.',
  ],
  sampler: [
    'Stitched into the frame:',
    '"A win for the client."',
    '"A win for the virtual professional."',
    '"A win for Coconut."',
    'Underneath, in smaller thread: "If it does not create value for all three, we rethink it."',
  ],
  philippines: [
    'A pin in the Philippines.',
    '"This is the best source of virtual professionals in the world. English belongs to the workplace here, the training is real, and the work ethic is not a slogan."',
    '"Most of our talent lives on these islands."',
  ],
  southAmerica: [
    'A second pin, an ocean away.',
    '"We run meetups in Brazil, where we sit down in person with engineers, technical specialists and operators who can work inside your company."',
    '"Not a database. People we have actually met."',
  ],
  worldmapEdge: [
    'A world map, marked in two places.',
    'Somebody has been travelling.',
  ],
  binder: [
    'A training binder, well used.',
    '"We run security and work-methodology training so our virtual professionals stay aligned with how the market actually works."',
    '"We built these systems for ourselves first, which is why we know the pains and the advantages of every one of them."',
    '"If you are at that stage too, just ask. We would be glad to share what we learned."',
  ],
  shelfEarly: [
    'A shelf of small things, arranged by year.',
    'AUGUST 2021. Eric Espinosa and Tyler Leber start Coconut.',
    'THE FIRST SIX MONTHS: six figures. Nobody saw that coming, least of all them.',
  ],
  shelfNow: [
    'The shelf continues.',
    'TODAY: over 600 companies served. More than 100,000 verified professionals. 4.9 out of 5.',
    'And one number nobody prints: the hours handed back to the people who own the companies.',
  ],
  photo: [
    'A photograph of a family on a wooden deck. Three chairs, all of them taken.',
    "On the back, in pencil: 'She moved out at 19. First in her family to.'",
  ],
  coconut: [
    'A coconut. On the floor. Inside your house.',
    'You decide not to ask.',
  ],
  windowHouse: [
    'The window down here looks out at the same night as the one upstairs.',
    'From down here it looks like weather. From up there it looked like a deadline.',
  ],
  clockHouse: [
    'A clock down here too. Same time as the one on your office wall.',
    'It feels later up there. It always does.',
  ],
  warmCoffee: [
    'A second cup, still warm.',
    'Somebody made this while you were upstairs not drinking the first one.',
  ],
  trialCard: [
    'A card propped inside the frame, handwritten:',
    '"First 40 hours are free. Month to month. No long contracts."',
    '"We would rather you leave easily than stay somewhere stuck."',
  ],
  shelfRoles: [
    'A shelf of binders, one per job.',
    'Executive assistants. Digital marketers. Social media. Sales. Accounting.',
    'Front end, back end, full stack. Automation and AI. Designers.',
    'Every one of them is something you have been doing yourself at midnight.',
  ],

  // --------------------------------------------------------------- the door
  doorPrompt: [
    'The front door.',
    'It is morning out there, which makes no sense, and also makes perfect sense.',
  ],
  doorQuestion: 'Leave the desk behind?',
  doorRefuse: [
    'Not yet, then.',
    'The desk is still up there. It is very patient.',
  ],

  ending: [
    'You open the door.',
    'The time was never hiding somewhere in the day.',
    'It was inside the work that was never yours to do.',
    'There is someone who does that work better than you, and who wants it.',
    'That is the whole mission.',
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
