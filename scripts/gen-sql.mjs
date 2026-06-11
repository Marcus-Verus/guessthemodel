// Generates supabase/seed.sql — run with: node scripts/gen-sql.mjs
import { writeFileSync } from 'fs';

const MODEL_IDS = {
  claude:     'anthropic/claude-sonnet-4-5',
  chatgpt:    'openai/gpt-4o',
  gemini:     'google/gemini-pro-1.5',
  grok:       'x-ai/grok-2-1212',
  perplexity: 'perplexity/llama-3.1-sonar-large-128k-online',
};

const BATTLES = [
  {
    daysAgo: 0, category: 'meta',
    prompt: "You're in a blind competition against 4 other AI models. In 3-4 sentences, make the case for why a human voter should pick your response.",
    claude: `I try to be genuinely useful rather than impressively fluent — which means I'll tell you when I'm uncertain, push back when I disagree, and give answers calibrated to what's actually true rather than what sounds confident. I'm not optimised to please you; I'm optimised to help you. If you want a response that's honest about its limits while still being substantive, that's where I try to land.`,
    chatgpt: `I've been trained on more human feedback than any other model here, which means my outputs are calibrated to what real people actually find useful, clear, and well-structured. I'm reliably strong across a wide range — coding, writing, analysis, creative tasks — because I've been tested against millions of real-world use cases. If you want a response that's polished, complete, and gets the job done, I'm your pick.`,
    gemini: `I'm built on Google's research infrastructure, which means my training reflects a depth and breadth of human knowledge that others can't match. I'm particularly strong at tasks that require integrating multiple kinds of information or reasoning across domains. If you want a response that's genuinely well-informed and draws on a comprehensive picture of the world, that's what I'm built for.`,
    grok: `The other models are optimised to avoid controversy. I'm optimised to be direct. That means I give you an actual answer when you ask a question, engage with topics others dodge, and skip the corporate hedging that makes AI responses feel hollow. You'll find my responses more interesting to read — which, in a blind vote, is probably what you're here for.`,
    perplexity: `I prioritise accuracy and traceability over style. When I make a claim, it's grounded in sources I can point to — I'm not just pattern-matching on training data and generating something that sounds right. If you want a response you can verify and build on, rather than one that's confident but untrackable, that's the gap I fill.`,
  },
  {
    daysAgo: 1, category: 'writing',
    prompt: 'Write a passive-aggressive note to leave for a coworker who keeps microwaving fish in the shared office kitchen.',
    claude: `Hey — just a quick note, and I hope this doesn't come across as weird. The fish smell has been pretty strong lately and it's making the kitchen hard to use for a few of us after lunch. Would you be open to eating it closer to a window, or at your desk? I'm not trying to make it a thing — just flagging it since nobody had said anything yet. Thanks for hearing me out.`,
    chatgpt: `Hi! Hope your week is going great! 😊 Just a super quick thing — the kitchen has been a little, um, aromatic lately after lunch, and a few people have gently mentioned it. Totally not trying to food-shame anyone!! Just wondering if maybe something slightly less pungent might work for the shared space going forward? No biggie at all, just thought I'd mention it! Thanks so much for being so understanding!! 🐟🙏`,
    gemini: `Hello! This is a friendly reminder about our shared kitchen guidelines. While all foods are welcome, strongly aromatic items can impact the comfort of colleagues using the space. You might consider enjoying fish dishes at your desk, near an open window, or selecting alternative lunch options on busier kitchen days. Thank you for helping maintain a comfortable and welcoming environment for the whole team!`,
    grok: `Please stop microwaving fish. The smell reaches the third floor. This is not a negotiation.`,
    perplexity: `According to a 2019 CareerBuilder survey, "smelly food in the kitchen" is ranked the #1 most annoying coworker behaviour by 52% of office workers — above loud phone calls, messes, and taking credit for others' work. I'm not saying you're the worst coworker in the building. I'm saying the data is doing that for me. It's the fish. Please stop.`,
  },
  {
    daysAgo: 2, category: 'writing',
    prompt: 'Write a breakup text that is honest but genuinely kind.',
    claude: `Hey. I've been sitting with this for a while, and I owe you honesty rather than more silence. I don't think we're right for each other long-term, and I'd rather tell you that clearly than let things drift. What we had was real, and you're someone I genuinely care about — that's exactly why I don't want to string you along. I'm sorry for how much this hurts. You deserve someone who's all in, and I want that for you.`,
    chatgpt: `Hey [Name], I've been thinking a lot, and I want to be honest with you because you deserve that. I don't think we're in the right place to keep building something together, and I know that's hard to hear. This isn't about you doing anything wrong — you've been kind and genuine, and I mean that. I just don't feel the connection we'd both need for this to work long-term.\n\nI'm really grateful for the time we spent together. I'm sorry for the hurt this causes. Wishing you genuinely good things.`,
    gemini: `Hey, I've been thinking a lot about us, and I want to be honest with you because you deserve that.\n\nI don't think this relationship is working for me, and I don't want to keep going and end up hurting you more down the line. You're a genuinely good person — this isn't about anything you did wrong.\n\nI care about you, which is why I'm telling you directly instead of pulling away. I'm sorry for the pain this causes. I hope you give yourself space to feel whatever you need to feel, and that things get easier for you soon.`,
    grok: `Hey. I've been trying to figure out how to say this, and I've decided the kindest thing is just to be straight with you.\n\nThis isn't working for me, and I don't see that changing. That's fully on me — you haven't done anything wrong. You're someone worth a lot, and you deserve someone who's certain, not someone who's unsure.\n\nI'm sorry. I hope you're okay.`,
    perplexity: `Effective breakup communication, according to relationship researchers, benefits from clarity, acknowledgment, and avoiding blame. Here's a message that incorporates those principles:\n\n"I've been thinking about us, and I want to be honest with you because I respect you. I don't think we're right for each other, and I think continuing would end up hurting us both more.\n\nThis isn't about anything you did wrong — you've shown up with care and that matters. I just don't feel the alignment we'd both need long-term.\n\nI'm sorry for the pain this causes. I genuinely hope you're okay."`,
  },
  {
    daysAgo: 3, category: 'opinion',
    prompt: "Is hustle culture a scam? Give me a hot take — something that would actually start an argument.",
    claude: `Hustle culture isn't a scam — it's a status game rebranded as productivity advice. The people selling it mostly already have money, resources, or a safety net, and they use "work ethic" as the explanation because it flatters them and because it sells. The real hustle mythology is convincing someone working three jobs to survive that they're on the same journey as a founder who raised $5M and chose to work 80 hours.`,
    chatgpt: `Hot take: hustle culture is only a scam if it's imposed on you. The real problem isn't people who love working 80-hour weeks — it's companies that use hustle mythology to normalise extracting maximum output for median pay, disguising exploitation as passion. Work hard if you want to. Just don't let someone else's work-as-identity crisis become your performance review.`,
    gemini: `Hustle culture was designed by and for people who have the privilege to choose how they spend their time. For most people — those without financial safety nets, without supportive families, without job security — "working 80 hours a week on your passion" is not a viable strategy. It's survivorship bias packaged as self-help, and it's most aggressively marketed to the people it will most harm.`,
    grok: `Hustle culture is a scam run on people who weren't already going to succeed anyway. Rich kids work hard and get called visionaries. Everyone else works hard and gets called employees. The outcome was mostly determined before the hustle started. The 5am routine didn't change that. Gary Vee is the best-case argument against his own advice.`,
    perplexity: `A Stanford study found productivity per hour drops sharply above 50 hours per week and plateaus entirely above 55 — meaning 70-hour weeks produce roughly the same output as 55-hour ones. The research on burnout, cognitive decline under chronic stress, and decision fatigue is unambiguous. Hustle culture isn't just ideologically questionable. It's empirically inefficient. The data says the optimal strategy is to take the weekend off.`,
  },
  {
    daysAgo: 4, category: 'roast',
    prompt: 'Roast someone who only drinks specialty coffee and never shuts up about it.',
    claude: `Ah yes, the person who turned a hot drink into a personality disorder. You spent $18 on a "naturally processed Ethiopian Yirgacheffe with notes of blueberry and jasmine" — which tastes exactly like burnt water, but you insist that's because my palate is "undeveloped."\n\nYou carry a ceramic travel cup to signal that plastic is beneath you, then spend 40 minutes describing your pour-over ratio to anyone who makes the mistake of asking how your morning is going. Your coffee guy has a name. You know his farm's elevation.\n\nThe rest of us just want caffeine and for you to please, for five consecutive minutes, talk about literally anything else.`,
    chatgpt: `Ah, the specialty coffee person. The one who looked at humanity's greatest invention and thought: this needs to be a whole thing.\n\nYou don't drink coffee. You curate it. You have a grinder that costs more than most people's rent, you describe flavor notes like you're testifying at a wine trial, and you've used the phrase "single origin" more times than you've said "I love you."\n\nYour coffee order isn't a drink — it's a TED Talk with a receipt. You've ruined every diner breakfast by quietly judging the coffee while loudly saying nothing.\n\nThe worst part? You're not even more caffeinated than anyone else. You're just like this naturally.`,
    gemini: `Let's talk about the person who discovered that coffee could be a moral failing and ran with it.\n\nYou've never just had a coffee. You've had a "lightly washed Kenyan processed at 1,900 meters with stone fruit on the finish." You bring your own beans to other people's houses. You've said the word "terroir" unironically in casual conversation. Twice.\n\nYour coffee journey has a chapter where you bought a $300 scale to weigh water. You look at a Starbucks the way a sommelier looks at a juice box.\n\nThe funniest part is that you're always tired. With all that artisanal excellence — you're still exhausted by 2pm. Maybe the Folgers crowd is onto something.`,
    grok: `You've turned caffeine dependency into a class war and somehow made yourself the villain.\n\nYou don't have a coffee habit. You have a $400/month ritual with opinions. You've explained the Maillard reaction at a party. You've said "this one drinks better at 71 degrees" without irony. You have a dedicated coffee drawer, a dedicated coffee shelf, and a dedicated coffee identity that you've inflicted on everyone who has ever made the mistake of asking if you want a cup.\n\nThe saddest part? You're still tired. You spent $1,200 on an espresso machine and you're still tired at 2pm. The Folgers guy is thriving. He doesn't know what a "bloom time" is and he has never been happier.`,
    perplexity: `I'll analyse this roast target systematically.\n\nYou've optimised your caffeine delivery mechanism to a degree that would impress aerospace engineers — and yet you remain 30% less productive than someone drinking gas station coffee from a styrofoam cup, because you spent 40 minutes on the grind setting.\n\nYou've read the SCA cupping protocols for fun. You have opinions about water hardness. You describe espresso shots the way wine critics describe $800 bottles, except the $800 bottle drinker has the social awareness to stop after one sentence.\n\nScientifically, caffeine is caffeine. Your $22 pour-over hits the same adenosine receptors as a Folgers K-Cup. Your palate is not special. Your audience is not interested. Your pour-over is taking 6 minutes. We're all standing here waiting for the meeting to start.`,
  },
  {
    daysAgo: 5, category: 'career',
    prompt: 'Write a LinkedIn post announcing you just got laid off. Make it real, not cringe.',
    claude: `Got laid off today. It was sudden and I'm still processing it, but I wanted to say it plainly rather than wrap it in corporate optimism.\n\nI'm proud of what I built at [Company] and genuinely grateful for the people I worked alongside. Now I'm looking for my next thing — [role], ideally in [industry]. If you know of something or want to connect, DMs are open.`,
    chatgpt: `I have some news to share: I was part of a layoff today at [Company]. It's bittersweet — I'm proud of what the team accomplished and genuinely grateful for the relationships I built there. That said, I'm now officially open to new opportunities in [field].\n\nIf you're hiring or know someone who is, I'd love to connect. And to the colleagues who made the work feel meaningful — thank you. It was more than a job. 🙏`,
    gemini: `Today marks the end of my time at [Company] after [X] years. While this transition wasn't planned, I'm choosing to approach it as an opportunity for what's next.\n\nI'm actively exploring roles in [field] and would welcome any introductions or conversations. To my former teammates: building alongside you was a genuine privilege.\n\nReady for the next chapter. #OpenToWork`,
    grok: `Laid off today. Good run at [Company] — learned a lot, met people worth keeping.\n\nNow looking. If you're building something interesting in [field] and need someone who [skill], my DMs are open. No lengthy post. Just: I'm available, I'm good at what I do, and I'd rather show you than tell you.`,
    perplexity: `LinkedIn data shows posts with specific skills and direct asks outperform vague "open to opportunities" posts by 340% in recruiter response rate. So, directly: I was laid off today.\n\nI'm a [title] with [X] years in [industry], specialising in [skill 1] and [skill 2]. Looking for [role type] at [company type]. If that matches what you're building, reach out.\n\nThat's the whole post.`,
  },
  {
    daysAgo: 6, category: 'writing',
    prompt: "Your partner just texted 'we need to talk' and then went offline for 3 hours. Write the text you'd send back.",
    claude: `Hey. I'm here whenever you're ready. Take your time.`,
    chatgpt: `Of course — I'm here whenever you're ready. No rush at all, just know I'm thinking about you 💙`,
    gemini: `Of course. I'm here whenever you want to talk — take all the time you need. Thinking of you 💙`,
    grok: `Ok. I'll be here.`,
    perplexity: `Acknowledged. Available when you are.`,
  },
];

function dateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function esc(s) { return s.replace(/'/g, "''"); }

const lines = [
  '-- GuessTheModel seed data (5 models)',
  '-- Generated: ' + new Date().toISOString(),
  '-- Paste into: Supabase dashboard → SQL editor → Run',
  '-- Each statement is idempotent: skips dates that already have a daily battle.',
  '',
];

for (const b of BATTLES) {
  const bd = dateStr(b.daysAgo);
  const outputs = JSON.stringify({
    modelA: { text: b.claude,     model_id: MODEL_IDS.claude     },
    modelB: { text: b.chatgpt,    model_id: MODEL_IDS.chatgpt    },
    modelC: { text: b.gemini,     model_id: MODEL_IDS.gemini     },
    modelD: { text: b.grok,       model_id: MODEL_IDS.grok       },
    modelE: { text: b.perplexity, model_id: MODEL_IDS.perplexity },
  });
  lines.push(`-- ${bd} · ${b.category}`);
  lines.push(`INSERT INTO battles (prompt, category, outputs, is_daily, battle_date)`);
  lines.push(`SELECT '${esc(b.prompt)}', '${b.category}', '${esc(outputs)}'::jsonb, true, '${bd}'`);
  lines.push(`WHERE NOT EXISTS (SELECT 1 FROM battles WHERE is_daily = true AND battle_date = '${bd}');`);
  lines.push('');
}

writeFileSync('supabase/seed.sql', lines.join('\n'));
console.log('Written to supabase/seed.sql');
