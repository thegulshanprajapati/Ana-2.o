"use client";

import { create } from "zustand";

import {
  AUDIENCE_OPTIONS,
  cleanCaptionForPayload,
  ComposerDraft,
  ComposerMediaItem,
  ComposerToast,
  createAutoEnhanceAdjustments,
  createId,
  createMediaEdits,
  createTextLayer,
  DraftMediaSnapshot,
  FilterPresetId,
  HASHTAG_SUGGESTIONS,
  LayerAlignment,
  LayerFont,
  makeDraftTitle,
  MENTION_SUGGESTIONS,
  PostTypeValue,
  STORAGE_KEYS,
} from "@/types/composer";

type LoadingFlags = {
  isUploading: boolean;
  isExporting: boolean;
  isPosting: boolean;
};

type ComposerState = LoadingFlags & {
  mediaItems: ComposerMediaItem[];
  activeMediaId: string | null;
  postType: PostTypeValue;
  caption: string;
  location: string;
  audience: (typeof AUDIENCE_OPTIONS)[number];
  scheduleEnabled: boolean;
  scheduledAt: string;
  saveAsDraft: boolean;
  applyToAll: boolean;
  drafts: ComposerDraft[];
  aiCaptionSuggestions: string[];
  hashtagSuggestions: string[];
  toasts: ComposerToast[];
};

type ComposerActions = {
  addMediaFiles: (files: File[]) => Promise<void>;
  clearMedia: () => void;
  removeMediaItem: (mediaId: string) => void;
  reorderMedia: (from: number, to: number) => void;
  setActiveMedia: (mediaId: string) => void;
  updateMediaUploadProgress: (mediaId: string, progress: number) => void;
  setPostType: (postType: PostTypeValue) => void;
  setCaption: (caption: string) => void;
  setAudience: (audience: (typeof AUDIENCE_OPTIONS)[number]) => void;
  setLocation: (location: string) => void;
  setScheduleEnabled: (enabled: boolean) => void;
  setScheduledAt: (datetime: string) => void;
  setSaveAsDraft: (save: boolean) => void;
  setApplyToAll: (value: boolean) => void;
  applyFilter: (filter: FilterPresetId, mediaId?: string) => void;
  autoEnhanceMedia: (mediaId?: string) => void;
  setAdjustment: (
    key:
      | "brightness"
      | "contrast"
      | "saturation"
      | "warmth"
      | "sharpness"
      | "blur"
      | "vignette",
    value: number,
    mediaId?: string
  ) => void;
  resetAdjustments: (mediaId?: string) => void;
  setCropAspect: (aspect: "square" | "portrait" | "landscape" | "original", mediaId?: string) => void;
  setCropValues: (
    mediaId: string,
    patch: Partial<ComposerMediaItem["edits"]["crop"]>
  ) => void;
  addTextLayer: (mediaId: string) => void;
  selectTextLayer: (mediaId: string, layerId: string | null) => void;
  updateTextLayer: (
    mediaId: string,
    layerId: string,
    patch: Partial<{
      text: string;
      x: number;
      y: number;
      scale: number;
      rotation: number;
      color: string;
      opacity: number;
      font: LayerFont;
      background: boolean;
      align: LayerAlignment;
    }>
  ) => void;
  removeTextLayer: (mediaId: string, layerId: string) => void;
  setExportedMediaData: (mediaId: string, dataUrl: string) => void;
  generateCaptionSuggestions: () => void;
  applyCaptionSuggestion: (value: string) => void;
  generateHashtagSuggestions: () => void;
  appendHashtag: (value: string) => void;
  clearAIAssist: () => void;
  addToast: (toast: Omit<ComposerToast, "id">) => void;
  dismissToast: (toastId: string) => void;
  loadDrafts: () => void;
  saveDraft: (draftId?: string) => ComposerDraft | null;
  restoreDraft: (draftId: string) => void;
  deleteDraft: (draftId: string) => void;
  resetComposer: () => void;
  setLoadingFlags: (flags: Partial<LoadingFlags>) => void;
};

const baseState: ComposerState = {
  mediaItems: [],
  activeMediaId: null,
  postType: "photo",
  caption: "",
  location: "",
  audience: "public",
  scheduleEnabled: false,
  scheduledAt: "",
  saveAsDraft: true,
  applyToAll: false,
  drafts: [],
  aiCaptionSuggestions: [],
  hashtagSuggestions: [],
  toasts: [],
  isUploading: false,
  isExporting: false,
  isPosting: false,
};

const draftMediaFromComposer = (media: ComposerMediaItem): DraftMediaSnapshot => ({
  id: media.id,
  kind: media.kind,
  name: media.name,
  previewUrl: media.exportedDataUrl ?? media.persistentPreview ?? media.objectUrl,
  mimeType: media.mimeType,
  edits: {
    ...media.edits,
    adjustments: { ...media.edits.adjustments },
    crop: { ...media.edits.crop },
    textLayers: media.edits.textLayers.map((layer) => ({ ...layer })),
  },
  width: media.width,
  height: media.height,
});

const hydrateDrafts = (): ComposerDraft[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.drafts);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as ComposerDraft[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
};

const persistDrafts = (drafts: ComposerDraft[]) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.drafts, JSON.stringify(drafts));
};

const createItemMetadata = async (item: ComposerMediaItem): Promise<Partial<ComposerMediaItem>> => {
  if (typeof window === "undefined") {
    return {};
  }

  if (item.kind === "image") {
    const metadata = await new Promise<{ width: number; height: number }>((resolve) => {
      const image = new window.Image();
      image.onload = () => {
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
      };
      image.onerror = () => {
        resolve({ width: 1080, height: 1080 });
      };
      image.src = item.objectUrl;
    });

    return metadata;
  }

  const metadata = await new Promise<{ width: number; height: number; duration: number }>((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      resolve({ width: video.videoWidth, height: video.videoHeight, duration: video.duration });
    };
    video.onerror = () => {
      resolve({ width: 1080, height: 1920, duration: 0 });
    };
    video.src = item.objectUrl;
  });

  return metadata;
};

const readAsDataUrl = async (file: File) => {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
};

const targetMediaIds = (
  state: ComposerState,
  mediaId?: string,
  applyToAll?: boolean
): Set<string> => {
  if (applyToAll ?? state.applyToAll) {
    return new Set(state.mediaItems.map((item) => item.id));
  }

  const resolved = mediaId ?? state.activeMediaId;
  return resolved ? new Set([resolved]) : new Set<string>();
};

const nextToastList = (toasts: ComposerToast[], next: ComposerToast) => {
  return [...toasts, next].slice(-4);
};

export const useComposerStore = create<ComposerState & ComposerActions>((set, get) => ({
  ...baseState,

  addMediaFiles: async (files) => {
    const accepted = files.filter((file) => {
      return file.type.startsWith("image/") || file.type.startsWith("video/");
    });

    if (!accepted.length) {
      get().addToast({
        title: "Unsupported file",
        description: "Only image and video files are supported.",
        tone: "error",
      });
      return;
    }

    set({ isUploading: true });

    const created: ComposerMediaItem[] = [];

    for (const file of accepted) {
      const objectUrl = URL.createObjectURL(file);
      const item: ComposerMediaItem = {
        id: createId(),
        kind: file.type.startsWith("video/") ? "video" : "image",
        file,
        objectUrl,
        persistentPreview: file.type.startsWith("image/") ? await readAsDataUrl(file) : undefined,
        name: file.name,
        mimeType: file.type,
        size: file.size,
        uploadProgress: 0,
        uploadStatus: "uploading",
        edits: createMediaEdits(),
      };

      const metadata = await createItemMetadata(item);
      created.push({ ...item, ...metadata });
    }

    set((state) => {
      const mediaItems = [...state.mediaItems, ...created];
      return {
        mediaItems,
        activeMediaId: state.activeMediaId ?? created[0]?.id ?? null,
      };
    });

    created.forEach((item) => {
      let progress = 0;
      const timer = window.setInterval(() => {
        progress += 12 + Math.round(Math.random() * 15);
        const normalized = Math.min(progress, 100);
        get().updateMediaUploadProgress(item.id, normalized);
        if (normalized >= 100) {
          window.clearInterval(timer);
        }
      }, 180);
    });

    set({ isUploading: false });
  },

  clearMedia: () => {
    const items = get().mediaItems;
    items.forEach((item) => {
      if (item.objectUrl.startsWith("blob:")) {
        URL.revokeObjectURL(item.objectUrl);
      }
    });

    set({ mediaItems: [], activeMediaId: null });
  },

  removeMediaItem: (mediaId) => {
    set((state) => {
      const current = state.mediaItems.find((item) => item.id === mediaId);
      if (current?.objectUrl.startsWith("blob:")) {
        URL.revokeObjectURL(current.objectUrl);
      }

      const mediaItems = state.mediaItems.filter((item) => item.id !== mediaId);
      const activeMediaId =
        state.activeMediaId === mediaId ? mediaItems[0]?.id ?? null : state.activeMediaId;
      return { mediaItems, activeMediaId };
    });
  },

  reorderMedia: (from, to) => {
    set((state) => {
      if (from === to || from < 0 || to < 0 || from >= state.mediaItems.length || to >= state.mediaItems.length) {
        return state;
      }

      const mediaItems = [...state.mediaItems];
      const [moved] = mediaItems.splice(from, 1);
      mediaItems.splice(to, 0, moved);
      return { mediaItems };
    });
  },

  setActiveMedia: (mediaId) => set({ activeMediaId: mediaId }),

  updateMediaUploadProgress: (mediaId, progress) => {
    set((state) => {
      const mediaItems = state.mediaItems.map((item) => {
        if (item.id !== mediaId) {
          return item;
        }

        return {
          ...item,
          uploadProgress: progress,
          uploadStatus:
            (progress >= 100 ? "uploaded" : "uploading") as ComposerMediaItem["uploadStatus"],
        };
      });
      return { mediaItems };
    });
  },

  setPostType: (postType) => set({ postType }),
  setCaption: (caption) => set({ caption }),
  setAudience: (audience) => set({ audience }),
  setLocation: (location) => set({ location }),
  setScheduleEnabled: (enabled) => set({ scheduleEnabled: enabled }),
  setScheduledAt: (datetime) => set({ scheduledAt: datetime }),
  setSaveAsDraft: (save) => set({ saveAsDraft: save }),
  setApplyToAll: (value) => set({ applyToAll: value }),

  applyFilter: (filter, mediaId) => {
    set((state) => {
      const targets = targetMediaIds(state, mediaId);
      if (!targets.size) {
        return state;
      }

      const mediaItems = state.mediaItems.map((item) => {
        if (!targets.has(item.id)) {
          return item;
        }

        return {
          ...item,
          edits: {
            ...item.edits,
            filter,
          },
        };
      });

      return { mediaItems };
    });
  },

  autoEnhanceMedia: (mediaId) => {
    set((state) => {
      const targets = targetMediaIds(state, mediaId);
      if (!targets.size) {
        return state;
      }

      const mediaItems = state.mediaItems.map((item) => {
        if (!targets.has(item.id)) {
          return item;
        }

        return {
          ...item,
          edits: {
            ...item.edits,
            autoEnhanced: true,
            adjustments: createAutoEnhanceAdjustments(item.edits.adjustments),
          },
        };
      });

      return { mediaItems };
    });
  },

  setAdjustment: (key, value, mediaId) => {
    set((state) => {
      const targets = targetMediaIds(state, mediaId);
      if (!targets.size) {
        return state;
      }

      const mediaItems = state.mediaItems.map((item) => {
        if (!targets.has(item.id)) {
          return item;
        }

        return {
          ...item,
          edits: {
            ...item.edits,
            adjustments: {
              ...item.edits.adjustments,
              [key]: value,
            },
            autoEnhanced: false,
          },
        };
      });

      return { mediaItems };
    });
  },

  resetAdjustments: (mediaId) => {
    set((state) => {
      const targets = targetMediaIds(state, mediaId);
      if (!targets.size) {
        return state;
      }

      const mediaItems = state.mediaItems.map((item) => {
        if (!targets.has(item.id)) {
          return item;
        }

        return {
          ...item,
          edits: {
            ...item.edits,
            adjustments: createMediaEdits().adjustments,
            autoEnhanced: false,
          },
        };
      });

      return { mediaItems };
    });
  },

  setCropAspect: (aspect, mediaId) => {
    set((state) => {
      const targets = targetMediaIds(state, mediaId);
      const mediaItems = state.mediaItems.map((item) => {
        if (!targets.has(item.id)) {
          return item;
        }

        return {
          ...item,
          edits: {
            ...item.edits,
            crop: {
              ...item.edits.crop,
              aspect,
              offsetX: 0,
              offsetY: 0,
            },
          },
        };
      });

      return { mediaItems };
    });
  },

  setCropValues: (mediaId, patch) => {
    set((state) => {
      const mediaItems = state.mediaItems.map((item) => {
        if (item.id !== mediaId) {
          return item;
        }

        return {
          ...item,
          edits: {
            ...item.edits,
            crop: {
              ...item.edits.crop,
              ...patch,
            },
          },
        };
      });

      return { mediaItems };
    });
  },

  addTextLayer: (mediaId) => {
    set((state) => {
      const mediaItems = state.mediaItems.map((item) => {
        if (item.id !== mediaId) {
          return item;
        }

        const layer = createTextLayer();
        return {
          ...item,
          edits: {
            ...item.edits,
            textLayers: [...item.edits.textLayers, layer],
            selectedTextLayerId: layer.id,
          },
        };
      });

      return { mediaItems };
    });
  },

  selectTextLayer: (mediaId, layerId) => {
    set((state) => ({
      mediaItems: state.mediaItems.map((item) => {
        if (item.id !== mediaId) {
          return item;
        }

        return {
          ...item,
          edits: {
            ...item.edits,
            selectedTextLayerId: layerId,
          },
        };
      }),
    }));
  },

  updateTextLayer: (mediaId, layerId, patch) => {
    set((state) => ({
      mediaItems: state.mediaItems.map((item) => {
        if (item.id !== mediaId) {
          return item;
        }

        return {
          ...item,
          edits: {
            ...item.edits,
            textLayers: item.edits.textLayers.map((layer) =>
              layer.id === layerId ? { ...layer, ...patch } : layer
            ),
          },
        };
      }),
    }));
  },

  removeTextLayer: (mediaId, layerId) => {
    set((state) => ({
      mediaItems: state.mediaItems.map((item) => {
        if (item.id !== mediaId) {
          return item;
        }

        const textLayers = item.edits.textLayers.filter((layer) => layer.id !== layerId);
        return {
          ...item,
          edits: {
            ...item.edits,
            textLayers,
            selectedTextLayerId:
              item.edits.selectedTextLayerId === layerId ? textLayers[0]?.id ?? null : item.edits.selectedTextLayerId,
          },
        };
      }),
    }));
  },

  setExportedMediaData: (mediaId, dataUrl) => {
    set((state) => ({
      mediaItems: state.mediaItems.map((item) =>
        item.id === mediaId
          ? {
              ...item,
              exportedDataUrl: dataUrl,
            }
          : item
      ),
    }));
  },

  generateCaptionSuggestions: () => {
    const { caption, postType } = get();
    const trimmed = cleanCaptionForPayload(caption);
    const headline = trimmed || "new update";
    const [firstTag = "anaconnect", secondTag = "creatorworkflow"] = HASHTAG_SUGGESTIONS;

    const suggestions = [
      `Building in public: ${headline}. What should we ship next? #${firstTag}`,
      `Quick drop from today: ${headline}. Feedback from the community keeps us sharp. #${secondTag}`,
      `Creator log: ${headline}. ${postType === "reel" ? "Watch till the end." : "Sharing the full context below."}`,
    ];

    set({ aiCaptionSuggestions: suggestions });
  },

  applyCaptionSuggestion: (value) => {
    set({ caption: value });
  },

  generateHashtagSuggestions: () => {
    const captionWords = get()
      .caption.toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);

    const matched = HASHTAG_SUGGESTIONS.filter((tag) =>
      captionWords.some((word) => tag.includes(word))
    );

    const fallback = ["anaconnect", "contentstrategy", "socialmedia", "creatorbuilds"];

    const hashtagSuggestions = Array.from(new Set([...matched, ...fallback])).slice(0, 8);
    set({ hashtagSuggestions });
  },

  appendHashtag: (value) => {
    const tag = value.startsWith("#") ? value : `#${value}`;
    set((state) => {
      const next = state.caption.trim();
      if (next.includes(tag)) {
        return state;
      }
      return { caption: `${next}${next ? " " : ""}${tag}` };
    });
  },

  clearAIAssist: () => set({ aiCaptionSuggestions: [], hashtagSuggestions: [] }),

  addToast: (toast) => {
    set((state) => ({
      toasts: nextToastList(state.toasts, {
        id: createId(),
        title: toast.title,
        description: toast.description,
        tone: toast.tone ?? "info",
      }),
    }));
  },

  dismissToast: (toastId) => {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== toastId) }));
  },

  loadDrafts: () => {
    set({ drafts: hydrateDrafts() });
  },

  saveDraft: (draftId) => {
    const state = get();
    const snapshot: ComposerDraft = {
      id: draftId ?? createId(),
      title: makeDraftTitle(state.caption),
      caption: state.caption,
      postType: state.postType,
      audience: state.audience,
      location: state.location,
      scheduleEnabled: state.scheduleEnabled,
      scheduledAt: state.scheduledAt,
      saveAsDraft: state.saveAsDraft,
      applyToAll: state.applyToAll,
      media: state.mediaItems.map(draftMediaFromComposer),
      updatedAt: new Date().toISOString(),
    };

    const existing = state.drafts.filter((draft) => draft.id !== snapshot.id);
    const drafts = [snapshot, ...existing].slice(0, 20);

    persistDrafts(drafts);
    set({ drafts });

    return snapshot;
  },

  restoreDraft: (draftId) => {
    const target = get().drafts.find((draft) => draft.id === draftId);
    if (!target) {
      return;
    }

    const mediaItems: ComposerMediaItem[] = target.media.map((snapshot) => ({
      id: snapshot.id,
      kind: snapshot.kind,
      objectUrl: snapshot.previewUrl,
      persistentPreview: snapshot.previewUrl,
      name: snapshot.name,
      mimeType: snapshot.mimeType,
      size: 0,
      width: snapshot.width,
      height: snapshot.height,
      uploadProgress: 100,
      uploadStatus: "uploaded",
      edits: {
        ...snapshot.edits,
        adjustments: { ...snapshot.edits.adjustments },
        crop: { ...snapshot.edits.crop },
        textLayers: snapshot.edits.textLayers.map((layer) => ({ ...layer })),
      },
      exportedDataUrl: snapshot.previewUrl,
    }));

    set({
      caption: target.caption,
      postType: target.postType,
      audience: target.audience,
      location: target.location,
      scheduleEnabled: target.scheduleEnabled,
      scheduledAt: target.scheduledAt,
      saveAsDraft: target.saveAsDraft,
      applyToAll: target.applyToAll,
      mediaItems,
      activeMediaId: mediaItems[0]?.id ?? null,
    });
  },

  deleteDraft: (draftId) => {
    const drafts = get().drafts.filter((draft) => draft.id !== draftId);
    persistDrafts(drafts);
    set({ drafts });
  },

  resetComposer: () => {
    const items = get().mediaItems;
    items.forEach((item) => {
      if (item.objectUrl.startsWith("blob:")) {
        URL.revokeObjectURL(item.objectUrl);
      }
    });

    set({
      mediaItems: [],
      activeMediaId: null,
      postType: "photo",
      caption: "",
      location: "",
      audience: "public",
      scheduleEnabled: false,
      scheduledAt: "",
      saveAsDraft: true,
      applyToAll: false,
      aiCaptionSuggestions: [],
      hashtagSuggestions: [],
      isUploading: false,
      isExporting: false,
      isPosting: false,
    });
  },

  setLoadingFlags: (flags) => {
    set((state) => ({ ...state, ...flags }));
  },
}));

export const composerMentionMatches = (query: string) => {
  const normalized = query.toLowerCase();
  return MENTION_SUGGESTIONS.filter((mention) => mention.includes(normalized)).slice(0, 5);
};

export const composerHashtagMatches = (query: string) => {
  const normalized = query.toLowerCase();
  return HASHTAG_SUGGESTIONS.filter((hashtag) => hashtag.includes(normalized)).slice(0, 6);
};
