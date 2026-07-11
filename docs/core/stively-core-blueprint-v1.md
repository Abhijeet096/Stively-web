# Stively Core Blueprint v1.0

**Working Title:** The Operating System for Talent Development & Software Delivery

**Status:** Reference document — checked against before every major feature, per the co-founder's own instruction at the end of this document. Not itself an implementation plan; several modules described here (CRM, Evaluation Engine, Internship Engine, Project Delivery Engine, Finance, Analytics) are 5–10 year vision, not Phase 1 scope. Cross-reference against `docs/phase-a-product-plan.md` and `docs/phase-d-product-blueprint.md` for what's actually being built now.

---

## 1. Mission

Build India's most trusted ecosystem where students become industry-ready professionals through real projects, and businesses receive high-quality software solutions powered by trained talent.

## 2. Vision (5–10 Years)

Stively will not be known as:

- An EdTech company
- A Software Agency
- An Internship Provider

It will be known as: **The Talent Operating System.**

A platform where students learn, mentors guide, businesses submit projects, AI assists, interns build, and companies hire — all inside one ecosystem.

## 3. Core Principles

Non-negotiable:

1. **Real projects over theoretical learning.**
2. **Automation before manual work.** If a task happens repeatedly, the system should eventually automate it.
3. **One source of truth.** Never duplicate data. Every entity exists once. Everything references it.
4. **Every action creates data.** Every evaluation, review, assignment, project, meeting, and feedback should improve the system.
5. **Build for 100,000 users from Day 1.** Even if only 10 exist today.

## 4. Stively Core Modules

| Module                     | Purpose                          | Contains / Supports                                                                                                         |
| -------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1. Marketing               | Acquire Students & Businesses    | Homepage, Training, Services, Blogs, About, Contact, SEO                                                                    |
| 2. CRM                     | Manage Leads                     | Students, Businesses, Sales, Follow-ups, WhatsApp, Calls                                                                    |
| 3. Learning                | Deliver education                | Courses, Modules, Lessons, Assignments, Projects, Quizzes, Certificates                                                     |
| 4. Evaluation Engine       | Determine readiness              | Coding, Projects, Communication, Teamwork, Problem Solving, Attendance, Professionalism → Readiness Score                   |
| 5. Internship Engine       | Convert learning into experience | Internal Projects, Client Projects, Mentor Reviews, Stipends, Performance                                                   |
| 6. Project Delivery Engine | Deliver software                 | Client → Requirements → Project → Task Breakdown → Mentor Review → Intern Assignment → Delivery → QA → Deployment → Support |
| 7. Finance                 | Track money                      | Student Revenue, Client Revenue, Trainer/Mentor Payments, Intern Stipends, Sales Commission, Taxes, Profit, Cash Flow       |
| 8. Analytics               | Run the company using data       | —                                                                                                                           |

## 5. Core Entities

Everything belongs to these — nothing should exist outside this ecosystem:

Student, Business, Lead, Salesperson, Trainer, Mentor, Program, Course, Module, Assignment, Evaluation, Certificate, Internship, Project, Task, Invoice, Payment, Notification, Role, Permission.

## 6. Student Lifecycle

Visitor → Lead → Registered → Paid → Learning → Evaluation → Intern → Client Project → Placed → Alumni

## 7. Business Lifecycle

Visitor → Lead → Discovery → Proposal → Negotiation → Client → Project → Support → Repeat Client

## 8. Project Lifecycle

Requirement → Estimate → Proposal → Approval → Planning → Development → QA → Deployment → Support

## 9. Automation Rules

Whenever possible: never click, never type — automate.

Example: Student purchases course → Invoice → Email → Dashboard → CRM → Mentor Notification → Payment Verification, automatically.

## 10. AI Layer

Future AI should assist Students, Mentors, Sales, Clients, and the CEO. Examples: recommend best intern, predict student dropout, suggest pricing, generate proposal drafts, estimate project cost, summarize mentor feedback, flag delayed projects.

## 11. CEO Dashboard

Should answer questions, not just display charts: How much profit did we make today? Which mentor performs best? Which course converts best? Which ad generates highest ROI? Which client is overdue? How much runway do we have?

## 12. Technical Philosophy

Frontend → Business Logic → Services → Database → Analytics → Automation. Every layer has a single responsibility.

## 13. Business Philosophy — Revenue Streams

1. Training
2. Software Development
3. Corporate Training
4. Placement Partnerships
5. SaaS Products (Future)
6. AI Services (Future)

## 14. Success Metrics

Student Completion %, Internship Conversion %, Client Satisfaction, Repeat Client %, Average Project Delivery Time, Revenue, Profit, Cash Runway, Mentor Rating, Sales Conversion %.

## 15. What Makes Stively Different?

Not courses. Not internships. Not websites. The advantage: **a continuously improving Talent Operating System that connects education, project delivery, and business demand into one intelligent ecosystem.**

---

## Co-Founder Notes

These rules aren't public documentation — they're working rules for how features get decided.

**Rule #1** — We never build a feature because it's "cool." Every feature must satisfy at least one of: increase revenue, reduce cost, save time, improve student outcomes, improve client outcomes, improve decision making. Otherwise it waits.

**Rule #2** — Every feature should answer "what business problem does this solve?" — not "what technology does it use?"

**Rule #3** — Every quarter: if we had to remove 50% of Stively tomorrow, what would we keep? Those things are the real business.

**Rule #4** — Optimize for trust, not hype. Businesses return because we deliver. Students recommend us because we helped them grow.

**Rule #5** — Stively is not selling courses. **Stively is manufacturing trust.** Students trust us with their careers. Businesses trust us with their software. Mentors trust us with their reputation. Everything else — videos, dashboards, websites, AI — is infrastructure that supports that trust.
