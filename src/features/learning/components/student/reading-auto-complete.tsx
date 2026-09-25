"use client";

import * as React from "react";

import { markLessonComplete } from "../../actions/progress-actions";

const DWELL_MS = 3000;

/**
 * The reading-material twin of BlockVideo's 90%-watched watcher: fires
 * markLessonComplete after this block has been the visible item for a few
 * seconds, same low bar as the video side ("seen it" is enough, no
 * scroll-to-bottom or comprehension check). Renders nothing - same
 * client-leaf-inside-a-server-component shape as offerings/
 * view-content-tracker.tsx, so BlockText itself never needs "use client".
 * The short dwell only guards against auto-completing a lesson by
 * flicking through the item tabs without ever landing on this one -
 * markLessonComplete's own quiz gate is the real backstop either way.
 */
function ReadingAutoComplete({
  enrollmentId,
  lessonId,
  lessonAlreadyCompleted,
}: {
  enrollmentId: string;
  lessonId: string;
  lessonAlreadyCompleted: boolean;
}) {
  React.useEffect(() => {
    if (lessonAlreadyCompleted) return;
    const timer = setTimeout(() => {
      void markLessonComplete(enrollmentId, lessonId);
    }, DWELL_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-arm per mount (new active item), not on every prop identity change
  }, [enrollmentId, lessonId]);

  return null;
}

export { ReadingAutoComplete };
