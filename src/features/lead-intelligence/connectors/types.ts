import type { ConnectorType, SocialPlatform } from "@prisma/client";

/** What every connector produces for one discovered/imported prospect - maps directly onto Business's scalar fields, plus any SocialProfile rows to attach (only the `website` connector populates these - Google Places never returns social links). */
export interface ConnectorResult {
  businessName: string;
  ownerName?: string;
  industry?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  googlePlaceId?: string;
  googleRating?: number;
  googleReviewCount?: number;
  googlePlaceTypes?: string[];
  socialLinks?: { platform: SocialPlatform; url: string }[];
}

export interface ConnectorRunSummary {
  results: ConnectorResult[];
  errors: { item: string; message: string }[];
}

export type { ConnectorType };
