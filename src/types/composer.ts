export const STORAGE_KEYS = {
  drafts: "ana-connect-composer-drafts-v1",
} as const;

export const MAX_CAPTION_LENGTH = 600;

export const POST_TYPE_OPTIONS = [
  { id: "photo", label: "Photo", acceptsMedia: true },
  { id: "text", label: "Text Post", acceptsMedia: false },
  { id: "story", label: "Story Style", acceptsMedia: true },
  { id: "reel", label: "Video/Reel", acceptsMedia: true },
  { id: "poll", label: "Poll", acceptsMedia: false },
] as const;

export type PostTypeValue = (typeof POST_TYPE_OPTIONS)[number]["id"];

export const ASPECT_RATIO_OPTIONS = [
  { id: "square", label: "1:1", ratio: 1 },
  { id: "portrait", label: "4:5", ratio: 4 / 5 },
  { id: "landscape", label: "16:9", ratio: 16 / 9 },
  { id: "original", label: "Original", ratio: 0 },
] as const;

export type AspectRatioKey = (typeof ASPECT_RATIO_OPTIONS)[number]["id"];

export const FILTER_PRESETS = [
  { id: "normal", name: "Normal", css: "none" },
  {
    id: "warm",
    name: "Warm",
    css: "brightness(1.05) contrast(1.06) saturate(1.18) sepia(0.16) hue-rotate(-8deg)",
  },
  {
    id: "cool",
    name: "Cool",
    css: "brightness(1.03) contrast(1.08) saturate(1.05) hue-rotate(12deg)",
  },
  {
    id: "vintage",
    name: "Vintage",
    css: "contrast(0.92) saturate(0.84) sepia(0.26) brightness(1.03)",
  },
  {
    id: "cinematic",
    name: "Cinematic",
    css: "contrast(1.18) saturate(0.92) brightness(0.95)",
  },
  {
    id: "vibrant",
    name: "Vibrant",
    css: "contrast(1.08) saturate(1.32) brightness(1.05)",
  },
  {
    id: "fade",
    name: "Fade",
    css: "contrast(0.86) saturate(0.9) brightness(1.1)",
  },
  {
    id: "bw",
    name: "B&W",
    css: "grayscale(1) contrast(1.05) brightness(1.02)",
  },
  {
    id: "softglow",
    name: "Soft Glow",
    css: "brightness(1.08) contrast(0.94) saturate(1.08)",
  },
] as const;

export type FilterPresetId = (typeof FILTER_PRESETS)[number]["id"];

export const LOCATION_OPTIONS = [
  "New York",
  "San Francisco",
  "Los Angeles",
  "Austin",
  "Seattle",
  "London",
  "Dubai",
  "Mumbai",
];

export const AUDIENCE_OPTIONS = ["public", "followers", "private"] as const;
export type AudienceValue = (typeof AUDIENCE_OPTIONS)[number];

export type MediaKind = "image" | "video";

export type UploadStatus = "queued" | "uploading" | "uploaded" | "failed";

export type LayerFont = "Classic" | "Modern" | "Bold" | "Script";

export type LayerAlignment = "left" | "center" | "right";

export interface AdjustmentValues {
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  sharpness: number;
  blur: number;
  vignette: number;
}

export interface CropValues {
  aspect: AspectRatioKey;
  zoom: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
}

export interface TextLayer {
  id: string;
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
}

export interface MediaEdits {
  filter: FilterPresetId;
  autoEnhanced: boolean;
  adjustments: AdjustmentValues;
  crop: CropValues;
  textLayers: TextLayer[];
  selectedTextLayerId: string | null;
}

export interface ComposerMediaItem {
  id: string;
  kind: MediaKind;
  file?: File;
  objectUrl: string;
  persistentPreview?: string;
  name: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  uploadProgress: number;
  uploadStatus: UploadStatus;
  edits: MediaEdits;
  exportedDataUrl?: string;
}

export interface DraftMediaSnapshot {
  id: string;
  kind: MediaKind;
  name: string;
  previewUrl: string;
  mimeType: string;
  edits: MediaEdits;
  width?: number;
  height?: number;
}

export interface ComposerDraft {
  id: string;
  title: string;
  caption: string;
  postType: PostTypeValue;
  audience: AudienceValue;
  location: string;
  scheduleEnabled: boolean;
  scheduledAt: string;
  saveAsDraft: boolean;
  applyToAll: boolean;
  media: DraftMediaSnapshot[];
  updatedAt: string;
}

export interface ComposerFormValues {
  caption: string;
  postType: PostTypeValue;
  audience: AudienceValue;
  location: string;
  scheduleEnabled: boolean;
  scheduledAt: string;
  saveAsDraft: boolean;
  mediaCount: number;
}

export interface ComposerToast {
  id: string;
  title: string;
  description?: string;
  tone?: "success" | "error" | "info";
}

export const DEFAULT_ADJUSTMENTS: AdjustmentValues = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  sharpness: 0,
  blur: 0,
  vignette: 0,
};

export const DEFAULT_CROP: CropValues = {
  aspect: "original",
  zoom: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
};

export const FONT_FAMILIES: Record<LayerFont, string> = {
  Classic: '"Times New Roman", serif',
  Modern: '"Inter", "Segoe UI", sans-serif',
  Bold: '"Inter", "Segoe UI", sans-serif',
  Script: '"Brush Script MT", "Segoe Script", cursive',
};

export const MENTION_SUGGESTIONS = [
  "ana_hq",
  "anaconnect",
  "creator_club",
  "growth_team",
  "design_ops",
  "community_lead",
];

export const HASHTAG_SUGGESTIONS = [
  "anaconnect",
  "buildinpublic",
  "creatorworkflow",
  "productdesign",
  "socialstrategy",
  "growthmindset",
  "contentops",
  "nextjs",
];

export const QUICK_EMOJIS = [
  "??",
  "?",
  "??",
  "??",
  "??",
  "??",
  "??",
  "??",
  "?",
  "??",
  "??",
  "??",
];

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
};

export const createTextLayer = (text = "Tap to edit") : TextLayer => ({
  id: createId(),
  text,
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  color: "#ffffff",
  opacity: 1,
  font: "Modern",
  background: true,
  align: "center",
});

export const createMediaEdits = (): MediaEdits => ({
  filter: "normal",
  autoEnhanced: false,
  adjustments: { ...DEFAULT_ADJUSTMENTS },
  crop: { ...DEFAULT_CROP },
  textLayers: [],
  selectedTextLayerId: null,
});

export const getFilterPreset = (presetId: FilterPresetId) => {
  return FILTER_PRESETS.find((preset) => preset.id === presetId) ?? FILTER_PRESETS[0];
};

const buildWarmthFilter = (warmth: number) => {
  if (warmth === 0) {
    return "";
  }

  if (warmth > 0) {
    const sepia = (warmth / 100) * 42;
    const hueRotate = -1 * (warmth / 100) * 14;
    return `sepia(${sepia}%) hue-rotate(${hueRotate}deg)`;
  }

  const cool = Math.abs(warmth);
  const hueRotate = (cool / 100) * 18;
  return `hue-rotate(${hueRotate}deg)`;
};

export const buildCssFilter = (preset: FilterPresetId, adjustments: AdjustmentValues) => {
  const basePreset = getFilterPreset(preset).css;
  const brightness = `brightness(${100 + adjustments.brightness}%)`;
  const contrast = `contrast(${100 + adjustments.contrast + adjustments.sharpness * 0.28}%)`;
  const saturation = `saturate(${100 + adjustments.saturation}%)`;
  const blur = `blur(${Math.max(0, adjustments.blur)}px)`;
  const warmth = buildWarmthFilter(adjustments.warmth);

  return [basePreset, brightness, contrast, saturation, blur, warmth]
    .filter((segment) => segment && segment !== "none")
    .join(" ");
};

export const getAspectRatio = (
  aspect: AspectRatioKey,
  media?: Pick<ComposerMediaItem, "width" | "height"> | null
) => {
  const option = ASPECT_RATIO_OPTIONS.find((item) => item.id === aspect);
  if (!option) {
    return 1;
  }

  if (aspect === "original") {
    if (media?.width && media?.height && media.height > 0) {
      return media.width / media.height;
    }
    return 1;
  }

  return option.ratio;
};

export const createAutoEnhanceAdjustments = (base: AdjustmentValues): AdjustmentValues => ({
  ...base,
  brightness: clamp(base.brightness + 8, -100, 100),
  contrast: clamp(base.contrast + 10, -100, 100),
  saturation: clamp(base.saturation + 12, -100, 100),
  sharpness: clamp(base.sharpness + 10, -100, 100),
  vignette: clamp(base.vignette + 4, 0, 100),
});

export const makeDraftTitle = (caption: string, fallback = "Untitled Draft") => {
  const trimmed = caption.trim();
  if (!trimmed) {
    return fallback;
  }

  if (trimmed.length <= 34) {
    return trimmed;
  }

  return `${trimmed.slice(0, 34)}...`;
};

export const textLayerStyle = (layer: TextLayer): Record<string, string | number> => {
  const weight = layer.font === "Bold" ? 800 : 600;
  return {
    left: `${50 + layer.x}%`,
    top: `${50 + layer.y}%`,
    transform: `translate(-50%, -50%) scale(${layer.scale}) rotate(${layer.rotation}deg)`,
    color: layer.color,
    opacity: layer.opacity,
    textAlign: layer.align,
    fontWeight: weight,
    fontFamily: FONT_FAMILIES[layer.font],
    background: layer.background ? "rgba(15, 23, 42, 0.44)" : "transparent",
  };
};

export const cleanCaptionForPayload = (caption: string) => caption.trim();
