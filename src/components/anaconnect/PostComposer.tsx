"use client";

import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Bookmark,
  Loader2,
  MoreHorizontal,
  ShieldCheck,
} from "lucide-react";

import { AppContext } from "@/context/AppContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostTypeTabs } from "@/components/anaconnect/PostTypeTabs";
import { MediaDropzone } from "@/components/anaconnect/MediaDropzone";
import { MediaPreview } from "@/components/anaconnect/MediaPreview";
import { CropPanel } from "@/components/anaconnect/CropPanel";
import { FilterBar } from "@/components/anaconnect/FilterBar";
import { AdjustmentsPanel } from "@/components/anaconnect/AdjustmentsPanel";
import { TextOverlayEditor } from "@/components/anaconnect/TextOverlayEditor";
import { CaptionEditor } from "@/components/anaconnect/CaptionEditor";
import { MetaPanel } from "@/components/anaconnect/MetaPanel";
import { BottomActionBar } from "@/components/anaconnect/BottomActionBar";
import { DraftsModal } from "@/components/anaconnect/DraftsModal";
import { Toasts } from "@/components/anaconnect/Toasts";
import { exportComposerPayload } from "@/lib/image/exportCanvas";
import { useComposerStore } from "@/store/useComposerStore";
import {
  cleanCaptionForPayload,
  ComposerFormValues,
  MAX_CAPTION_LENGTH,
} from "@/types/composer";

const postTypeEnum = ["photo", "text", "story", "reel", "poll"] as const;
const audienceEnum = ["public", "followers", "private"] as const;

const composerSchema = z
  .object({
    caption: z.string().max(MAX_CAPTION_LENGTH, `Caption must be under ${MAX_CAPTION_LENGTH} characters.`),
    postType: z.enum(postTypeEnum),
    audience: z.enum(audienceEnum),
    location: z.string(),
    scheduleEnabled: z.boolean(),
    scheduledAt: z.string(),
    saveAsDraft: z.boolean(),
    mediaCount: z.number().int().min(0),
  })
  .superRefine((value, ctx) => {
    if (!value.caption.trim() && value.mediaCount === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add media or caption before posting.",
        path: ["caption"],
      });
    }

    if (value.scheduleEnabled) {
      if (!value.scheduledAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select a schedule date and time.",
          path: ["scheduledAt"],
        });
        return;
      }

      const date = new Date(value.scheduledAt);
      if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Scheduled date must be in the future.",
          path: ["scheduledAt"],
        });
      }
    }
  });

const getDefaultFormValues = (): ComposerFormValues => ({
  caption: "",
  postType: "photo",
  audience: "public",
  location: "",
  scheduleEnabled: false,
  scheduledAt: "",
  saveAsDraft: true,
  mediaCount: 0,
});

interface PostComposerProps {
  onClose?: () => void;
}

export function PostComposer({ onClose }: PostComposerProps) {
  const { user } = useContext(AppContext);
  const [previewMode, setPreviewMode] = useState(false);
  const [draftsOpen, setDraftsOpen] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const metaSectionRef = useRef<HTMLDivElement>(null);

  const {
    mediaItems,
    activeMediaId,
    applyToAll,
    drafts,
    toasts,
    aiCaptionSuggestions,
    hashtagSuggestions,
    isPosting,
    isExporting,
    addMediaFiles,
    removeMediaItem,
    reorderMedia,
    setActiveMedia,
    setPostType,
    setCaption,
    setAudience,
    setLocation,
    setScheduleEnabled,
    setScheduledAt,
    setSaveAsDraft,
    setApplyToAll,
    applyFilter,
    autoEnhanceMedia,
    setAdjustment,
    resetAdjustments,
    setCropAspect,
    setCropValues,
    addTextLayer,
    selectTextLayer,
    updateTextLayer,
    removeTextLayer,
    generateCaptionSuggestions,
    applyCaptionSuggestion,
    generateHashtagSuggestions,
    appendHashtag,
    dismissToast,
    addToast,
    saveDraft,
    loadDrafts,
    restoreDraft,
    deleteDraft,
    resetComposer,
    setExportedMediaData,
    setLoadingFlags,
  } = useComposerStore((state) => state);

  const form = useForm<ComposerFormValues>({
    resolver: zodResolver(composerSchema),
    defaultValues: getDefaultFormValues(),
    mode: "onChange",
  });

  const watchedCaption = form.watch("caption");
  const watchedAudience = form.watch("audience");
  const watchedLocation = form.watch("location");
  const watchedScheduleEnabled = form.watch("scheduleEnabled");
  const watchedScheduledAt = form.watch("scheduledAt");
  const watchedSaveAsDraft = form.watch("saveAsDraft");
  const watchedPostType = form.watch("postType");

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  useEffect(() => {
    form.setValue("mediaCount", mediaItems.length, { shouldValidate: true });
  }, [form, mediaItems.length]);

  useEffect(() => {
    setCaption(watchedCaption ?? "");
  }, [setCaption, watchedCaption]);

  useEffect(() => {
    setAudience(watchedAudience);
  }, [setAudience, watchedAudience]);

  useEffect(() => {
    setLocation(watchedLocation);
  }, [setLocation, watchedLocation]);

  useEffect(() => {
    setScheduleEnabled(watchedScheduleEnabled);
  }, [setScheduleEnabled, watchedScheduleEnabled]);

  useEffect(() => {
    setScheduledAt(watchedScheduledAt);
  }, [setScheduledAt, watchedScheduledAt]);

  useEffect(() => {
    setSaveAsDraft(watchedSaveAsDraft);
  }, [setSaveAsDraft, watchedSaveAsDraft]);

  useEffect(() => {
    setPostType(watchedPostType);
  }, [setPostType, watchedPostType]);

  useEffect(() => {
    if (!watchedSaveAsDraft) {
      return;
    }

    if (!watchedCaption.trim() && mediaItems.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      saveDraft();
    }, 10_000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [mediaItems.length, saveDraft, watchedCaption, watchedSaveAsDraft, watchedAudience, watchedLocation, watchedScheduleEnabled, watchedScheduledAt, watchedPostType]);

  const activeMedia = useMemo(() => {
    return mediaItems.find((item) => item.id === activeMediaId) ?? null;
  }, [activeMediaId, mediaItems]);

  const handleAddFiles = async (files: File[]) => {
    await addMediaFiles(files);
    form.trigger("caption");
  };

  const syncFormWithStore = () => {
    const state = useComposerStore.getState();
    form.reset({
      caption: state.caption,
      postType: state.postType,
      audience: state.audience,
      location: state.location,
      scheduleEnabled: state.scheduleEnabled,
      scheduledAt: state.scheduledAt,
      saveAsDraft: state.saveAsDraft,
      mediaCount: state.mediaItems.length,
    });
  };

  const handleRestoreDraft = (draftId: string) => {
    restoreDraft(draftId);
    syncFormWithStore();
    addToast({ title: "Draft restored", tone: "success" });
  };

  const handleManualDraftSave = () => {
    const snapshot = saveDraft();
    if (snapshot) {
      addToast({ title: "Draft saved", description: snapshot.title, tone: "success" });
    }
  };

  const handlePrimaryAction = form.handleSubmit(async (values) => {
    setLoadingFlags({ isPosting: true, isExporting: true });

    try {
      const exportedMedia = await exportComposerPayload(mediaItems);

      exportedMedia.forEach((entry) => {
        if (entry.kind === "image") {
          setExportedMediaData(entry.id, entry.dataUrl);
        }
      });

      setLoadingFlags({ isExporting: false });

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          files: exportedMedia.map((file) => ({
            id: file.id,
            filename: file.filename,
            mimeType: file.mimeType,
            size: file.blob?.size ?? 0,
            preview: file.kind === "image" ? file.dataUrl.slice(0, 120) : "video",
          })),
        }),
      });

      const uploadJson = (await uploadResponse.json()) as {
        files?: Array<{ id: string; url: string; mimeType: string; filename: string }>;
        error?: string;
      };

      if (!uploadResponse.ok || !uploadJson.files) {
        throw new Error(uploadJson.error || "Upload failed");
      }

      const postResponse = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caption: cleanCaptionForPayload(values.caption),
          postType: values.postType,
          audience: values.audience,
          location: values.location,
          scheduleEnabled: values.scheduleEnabled,
          scheduledAt: values.scheduledAt,
          media: uploadJson.files,
          mediaMeta: exportedMedia.map((file) => ({
            id: file.id,
            width: file.width,
            height: file.height,
            type: file.kind,
          })),
        }),
      });

      const postJson = (await postResponse.json()) as { error?: string; id?: string };
      if (!postResponse.ok) {
        throw new Error(postJson.error || "Unable to publish post");
      }

      addToast({
        title: values.scheduleEnabled ? "Post scheduled" : "Post published",
        description: values.scheduleEnabled
          ? `Scheduled for ${new Date(values.scheduledAt).toLocaleString()}`
          : "Your post is now ready.",
        tone: "success",
      });

      resetComposer();
      form.reset(getDefaultFormValues());
    } catch (error) {
      addToast({
        title: "Publish failed",
        description: error instanceof Error ? error.message : "Unexpected error",
        tone: "error",
      });
    } finally {
      setLoadingFlags({ isPosting: false, isExporting: false });
    }
  });

  const postDisabled = !form.formState.isValid || isPosting || isExporting;

  return (
    <>
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          handleAddFiles(Array.from(event.target.files ?? []));
          event.currentTarget.value = "";
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        multiple
        accept="video/*"
        className="hidden"
        onChange={(event) => {
          handleAddFiles(Array.from(event.target.files ?? []));
          event.currentTarget.value = "";
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mx-auto w-full max-w-5xl space-y-2 pb-20 md:space-y-4 md:pb-8"
      >
        <header className="rounded-2xl border bg-white dark:bg-slate-950 border-slate-200/60 dark:border-white/10 p-3 md:p-4 shadow-sm md:shadow-[0_24px_54px_-34px_rgba(20,184,166,0.65)] backdrop-blur-2xl">
          <div className="flex items-start gap-2 md:gap-3">
            <Avatar className="h-8 w-8 md:h-10 md:w-10 border border-slate-200 dark:border-white/15">
              <AvatarImage src={user?.photoURL || undefined} />
              <AvatarFallback>{(user?.displayName || "A").slice(0, 1)}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-xs md:text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {user?.displayName || "Guest Creator"}
                </p>
                {user?.plan === "Enterprise" ? (
                  <Badge className="border border-cyan-300/35 bg-cyan-400/15 text-cyan-100">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Enterprise
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">What&apos;s happening?</p>
            </div>

            <div className="flex items-center gap-2">
              {onClose && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-slate-600 dark:text-slate-300"
                  onClick={onClose}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.28 5.22a.75.75 0 011.06 0L12 9.94l4.66-4.72a.75.75 0 111.06 1.06L13.06 11l4.72 4.66a.75.75 0 11-1.06 1.06L12 12.06l-4.66 4.72a.75.75 0 01-1.06-1.06L10.94 11 6.22 6.34a.75.75 0 010-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                className="hidden md:inline-flex h-8 rounded-lg px-2 text-slate-600 dark:text-slate-300"
                onClick={() => setDraftsOpen(true)}
              >
                <Bookmark className="mr-1 h-4 w-4" />
                Drafts
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8"
                onClick={() => setDraftsOpen(true)}
              >
                <Bookmark className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="text-slate-400">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <PostTypeTabs
          value={watchedPostType}
          onChange={(next) => form.setValue("postType", next, { shouldValidate: true })}
        />

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
          className="space-y-2 md:space-y-4 rounded-[22px] border bg-white dark:bg-gradient-to-b dark:from-slate-900/80 dark:to-slate-950/60 border-slate-200/60 dark:border-white/10 p-3 md:p-5 shadow-sm md:shadow-[0_34px_68px_-42px_rgba(56,189,248,0.7)] backdrop-blur-xl"
        >
          <MediaDropzone
            mediaItems={mediaItems}
            activeMediaId={activeMediaId}
            onFilesSelected={handleAddFiles}
            onRemove={removeMediaItem}
            onActivate={setActiveMedia}
            onReorder={reorderMedia}
          />

          <MediaPreview
            media={activeMedia}
            onRemove={removeMediaItem}
            onAddText={addTextLayer}
            onSelectTextLayer={selectTextLayer}
            onUpdateTextLayer={updateTextLayer}
            onCropChange={setCropValues}
          />

          <CropPanel
            media={activeMedia}
            onAspectChange={(aspect) => setCropAspect(aspect, activeMedia?.id)}
            onCropChange={(patch) => {
              if (!activeMedia) {
                return;
              }
              setCropValues(activeMedia.id, patch);
            }}
          />

          <FilterBar
            media={activeMedia}
            applyToAll={applyToAll}
            onToggleApplyToAll={setApplyToAll}
            onFilterSelect={(filter) => applyFilter(filter, activeMedia?.id)}
            onAutoEnhance={() => autoEnhanceMedia(activeMedia?.id)}
          />

          <AdjustmentsPanel
            media={activeMedia}
            onAdjustmentChange={(key, value) => setAdjustment(key, value, activeMedia?.id)}
            onReset={() => resetAdjustments(activeMedia?.id)}
          />

          <TextOverlayEditor
            media={activeMedia}
            onAddLayer={() => activeMedia && addTextLayer(activeMedia.id)}
            onSelectLayer={(layerId) => activeMedia && selectTextLayer(activeMedia.id, layerId)}
            onUpdateLayer={(layerId, patch) => activeMedia && updateTextLayer(activeMedia.id, layerId, patch)}
            onDeleteLayer={(layerId) => activeMedia && removeTextLayer(activeMedia.id, layerId)}
          />

          <CaptionEditor
            value={watchedCaption}
            previewMode={previewMode}
            onTogglePreview={setPreviewMode}
            onChange={(next) => form.setValue("caption", next, { shouldValidate: true })}
            onGenerateCaptions={generateCaptionSuggestions}
            onGenerateHashtags={generateHashtagSuggestions}
            captionSuggestions={aiCaptionSuggestions}
            hashtagSuggestions={hashtagSuggestions}
            onApplyCaptionSuggestion={(value) => {
              applyCaptionSuggestion(value);
              form.setValue("caption", value, { shouldValidate: true });
            }}
            onApplyHashtag={(tag) => {
              appendHashtag(tag);
              const nextValue = useComposerStore.getState().caption;
              form.setValue("caption", nextValue, { shouldValidate: true });
            }}
          />

          {form.formState.errors.caption?.message ? (
            <p className="text-sm text-rose-600 dark:text-rose-300">{form.formState.errors.caption.message}</p>
          ) : null}

          <div ref={metaSectionRef}>
            <MetaPanel
              location={watchedLocation}
              audience={watchedAudience}
              scheduleEnabled={watchedScheduleEnabled}
              scheduledAt={watchedScheduledAt}
              saveAsDraft={watchedSaveAsDraft}
              onLocationChange={(value) => form.setValue("location", value)}
              onAudienceChange={(value) => form.setValue("audience", value)}
              onScheduleEnabledChange={(value) => form.setValue("scheduleEnabled", value, { shouldValidate: true })}
              onScheduleDateChange={(value) => form.setValue("scheduledAt", value, { shouldValidate: true })}
              onSaveDraftToggle={(value) => form.setValue("saveAsDraft", value)}
              scheduleError={form.formState.errors.scheduledAt?.message}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-slate-950/45 px-2 md:px-3 py-2 text-xs dark:text-slate-400">
            <div className="text-slate-600 dark:text-slate-400">
              {isExporting ? "Exporting..." : isPosting ? "Publishing..." : "Ready"}
            </div>
            <div className="flex items-center gap-1 md:gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-slate-300 dark:border-slate-600 bg-white dark:bg-transparent text-slate-900 dark:text-slate-100 h-7 text-xs"
                onClick={handleManualDraftSave}
              >
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-slate-300 dark:border-slate-600 bg-white dark:bg-transparent text-slate-900 dark:text-slate-100 h-7 text-xs hidden md:inline-flex"
                onClick={() => setDraftsOpen(true)}
              >
                Drafts
              </Button>
            </div>
          </div>

          <BottomActionBar
            characterCount={watchedCaption.length}
            maxCharacters={MAX_CAPTION_LENGTH}
            disabled={postDisabled}
            loading={isPosting || isExporting}
            scheduled={watchedScheduleEnabled}
            onPrimaryAction={handlePrimaryAction}
            onOpenImageUpload={() => imageInputRef.current?.click()}
            onOpenVideoUpload={() => videoInputRef.current?.click()}
            onEmoji={() => {
              const next = `${watchedCaption}${watchedCaption ? " " : ""}🔥`;
              form.setValue("caption", next, { shouldValidate: true });
            }}
            onLocation={() => {
              metaSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              if (!form.getValues("location")) {
                form.setValue("location", "New York");
              }
            }}
            onSchedule={() => {
              metaSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              form.setValue("scheduleEnabled", true, { shouldValidate: true });
            }}
          />
        </motion.section>
      </motion.div>

      <DraftsModal
        open={draftsOpen}
        onOpenChange={setDraftsOpen}
        drafts={drafts}
        onRestore={handleRestoreDraft}
        onDelete={deleteDraft}
      />

      <Toasts toasts={toasts} onDismiss={dismissToast} />

      {(isPosting || isExporting) && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/45 backdrop-blur-sm">
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-slate-950/90 px-4 py-2 text-sm text-slate-100">
            <Loader2 className="h-4 w-4 animate-spin" />
            {isExporting ? "Exporting media" : "Publishing post"}
          </div>
        </div>
      )}
    </>
  );
}
