import "server-only";

import * as cheerio from "cheerio";

const PLATFORM_HOST_MAP: { host: RegExp; platform: "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "YOUTUBE" | "X" }[] = [
  { host: /(^|\.)facebook\.com$/i, platform: "FACEBOOK" },
  { host: /(^|\.)instagram\.com$/i, platform: "INSTAGRAM" },
  { host: /(^|\.)linkedin\.com$/i, platform: "LINKEDIN" },
  { host: /(^|\.)youtube\.com$/i, platform: "YOUTUBE" },
  { host: /(^|\.)(x|twitter)\.com$/i, platform: "X" },
];

const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?){2,4}\d{3,4}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const WHATSAPP_LINK_REGEX = /(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)(\d+)/i;

export interface ParsedPage {
  $: cheerio.CheerioAPI;
  title: string | null;
  metaDescription: string | null;
  ogSiteName: string | null;
  h1Count: number;
  headings: string[];
  jsonLd: Record<string, unknown>[];
  socialLinks: { platform: "FACEBOOK" | "INSTAGRAM" | "LINKEDIN" | "YOUTUBE" | "X"; url: string }[];
  phones: string[];
  emails: string[];
  whatsappNumber: string | null;
  hasContactForm: boolean;
  visibleText: string;
}

/**
 * Cheerio-based extraction of everything both the website connector
 * (business-field discovery: name/phone/email/social) and the deeper
 * website analyzer (SEO/content checks) need - one parse pass shared by
 * both rather than two separate HTML parsers.
 */
export function parsePage(html: string): ParsedPage {
  const $ = cheerio.load(html);

  const title = $("head > title").first().text().trim() || null;
  const metaDescription = $('meta[name="description"]').attr("content")?.trim() || null;
  const ogSiteName = $('meta[property="og:site_name"]').attr("content")?.trim() || null;

  const headings = $("h1, h2, h3")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
  const h1Count = $("h1").length;

  const jsonLd: Record<string, unknown>[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).text());
      if (Array.isArray(parsed)) jsonLd.push(...parsed.filter((p) => typeof p === "object" && p !== null));
      else if (parsed && typeof parsed === "object") jsonLd.push(parsed);
    } catch {
      // Malformed JSON-LD is common in the wild - skip, don't fail the whole parse.
    }
  });

  const socialLinks: ParsedPage["socialLinks"] = [];
  const seenSocialUrls = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const url = new URL(href, "https://example.com");
      for (const { host, platform } of PLATFORM_HOST_MAP) {
        if (host.test(url.hostname) && !seenSocialUrls.has(href)) {
          socialLinks.push({ platform, url: href });
          seenSocialUrls.add(href);
        }
      }
    } catch {
      // Relative/malformed href - ignore.
    }
  });

  const visibleText = $("body").text().replace(/\s+/g, " ").trim();

  const phones = Array.from(new Set(visibleText.match(PHONE_REGEX) ?? [])).slice(0, 5);
  const emails = Array.from(new Set(visibleText.match(EMAIL_REGEX) ?? [])).slice(0, 5);

  let whatsappNumber: string | null = null;
  $('a[href*="wa.me"], a[href*="api.whatsapp.com"]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const match = href.match(WHATSAPP_LINK_REGEX);
    if (match && !whatsappNumber) whatsappNumber = match[1];
  });

  const hasContactForm = $("form").filter((_, el) => {
    const formText = $(el).text().toLowerCase();
    return $(el).find('input[type="email"], textarea').length > 0 || /contact|enquiry|inquiry|message/.test(formText);
  }).length > 0;

  return { $, title, metaDescription, ogSiteName, h1Count, headings, jsonLd, socialLinks, phones, emails, whatsappNumber, hasContactForm, visibleText };
}
