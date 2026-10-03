import type { ChatLine } from './characters';

/** Request lines for the work chains, keyed `${chain}-${tier}`. */
export const workRequestLines: Record<string, ChatLine[]> = {
  // Code
  'code-1': [
    { text: 'Found a bug. Well, a user found it. Loudly.' },
    { text: 'QA is bored. Feed them a bug, please' },
    { who: ['sam'], text: 'Works on my machine. Send a bug to prove it' },
  ],
  'code-2': [
    { text: 'Prod is on fire. A patch, please. Quietly.' },
    { text: 'Need a quick patch before anyone notices' },
    { who: ['kai'], text: 'Patch needed. It is 3am. Perfect time to ship' },
  ],
  'code-3': [
    { text: 'Open a pull request so I can leave one comment' },
    { text: 'Need a PR. Small. Reviewers fear big ones' },
    { who: ['sam'], text: 'Send a pull request. I will review it next quarter' },
  ],
  'code-4': [
    { text: 'A customer asked for a feature. One. Once.' },
    { text: 'Need a feature for the roadmap slide' },
    { who: ['jordan'], text: 'Ticket says "feature". Ticket also says "ASAP"' },
  ],
  'code-5': [
    { text: 'Release day. Nobody touch anything. Except you.' },
    { text: 'Need a release before Friday. Not on Friday.' },
    { who: ['ava'], text: 'Ship it. The vision cannot wait for testing' },
  ],
  'code-6': [
    { text: 'Launch day. The press release says "revolutionary"' },
    { text: 'Need a product launch. The countdown has started' },
    { who: ['ruth'], text: 'I already sold the launch. Please make it exist' },
  ],

  // Data
  'data-1': [
    { text: 'Need one cell. Just the one. It says "TBC"' },
    { text: 'Can I get a cell? Mine has a circular reference' },
    { who: ['jordan'], text: 'Need a cell to track my tickets about cells' },
  ],
  'data-2': [
    { text: 'Send a spreadsheet. Ideally one tab, not 40' },
    { text: 'Need a spreadsheet. Do not open the hidden tab' },
    { who: ['ruth'], text: 'Spreadsheet please. My forecast is all vibes' },
  ],
  'data-3': [
    { text: 'Need a chart. Any chart. Up and to the right.' },
    { text: 'Chart please. Start the y-axis wherever helps' },
    { who: ['lee'], text: 'Just checking in. Where is the chart?' },
  ],
  'data-4': [
    { text: 'Need a dashboard nobody will open after Tuesday' },
    { text: 'Dashboard please. Lots of green. Green is good' },
    { who: ['nina'], text: 'Quick sync: can we get a dashboard for the syncs?' },
  ],
  'data-5': [
    { text: 'Need a forecast. Optimistic, but defensibly so' },
    { text: 'Finance wants a number. Any number. Forecast pls' },
    { who: ['theo'], text: 'Forecast with a hockey stick. 10x by Q3' },
  ],
  'data-6': [
    { text: 'Board meets tomorrow. Need the board report.' },
    { text: 'Board report please. Bury the churn on page 30' },
    { who: ['ava'], text: 'Board report needs more vision. Fewer numbers' },
  ],

  // Strategy
  'strategy-1': [
    { text: 'Sticky note please. This idea will not hold itself' },
    { text: 'Need a sticky note. The wall still has a gap' },
    { who: ['jordan'], text: 'Need a sticky note. Mine is in use. On my face.' },
  ],
  'strategy-2': [
    { text: 'Need a whiteboard. Someone wrote DO NOT ERASE' },
    { text: 'Whiteboard please. I have arrows to draw' },
    { who: ['kai'], text: 'Whiteboard needed. The architecture is just boxes' },
  ],
  'strategy-3': [
    { text: 'Need one slide. One. It can have nine bullets' },
    { text: 'Slide please. Title it "Learnings"' },
    { who: ['nina'], text: 'Can you pop that into a slide? Just a quick one' },
  ],
  'strategy-4': [
    { text: 'Need a deck. 40 slides, 12 of them appendix' },
    { text: 'Slide deck please. I present in, um, now' },
    { who: ['ruth'], text: 'Need a deck for the pitch. Make it pop. Then more' },
  ],
  'strategy-5': [
    { text: 'We need a strategy. Or at least a strategy deck' },
    { text: 'Strategy please. Last year\'s was mostly a font' },
    { who: ['ava'], text: 'The vision is clear. I just need a strategy for it' },
  ],
  'strategy-6': [
    { text: 'Need a pivot. The old idea is no longer an idea' },
    { text: 'Pivot please. Same product, different buzzword' },
    { who: ['theo'], text: 'Runway is short. Time to pivot. Into what? Yes.' },
  ],

  // Inbox
  'inbox-1': [
    { text: 'Send me an email so I can say I never got it' },
    { text: 'Need an email. As per my last email.' },
    { who: ['lee'], text: 'Just checking in on my email about the email' },
  ],
  'inbox-2': [
    { text: 'Need a thread. Bonus points for 40 replies' },
    { text: 'Start a thread. I will reply in three weeks' },
    { who: ['nina'], text: 'Let us take this to a thread and circle back' },
  ],
  'inbox-3': [
    { text: 'Need a reply-all. Please remove me from this list' },
    { text: 'Reply-all needed. Everyone must know I agree' },
    { who: ['sam'], text: 'Reply-all please. I want to watch the chaos live' },
  ],
  'inbox-4': [
    { text: 'Need a meeting about whether we need a meeting' },
    { text: 'Book a meeting. It could have been an email.' },
    { who: ['nina'], text: 'Quick sync? Thirty minutes. Or sixty. Or ninety' },
  ],
  'inbox-5': [
    { text: 'Need an offsite. Same meetings, worse wi-fi' },
    { text: 'Offsite please. There will be trust falls' },
    { who: ['ava'], text: 'Offsite time. We need to realign on the vision' },
  ],
  'inbox-6': [
    { text: 'Need a restructure. The org chart is too readable' },
    { text: 'Restructure please. Same people, new boxes' },
    { who: ['nina'], text: 'Quick sync about the restructure. Bring a box.' },
  ],

  // Swag
  'swag-1': [
    { text: 'Need a laptop sticker. My lid is 80% stickers' },
    { text: 'Sticker please. It says I care about culture' },
    { who: ['byte'], text: 'Woof. (He wants a sticker. To eat.)' },
  ],
  'swag-2': [
    { text: 'Need a lanyard. Security does not trust my face' },
    { text: 'Lanyard please. I locked myself out of the kitchen' },
    { who: ['marco'], text: 'Lanyards for the new rockstars! So exciting!' },
  ],
  'swag-3': [
    { text: 'Need a tote bag for my other tote bags' },
    { text: 'Tote bag please. The conference ran out' },
    { who: ['byte'], text: 'Woof. (He wants the tote bag. He will sit in it.)' },
  ],
  'swag-4': [
    { text: 'Launch T-shirt please. Size: whatever is left' },
    { text: 'Need a launch shirt. The launch was cancelled' },
    { who: ['kai'], text: 'Need a launch shirt. On day three of the last one' },
  ],
  'swag-5': [
    { text: 'Hoodie please. The air con is set to arctic' },
    { text: 'Need a hoodie. It is my professional attire' },
    { who: ['kai'], text: 'New hoodie needed. The old one has gained sentience' },
  ],
  'swag-6': [
    { text: 'Need the fleece vest. I have a funding call' },
    { text: 'Fleece vest please. I am ready to say "synergy"' },
    { who: ['theo'], text: 'The vest. Every serious investor needs the vest.' },
  ],

  // Coffee
  'coffee-1': [
    { text: 'Need a coffee bean. I will chew it if I must' },
    { text: 'One bean please. Budget cuts hit the kitchen' },
    { who: ['byte'], text: 'Woof. (He is not allowed coffee beans. He knows.)' },
  ],
  'coffee-2': [
    { text: 'Espresso please. Standup is in four minutes' },
    { text: 'Need an espresso. Do not ask me how many' },
    { who: ['sam'], text: 'Espresso. The duck and I are debugging.' },
  ],
  'coffee-3': [
    { text: 'Flat white please. My personality depends on it' },
    { text: 'Need a flat white before I can form opinions' },
    { who: ['nina'], text: 'Grab a flat white? We can circle back after' },
  ],
  'coffee-4': [
    { text: 'Oat latte please. Extra hot, extra smug' },
    { text: 'Need an oat latte. Dairy is so last quarter' },
    { who: ['lee'], text: 'Just checking in on the oat latte.' },
  ],
  'coffee-5': [
    { text: 'Coffee run! Writing the order on a sticky note' },
    { text: 'Need a coffee run. It is 3pm. You know why.' },
    { who: ['jordan'], text: 'Coffee run please. I made a ticket per order' },
  ],
  'coffee-6': [
    { text: 'Need a coffee cart. Morale is a supply problem' },
    { text: 'Coffee cart please. All-hands at 9am' },
    { who: ['marco'], text: 'Coffee cart for candidates! Culture sells itself!' },
  ],

  // Funding
  'funding-1': [
    { text: 'Need a coin for the vending machine. Startup life' },
    { text: 'One coin please. The petty cash is very petty' },
    { who: ['byte'], text: 'Woof. (He found a coin once. He wants another.)' },
  ],
  'funding-2': [
    { text: 'Need a coin stack. Payroll is Friday. Gulp.' },
    { text: 'Coin stack please. Building the pizza fund' },
    { who: ['kai'], text: 'Need coins for the servers. The servers want coins' },
  ],
  'funding-3': [
    { text: 'Cash bundle please. The intern needs paying' },
    { text: 'Need a cash bundle. Do not ask what for. Snacks.' },
    { who: ['ruth'], text: 'Need a cash bundle for the client dinner. Big one' },
  ],
  'funding-4': [
    { text: 'Need a term sheet. We will read the small print later' },
    { text: 'Term sheet please. Any term. Any sheet.' },
    { who: ['theo'], text: 'Sending a term sheet. Two pages. One is a vibe.' },
  ],
  'funding-5': [
    { text: 'Need a Series A. Our runway is a short driveway' },
    { text: 'Series A please. We have five users and a dream' },
    { who: ['ava'], text: 'Series A, please. The vision has a burn rate' },
  ],
  'funding-6': [
    { text: 'IPO bell please. I have been practising my bell face' },
    { text: 'Need the IPO bell. Ring once, retire never' },
    { who: ['theo'], text: 'Ring the bell. I promised my investors a 10x' },
  ],
};

/** Lines for requests asking for several items, per character id. */
export const workMultiLines: Record<string, string[]> = {
  kai: ['Shipping tonight. Need all of this by 2am:', 'Prod is down. Bring everything:'],
  ava: ['Investor demo in an hour. The vision needs:', 'Big week for the vision. Need these:'],
  byte: ['Woof. (He has made a list. It is chewed.)', 'Woof woof. (Several items. He is very sure.)'],
  sam: ['On call this weekend. Survival kit, please:', 'Code freeze in an hour. Need all of this:'],
  nina: ['Quick sync before the quick sync. Please bring:', 'Circling back on these. All of them:'],
  jordan: ['Made you a ticket. It has subtasks:', 'Sprint starts Monday. The backlog says:'],
  ruth: ['Quarter ends Friday. Need all of this to close:', 'Huge deal, huge list! Love it:'],
  lee: ['Just checking in on this list:', 'Contract renewal is next week. I need:'],
  marco: ['Onboarding ten rockstars on Monday. Need:', 'Exciting opportunity to send me all of this:'],
  theo: ['Board meeting in an hour. Need all of this:', 'Due diligence starts tomorrow. 10x this list:'],
};

/** Thank-you replies after a delivery, per character id. */
export const workThanksLines: Record<string, string[]> = {
  kai: [
    'Merged. Shipping it before anyone reviews it',
    'Nice. Adding you to the README.',
    'Thanks. Going to bed now. It is 4pm.',
  ],
  ava: [
    'This is exactly the vision. Roughly.',
    'You get it. You really get the vision.',
    'Amazing. Putting you on the all-hands slide',
  ],
  byte: [
    'Woof. (Tail wag. Highest rating available.)',
    'Woof. (He has buried it. That means thanks.)',
    'Woof. (He would promote you. He cannot.)',
  ],
  sam: [
    'Thanks. The duck approves. I am neutral.',
    'Works. Do not touch it. Ever.',
    'Good. Now I can be tired about something else.',
  ],
  nina: [
    'Love this. Let us circle back on why it is great',
    'Thanks! Popping in a sync to celebrate',
    'Great work. Noted for your review. Somewhere.',
  ],
  jordan: [
    'Moving the ticket to Done. Best feeling there is',
    'Thanks! I made a ticket to say thanks',
    'Shipped! Updating the roadmap. Again.',
  ],
  ruth: [
    'Incredible! Quota is basically closed!',
    'You are a closer. That is my highest compliment',
    'Love it. I have already sold three more',
  ],
  lee: [
    'Acceptable.',
    'Received. I will be checking in anyway.',
    'Fine. I suppose we will renew.',
  ],
  marco: [
    'Rockstar move! Ever thought about a career change?',
    'Amazing! Sending you a role you would be perfect for',
    'Ninja-level delivery! Can I quote you on that?',
  ],
  theo: [
    'That is a 10x deliverable. Maybe 3x.',
    'Great. Extending your runway by a week.',
    'Love it. Want to be an advisor? It is unpaid.',
  ],
};
