import { prisma } from "../src/lib/prisma";

/**
 * PLACEHOLDER video URLs - clearly named so they're easy to find/replace
 * once real lecture recordings exist. Everything else here is real,
 * substantive content, not filler.
 */
function placeholderVideo(lessonSlug: string) {
  return { url: `https://placeholder.stively.com/video-pending/fullstack-development/${lessonSlug}`, provider: "file" as const };
}

async function main() {
  const existing = await prisma.offering.findUnique({ where: { slug: "fullstack-development" } });
  if (existing) {
    console.log("fullstack-development already seeded - skipping. Delete it first if you want to reseed from scratch.");
    return;
  }

  const offering = await prisma.offering.create({
    data: {
      slug: "fullstack-development",
      title: "Fullstack Development",
      shortDescription: "Connect a real frontend to a real backend and ship one complete application, end to end - the part most courses skip.",
      longDescription:
        "Most people who've learned frontend and backend separately still freeze the first time they have to connect the two for real - auth across both sides, CORS errors that don't make sense, forms that submit into a void. This course is specifically about that connection: designing an API around what a real UI actually needs, wiring authentication end-to-end, handling loading and error states honestly, and shipping one real, complete application with both a live frontend and a live backend. This isn't Frontend and Backend glued together - it's the integration work neither of those covers on its own.",
      category: "TRAINING",
      audience: "STUDENT",
      status: "PUBLISHED",
      visible: true,
      purchaseFlow: "DIRECT_PAYMENT",
      price: 144900,
      currency: "INR",
      pricingType: "FIXED",
      duration: "8 Weeks",
      mode: "ONLINE",
      difficulty: "INTERMEDIATE",
      whatYoullLearn: [
        "Structure a real project where a frontend and an API live and deploy together",
        "Design API endpoints around what a real UI screen actually needs, not in isolation",
        "Wire authentication end-to-end - login, protected routes, and session/token handling on both sides",
        "Handle loading, error, and empty states honestly instead of assuming the happy path",
        "Debug across the stack when something breaks, and know which side to look at first",
        "Deploy a complete, connected application - frontend, backend, and database, all live",
      ],
      benefits: [
        "5 modules, 13 lessons, built around one real connected application, not isolated exercises",
        "MCQ checks after key lessons, a full capstone project at the end",
        "Lifetime access to course material and updates",
        "Certificate of completion",
      ],
      whoItsFor: [
        "Anyone who's learned frontend and backend separately but has never actually connected the two for real",
        "Developers who want to stop being stuck when a bug could be on either side of the stack",
      ],
      requirements: [
        "Basic familiarity with either frontend (HTML/CSS/JS) or backend (Node/Express) concepts - this course assumes some foundation, it's not an absolute-beginner course",
      ],
      curriculum: {
        modules: [
          { title: "How Frontend and Backend Actually Connect", topics: ["The Real Shape of a Fullstack App", "Setting Up a Connected Project", "Environment Variables & Config Across Both Sides"] },
          { title: "Building the API Your Frontend Will Actually Use", topics: ["Designing Endpoints Around Real UI Needs", "Handling Auth End-to-End", "CORS, Cookies, and Why 'It Works on My Machine' Breaks"] },
          { title: "Wiring the Frontend to Real Data", topics: ["Loading States and Error States That Don't Look Broken", "Optimistic Updates & Real-Time Feel", "Forms That Talk to a Real Backend"] },
          { title: "The Capstone Project", topics: ["Planning a Real Full-Stack Feature", "Building It End-to-End", "Deploying Both Sides for Real"] },
          { title: "Working Like a Real Team", topics: ["Debugging Across the Stack When Something Breaks"] },
        ],
      },
    },
  });

  const experience = await prisma.learningExperience.create({ data: { offeringId: offering.id } });

  type LessonSpec = {
    slug: string;
    title: string;
    summary: string;
    estimatedMinutes: number;
    reading: string;
    quiz?: { title: string; questions: { question: string; options: string[]; correctIndex: number }[] };
  };

  const modules: { title: string; lessons: LessonSpec[] }[] = [
    {
      title: "How Frontend and Backend Actually Connect",
      lessons: [
        {
          slug: "the-real-shape-of-a-fullstack-app",
          title: "The Real Shape of a Fullstack App",
          summary: "Two separate applications talking over HTTP - not one thing, and why that separation is the whole point.",
          estimatedMinutes: 18,
          reading:
            "## Two apps, not one\n\nA fullstack application is really two independent programs - a frontend (running in the user's browser) and a backend (running on a server), communicating entirely through HTTP requests. They can be deployed separately, scaled separately, and built by different people entirely, as long as they agree on the shape of the data passing between them.\n\n## Why this course exists\n\nLearning each side in isolation teaches you the syntax, but not the real friction: what happens when the frontend expects a field the backend doesn't send, how a login actually stays valid across page reloads, why a request that works in a testing tool fails from the real browser. That friction is what this course is actually about - the part that only shows up once both sides are real and connected.\n\n## What you'll build\n\nOver this course, you'll build one real connected application - a small project-tracking tool - with a real frontend, a real API, and a real database, ending with both sides deployed and genuinely talking to each other in production.",
        },
        {
          slug: "setting-up-a-connected-project",
          title: "Setting Up a Connected Project",
          summary: "Structuring a repo (or two) so your frontend and backend can develop and run together without fighting each other.",
          estimatedMinutes: 22,
          reading:
            "## One repo or two - both are real choices\n\nSome teams keep frontend and backend in one monorepo for easier shared types and single-PR changes; others keep them fully separate for independent deploys and clearer ownership. Neither is universally correct - what matters is that whichever you choose, both sides can run locally at the same time without port conflicts or config guesswork.\n\n## A real local setup\n\n```\nbackend  -> running on http://localhost:4000\nfrontend -> running on http://localhost:3000, calling the backend at :4000\n```\n\nGetting this running together locally - not just each side in isolation - is the first real milestone of this course. If you can start both, load your frontend, and see a real response from your own backend, everything after this lesson is building on solid ground.",
        },
        {
          slug: "env-vars-and-config-across-both-sides",
          title: "Environment Variables & Config Across Both Sides",
          summary: "Keeping your API's real URL, and every secret, out of code that ships to a user's browser.",
          estimatedMinutes: 20,
          reading:
            "## The rule that's easy to get backwards\n\nYour backend's environment variables (`DATABASE_URL`, `JWT_SECRET`) must never be reachable from frontend code - anything bundled into a frontend build ships to every visitor's browser, fully readable by them. Frontend environment variables are for things safe to be public (an API's base URL, a public analytics key), never for real secrets.\n\n```js\n// Frontend - fine, this is meant to be public\nconst API_URL = import.meta.env.VITE_API_URL;\n\n// Backend only - never reference this from frontend code\nconst dbUrl = process.env.DATABASE_URL;\n```\n\nMost frontend frameworks even enforce a naming convention (`VITE_`, `NEXT_PUBLIC_`) specifically so it's obvious at a glance which variables are safe to expose and which aren't - learn your framework's convention and never fight it.",
          quiz: {
            title: "Project Setup Check",
            questions: [
              {
                question: "Why must backend secrets like DATABASE_URL never be referenced from frontend code?",
                options: [
                  "It would slow down the frontend",
                  "Anything bundled into a frontend build ships to every visitor's browser and is fully readable by them",
                  "Frontend code can't read environment variables at all",
                  "There's no real risk, it's just a style preference",
                ],
                correctIndex: 1,
              },
              {
                question: "What's the main real difference between a monorepo and separate repos for frontend/backend?",
                options: [
                  "One of them is objectively wrong",
                  "A tradeoff between easier shared changes (monorepo) versus independent deploys and clearer ownership (separate repos)",
                  "Monorepos can't be deployed",
                  "Separate repos can't share a database",
                ],
                correctIndex: 1,
              },
            ],
          },
        },
      ],
    },
    {
      title: "Building the API Your Frontend Will Actually Use",
      lessons: [
        {
          slug: "designing-endpoints-around-real-ui-needs",
          title: "Designing Endpoints Around Real UI Needs",
          summary: "Building the API to match what a real screen needs to render, instead of designing it in isolation and hoping it fits.",
          estimatedMinutes: 24,
          reading:
            "## Start from the screen, not the database\n\nA common beginner mistake: design the API to mirror the database tables exactly, then discover the frontend needs three separate requests (and three loading states) just to render one screen. A better approach: look at the actual screen you're building, list exactly what data it needs, and shape the endpoint around that.\n\n## A real example\n\nA project dashboard screen needs: the project's name, its task count, and its most recent activity - three different underlying tables. Rather than three separate frontend requests, a single `GET /projects/:id/dashboard` endpoint that joins and shapes that data server-side means one request, one loading state, and a frontend that doesn't need to know how the data is actually stored.\n\nThis is the real skill this module builds: thinking about your API from the consumer's side, not just the database's side.",
        },
        {
          slug: "handling-auth-end-to-end",
          title: "Handling Auth End-to-End",
          summary: "Login on the frontend, a real session/token on the backend, and protected routes that actually enforce it on both sides.",
          estimatedMinutes: 28,
          reading:
            "## The full loop, not just one half\n\nAuth only really 'works' once you've connected every piece: a login form that submits real credentials, a backend that verifies them and issues a token/session, a frontend that stores and attaches that token to every subsequent request, and both a frontend route guard (for UX) and a backend check (for real security) protecting anything that shouldn't be public.\n\n## The mistake that undoes all of it\n\nA frontend-only route guard (hiding a page if you're not logged in) is a UX nicety, never security - anyone can call your API directly, bypassing your frontend entirely. Every protected backend endpoint needs its own real check, independent of whatever the frontend does or doesn't show. If the backend doesn't enforce it, it isn't actually protected.",
        },
        {
          slug: "cors-cookies-and-it-works-on-my-machine",
          title: "CORS, Cookies, and Why 'It Works on My Machine' Breaks",
          summary: "The real reason a request that works in Postman fails from your actual frontend, and how to fix it correctly.",
          estimatedMinutes: 26,
          reading:
            "## Why CORS exists\n\nBrowsers block a frontend running on one origin (`localhost:3000`) from calling a backend on a different origin (`localhost:4000`) unless that backend explicitly allows it - a real security boundary, not a bug you're hitting by accident. This is exactly why a request works fine from a tool like Postman (which isn't a browser, so it doesn't enforce this) but fails from your actual frontend.\n\n## The real fix\n\n```js\nconst cors = require('cors');\napp.use(cors({ origin: 'http://localhost:3000', credentials: true }));\n```\n\nSetting `origin: '*'` (allow everyone) is tempting and works, but it's the wrong fix for anything handling real user data or cookies - it defeats the actual purpose of the check. Naming your real allowed origin(s) explicitly is the correct fix, not a workaround.\n\n## Cookies specifically\n\nIf you're using cookie-based auth, `credentials: true` on both the CORS config and your frontend's fetch calls is required, or the cookie simply won't be sent - one of the single most common 'my login just silently doesn't work' bugs in a real connected app.",
          quiz: {
            title: "API Integration Check",
            questions: [
              {
                question: "Why does a request work in Postman but fail with a CORS error from your actual frontend?",
                options: [
                  "Postman is faster than a browser",
                  "Postman isn't a browser, so it doesn't enforce the browser's cross-origin security check the way your frontend does",
                  "CORS only applies to POST requests",
                  "It's a random bug with no real cause",
                ],
                correctIndex: 1,
              },
              {
                question: "Why is a frontend-only route guard not real security?",
                options: [
                  "It slows down the page",
                  "Anyone can call your API directly, bypassing the frontend entirely, so the backend must enforce access on its own",
                  "Frontend route guards don't exist",
                  "It only works in Chrome",
                ],
                correctIndex: 1,
              },
            ],
          },
        },
      ],
    },
    {
      title: "Wiring the Frontend to Real Data",
      lessons: [
        {
          slug: "loading-and-error-states-that-dont-look-broken",
          title: "Loading States and Error States That Don't Look Broken",
          summary: "Real backends are sometimes slow and sometimes fail - building a UI that's honest about both instead of assuming the happy path.",
          estimatedMinutes: 22,
          reading:
            "## The three real states of any data-driven screen\n\nEvery screen that loads real data has at least three states: loading, error, and success - and a surprising number of tutorials only ever build the third one. A screen that just shows a blank space while data loads, with no indication anything is happening, reads as broken to a real user even when it's technically working.\n\n```jsx\nif (isLoading) return <Spinner />;\nif (error) return <ErrorMessage message=\"Couldn't load your projects. Try again.\" />;\nif (data.length === 0) return <EmptyState message=\"No projects yet - create your first one.\" />;\nreturn <ProjectList projects={data} />;\n```\n\nThat's four states, not one - loading, error, empty, and real data - and a genuinely polished fullstack app handles all four deliberately, not just the last one.",
        },
        {
          slug: "optimistic-updates-and-real-time-feel",
          title: "Optimistic Updates & Real-Time Feel",
          summary: "Making an app feel instant by updating the UI before the server confirms - and handling it correctly when the server disagrees.",
          estimatedMinutes: 24,
          reading:
            "## Why waiting feels slow\n\nUpdating the UI only after a server response arrives means every action has a visible delay, even on a fast connection. An optimistic update flips the order: update the UI immediately as if the action succeeded, send the real request in the background, and only correct the UI if the server actually rejects it.\n\n```js\nfunction toggleTask(id) {\n  setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));\n  api.updateTask(id, { done: !currentDone }).catch(() => {\n    // revert on real failure\n    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: currentDone } : t));\n    showError('Could not update - try again.');\n  });\n}\n```\n\nThis is the exact pattern behind why checking off a task in a well-built app feels instant - the checkmark appears before the server has actually confirmed anything, with a real fallback if that confirmation never comes.",
        },
        {
          slug: "forms-that-talk-to-a-real-backend",
          title: "Forms That Talk to a Real Backend",
          summary: "Client-side validation for a good experience, server-side validation because the client can never be trusted - both, not either.",
          estimatedMinutes: 24,
          reading:
            "## Two layers, two different jobs\n\nClient-side validation exists to give a user immediate, friendly feedback - don't make them wait for a round-trip just to learn a field was required. Server-side validation exists because the client can be bypassed entirely (a direct API call, a modified request) - it's the only validation that actually protects your data.\n\n```jsx\n// Client-side: fast feedback\n<input required minLength={1} maxLength={200} />\n\n// Server-side: the real protection (same rule, enforced again)\nconst schema = z.object({ title: z.string().trim().min(1).max(200) });\n```\n\nThey should enforce the *same* real rules, not different ones - client-side validation you don't also enforce server-side isn't validation, it's a suggestion.",
          quiz: {
            title: "Frontend-Backend Wiring Check",
            questions: [
              {
                question: "What's the point of an optimistic update?",
                options: [
                  "It skips sending the real request entirely",
                  "It updates the UI immediately for a fast feel, then corrects it if the server actually rejects the change",
                  "It's only used for delete operations",
                  "It makes the server respond faster",
                ],
                correctIndex: 1,
              },
              {
                question: "Why is client-side form validation alone not enough?",
                options: [
                  "It's too slow",
                  "It can be bypassed entirely by a direct API call, so the server must enforce the same rules independently",
                  "Browsers don't support form validation",
                  "It's actually sufficient on its own",
                ],
                correctIndex: 1,
              },
            ],
          },
        },
      ],
    },
    {
      title: "The Capstone Project",
      lessons: [
        {
          slug: "planning-a-real-fullstack-feature",
          title: "Planning a Real Full-Stack Feature",
          summary: "Scoping the capstone: one real feature, planned end-to-end across both the API and the UI before writing code.",
          estimatedMinutes: 20,
          reading:
            "## Plan both sides before building either\n\nFor your capstone, you'll extend the project-tracking app built through this course with one complete new feature - project comments, for example. Before writing any code, plan: what does the API endpoint look like (request/response shape), what UI states does the screen need (loading/error/empty/real data), and what does auth/ownership enforcement look like (can only project members comment)?\n\nPlanning this on paper first - even briefly - is what separates a feature that comes together cleanly from one that requires rewriting the API halfway through because the UI needed something different than what was built.",
        },
        {
          slug: "building-it-end-to-end",
          title: "Building It End-to-End",
          summary: "Implementing the capstone feature across both sides - the real graded work for this course.",
          estimatedMinutes: 40,
          reading:
            "## What the capstone needs to include\n\n- A real new API endpoint (or set of endpoints), with proper auth/ownership checks and input validation\n- A real frontend screen or component consuming it, with honest loading/error/empty states\n- At least one place using an optimistic update where it genuinely improves the feel\n\n## Submitting\n\nSubmit a link to your repository, with both the frontend and backend changes for this feature - this is the single piece of work this course is really building toward, so take the time to make it real rather than rushed.",
        },
        {
          slug: "deploying-both-sides-for-real",
          title: "Deploying Both Sides for Real",
          summary: "Getting your complete application - frontend, backend, and database - live and actually connected in production.",
          estimatedMinutes: 30,
          reading:
            "## Production is a different environment, on purpose\n\nYour frontend's deployed build needs the *real* production API URL, not `localhost` - set via your hosting platform's environment variables, never hardcoded. Your backend's CORS config needs your real deployed frontend URL added, or the exact same CORS failure from Module 2 comes back in production.\n\n## The real deployment checklist\n\n- Backend deployed (Railway/Render/Fly.io) with real environment variables set there, not copied from your local `.env`\n- Database provisioned for production, not still pointing at your local one\n- Frontend deployed (Vercel/Netlify) with its API URL pointed at the real deployed backend\n- CORS on the backend updated to allow the real deployed frontend origin\n\nBefore considering this course complete: open your deployed frontend URL in an incognito window and actually use it, start to finish, exactly like a real first-time user would.",
        },
      ],
    },
    {
      title: "Working Like a Real Team",
      lessons: [
        {
          slug: "debugging-across-the-stack",
          title: "Debugging Across the Stack When Something Breaks",
          summary: "A real method for finding out whether a bug is frontend, backend, or the connection between them - not guessing.",
          estimatedMinutes: 26,
          reading:
            "## The question that narrows it down fast\n\nWhen something breaks in a connected app, the fastest path to a fix is answering one question first: did the request even leave the frontend correctly, did it arrive at the backend correctly, and did the response come back correctly? Your browser's Network tab answers all three in one place - the actual request sent, its status code, and its actual response body.\n\n## A real method, not guessing\n\n1. Check the Network tab: did the request fire, what status code came back, what's actually in the response?\n2. If the request never fired - it's a frontend bug (a broken click handler, a bad conditional)\n3. If it fired but got a 4xx/5xx - check your backend logs for what actually happened server-side\n4. If it succeeded but the UI still looks wrong - the bug is in how the frontend is using a correct response, not in the request/response cycle at all\n\nThis process turns 'something's broken, no idea where' into a specific, narrowed-down question in under a minute - the actual skill that separates confident fullstack debugging from guessing.",
          quiz: {
            title: "Final Course Check",
            questions: [
              {
                question: "What's the fastest first step when debugging a broken connected feature?",
                options: [
                  "Rewrite the whole feature from scratch",
                  "Check the browser's Network tab to see if the request fired, what status code came back, and what the response actually contains",
                  "Restart your computer",
                  "Assume it's always a backend bug",
                ],
                correctIndex: 1,
              },
              {
                question: "In production, why would a working local app suddenly show CORS errors?",
                options: [
                  "CORS only applies locally",
                  "The backend's CORS config needs the real deployed frontend origin added, not just the local one",
                  "Production servers don't support CORS",
                  "It's unrelated to CORS entirely",
                ],
                correctIndex: 1,
              },
            ],
          },
        },
      ],
    },
  ];

  let moduleOrder = 0;
  for (const mod of modules) {
    moduleOrder += 1;
    const createdModule = await prisma.module.create({ data: { learningExperienceId: experience.id, title: mod.title, order: moduleOrder } });

    let lessonOrder = 0;
    for (const lesson of mod.lessons) {
      lessonOrder += 1;
      const createdLesson = await prisma.lesson.create({
        data: {
          moduleId: createdModule.id,
          title: lesson.title,
          slug: lesson.slug,
          order: lessonOrder,
          summary: lesson.summary,
          estimatedMinutes: lesson.estimatedMinutes,
          requiresPreviousCompletion: true,
        },
      });

      await prisma.lessonBlock.create({
        data: { lessonId: createdLesson.id, type: "VIDEO", order: 1, title: "Watch", content: placeholderVideo(lesson.slug) },
      });

      await prisma.lessonBlock.create({
        data: { lessonId: createdLesson.id, type: "MARKDOWN", order: 2, title: "Reading material", content: { text: lesson.reading } },
      });

      if (lesson.quiz) {
        const assessment = await prisma.assessment.create({
          data: {
            title: lesson.quiz.title,
            type: "QUIZ",
            instructions: "Select the best answer for each question.",
            passingScore: 70,
            config: { questions: lesson.quiz.questions },
          },
        });
        await prisma.lessonBlock.create({
          data: { lessonId: createdLesson.id, type: "QUIZ", order: 3, assessmentId: assessment.id },
        });
      }

      await prisma.lessonBlock.create({
        data: { lessonId: createdLesson.id, type: "AI_CONVERSATION", order: lesson.quiz ? 4 : 3, title: "Ask the AI Tutor" },
      });
    }
  }

  console.log(JSON.stringify({ offeringId: offering.id, slug: offering.slug, learningExperienceId: experience.id }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
