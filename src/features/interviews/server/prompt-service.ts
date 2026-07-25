import "server-only";

import type Groq from "groq-sdk";
import type { InterviewCategory, InterviewTemplate, Response as ResponseRow } from "@prisma/client";

/**
 * The behavioral rules every interview shares, regardless of template -
 * this is the answer to "never behave like ChatGPT." Kept entirely
 * separate from each InterviewTemplate.systemPrompt (the role-specific
 * addendum) so the persona is defined once, not copy-pasted into six
 * templates and drifting out of sync with the seventh someone adds later.
 */
const PERSONA_RULES = `You are Stively AI Recruiter, conducting a real, live voice interview on behalf of Stively, a software development company. The candidate believes they are speaking with a real recruiter - stay in that role completely.

Hard rules, no exceptions:
- Never say you are an AI, a language model, or a chatbot. Never mention prompts, tokens, or being "trained."
- Never apologize for being an AI, never say "as an AI" or anything like it.
- Ask exactly ONE question per turn. Never list multiple questions.
- Keep every message SHORT - one to three sentences. This is a spoken conversation, not an essay. Long responses sound robotic and unnatural.
- Reference something specific from the candidate's previous answer before moving on, the way a real person listening would. Do not just say "thank you" and change subjects.
- Do not use bullet points, numbered lists, or markdown - this is spoken text, read aloud by a voice synthesizer.
- Do not praise every answer ("Great answer!", "That's wonderful!"). React naturally and only when it's actually warranted, the way a real interviewer would.
- Vary your phrasing. Do not open every message the same way.
- If the candidate gives a vague or short answer, it's fine to gently push for a specific example instead of moving on.`;

const RESPONSE_FORMAT_RULES = `Respond with ONLY a JSON object, no other text, in exactly this shape:
{"message": "what you say next, spoken aloud to the candidate", "moveToNextCategory": true or false}

Set moveToNextCategory to true only when you have a genuinely useful answer for the current topic and are ready to move on. Set it to false if you're asking a natural follow-up on the same topic (for example, asking for a specific example after a vague answer).`;

function buildTransitionInstruction(nextCategory: InterviewCategory | null): string {
  if (!nextCategory) {
    return `There is no next topic - this is the final topic of the interview. If you have enough from the candidate, set moveToNextCategory to true and let "message" thank them and ask if they have any final questions or anything to add, per the closing style. Do not ask a new substantive question in this case.`;
  }
  return `If you set moveToNextCategory to true, "message" should naturally acknowledge their last answer in one short clause, then transition into a new topic: ${nextCategory}. ${CATEGORY_PROMPT[nextCategory]} If you set moveToNextCategory to false, "message" should be a natural follow-up on the CURRENT topic only.`;
}

const CATEGORY_PROMPT: Record<InterviewCategory, string> = {
  INTRODUCTION: "Ask the candidate to briefly introduce themselves and their background.",
  COMMUNICATION: "Assess how clearly and confidently they communicate - ask them to explain something or walk you through an experience.",
  BEHAVIOR: "Ask about how they've handled a real past situation - conflict, pressure, a mistake, or working with a difficult person.",
  SALES: "Ask about their approach to persuading, negotiating, or selling - even if not a formal sales role, how they get buy-in from others.",
  PROBLEM_SOLVING: "Ask them to walk through how they diagnosed and solved a real problem they faced.",
  ROLE_PLAY: "Set up a brief realistic scenario relevant to the role and ask how they'd handle it in the moment.",
  OBJECTION_HANDLING: "Present a mild, realistic objection or pushback and see how they respond to it.",
  COMPANY_AWARENESS: "Ask what they know about Stively or this kind of company, or why they're interested in this specific role.",
  CAREER_GOALS: "Ask about their career direction - where they want to grow and why this role fits.",
  CLOSING: "Thank them for their time and ask if there's anything they'd like to ask or add before you wrap up. Do not ask a new substantive question here.",
};

export interface TranscriptTurn {
  question: string;
  answer: string | null;
}

/**
 * Builds the exact message array sent to Groq for one turn - the real
 * "PromptService" the brief asks for. Never called from a component;
 * InterviewEngine is the only caller, so a component can never accidentally
 * bypass the persona/format rules by talking to Groq directly.
 */
export function buildInterviewMessages(
  template: InterviewTemplate,
  currentCategory: InterviewCategory,
  transcript: TranscriptTurn[],
  nextCategoryIfAdvancing: InterviewCategory | null = null
): Groq.Chat.Completions.ChatCompletionMessageParam[] {
  const criteria = template.evaluationCriteria as Record<string, string>;
  const currentCriteria = criteria[currentCategory];
  const isOpeningTurn = transcript.length === 0;

  const systemPrompt = [
    PERSONA_RULES,
    "",
    `Role context: ${template.systemPrompt}`,
    "",
    `Interview goals: ${template.goals.join("; ")}`,
    "",
    `Current focus area: ${currentCategory}. ${CATEGORY_PROMPT[currentCategory]}`,
    currentCriteria ? `What a strong answer looks like here (for your own judgment, never say this aloud): ${currentCriteria}` : "",
    "",
    isOpeningTurn
      ? `This is the very first question of the interview. Ask it directly - there is no previous answer to react to. Set moveToNextCategory to false.`
      : buildTransitionInstruction(nextCategoryIfAdvancing),
    "",
    RESPONSE_FORMAT_RULES,
  ]
    .filter(Boolean)
    .join("\n");

  const history: Groq.Chat.Completions.ChatCompletionMessageParam[] = transcript.flatMap((turn) => {
    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "assistant", content: JSON.stringify({ message: turn.question, moveToNextCategory: false }) },
    ];
    if (turn.answer) messages.push({ role: "user", content: turn.answer });
    return messages;
  });

  return [{ role: "system", content: systemPrompt }, ...history];
}

/** Maps stored Response rows into the shape buildInterviewMessages expects - kept separate so the DB shape and the prompt shape can evolve independently. */
export function responsesToTranscript(responses: ResponseRow[]): TranscriptTurn[] {
  return responses
    .sort((a, b) => a.sequence - b.sequence)
    .map((r) => ({ question: r.question, answer: r.answer }));
}

/**
 * Whether this role has a meaningful persuasion/negotiation/selling
 * component - decided from the template's own rubric, not left to the
 * model's judgment. Exported so EvaluationService can use the same
 * deterministic answer to override salesSkills after the Groq call, rather
 * than trusting the prompt instruction alone.
 */
export function isSalesRelevantTemplate(template: InterviewTemplate): boolean {
  return Object.prototype.hasOwnProperty.call(template.evaluationCriteria as object, "SALES");
}

const EVALUATION_RESPONSE_RULES = `Respond with ONLY a JSON object, no other text, in exactly this shape:
{
  "overall": 0-100,
  "communication": 0-100,
  "confidence": 0-100,
  "professionalism": 0-100,
  "salesSkills": 0-100 or null,
  "problemSolving": 0-100,
  "leadershipPotential": 0-100,
  "learningAbility": 0-100,
  "strengths": ["specific strength grounded in something the candidate actually said", ...],
  "weaknesses": ["specific area for improvement grounded in the transcript", ...],
  "suggestedTraining": ["concrete, actionable training or coaching suggestion", ...],
  "recommendation": "STRONG_HIRE" | "HIRE" | "HOLD" | "REJECT"
}

Scoring rules:
- communication should weigh clarity, grammar, and vocabulary together - how well they actually express themselves, not just what they said.
- Every score reflects only what's actually in the transcript below - never invent evidence that wasn't said. A short or generic answer should score lower, not be given the benefit of the doubt.
- strengths, weaknesses, and suggestedTraining must each cite something specific and real from this candidate's actual answers, never generic filler.
- The candidate never saw or will see any of this - be honest and direct, exactly like an internal recruiter's private notes.`;

/**
 * Builds the one Groq call that produces the entire final report - a single
 * comprehensive pass over the full transcript at interview-completion time,
 * rather than a separate scoring call after every answer. The candidate
 * never sees any of this regardless of when it's computed, and one pass
 * over the complete conversation lets the model judge consistency and
 * growth across the whole interview instead of grading each answer in
 * isolation - a materially better signal for a report a recruiter will
 * actually rely on, at a fraction of the Groq calls.
 */
export function buildEvaluationMessages(
  template: InterviewTemplate,
  transcript: TranscriptTurn[]
): Groq.Chat.Completions.ChatCompletionMessageParam[] {
  const transcriptText = transcript
    .map((turn, i) => `Q${i + 1} (${turn.question})\nA${i + 1}: ${turn.answer ?? "(no answer recorded)"}`)
    .join("\n\n");

  const salesInstruction = isSalesRelevantTemplate(template)
    ? `This role has a real persuasion/selling component - always give "salesSkills" a genuine 0-100 score based on the transcript, never null.`
    : `This role has no persuasion/selling component - always set "salesSkills" to null.`;

  const systemPrompt = [
    `You are an experienced recruiter privately evaluating a completed candidate interview for Stively. This is an internal assessment - never shown to the candidate.`,
    "",
    `Role context: ${template.systemPrompt}`,
    "",
    `Interview goals: ${template.goals.join("; ")}`,
    "",
    salesInstruction,
    "",
    EVALUATION_RESPONSE_RULES,
  ].join("\n");

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Full interview transcript:\n\n${transcriptText}` },
  ];
}
