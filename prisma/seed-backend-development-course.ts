import { prisma } from "../src/lib/prisma";

/**
 * PLACEHOLDER video URLs - clearly named so they're easy to find/replace
 * once real lecture recordings exist. Everything else here is real,
 * substantive content, not filler.
 */
function placeholderVideo(lessonSlug: string) {
  return { url: `https://placeholder.stively.com/video-pending/backend-development/${lessonSlug}`, provider: "file" as const };
}

async function main() {
  const existing = await prisma.offering.findUnique({ where: { slug: "backend-development" } });
  if (existing) {
    console.log("backend-development already seeded - skipping. Delete it first if you want to reseed from scratch.");
    return;
  }

  const offering = await prisma.offering.create({
    data: {
      slug: "backend-development",
      title: "Backend Development",
      shortDescription: "Build real APIs, work with a real database, and handle auth and security the way production code actually needs to.",
      longDescription:
        "A backend course built around what a real server actually has to do - not just routes that return JSON, but the auth, validation, error handling, and security decisions that separate a working demo from something you'd trust with real users' data. You'll build a real Express API backed by a real Postgres database, with proper authentication, input validation, and error handling throughout - the same shape of decisions you'd make on a real production backend.",
      category: "TRAINING",
      audience: "STUDENT",
      status: "PUBLISHED",
      visible: true,
      purchaseFlow: "DIRECT_PAYMENT",
      price: 124900,
      currency: "INR",
      pricingType: "FIXED",
      duration: "7 Weeks",
      mode: "ONLINE",
      difficulty: "BEGINNER",
      whatYoullLearn: [
        "Build a real REST API with Node.js and Express, designed around how it'll actually be used",
        "Work with a real Postgres database - schema design, queries, and migrations",
        "Implement authentication properly: password hashing, sessions/tokens, and why 'just store the password' is never the answer",
        "Validate input you can't trust, and handle errors without leaking what's actually going wrong internally",
        "Deploy a real backend with proper environment config and logging",
      ],
      benefits: [
        "5 modules, 14 lessons, built around one real API you build progressively",
        "MCQ checks after key lessons, a real project submission at the end",
        "Lifetime access to course material and updates",
        "Certificate of completion",
      ],
      whoItsFor: [
        "Beginners who want to understand what actually happens behind an API, not just how to call one",
        "Frontend developers who want to stop being blocked waiting on 'the backend team'",
      ],
      requirements: ["A laptop/desktop with a modern browser and terminal access", "Basic JavaScript familiarity is helpful but not required - covered in Module 1"],
      curriculum: {
        modules: [
          { title: "Node.js & Server Fundamentals", topics: ["What a Backend Actually Does", "Node.js & npm Essentials", "Building Your First Express Server"] },
          { title: "APIs & Data", topics: ["REST API Design That Doesn't Fight You Later", "Working With a Real Database", "Validating Input You Can't Trust"] },
          { title: "Authentication & Security", topics: ["Sessions, Tokens, and What Actually Keeps Users Logged In", "Hashing Passwords the Right Way", "Common Vulnerabilities and How to Not Ship Them"] },
          { title: "Real-World Backend Patterns", topics: ["Error Handling That Doesn't Leak Secrets", "Background Jobs & Webhooks", "Building a Real API From Scratch"] },
          { title: "Shipping a Backend", topics: ["Environment Config, Logging & Deployment"] },
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
      title: "Node.js & Server Fundamentals",
      lessons: [
        {
          slug: "what-a-backend-actually-does",
          title: "What a Backend Actually Does",
          summary: "The real job of a server: receive a request, do something trustworthy with it, send back a response.",
          estimatedMinutes: 18,
          reading:
            "## The job, stripped down\n\nEvery backend, no matter how complex, is doing one of a small number of things: reading data, writing data, checking whether you're allowed to do either, or coordinating with another service. Everything else - frameworks, ORMs, middleware - exists to make those four things safer and less repetitive to write correctly.\n\n## Why it can't live in the browser\n\nAnything that runs in a user's browser can be read, modified, or bypassed by that user - that's not a flaw, it's just what 'client-side' means. A backend exists specifically because some decisions (is this password correct, does this user own this order, what's the real price of this item) can't be trusted to code the user controls. That's the entire reason a separate, server-side system exists at all.\n\n## What we're building toward\n\nOver this course you'll build one real API - a small task-management backend - progressively, module by module, ending with real authentication, real validation, and a real deployed URL.",
        },
        {
          slug: "nodejs-and-npm-essentials",
          title: "Node.js & npm Essentials",
          summary: "Running JavaScript outside the browser, and managing the packages a real project depends on.",
          estimatedMinutes: 20,
          reading:
            "## JavaScript, minus the browser\n\nNode.js runs JavaScript outside a browser - no `window`, no DOM, but with things a server actually needs: file system access, network sockets, and the ability to stay running and respond to requests indefinitely.\n\n## npm: your project's real dependency list\n\n```bash\nnpm init -y\nnpm install express\n```\n\n`package.json` is the real, checked-in record of exactly what your project depends on and which versions - `node_modules` itself never gets committed to version control, since it can always be rebuilt from `package.json` with `npm install`. Getting comfortable with this distinction early avoids a lot of confusion later about what actually needs to be shared vs. regenerated.",
        },
        {
          slug: "building-your-first-express-server",
          title: "Building Your First Express Server",
          summary: "A real, running Express server with your first route - the foundation everything else in this course builds on.",
          estimatedMinutes: 25,
          reading:
            "## A real minimal server\n\n```js\nconst express = require('express');\nconst app = express();\napp.use(express.json());\n\napp.get('/tasks', (req, res) => {\n  res.json({ tasks: [] });\n});\n\napp.listen(3000, () => console.log('Server running on port 3000'));\n```\n\n## What each piece is actually doing\n\n- `express.json()` - without this, `req.body` on a POST request would just be undefined; this middleware is what parses an incoming JSON body into something you can actually use\n- `app.get('/tasks', ...)` - registers a route: this specific URL, this specific HTTP method, this specific handler function\n- `res.json(...)` - sends a response with the right `Content-Type` header set automatically, not something you should be setting by hand\n\nThis is the exact skeleton the task-management API you'll build over this course starts from.",
          quiz: {
            title: "Server Fundamentals Check",
            questions: [
              {
                question: "Why can't sensitive logic (like checking a password) be trusted to run only in the browser?",
                options: [
                  "Browsers are too slow",
                  "Anything running in the browser can be read or modified by the user, so it can't be trusted to enforce real rules",
                  "Browsers don't support JavaScript",
                  "It's just a convention, there's no real reason",
                ],
                correctIndex: 1,
              },
              {
                question: "What does `express.json()` middleware actually do?",
                options: [
                  "Converts your server to run faster",
                  "Parses an incoming JSON request body so you can read it from req.body",
                  "Formats your server's console logs",
                  "Encrypts outgoing responses",
                ],
                correctIndex: 1,
              },
            ],
          },
        },
      ],
    },
    {
      title: "APIs & Data",
      lessons: [
        {
          slug: "rest-api-design-that-doesnt-fight-you-later",
          title: "REST API Design That Doesn't Fight You Later",
          summary: "Naming routes and choosing HTTP methods the way a real team would expect, so your API doesn't need a manual to use.",
          estimatedMinutes: 22,
          reading:
            "## Resources, not actions, in the URL\n\n```\nGET    /tasks          - list tasks\nPOST   /tasks          - create a task\nGET    /tasks/:id      - get one task\nPATCH  /tasks/:id      - update a task\nDELETE /tasks/:id      - delete a task\n```\n\nThe verb belongs in the HTTP method, not the URL - `/tasks/delete/5` is a common beginner pattern, but it duplicates information the method already carries and breaks the predictable pattern every other developer (and every API client library) expects.\n\n## Status codes that mean something\n\nReturning `200` for everything, including failures, forces every client to parse your response body just to know if something worked. `201` for a real creation, `400` for bad input, `401`/`403` for auth problems, `404` for a real missing resource, `500` only for something that's actually your server's fault - getting this right is what makes an API pleasant to build against instead of something you have to reverse-engineer.",
        },
        {
          slug: "working-with-a-real-database",
          title: "Working With a Real Database",
          summary: "Connecting to Postgres, and the difference between a query that works and one that scales.",
          estimatedMinutes: 28,
          reading:
            "## Why not just a file?\n\nA JSON file 'works' for a demo, but breaks down fast: no concurrent-write safety, no real querying, no way to enforce that a task actually belongs to a real user. A real database (we'll use Postgres) gives you all three, plus the ability to model real relationships - a task belongs to a user, a user has many tasks.\n\n## A real query, done safely\n\n```js\nconst result = await pool.query(\n  'SELECT * FROM tasks WHERE user_id = $1',\n  [userId]\n);\n```\n\nThe `$1` placeholder (a parameterized query) is doing real work here - it's what stops SQL injection, where a malicious value in `userId` could otherwise be crafted to run arbitrary SQL. Building the query string by concatenating raw values in is one of the most common real vulnerabilities in beginner backend code, and parameterized queries are the fix, not an optional extra.",
        },
        {
          slug: "validating-input-you-cant-trust",
          title: "Validating Input You Can't Trust",
          summary: "Every request body is a lie until you've checked it - validating input before it touches your database or your logic.",
          estimatedMinutes: 24,
          reading:
            "## The rule: never trust a request body\n\nAnything arriving in `req.body` could be missing fields, wrong types, or deliberately malformed by someone testing your API's edges. Code that assumes `req.body.title` is always a non-empty string will eventually crash or, worse, silently store garbage.\n\n## Validating with a real schema\n\n```js\nconst { z } = require('zod');\n\nconst createTaskSchema = z.object({\n  title: z.string().trim().min(1).max(200),\n  completed: z.boolean().optional(),\n});\n\napp.post('/tasks', (req, res) => {\n  const parsed = createTaskSchema.safeParse(req.body);\n  if (!parsed.success) {\n    return res.status(400).json({ error: parsed.error.issues[0].message });\n  }\n  // parsed.data is now safe to use\n});\n```\n\nValidating at the boundary - the moment a request comes in - means every line of code after that point can trust the shape of the data it's working with, instead of re-checking it everywhere.",
          quiz: {
            title: "APIs & Data Check",
            questions: [
              {
                question: "What's the problem with a URL like `/tasks/delete/5`?",
                options: [
                  "URLs can't contain the word delete",
                  "It duplicates the action in the URL instead of using the DELETE HTTP method, breaking the expected REST pattern",
                  "It's too long",
                  "Nothing, it's a fine pattern",
                ],
                correctIndex: 1,
              },
              {
                question: "What does a parameterized query (using $1, $2, etc.) protect against?",
                options: ["Slow queries", "SQL injection from untrusted input", "Running out of disk space", "Network timeouts"],
                correctIndex: 1,
              },
            ],
          },
        },
      ],
    },
    {
      title: "Authentication & Security",
      lessons: [
        {
          slug: "sessions-tokens-and-staying-logged-in",
          title: "Sessions, Tokens, and What Actually Keeps Users Logged In",
          summary: "How a server remembers who you are across multiple requests, and the two common ways it's done.",
          estimatedMinutes: 24,
          reading:
            "## HTTP forgets you by default\n\nEach HTTP request is independent - the server has no built-in memory of who made the last one. 'Staying logged in' is really: the server issues you something (a session cookie, or a token) on login, and you present it back on every future request so the server can look up who you are.\n\n## Two common approaches\n\n- **Sessions**: the server stores session data (who's logged in) and gives the browser a cookie referencing it. Simple, but requires server-side storage.\n- **JWTs (JSON Web Tokens)**: the server issues a signed token containing the user's identity; the server verifies the signature on each request without needing to store anything itself. Stateless, but harder to revoke early if a token is compromised.\n\nNeither is universally 'better' - the right choice depends on whether you need easy revocation (sessions) or need to avoid server-side session storage entirely (tokens).",
        },
        {
          slug: "hashing-passwords-the-right-way",
          title: "Hashing Passwords the Right Way",
          summary: "Why you never store a real password, and how bcrypt actually protects users if your database is ever breached.",
          estimatedMinutes: 22,
          reading:
            "## Never store the real password. Ever.\n\nIf your database is ever breached - and real breaches happen even to careful teams - a stored plain-text password is an immediate, total compromise of every user who reused that password anywhere else. Hashing exists specifically to make that breach far less catastrophic.\n\n## Using bcrypt correctly\n\n```js\nconst bcrypt = require('bcryptjs');\n\nconst hash = await bcrypt.hash(plainPassword, 12);\n// store `hash`, never the plain password\n\nconst isValid = await bcrypt.compare(attemptedPassword, hash);\n```\n\nbcrypt is deliberately slow (the `12` is the cost factor) - that's a feature, not a bug, since it makes brute-forcing a stolen hash database far more expensive. Never write your own hashing scheme, and never use a fast general-purpose hash like MD5 or SHA-256 alone for passwords - they're built for speed, which is exactly the wrong property for this job.",
        },
        {
          slug: "common-vulnerabilities-and-how-to-not-ship-them",
          title: "Common Vulnerabilities and How to Not Ship Them",
          summary: "SQL injection, broken access control, and secrets in your codebase - the real, common mistakes worth checking for by name.",
          estimatedMinutes: 26,
          reading:
            "## The ones that show up constantly in real code\n\n**Broken access control**: checking that a user is logged in, but not that they own the specific resource they're modifying. `PATCH /tasks/47` needs to verify the task belongs to the requesting user, not just that some user is logged in.\n\n**Secrets in your codebase**: API keys, database passwords, or JWT signing secrets committed directly into your code instead of environment variables. Once something is committed to git history, it's effectively permanent even if you delete it in a later commit.\n\n**Missing rate limiting**: a login endpoint with no limit on failed attempts is an open invitation to brute-force every password in your database, one guess at a time, forever.\n\n## The habit that catches most of this\n\nFor every endpoint you write, ask two questions before moving on: 'who is allowed to call this?' and 'what happens if the input is malicious, not just wrong?' Most real vulnerabilities in beginner code trace back to one of those two questions never being asked.",
          quiz: {
            title: "Authentication & Security Check",
            questions: [
              {
                question: "Why is bcrypt deliberately slow?",
                options: [
                  "It's a bug that hasn't been fixed",
                  "The slowness makes brute-forcing a stolen password hash significantly more expensive",
                  "Slow hashing is more secure by coincidence",
                  "It's not actually slow",
                ],
                correctIndex: 1,
              },
              {
                question: "What is 'broken access control' in the context of an API endpoint like PATCH /tasks/:id?",
                options: [
                  "The endpoint being too slow",
                  "Checking that a user is logged in, but not that they actually own the specific resource being modified",
                  "A missing HTTP method",
                  "A database connection error",
                ],
                correctIndex: 1,
              },
            ],
          },
        },
      ],
    },
    {
      title: "Real-World Backend Patterns",
      lessons: [
        {
          slug: "error-handling-that-doesnt-leak-secrets",
          title: "Error Handling That Doesn't Leak Secrets",
          summary: "Catching errors properly, and never sending a raw stack trace or database error back to the client.",
          estimatedMinutes: 22,
          reading:
            "## The failure mode: helpful to attackers, not to users\n\nA raw error message like `relation \"users\" does not exist` or a full stack trace tells an attacker real details about your database schema and file structure - information that should never leave your server.\n\n## A real error-handling pattern\n\n```js\napp.use((err, req, res, next) => {\n  console.error(err); // log the real detail, server-side only\n  res.status(500).json({ error: 'Something went wrong. Please try again.' });\n});\n```\n\nLog the real error where only you can see it (your server logs), and send the client something generic and safe. The one exception: validation errors (bad input) are fine to describe specifically, since that's actionable feedback for a legitimate user, not leaked internal detail.",
        },
        {
          slug: "background-jobs-and-webhooks",
          title: "Background Jobs & Webhooks",
          summary: "Work that shouldn't block a response, and receiving real-time updates from other services.",
          estimatedMinutes: 24,
          reading:
            "## Not everything belongs in the request/response cycle\n\nSending a welcome email during signup shouldn't make the user wait an extra two seconds for that email to send before their account creation even completes. Real backends push slow, non-critical work (emails, report generation, notifications) into a background job instead of doing it inline.\n\n## Webhooks: being told, not asking\n\nInstead of repeatedly polling a payment provider asking 'has this payment completed yet?', a webhook lets that provider call *your* server the moment something happens. This is the same pattern real payment systems (Stripe, Razorpay) use in production - your server exposes an endpoint, the provider calls it when an event occurs, and you verify the request is genuinely from them (usually via a signature check) before trusting it.",
        },
        {
          slug: "building-a-real-api-from-scratch",
          title: "Building a Real API From Scratch",
          summary: "The module project: your own complete task-management API, with auth, validation, and proper error handling.",
          estimatedMinutes: 35,
          reading:
            "## The project for this module\n\nBring together everything from this course into one real API: user signup/login with hashed passwords, authenticated task CRUD endpoints (a user can only see and modify their own tasks), input validation on every write, and proper error handling throughout.\n\n## What it needs to include\n\n- `POST /auth/signup` and `POST /auth/login` with real password hashing\n- Authenticated `GET/POST/PATCH/DELETE /tasks` endpoints, scoped to the logged-in user only\n- Real input validation on every endpoint that accepts a body\n- No raw error details ever reaching the client\n\nSubmit a link to your repository (GitHub) in the project box below - this is the API you'll deploy in the next lesson.",
        },
      ],
    },
    {
      title: "Shipping a Backend",
      lessons: [
        {
          slug: "environment-config-logging-and-deployment",
          title: "Environment Config, Logging & Deployment",
          summary: "Getting your real API onto a real URL, with secrets handled correctly and logs you can actually use.",
          estimatedMinutes: 26,
          reading:
            "## Environment variables, not hardcoded values\n\n```js\nconst dbUrl = process.env.DATABASE_URL;\nconst jwtSecret = process.env.JWT_SECRET;\n```\n\nEvery secret and every environment-specific value (database URL, API keys) belongs in environment variables, never hardcoded - this is what lets the exact same code run safely in development and production with different real credentials, and what keeps secrets out of your git history.\n\n## Logging that's actually useful later\n\nA console.log scattered wherever something breaks isn't a logging strategy. At minimum, log every request's method/path, every error with enough context to reproduce it, and nothing sensitive (never log full request bodies containing passwords or tokens).\n\n## Deploying for real\n\nRailway, Render, and Fly.io all take a connected GitHub repo and give you a real, running backend URL with environment variables configured through their dashboard - no server management required for a course project like this one. Before you consider this course complete: is your API actually deployed and reachable at a real URL?",
          quiz: {
            title: "Final Course Check",
            questions: [
              {
                question: "Why should secrets like a database URL live in environment variables instead of hardcoded in your code?",
                options: [
                  "It makes the code run faster",
                  "It keeps secrets out of git history and lets the same code use different real credentials per environment",
                  "It's required by JavaScript syntax",
                  "There's no real reason, it's just a convention",
                ],
                correctIndex: 1,
              },
              {
                question: "What should never appear in your server logs?",
                options: ["Request URLs", "Error messages", "Full request bodies containing passwords or tokens", "Timestamps"],
                correctIndex: 2,
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
