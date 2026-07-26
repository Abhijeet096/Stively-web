import "server-only";

import dns from "node:dns/promises";
import net from "node:net";

const TIMEOUT_MS = 8000;
const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_REDIRECTS = 5;

/**
 * Every URL this feature ever fetches - admin-supplied or Google-Places-
 * discovered - is untrusted input pointed at an arbitrary host. Without
 * this guard a connector run becomes a trivial SSRF primitive (fetch
 * http://169.254.169.254/... for cloud metadata, or an internal service on
 * localhost). Validates the *resolved* IP, not just the hostname string -
 * a hostname resolving to a public IP right now could still be pinned to a
 * private one by the time of the actual request (DNS rebinding). Full
 * hardening against that needs connecting to the resolved IP literal
 * instead of letting fetch() re-resolve the hostname - not done here
 * (fetchPageSafely re-resolves via fetch(url) after this check passes) -
 * documented as a known residual risk, narrow window, not closed.
 */
export async function assertPublicUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Not a valid URL");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only http(s) URLs are allowed");
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "0.0.0.0") {
    throw new Error("Local addresses are not allowed");
  }

  const addresses = await dns.lookup(hostname, { all: true });
  if (addresses.length === 0) {
    throw new Error("Could not resolve host");
  }
  for (const { address, family } of addresses) {
    if (isPrivateOrReservedIp(address, family)) {
      throw new Error(`Refusing to fetch a non-public address: ${address}`);
    }
  }

  return url;
}

function isPrivateOrReservedIp(address: string, family: number): boolean {
  if (family === 4) {
    const parts = address.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 127) return true; // 127.0.0.0/8 loopback
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local, incl. 169.254.169.254 cloud metadata
    if (a === 0) return true; // 0.0.0.0/8
    return false;
  }
  // IPv6
  const normalized = net.isIPv6(address) ? address.toLowerCase() : "";
  if (normalized === "::1") return true; // loopback
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // fc00::/7 unique local
  if (normalized.startsWith("fe80")) return true; // fe80::/10 link-local
  return false;
}

export interface FetchedPage {
  url: string;
  status: number;
  headers: Headers;
  html: string;
  responseTimeMs: number;
}

/**
 * SSRF-guarded fetch with a timeout, a response-size cap, and manual
 * redirect handling - each hop is independently re-validated rather than
 * trusting `redirect: "follow"`, since a public URL that 302s to an
 * internal one is the classic bypass of a naive single-URL check.
 */
export async function fetchPageSafely(rawUrl: string, redirectsLeft = MAX_REDIRECTS): Promise<FetchedPage> {
  const url = await assertPublicUrl(rawUrl);
  const startedAt = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": "StivelyLeadIntelligenceBot/1.0 (+https://www.stively.com)" },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirectsLeft <= 0) {
        throw new Error("Too many redirects or missing Location header");
      }
      const nextUrl = new URL(location, url).toString();
      return fetchPageSafely(nextUrl, redirectsLeft - 1);
    }

    const reader = response.body?.getReader();
    let html = "";
    let bytesRead = 0;
    if (reader) {
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytesRead += value.byteLength;
        if (bytesRead > MAX_BYTES) {
          await reader.cancel();
          break;
        }
        html += decoder.decode(value, { stream: true });
      }
    }

    return {
      url: url.toString(),
      status: response.status,
      headers: response.headers,
      html,
      responseTimeMs: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timeout);
  }
}
