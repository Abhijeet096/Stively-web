import { prisma } from "../src/lib/prisma";

/**
 * PLACEHOLDER video URLs - clearly named so they're easy to find/replace
 * once real lecture recordings exist. Everything else here is real,
 * substantive content, not filler.
 */
function placeholderVideo(lessonSlug: string) {
  return { url: `https://placeholder.stively.com/video-pending/frontend-development/${lessonSlug}`, provider: "file" as const };
}

async function main() {
  const existing = await prisma.offering.findUnique({ where: { slug: "frontend-development" } });
  if (existing) {
    console.log("frontend-development already seeded - skipping. Delete it first if you want to reseed from scratch.");
    return;
  }

  const offering = await prisma.offering.create({
    data: {
      slug: "frontend-development",
      title: "Frontend Development",
      shortDescription: "Go from zero to shipping real, responsive interfaces with HTML, CSS, JavaScript, and React.",
      longDescription:
        "A hands-on frontend course built around what actually gets used on real projects, not a random tour of syntax. You'll build real pages and components in every module - semantic HTML, layouts that hold up on any screen size, JavaScript that talks to real APIs, and React components structured the way a real team would review them. By the end, you'll have a small portfolio of work you built yourself, not just watched someone else build.",
      category: "TRAINING",
      audience: "STUDENT",
      status: "PUBLISHED",
      visible: true,
      purchaseFlow: "DIRECT_PAYMENT",
      price: 99900,
      currency: "INR",
      pricingType: "FIXED",
      duration: "6 Weeks",
      mode: "ONLINE",
      difficulty: "BEGINNER",
      whatYoullLearn: [
        "Write semantic, accessible HTML that holds up in real audits",
        "Build responsive layouts with Flexbox and Grid - no guesswork, no fighting the browser",
        "JavaScript fundamentals: variables, functions, events, and working with real data from an API",
        "Build real, reusable components in React with props, state, and effects",
        "Ship and deploy your own work, with a small portfolio to show for it",
      ],
      benefits: [
        "5 modules, 14 lessons, built around real projects not toy examples",
        "MCQ checks after key lessons, a real coding project at the end",
        "Lifetime access to course material and updates",
        "Certificate of completion",
      ],
      whoItsFor: [
        "Complete beginners who want a real foundation, not a highlight reel of buzzwords",
        "Anyone who's tried tutorials before and wants something structured that actually builds toward a portfolio",
      ],
      requirements: ["A laptop/desktop with a modern browser", "No prior coding experience required"],
      curriculum: {
        modules: [
          { title: "HTML & Semantic Foundations", topics: ["Why Semantic HTML Matters", "Structuring a Real Page", "Forms & Accessibility Basics"] },
          { title: "CSS & Responsive Layout", topics: ["The Box Model, For Real This Time", "Flexbox & Grid in Practice", "Responsive Design Without Guesswork"] },
          { title: "JavaScript Fundamentals", topics: ["Variables, Types, and the DOM", "Functions, Events, and State", "Fetching Real Data"] },
          { title: "Building With React", topics: ["Components & Props", "State & Effects", "Building a Real Component"] },
          { title: "Shipping Your Work", topics: ["Git, Deployment & Portfolio Basics"] },
        ],
      },
    },
  });

  const experience = await prisma.learningExperience.create({
    data: { offeringId: offering.id },
  });

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
      title: "HTML & Semantic Foundations",
      lessons: [
        {
          slug: "why-semantic-html-matters",
          title: "Why Semantic HTML Matters",
          summary: "What semantic HTML actually buys you, and why div-soup breaks down in real projects.",
          estimatedMinutes: 18,
          reading:
            "## Why this matters\n\nIt's tempting to build every page out of `<div>` and `<span>` - they're flexible, and CSS can make them look like anything. But real projects get read by more than just a browser rendering pixels: screen readers, search engines, and the next developer who opens your file all rely on the *meaning* your markup carries, not just its appearance.\n\n## The elements that carry meaning\n\n- `<header>`, `<nav>`, `<main>`, `<footer>` - the skeleton of a page, understood instantly by assistive tech\n- `<article>` and `<section>` - self-contained content vs. a thematic grouping within a page\n- `<button>` vs `<div onclick=...>` - a real button is keyboard-accessible and announced correctly by default; a div pretending to be one isn't, unless you rebuild all of that yourself\n\n## The real-world test\n\nA good gut-check: turn off CSS entirely. If your page still makes sense read top to bottom - header, main content, footer - your HTML is doing its job. If it's a flat wall of unlabeled divs, it isn't yet.",
        },
        {
          slug: "structuring-a-real-page",
          title: "Structuring a Real Page",
          summary: "Taking a real page design and turning it into a correct HTML skeleton before any CSS exists.",
          estimatedMinutes: 22,
          reading:
            "## From design to skeleton\n\nBefore writing a single line of CSS, a real page starts as a plain, well-structured HTML document. This lesson walks through taking a simple business homepage - header with navigation, a hero section, a few content sections, a footer - and building the skeleton first.\n\n## The order that matters\n\n1. Get the heading hierarchy right first (`<h1>` once per page, `<h2>` for major sections, never skipping a level for style reasons)\n2. Group related content into `<section>`s with their own heading\n3. Leave images with real `alt` text as you go, not as an afterthought\n\nGetting this right before any styling exists means your CSS is solving a layout problem, not fighting markup that was structured wrong from the start.",
        },
        {
          slug: "forms-and-accessibility-basics",
          title: "Forms & Accessibility Basics",
          summary: "Building a real contact form that's actually usable - labels, focus states, and error messaging.",
          estimatedMinutes: 25,
          reading:
            "## Forms are where accessibility gets tested for real\n\nA form with no `<label>` elements might look fine visually and still be nearly unusable for someone on a screen reader or with a motor impairment relying on larger click targets.\n\n## The non-negotiables\n\n- Every input gets a real `<label for=\"...\">`, not a placeholder pretending to be one (placeholders disappear the moment you start typing)\n- Required fields are marked with the `required` attribute, not just a visual asterisk\n- Error messages are associated with their field via `aria-describedby`, not just floating nearby in the DOM\n\nWe'll build a real contact form in this lesson with all of this in place, then break it on purpose to see what actually goes wrong without it.",
          quiz: {
            title: "HTML & Accessibility Check",
            questions: [
              {
                question: "What's wrong with using only a placeholder instead of a <label> on a form input?",
                options: [
                  "Nothing, placeholders are a valid replacement for labels",
                  "The placeholder text disappears once the user starts typing, and screen readers may not announce it as a label",
                  "Placeholders make the input larger",
                  "Placeholders are only for password fields",
                ],
                correctIndex: 1,
              },
              {
                question: "How many <h1> elements should a well-structured page normally have?",
                options: ["As many as needed", "Exactly one", "None, use <h2> for everything", "One per section"],
                correctIndex: 1,
              },
            ],
          },
        },
      ],
    },
    {
      title: "CSS & Responsive Layout",
      lessons: [
        {
          slug: "the-box-model-for-real",
          title: "The Box Model, For Real This Time",
          summary: "Content, padding, border, margin - and the one property that fixes most beginner layout bugs.",
          estimatedMinutes: 20,
          reading:
            "## The four layers\n\nEvery element on a page is a box made of four layers, from the inside out: content, padding, border, and margin. Most early CSS confusion traces back to not knowing which layer a given size actually applies to.\n\n## The fix that solves most of it\n\n```css\n* {\n  box-sizing: border-box;\n}\n```\n\nBy default, `width: 300px` only sizes the content box - padding and border get added on top, so your element ends up wider than you expected. `border-box` makes `width` describe the *total* size instead, matching how most people intuitively expect sizing to work. Set this globally, once, at the top of your stylesheet, and a huge class of layout bugs simply stops happening.",
        },
        {
          slug: "flexbox-and-grid-in-practice",
          title: "Flexbox & Grid in Practice",
          summary: "When to reach for Flexbox versus Grid, with a real navbar and a real card layout as examples.",
          estimatedMinutes: 28,
          reading:
            "## Two tools, two different jobs\n\nFlexbox is for laying things out in a single direction - a row of navigation links, a header with a logo on the left and buttons on the right. Grid is for two-dimensional layouts - a page with distinct rows and columns, like a dashboard or a card grid.\n\n## A real navbar with Flexbox\n\n```css\n.navbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n```\n\nThat's the whole layout for a logo-left, links-right navbar - no floats, no manual positioning.\n\n## A real card grid with Grid\n\n```css\n.card-grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));\n  gap: 1.5rem;\n}\n```\n\n`auto-fit` with `minmax` is the trick that makes a card grid responsive with zero media queries - cards wrap automatically as the screen shrinks.",
        },
        {
          slug: "responsive-design-without-guesswork",
          title: "Responsive Design Without Guesswork",
          summary: "Mobile-first media queries, and testing on a real range of screen sizes instead of just resizing a browser window.",
          estimatedMinutes: 24,
          reading:
            "## Mobile-first, not desktop-first\n\nWrite your base CSS for the smallest screen first, then use `min-width` media queries to add complexity as the screen grows - not the other way around. This keeps your default styles simple and means a slow mobile connection never has to download desktop-only CSS it won't use.\n\n```css\n.container {\n  padding: 1rem;\n}\n\n@media (min-width: 768px) {\n  .container {\n    padding: 2rem;\n  }\n}\n```\n\n## Testing it for real\n\nResizing your browser window is a start, but real devices have quirks a resized window doesn't - actual touch targets, real viewport meta tag behavior, real font rendering. Use your browser's device toolbar (not just a resized window) and, when you can, an actual phone.",
          quiz: {
            title: "CSS Layout Check",
            questions: [
              {
                question: "What does `box-sizing: border-box` change about how `width` is calculated?",
                options: [
                  "It removes padding and border entirely",
                  "Width now includes padding and border, instead of adding them on top of the content width",
                  "It only affects margin",
                  "It has no real effect",
                ],
                correctIndex: 1,
              },
              {
                question: "Which layout tool is generally the better fit for a two-dimensional dashboard layout?",
                options: ["Flexbox", "CSS Grid", "Floats", "Tables"],
                correctIndex: 1,
              },
            ],
          },
        },
      ],
    },
    {
      title: "JavaScript Fundamentals",
      lessons: [
        {
          slug: "variables-types-and-the-dom",
          title: "Variables, Types, and the DOM",
          summary: "let vs const, the real JavaScript types, and selecting/changing real elements on a page.",
          estimatedMinutes: 22,
          reading:
            "## let and const, not var\n\nModern JavaScript uses `const` by default (the value won't be reassigned) and `let` when it will. `var` still works but has scoping behavior that causes real bugs in real code - there's no good reason to reach for it in new code.\n\n## Touching the real page\n\n```js\nconst button = document.querySelector('#submit-btn');\nbutton.addEventListener('click', () => {\n  button.textContent = 'Submitted!';\n});\n```\n\nThis is the DOM: JavaScript's live connection to the actual elements on the page. `querySelector` finds one, and from there you can read or change anything about it - text, classes, attributes, even whether it exists at all.",
        },
        {
          slug: "functions-events-and-state",
          title: "Functions, Events, and State",
          summary: "Writing functions that respond to real user actions, and why 'state' just means 'the data your UI depends on.'",
          estimatedMinutes: 24,
          reading:
            "## State is simpler than it sounds\n\n'State' just means: the data that determines what your UI currently shows. A counter's current number, whether a menu is open, what a user typed into a field - all state. The pattern that matters is: change the state, then update the UI to match it, in that order, every time.\n\n```js\nlet count = 0;\nconst display = document.querySelector('#count');\n\ndocument.querySelector('#increment').addEventListener('click', () => {\n  count += 1;\n  display.textContent = count;\n});\n```\n\nThis tiny example has the exact shape every larger app follows: an event happens, state changes, the UI re-renders to reflect it. React (coming up in Module 4) is largely a more structured way of doing exactly this.",
        },
        {
          slug: "fetching-real-data",
          title: "Fetching Real Data",
          summary: "Using fetch() to call a real API, and handling the fact that network requests can fail.",
          estimatedMinutes: 26,
          reading:
            "## Talking to a real server\n\n```js\nasync function loadUsers() {\n  try {\n    const response = await fetch('https://api.example.com/users');\n    if (!response.ok) throw new Error('Request failed');\n    const users = await response.json();\n    renderUsers(users);\n  } catch (error) {\n    showErrorMessage('Could not load users right now.');\n  }\n}\n```\n\n## Why the try/catch isn't optional\n\nEvery real app you build will eventually hit a network that's slow, an API that's down, or a response that isn't what you expected. Code that assumes `fetch` always succeeds looks fine in a demo and breaks the first time something outside your control goes wrong. Handling that failure case is what separates a tutorial script from something you'd actually ship.",
          quiz: {
            title: "JavaScript Fundamentals Check",
            questions: [
              {
                question: "What's the main practical difference between `let` and `const`?",
                options: [
                  "const is faster",
                  "const can't be reassigned after its initial value; let can",
                  "let only works inside functions",
                  "There is no difference",
                ],
                correctIndex: 1,
              },
              {
                question: "Why wrap a fetch() call in try/catch?",
                options: [
                  "It's required syntax",
                  "To handle the case where the network request fails or the server returns an error",
                  "It makes the request faster",
                  "It's only needed for POST requests",
                ],
                correctIndex: 1,
              },
            ],
          },
        },
      ],
    },
    {
      title: "Building With React",
      lessons: [
        {
          slug: "components-and-props",
          title: "Components & Props",
          summary: "Breaking a real page into components, and passing data down through props.",
          estimatedMinutes: 26,
          reading:
            "## A component is just a function\n\n```jsx\nfunction ProfileCard({ name, role }) {\n  return (\n    <div className=\"card\">\n      <h3>{name}</h3>\n      <p>{role}</p>\n    </div>\n  );\n}\n```\n\n`{ name, role }` are props - data passed in from whatever renders this component, the same way arguments get passed into any function. The component doesn't know or care where that data came from; it just renders whatever it's given.\n\n## Breaking a real page apart\n\nGiven a real team page with ten profile cards, you don't write ten near-identical blocks of JSX - you write `ProfileCard` once and render it ten times with different props. This is the core idea React is built around: describe a piece of UI once, reuse it everywhere it's needed.",
        },
        {
          slug: "state-and-effects",
          title: "State & Effects",
          summary: "useState for data that changes, useEffect for syncing with the outside world.",
          estimatedMinutes: 28,
          reading:
            "## useState, the React way of state\n\n```jsx\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>{count}</button>;\n}\n```\n\nCalling `setCount` doesn't just update a variable - it tells React \"re-render this component with the new value,\" which is the whole reason React apps stay in sync automatically instead of manually touching the DOM everywhere state changes.\n\n## useEffect, for everything outside React\n\n```jsx\nuseEffect(() => {\n  fetchUserData(userId).then(setUser);\n}, [userId]);\n```\n\n`useEffect` is for anything that reaches outside the component - fetching data, subscribing to something, reading from `localStorage`. The `[userId]` array tells React to only re-run this when `userId` actually changes, not on every single render.",
        },
        {
          slug: "building-a-real-component",
          title: "Building a Real Component",
          summary: "A guided build: a real, reusable search-and-filter component, submitted as your module project.",
          estimatedMinutes: 35,
          reading:
            "## The project for this module\n\nYou'll build a real, reusable `FilterableList` component: a search box, a list of items, and live filtering as the user types - the exact pattern behind almost every admin dashboard or product catalog you've ever used.\n\n## What it needs to do\n\n- Hold the current search text in state\n- Filter the list on every keystroke without noticeable lag\n- Show a clear empty state when nothing matches (not just a blank list)\n- Be built as a real, reusable component that accepts its list of items as a prop, not hardcoded data\n\nSubmit a link to your working version (CodeSandbox, StackBlitz, or a deployed link) in the project box below.",
        },
      ],
    },
    {
      title: "Shipping Your Work",
      lessons: [
        {
          slug: "git-deployment-and-portfolio-basics",
          title: "Git, Deployment & Portfolio Basics",
          summary: "Getting your work onto a real URL, and what actually belongs in a beginner portfolio.",
          estimatedMinutes: 24,
          reading:
            "## From your machine to a real URL\n\nA project sitting only on your laptop doesn't count as shipped. This lesson covers pushing your code to GitHub and deploying it for free with Vercel or Netlify - both take a connected GitHub repo and give you a live URL in minutes, with automatic redeploys every time you push a change.\n\n## What actually belongs in your portfolio\n\nNot every exercise from this course needs to go in your portfolio - pick the 2-3 pieces that best show real, working functionality (the filterable list component from Module 4 is a strong candidate). A portfolio with three real, working, well-explained projects beats one with ten unfinished ones every time.\n\n## Final check\n\nBefore you consider this course complete: is at least one project deployed to a real URL you can share? If not, that's the last step - not another lesson, just shipping what you've already built.",
          quiz: {
            title: "Final Course Check",
            questions: [
              {
                question: "What's the main benefit of connecting a GitHub repo to Vercel/Netlify for deployment?",
                options: [
                  "It makes your code run faster",
                  "Every push to your repo automatically redeploys the live site",
                  "It's required for React to work",
                  "It removes the need for a database",
                ],
                correctIndex: 1,
              },
              {
                question: "What generally makes a stronger beginner portfolio?",
                options: [
                  "As many projects as possible, finished or not",
                  "A few real, working, well-explained projects rather than many incomplete ones",
                  "Only projects with no CSS",
                  "Projects copied from tutorials without changes",
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
    const createdModule = await prisma.module.create({
      data: { learningExperienceId: experience.id, title: mod.title, order: moduleOrder },
    });

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
        data: {
          lessonId: createdLesson.id,
          type: "VIDEO",
          order: 1,
          title: "Watch",
          content: placeholderVideo(lesson.slug),
        },
      });

      await prisma.lessonBlock.create({
        data: {
          lessonId: createdLesson.id,
          type: "MARKDOWN",
          order: 2,
          title: "Reading material",
          content: { text: lesson.reading },
        },
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
