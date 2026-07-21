"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BLOCK_TYPE_LABEL, BLOCK_TYPE_ICON } from "../../lib/block-types";
import { deleteModule, deleteLesson, deleteBlock, reorderModule, reorderLesson, reorderBlock } from "../../actions/admin-curriculum-actions";
import { ReorderButtons } from "./reorder-buttons";
import { ModuleForm } from "./module-form";
import { LessonForm } from "./lesson-form";
import { BlockForm } from "./block-form";
import type { LearningExperienceForAdmin } from "../../server/admin-queries";
import type { Resource, Assessment, LiveSession } from "@prisma/client";

export interface CurriculumTreeProps {
  learningExperience: LearningExperienceForAdmin;
  resources: Resource[];
  assessments: Assessment[];
  liveSessions: LiveSession[];
}

function CurriculumTree({ learningExperience, resources, assessments, liveSessions }: CurriculumTreeProps) {
  const router = useRouter();
  const modules = learningExperience.modules;
  // Which row's delete is in flight - disables just that row's button
  // (and blocks a second click on it) rather than a single shared flag
  // freezing every delete button on the tree at once.
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

  async function handleDelete(id: string, action: () => Promise<unknown>) {
    if (!window.confirm("Delete this? This can't be undone.")) return;
    setPendingDeleteId(id);
    await action();
    setPendingDeleteId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-lg font-semibold">Curriculum</h2>
        <ModuleForm learningExperienceId={learningExperience.id} />
      </div>

      {modules.length === 0 && (
        <p className="text-muted-foreground text-sm">No modules yet - add the first one to start building this curriculum.</p>
      )}

      {modules.map((module, moduleIndex) => (
        <Card key={module.id}>
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-2">
              <ReorderButtons
                onMoveUp={() => reorderModule(module.id, "up")}
                onMoveDown={() => reorderModule(module.id, "down")}
                disableUp={moduleIndex === 0}
                disableDown={moduleIndex === modules.length - 1}
              />
              <div className="flex flex-col">
                <CardTitle>{module.title}</CardTitle>
                {module.description && <p className="text-muted-foreground mt-1 text-sm">{module.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ModuleForm learningExperienceId={learningExperience.id} module={module} />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete module"
                loading={pendingDeleteId === module.id}
                disabled={pendingDeleteId !== null}
                onClick={() => handleDelete(module.id, () => deleteModule(module.id))}
              >
                &times;
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {module.lessons.map((lesson, lessonIndex) => (
              <div key={lesson.id} className="border-border rounded-lg border p-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2">
                    <ReorderButtons
                      onMoveUp={() => reorderLesson(lesson.id, "up")}
                      onMoveDown={() => reorderLesson(lesson.id, "down")}
                      disableUp={lessonIndex === 0}
                      disableDown={lessonIndex === module.lessons.length - 1}
                    />
                    <div className="flex flex-col gap-1">
                      <span className="text-foreground text-sm font-medium">{lesson.title}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {lesson.isPreviewable && <Badge variant="outline">Previewable</Badge>}
                        {!lesson.requiresPreviousCompletion && <Badge variant="outline">No lock</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <LessonForm moduleId={module.id} lesson={lesson} />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete lesson"
                      loading={pendingDeleteId === lesson.id}
                      disabled={pendingDeleteId !== null}
                      onClick={() => handleDelete(lesson.id, () => deleteLesson(lesson.id))}
                    >
                      &times;
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2 pl-8">
                  {lesson.blocks.map((block, blockIndex) => {
                    const Icon = BLOCK_TYPE_ICON[block.type];
                    return (
                      <div key={block.id} className="bg-muted flex items-center justify-between gap-3 rounded-md px-3 py-2">
                        <div className="flex items-center gap-2">
                          <ReorderButtons
                            onMoveUp={() => reorderBlock(block.id, "up")}
                            onMoveDown={() => reorderBlock(block.id, "down")}
                            disableUp={blockIndex === 0}
                            disableDown={blockIndex === lesson.blocks.length - 1}
                          />
                          <Icon className="text-muted-foreground size-4" aria-hidden="true" />
                          <span className="text-foreground text-sm">{block.title || BLOCK_TYPE_LABEL[block.type]}</span>
                          <Badge variant="outline">{BLOCK_TYPE_LABEL[block.type]}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <BlockForm
                            lessonId={lesson.id}
                            learningExperienceId={learningExperience.id}
                            block={block}
                            resources={resources}
                            assessments={assessments}
                            liveSessions={liveSessions}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete block"
                            loading={pendingDeleteId === block.id}
                            disabled={pendingDeleteId !== null}
                            onClick={() => handleDelete(block.id, () => deleteBlock(block.id))}
                          >
                            &times;
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <BlockForm
                    lessonId={lesson.id}
                    learningExperienceId={learningExperience.id}
                    resources={resources}
                    assessments={assessments}
                    liveSessions={liveSessions}
                  />
                </div>
              </div>
            ))}
            <LessonForm moduleId={module.id} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export { CurriculumTree };
