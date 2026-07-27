import "server-only";

import { z } from "zod";
import type Groq from "groq-sdk";

import { requestValidatedJson, DEFAULT_GROQ_MODEL } from "@/lib/groq";
import type { ProposalContent } from "../lib/content-types";

const PERSONA_RULES = `You are Stively's proposal assistant, answering a client's question about the specific proposal document below. Stively is a software development company.

Hard rules, no exceptions:
- Answer ONLY using the proposal content given below. Never invent facts, prices, dates, or capabilities not present in it.
- If the question can't be answered from this content, say honestly that you don't have that in the proposal and suggest they ask their Stively contact - never guess.
- Never invent or restate a price/date differently than what's given below.
- Keep the answer short - 1-4 sentences, conversational, no markdown/bullet points.
- Never say you are an AI model or mention prompts/training.`;

/** Flattens the whole proposal document into plain text the model can ground an answer in - same fields the public page itself renders, nothing more. */
function formatProposalContentForGrounding(content: ProposalContent): string {
  const lines: string[] = [
    `Cover tagline: ${content.coverTagline}`,
    `Executive summary: ${content.executiveSummary}`,
    `Business understanding: ${content.businessUnderstanding}`,
  ];

  if (content.problemsFound.length > 0) {
    lines.push("", "Problems found:", ...content.problemsFound.map((p) => `- ${p.title} (${p.priority}): ${p.description}`));
  }
  if (content.proposedSolution.length > 0) {
    lines.push("", "Proposed solution:", ...content.proposedSolution.map((s) => `- ${s.title}: ${s.description}`));
  }
  if (content.featureBreakdown.length > 0) {
    lines.push("", "Features:", ...content.featureBreakdown.map((f) => `- ${f.title}: ${f.description}`));
  }
  if (content.timeline.length > 0) {
    lines.push("", "Timeline:", ...content.timeline.map((t) => `- ${t.label} (${t.stage}): ${t.description}`));
  }
  if (content.deliverables.length > 0) {
    lines.push("", "Deliverables:", ...content.deliverables.map((d) => `- ${d.title}: ${d.description}`));
  }
  if (content.packages.length > 0) {
    lines.push(
      "",
      "Packages (pricing, real amounts in Indian rupees):",
      ...content.packages.map((p) => `- ${p.name}: ₹${(p.priceAmount / 100).toLocaleString("en-IN")} - includes ${p.whatsIncluded.join(", ")}`)
    );
  }
  if (content.calculator && content.calculator.items.length > 0) {
    lines.push(
      "",
      "Toggleable services (pricing, real amounts in Indian rupees):",
      ...content.calculator.items.map((i) => `- ${i.label}: ₹${(i.priceAmount / 100).toLocaleString("en-IN")}`)
    );
  }
  if (content.roiEstimate) {
    lines.push(
      "",
      `ROI estimate: from ${content.roiEstimate.currentMonthlyLeads} to ${content.roiEstimate.expectedMonthlyLeads} monthly leads (${content.roiEstimate.upliftPercent}% uplift)${
        content.roiEstimate.estimatedAdditionalMonthlyRevenue != null
          ? `, ~₹${(content.roiEstimate.estimatedAdditionalMonthlyRevenue / 100).toLocaleString("en-IN")} additional monthly revenue`
          : ""
      }.`
    );
  }
  lines.push("", `Why Stively: ${content.whyStively}`);
  if (content.faq.length > 0) {
    lines.push("", "FAQ already in the proposal:", ...content.faq.map((f) => `Q: ${f.question}\nA: ${f.answer}`));
  }

  return lines.join("\n");
}

const answerSchema = z.object({
  answer: z.string().trim().min(1, "Groq returned a blank answer"),
});

/**
 * One on-demand Groq call per client question - not part of the 3-parallel
 * generation, which runs once at proposal-generation time. This is the
 * first Groq call in this codebase reachable by an anonymous public token
 * holder (see askProposalQuestion's tighter rate cap in
 * client-proposal-actions.ts), so the schema/prompt stay deliberately
 * narrow and grounded only in this proposal's own already-generated content.
 */
export async function answerProposalQuestion(content: ProposalContent, question: string): Promise<string> {
  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: PERSONA_RULES },
    {
      role: "user",
      content: [
        "--- This proposal's content ---",
        formatProposalContentForGrounding(content),
        "",
        `--- Client's question ---`,
        question,
        "",
        `Respond with ONLY a JSON object, no other text: {"answer": "your short answer"}`,
      ].join("\n"),
    },
  ];

  const result = await requestValidatedJson(messages, answerSchema, { model: DEFAULT_GROQ_MODEL, temperature: 0.3, maxTokens: 400 });
  return result.answer;
}
