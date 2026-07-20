import { BlockText } from "./block-text";
import { BlockVideo } from "./block-video";
import { BlockResource } from "./block-resource";
import { BlockExternalLink } from "./block-external-link";
import { BlockEmbed } from "./block-embed";
import { BlockCode } from "./block-code";
import { BlockAssessment } from "./block-assessment";
import { BlockLiveSession } from "./block-live-session";
import { BlockUnbuiltPlaceholder } from "./block-unbuilt-placeholder";
import type { LessonBlockWithRelations } from "../../server/queries";

/** The one dispatcher every lesson's content flows through - the "one renderer per polymorphic type" pattern already used for Offering CTAs and status badges elsewhere in this codebase. */
function BlockRenderer({ block, enrollmentId }: { block: LessonBlockWithRelations; enrollmentId: string }) {
  switch (block.type) {
    case "RICH_TEXT":
    case "MARKDOWN":
      return <BlockText block={block} />;
    case "VIDEO":
      return <BlockVideo block={block} />;
    case "PDF":
    case "SLIDES":
    case "DOWNLOAD":
      return block.resource ? <BlockResource resource={block.resource} /> : null;
    case "EXTERNAL_LINK":
      return <BlockExternalLink block={block} />;
    case "EMBED":
      return <BlockEmbed block={block} />;
    case "CODE":
      return <BlockCode block={block} />;
    case "QUIZ":
    case "ASSIGNMENT":
    case "PROJECT":
      return block.assessment ? <BlockAssessment assessment={block.assessment} enrollmentId={enrollmentId} /> : null;
    case "LIVE_SESSION":
      return block.liveSession ? <BlockLiveSession session={block.liveSession} /> : null;
    case "AI_CONVERSATION":
      return <BlockUnbuiltPlaceholder type={block.type} />;
    default:
      return <BlockUnbuiltPlaceholder type={block.type} />;
  }
}

export { BlockRenderer };
