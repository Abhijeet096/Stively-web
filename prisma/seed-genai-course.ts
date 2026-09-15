import { prisma } from "../src/lib/prisma";

/**
 * Real recorded lecture videos, already uploaded to Cloudinary (see
 * stively/course-videos/ - uploaded 2026-09-09 from the raw files at
 * D:\Stively\Gen ai video production cc\). Unlike the other 3 training
 * courses (Frontend/Backend/Fullstack), these are NOT placeholders.
 */
const VIDEO_URLS: Record<string, string> = {
  "introduction-to-generative-ai":
    "https://res.cloudinary.com/doascfnjv/video/upload/v1788977911/stively/course-videos/genai-introduction-to-generative-ai_nq9qfz.mp4",
  "understanding-llms-and-ai-assistants":
    "https://res.cloudinary.com/doascfnjv/video/upload/v1788977924/stively/course-videos/genai-understanding-llms-and-ai-assistants_cmw3zi.mp4",
  "prompt-engineering-fundamentals":
    "https://res.cloudinary.com/doascfnjv/video/upload/v1788977936/stively/course-videos/genai-prompt-engineering-fundamentals_lrah9c.mp4",
  "advanced-prompting-techniques":
    "https://res.cloudinary.com/doascfnjv/video/upload/v1788977948/stively/course-videos/genai-advanced-prompting-techniques_rfzh1x.mp4",
};

/**
 * Passing score: 50% - matches the explicit brief ("at least 3 questions
 * correct from 6") exactly, since 3/6 = 50%. Enforced for real by
 * isLessonBlockedByUnpassedQuiz (see queries.ts) - a student cannot mark a
 * module complete, and therefore cannot unlock the next one, until they
 * actually score >= this on the quiz. A failed attempt can be retried (see
 * AssessmentSubmissionForm's retry flow) - it is not a one-shot lockout.
 */
const PASSING_SCORE = 50;

async function main() {
  const existing = await prisma.offering.findUnique({ where: { slug: "generative-ai-prompt-engineering" } });
  if (existing) {
    console.log("generative-ai-prompt-engineering already seeded - skipping. Delete it first if you want to reseed from scratch.");
    return;
  }

  const offering = await prisma.offering.create({
    data: {
      slug: "generative-ai-prompt-engineering",
      title: "Generative AI & Prompt Engineering Certification",
      shortDescription: "Understand what Generative AI actually does, and learn to write prompts that get you real, useful results - not guesswork.",
      longDescription:
        "A practical, no-fluff course on Generative AI and prompt engineering. You'll start with what Generative AI actually is and how tools like ChatGPT, Claude, and Gemini work underneath, then move into real prompt-engineering skills - goals, context, constraints, output format, few-shot examples, structured output, task decomposition, prompt chaining, grounding, and evaluation. Every lesson is built around one real recorded lecture, a written summary you can revisit, and a short quiz you need to pass before moving on - so the certification actually reflects real understanding, not just watched-to-the-end.\n\nNew lessons are added regularly as the curriculum keeps growing - lifetime access means you get every update.",
      category: "TRAINING",
      audience: "STUDENT",
      status: "PUBLISHED",
      visible: true,
      // DIRECT_PAYMENT + FIXED, matching the other 3 training courses.
      // `price` is the list price and `discountPrice` what's actually
      // charged - every surface renders the payable amount with the list
      // price struck through and the computed "50% OFF" badge beside it.
      // promptsPackPrice adds the same one-fixed-optional checkout add-on
      // (100+ ready-to-use prompt templates) the guest-checkout flow already
      // supports - now reachable from the normal authenticated checkout too
      // (see createOrder/CheckoutButton).
      purchaseFlow: "DIRECT_PAYMENT",
      // Zero-login checkout: this course is sold straight off Instagram ads,
      // where sending a cold visitor to a sign-in screen before they've paid
      // is the single biggest drop-off in the funnel. Name/email/phone are
      // captured on the checkout form itself and the account is created
      // silently after payment succeeds (see fulfillGuestOrder).
      allowsGuestCheckout: true,
      // Founding-price discount (AD-024, cadence refined in AD-028): 1999 is
      // the real full price, 499 is what's actually charged while the
      // recurring 110-minute cycle is active - both enforced server-side
      // (getOfferingPayablePrice), not just display copy. saleCycleMinutes
      // (not saleEndsAt) so the discount needs no manual upkeep to keep
      // recurring.
      price: 199900,
      discountPrice: 49900,
      saleCycleMinutes: 110,
      // Either/or upsell (AD-025): 99 for the 100-pack, 199 for the 500-pack
      // - the same real price each already has standalone in the Digital
      // Store (100-practical-ai-prompts / 500-ai-prompt-templates), not a
      // separately invented bundle price. Fixed the pre-existing drift here
      // too: this was 19900 (199) while production actually had 9900 (99)
      // set directly - a fresh reseed would have silently doubled the price
      // customers were actually being charged.
      promptsPackPrice: 9900,
      promptsPack500Price: 19900,
      pricingType: "FIXED",
      currency: "INR",
      // The current flagship course - drives the Bestseller badge and the
      // featured slot on /training.
      featured: true,
      tags: ["AI & Prompting"],
      duration: "Ongoing",
      mode: "ONLINE",
      difficulty: "BEGINNER",
      whatYoullLearn: [
        "What Generative AI actually is, and how it's different from traditional AI",
        "What's really happening behind tools like ChatGPT, Claude, and Gemini",
        "How to write prompts with a clear goal, the right context, useful constraints, and a usable output format",
        "Advanced techniques: few-shot examples, structured output, breaking tasks into steps, prompt chaining, grounding, and evaluation criteria",
        "How to tell when AI output can be trusted, and when to verify it yourself",
      ],
      benefits: [
        "Real recorded lectures, written notes, and a graded quiz for every lesson",
        "Must pass each quiz (3 of 6 correct) to unlock the next lesson - a real check, not just watch-and-click-next",
        "Lifetime access to course material and every future update",
        "Certificate of completion",
      ],
      whoItsFor: [
        "Students and professionals who already use ChatGPT or similar tools but want to actually understand what they're doing",
        "Anyone who wants prompting skills that transfer across AI tools, not tied to one specific product",
      ],
      requirements: ["A laptop/desktop with a modern browser", "Access to any AI assistant (ChatGPT, Claude, Gemini, or similar) for the practice activities"],
      // 8 modules total - matches the real course outline. Only modules 1-4
      // have recorded lessons below (real video + quiz); 5-8 are added as
      // empty Module rows by a one-off migration (not this seed, which only
      // ever runs once against an empty DB - see the `existing` guard
      // above), so they show as real, correctly-titled "Coming soon" rows
      // instead of being left out of the course outline entirely. A Module
      // with zero Lessons is inert to progress/unlock/certificate logic
      // (see lib/progress.ts's flattenLessons) - purely a display entry
      // until its lesson is recorded.
      curriculum: {
        modules: [
          { title: "Introduction to Generative AI", topics: ["What Generative AI is", "Where it fits vs. traditional AI", "What it can create", "The instruction loop"] },
          { title: "Understanding LLMs & AI Assistants", topics: ["AI assistant vs. AI model", "What LLM means", "Tokens and training", "Why context matters"] },
          { title: "Prompt Engineering Fundamentals", topics: ["Goal, context, constraints, output format", "Role and audience", "Iterating on a prompt"] },
          { title: "Advanced Prompting Techniques", topics: ["Few-shot prompting", "Structured output", "Task decomposition", "Prompt chaining", "Grounding", "Evaluation"] },
          { title: "AI for Study, Work & Productivity", topics: ["Studying with AI as a loop, not a summarizer", "AI as a writing partner", "Turning repetitive work into reusable workflows", "Research and document-grounded answers"] },
          { title: "AI for Coding & Technical Work", topics: ["Understanding unfamiliar code", "Generating and reviewing small changes", "Debugging with real evidence", "Refactoring, tests, and documentation"] },
          { title: "AI for Content, Business & Real-World Workflows", topics: ["Content creation and transformation", "Business research and documents", "Customer support with a human checkpoint", "Designing a repeatable workflow"] },
          { title: "Applying AI: Workflows, Responsibility & Final Assessment", topics: ["Building a complete AI workflow", "Human-in-the-loop and evaluation criteria", "Responsible AI use", "Practical tasks and final assessment"] },
        ],
      },
    },
  });

  const experience = await prisma.learningExperience.create({
    data: { offeringId: offering.id, title: "Generative AI & Prompt Engineering Certification" },
  });

  interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
  }
  interface ModuleSpec {
    slug: string;
    title: string;
    summary: string;
    estimatedMinutes: number;
    reading: string;
    quiz: QuizQuestion[];
  }

  const modules: ModuleSpec[] = [
    {
      slug: "introduction-to-generative-ai",
      title: "Introduction to Generative AI",
      summary: "What Generative AI actually is, how it differs from traditional AI, and the instruction loop behind every good result.",
      estimatedMinutes: 20,
      reading:
        "## What is Generative AI?\n\nArtificial Intelligence is a broad field - systems that perform tasks normally requiring human intelligence, like recognizing patterns, understanding language, or making decisions. Generative AI is one part of this larger field: the part that generates or transforms content - text, images, audio, or video - from an instruction.\n\nA simple way to see where it fits: **Artificial Intelligence** is the broadest area, **Machine Learning** is one part of AI, **Deep Learning** is a specialized area within machine learning, and **Generative AI** refers to systems built to generate new content. You don't need to memorize this hierarchy - what matters is the layer you actually interact with.\n\n## What makes it different from traditional AI?\n\nTraditional AI is often used to classify, predict, recommend, or decide - is this email spam, will this customer leave, what should we recommend next. Generative AI does something different: instead of only telling us what category something belongs to, it can actually **create** a response - a product description, a rewritten article, a first draft.\n\n## What can it create?\n\nText is what most people encounter first - emails, summaries, explanations. But Generative AI can also create images, work with audio (including speech), and generate video. The specific tools will keep changing, but the underlying idea stays the same: you give instructions, and the system generates or transforms content based on them.\n\n## Where people already use it\n\nStudents use it to explain difficult topics or create practice questions. Professionals draft emails and reports. Developers understand code and debug. Creators get ideas and captions. Businesses use it for research and support responses. For careers, it helps with resume drafts and interview prep. It's not about one profession - the same technology supports very different kinds of work.\n\n## The instruction loop\n\nThink of using Generative AI as a loop, not a one-shot request: you know your goal, you give the AI a prompt, it gives you an output, you review that output, and based on what you see, you refine your instruction. People sometimes expect one perfect prompt to give a perfect answer immediately - that's usually not how it works. Good results often come from a few rounds: ask, review, improve, ask again.\n\n## What it's good at - and where it can be wrong\n\nGenerative AI is particularly strong at **drafting** (a first version of an email, article, or outline), **transforming information** (summarizing, rewriting, reformatting), and **brainstorming** (ideas, alternatives, variations). Think of it as a very fast collaborator, not something that magically does everything.\n\nBut it can also be wrong. It can invent facts or sources that don't exist, misunderstand context, and - this is the important part - an incorrect answer can still sound very confident. The AI doesn't automatically know it's wrong just because the answer sounds convincing. The rule to remember: **use AI to accelerate your work, but don't outsource your judgment.** For anything important, verify the result.\n\n## Why the way you ask matters\n\nCompare 'Write something about internships' with a version that specifies the audience, length, and format. The first leaves the AI guessing on almost everything. The second removes that guesswork. That's the whole reason prompt engineering - which we cover starting next lesson - actually matters: the way you communicate the task directly affects the output you get.",
      quiz: [
        {
          question: "What's the key difference between Generative AI and traditional AI systems (like spam filters or recommendation engines)?",
          options: [
            "Generative AI is faster at making predictions",
            "Generative AI creates new content instead of only classifying, predicting, or recommending",
            "Generative AI only works with images, not text",
            "There is no real difference between them",
          ],
          correctIndex: 1,
        },
        {
          question: "In the AI hierarchy described in the lesson, which is the broadest category?",
          options: ["Generative AI", "Deep Learning", "Artificial Intelligence", "Machine Learning"],
          correctIndex: 2,
        },
        {
          question: "According to the lesson, what should you do with AI-generated information before relying on it for something important?",
          options: [
            "Trust it completely if it sounds confident",
            "Verify it - AI can sound confident and still be wrong",
            "Nothing, AI is always accurate",
            "Ask a different AI tool the exact same question",
          ],
          correctIndex: 1,
        },
        {
          question: "The lesson describes using Generative AI as a loop. What comes right after you give the AI a prompt?",
          options: [
            "You immediately refine the prompt",
            "The AI gives you an output, which you then review",
            "You switch to a different AI tool",
            "The task is automatically complete",
          ],
          correctIndex: 1,
        },
        {
          question: "Why is 'Write something about internships' a weak prompt, according to the lesson?",
          options: [
            "It's too short to process",
            "It leaves too much for the AI to guess - audience, length, purpose, and format",
            "AI can't write about internships",
            "It doesn't use the word 'please'",
          ],
          correctIndex: 1,
        },
        {
          question: "Which of these is Generative AI good at, per the lesson?",
          options: [
            "Drafting a first version of something (email, article, outline)",
            "Guaranteeing every fact it states is correct",
            "Reading your mind about what you actually want",
            "Replacing your own judgment entirely",
          ],
          correctIndex: 0,
        },
      ],
    },
    {
      slug: "understanding-llms-and-ai-assistants",
      title: "Understanding LLMs & AI Assistants",
      summary: "The difference between an AI assistant and the model behind it, what LLM means, and why context changes the answer you get.",
      estimatedMinutes: 18,
      reading:
        "## AI assistant vs. AI model\n\nAn AI assistant and an AI model are not the same thing. The **assistant** is the product you interact with - the chat interface, file uploads, tools, settings. Behind that sits a **model** that actually processes the language and generates the response. In simple terms: you use the assistant, and the assistant uses a model.\n\n## What does LLM mean?\n\nLLM stands for **Large Language Model**. Large means it's trained on a very large amount of data. Language means its main job is understanding and generating human language. Model means it's a trained system that uses what it learned to produce an output from an input. You don't need to memorize the definition - just remember that an LLM learns patterns in language and uses those patterns to generate a response.\n\nText isn't processed exactly the way we read it - it's broken into smaller pieces called **tokens** before the model works with it. You don't need to manage tokens manually, but it's useful to know this is happening, especially later when thinking about prompt length.\n\nTraining happens beforehand: the model learns patterns from large collections of data and adjusts its internal parameters during training. Your actual conversation happens later, at runtime, using what it already learned.\n\n## Why context matters\n\nThe AI doesn't only look at the last sentence you typed - it can use previous messages, attached information, instructions, and constraints. All of that helps it understand what you're actually asking. Importantly: **more context doesn't mean more text. It means more relevant information.**\n\nTwo prompts asking for the same thing (an email about an internship) can produce very different results depending on how much useful context - who you're writing to, what happened, what you actually want to know - is included. The request hasn't changed; the context and specificity have.\n\n## Why outputs can vary\n\nGenerative AI isn't a search box where the same input always gives exactly the same result. For an open-ended request, the model may generate different valid responses each time. Don't expect identical wording every time - what matters is whether the response actually satisfies the task.\n\n## One model, many tasks\n\nThe same model can explain something, transform information, create content, compare options, extract details, or help with code. It hasn't become six different tools - you're directing the same language capability toward different goals.\n\n## Confident, and still wrong\n\nAn AI can produce an answer that sounds extremely confident and still be incorrect - it might invent details, misunderstand a vague request, or simply not know information you never provided. For current or important information, verify using reliable sources. Same rule as last lesson: **use AI to accelerate your work, not to outsource your judgment.**\n\n## The full picture\n\nStart with your goal, write your prompt, give the AI relevant context, look at the output, and review it - is it useful, correct, does it meet your goal? That review step is the foundation of the prompting skills covered in the next two lessons.",
      quiz: [
        {
          question: "What's the relationship between an AI assistant and an AI model?",
          options: [
            "They're exactly the same thing",
            "The assistant is the product you interact with; the model behind it actually generates the response",
            "The model is the chat interface, and the assistant is the training data",
            "An assistant has no model behind it",
          ],
          correctIndex: 1,
        },
        {
          question: "What does the 'L' in LLM stand for?",
          options: ["Logical", "Large", "Learning", "Linear"],
          correctIndex: 1,
        },
        {
          question: "What are the small pieces that text gets broken into before an LLM processes it?",
          options: ["Tokens", "Fragments", "Bytes", "Phrases"],
          correctIndex: 0,
        },
        {
          question: "According to the lesson, what does 'more context' actually mean?",
          options: ["Typing a much longer message", "More relevant information, not more text", "Repeating your question several times", "Using more technical vocabulary"],
          correctIndex: 1,
        },
        {
          question: "Why might the same AI give slightly different wording for the same open-ended prompt asked twice?",
          options: [
            "It's a bug that should be reported",
            "Generative AI isn't a search box - it can generate different valid responses to open-ended requests",
            "It only happens with images, never text",
            "It means the AI is broken",
          ],
          correctIndex: 1,
        },
        {
          question: "What does the lesson say about an AI's confident-sounding answers?",
          options: [
            "A confident tone always means the answer is correct",
            "An answer can sound extremely confident and still be wrong",
            "AI is never confident about anything",
            "Only short answers can be wrong",
          ],
          correctIndex: 1,
        },
      ],
    },
    {
      slug: "prompt-engineering-fundamentals",
      title: "Prompt Engineering Fundamentals",
      summary: "The four building blocks of a clear prompt - goal, context, constraints, and output format - and why prompting is an iterative process.",
      estimatedMinutes: 20,
      reading:
        "## A prompt is more than a question\n\nA common beginner mistake is thinking a prompt is simply a question. It can be, but it can also be a complete task. A useful prompt tells the AI what job to perform, gives it the context it needs, sets any important boundaries, and says what kind of output you want. Instead of 'I'm asking AI a question,' think: **I'm giving AI a task brief.**\n\n## The four building blocks\n\n**Goal** - decide what you actually want before writing the prompt. 'Help me with my resume' is too open-ended: reviewed? rewritten? tailored for a job? Define the exact result you need first.\n\n**Context** - tells the AI the situation. 'Explain APIs' leaves a lot open; 'explain APIs to a second-year CS student who already knows JavaScript' gives the AI something to work with. Context doesn't mean adding every detail you know - give the information that actually changes the answer.\n\n**Constraints** - the boundaries around the task: length, audience, restricted information, style. 'Keep it under 120 words' immediately removes a lot of unnecessary output. Add a constraint when it prevents a problem you'd otherwise have to fix later.\n\n**Output format** - tell the AI what the final answer should look like. Instead of 'give me ideas for improving my productivity,' ask for a specific structure: the problem, why it happens, three fixes, one action for today. Same task, much easier to scan and use.\n\n## Role and audience\n\nAdding 'act as an expert' doesn't magically make the answer better - a role is only useful when that perspective actually changes the response (e.g. reviewing a feature from a product manager's viewpoint). Audience matters more directly: the same topic needs different explanations for a beginner versus an experienced developer.\n\n## Putting it together - and a reusable pattern\n\nA strong prompt doesn't have to be huge - it just needs the right information. A simple framework: **what do I need? what should the AI know? what rules matter? what should the answer look like?** Don't treat this as a rigid formula where every prompt needs all four - use the parts that actually matter for the task.\n\n## Prompting is iterative\n\nYou don't need the perfect prompt on your first attempt. A realistic process: ask, review the result, notice what's missing, refine the prompt, try again. The first response gives you information about how to improve the next instruction.\n\n## What to avoid\n\nThere's a myth that longer prompts are automatically better - they're not. A vague prompt gives too little direction. A prompt full of irrelevant details buries the useful information. Conflicting instructions create confusion. And sometimes the real issue is simply never telling the AI what kind of result you actually wanted. The goal isn't more words - it's more useful information. Focus on defining the result you want, not on making the prompt sound impressive.",
      quiz: [
        {
          question: "According to the lesson, a prompt is best thought of as:",
          options: [
            "Always a simple question",
            "A task brief - what to do, context, boundaries, and desired output",
            "A magic phrase that must be exact",
            "Something that should always be as short as possible",
          ],
          correctIndex: 1,
        },
        {
          question: "Which of these is NOT one of the four building blocks of a clear prompt covered in the lesson?",
          options: ["Goal", "Context", "Constraints", "Model temperature"],
          correctIndex: 3,
        },
        {
          question: "Does adding 'Act as an expert' to a prompt automatically make the AI's answer better?",
          options: [
            "Yes, it always improves every answer",
            "No - a role only helps when that perspective actually changes the response",
            "Only if you also add 'please'",
            "Yes, but only for coding questions",
          ],
          correctIndex: 1,
        },
        {
          question: "What is the reusable prompt framework taught in this lesson?",
          options: [
            "Longer is always better",
            "What do I need? What should the AI know? What rules matter? What should the answer look like?",
            "Always start with 'Act as an expert'",
            "Only ever ask one-word prompts",
          ],
          correctIndex: 1,
        },
        {
          question: "True or false: a longer prompt is always a better prompt.",
          options: ["True - more words always help", "False - the goal is useful information, not more words", "True, but only for image prompts", "False, prompts should always be under 5 words"],
          correctIndex: 1,
        },
        {
          question: "What's the recommended process when your first prompt doesn't give a great result?",
          options: [
            "Give up and do the task yourself",
            "Review the result, notice what's missing, refine the prompt, and try again",
            "Repeat the exact same prompt until it works",
            "Switch to a completely unrelated topic",
          ],
          correctIndex: 1,
        },
      ],
    },
    {
      slug: "advanced-prompting-techniques",
      title: "Advanced Prompting Techniques",
      summary: "Few-shot examples, structured output, breaking tasks into steps, prompt chaining, grounding, and evaluating results against real criteria.",
      estimatedMinutes: 22,
      reading:
        "## From good prompts to better systems\n\nAdvanced prompting doesn't mean writing a huge paragraph - it's about giving the AI a better process to follow. Sometimes that's an example, sometimes a structured output, sometimes breaking one large task into smaller steps. The goal is more control over the task and result, not more words.\n\n## Few-shot prompting\n\nSometimes explaining a pattern with words isn't enough - showing a few examples works better. To classify support messages, instead of only describing the categories, show examples: 'I cannot log in' maps to Login, 'My payment failed' maps to Billing. The important part is **consistency** - if your examples follow one pattern, the AI can learn it; if your examples contradict each other, you're effectively teaching it two different rules.\n\n## Structured output\n\nIf you ask 'What do you think about this resume?' for ten different resumes, every answer may come back in a different format, making comparison hard. Instead, define the structure you want - strengths, weaknesses, missing information, improvements, next action. Structured output is especially useful when the result will be copied, compared, or reused.\n\n## Breaking tasks into smaller parts, and chaining them\n\nSome tasks are too broad to handle as one instruction - a product launch plan, for example, is easier as: first understand the customer, then define the offer, then plan the channels, then review. **Prompt chaining** takes this further: one AI interaction produces something that becomes the input for the next. Raw interview notes → extract key points → group into themes → turn into a report. This is useful when each stage has a different job and you want to inspect intermediate results rather than jumping straight to a final answer.\n\n## Handling ambiguity, and grounding answers\n\nIf you say 'Plan my trip to Goa,' the AI doesn't know your dates, budget, or travel style - it has to guess. A better approach: tell it to ask a few clarifying questions first, rather than build an answer on wrong assumptions.\n\nSometimes you don't want the AI relying on general knowledge - you want it working from a specific source (a policy document, research notes, a spec). Provide that material and tell the AI to use only the supplied information, clearly stating when something isn't available. This makes the answer traceable - but grounding doesn't automatically make the source itself correct.\n\n## Evaluating the output\n\nInstead of asking 'is this good?', first decide what 'good' actually means - is it accurate, relevant, in the right format, the right tone? Once those criteria are defined, checking AI output becomes far more consistent. You can even give those criteria directly to the AI and ask it to review its own draft before finalizing - the important part isn't the phrase 'check your work,' it's the specific criteria you give it to check against.\n\n## Combine only when it helps\n\nYou don't have to use only one technique - a demanding task might combine several. But don't add techniques just because they sound advanced. Common mistakes: too many unrelated instructions, conflicting examples, a simple task forced through a complicated workflow, and no evaluation criteria at all. The rule to remember: **use the simplest technique that gives you the control you need.**",
      quiz: [
        {
          question: "What is 'few-shot prompting'?",
          options: [
            "Asking the AI very short questions",
            "Giving the AI a small number of examples so it can learn the pattern you want",
            "Only using AI a few times per day",
            "Asking five questions at once",
          ],
          correctIndex: 1,
        },
        {
          question: "Why does consistency matter when giving few-shot examples?",
          options: [
            "It doesn't matter at all",
            "Contradicting examples effectively teach the AI two different, conflicting rules",
            "Consistent examples make the AI respond faster",
            "It only matters for image generation",
          ],
          correctIndex: 1,
        },
        {
          question: "What is 'prompt chaining'?",
          options: [
            "Asking the same question to multiple AI tools",
            "One AI interaction's output becomes the input for the next step",
            "Linking multiple unrelated prompts together randomly",
            "A way to make prompts shorter",
          ],
          correctIndex: 1,
        },
        {
          question: "What does 'grounding' an AI's answer mean?",
          options: [
            "Making the AI respond only using specific supplied information, not just general knowledge",
            "Making the AI's response as short as possible",
            "Turning off the AI's ability to make mistakes",
            "Asking the AI to ground (deny) a request",
          ],
          correctIndex: 0,
        },
        {
          question: "Before asking 'is this AI output good?', what does the lesson say you should do first?",
          options: [
            "Nothing - just trust your gut feeling",
            "Define what 'good' actually means - clear evaluation criteria like accuracy, relevance, and format",
            "Ask a different AI tool to compare",
            "Assume it's good if it's long enough",
          ],
          correctIndex: 1,
        },
        {
          question: "What's the main rule for using advanced prompting techniques, according to the lesson?",
          options: [
            "Always use every technique on every prompt",
            "Use the simplest technique that gives you the control you actually need",
            "Advanced techniques should only be used by experts",
            "More techniques always produce better results",
          ],
          correctIndex: 1,
        },
      ],
    },
  ];

  let moduleOrder = 0;
  for (const mod of modules) {
    moduleOrder += 1;
    const createdModule = await prisma.module.create({
      data: { learningExperienceId: experience.id, title: mod.title, order: moduleOrder },
    });

    const createdLesson = await prisma.lesson.create({
      data: {
        moduleId: createdModule.id,
        title: mod.title,
        slug: mod.slug,
        order: 1,
        summary: mod.summary,
        estimatedMinutes: mod.estimatedMinutes,
        requiresPreviousCompletion: true,
      },
    });

    await prisma.lessonBlock.create({
      data: {
        lessonId: createdLesson.id,
        type: "VIDEO",
        order: 1,
        title: "Watch",
        content: { url: VIDEO_URLS[mod.slug], provider: "file" },
      },
    });

    await prisma.lessonBlock.create({
      data: {
        lessonId: createdLesson.id,
        type: "MARKDOWN",
        order: 2,
        title: "Reading material",
        content: { text: mod.reading },
      },
    });

    const assessment = await prisma.assessment.create({
      data: {
        title: `${mod.title} - Quiz`,
        type: "QUIZ",
        instructions: "Answer all 6 questions. You need at least 3 correct to unlock the next lesson - you can retry if you don't pass.",
        passingScore: PASSING_SCORE,
        config: { questions: mod.quiz } as never,
      },
    });
    await prisma.lessonBlock.create({
      data: { lessonId: createdLesson.id, type: "QUIZ", order: 3, assessmentId: assessment.id },
    });

    await prisma.lessonBlock.create({
      data: { lessonId: createdLesson.id, type: "AI_CONVERSATION", order: 4, title: "Ask the AI Tutor" },
    });
  }

  console.log(JSON.stringify({ offeringId: offering.id, slug: offering.slug, learningExperienceId: experience.id }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
