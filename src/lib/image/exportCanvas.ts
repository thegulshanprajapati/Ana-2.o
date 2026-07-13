import {
  buildCssFilter,
  clamp,
  ComposerMediaItem,
  FONT_FAMILIES,
  getAspectRatio,
  TextLayer,
} from "@/types/composer";

export interface ExportedMediaPayload {
  id: string;
  kind: "image" | "video";
  filename: string;
  mimeType: string;
  dataUrl: string;
  blob?: Blob;
  width?: number;
  height?: number;
}

const ensureImage = async (source: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image preview for export."));
    image.src = source;
  });
};

const drawLayer = (
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  canvasWidth: number,
  canvasHeight: number
) => {
  const x = ((layer.x + 50) / 100) * canvasWidth;
  const y = ((layer.y + 50) / 100) * canvasHeight;
  const fontSize = Math.max(18, Math.round(canvasWidth * 0.042));
  const text = layer.text.trim() || "Text";
  const lines = text.split("\n");
  const lineHeight = Math.round(fontSize * 1.22);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((layer.rotation * Math.PI) / 180);
  ctx.scale(layer.scale, layer.scale);
  ctx.globalAlpha = clamp(layer.opacity, 0, 1);
  ctx.font = `${layer.font === "Bold" ? 800 : 600} ${fontSize}px ${FONT_FAMILIES[layer.font]}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = layer.align;

  const metrics = lines.map((line) => ctx.measureText(line));
  const maxLineWidth = metrics.reduce((max, m) => Math.max(max, m.width), 0);
  const totalHeight = lines.length * lineHeight;
  const anchorX = layer.align === "left" ? -maxLineWidth / 2 : layer.align === "right" ? maxLineWidth / 2 : 0;

  if (layer.background) {
    const padX = 18;
    const padY = 12;
    const left = -maxLineWidth / 2 - padX;
    const top = -totalHeight / 2 - padY;
    ctx.fillStyle = "rgba(2, 6, 23, 0.54)";
    ctx.fillRect(left, top, maxLineWidth + padX * 2, totalHeight + padY * 2);
  }

  ctx.fillStyle = layer.color;

  lines.forEach((line, index) => {
    const yOffset = (index - (lines.length - 1) / 2) * lineHeight;
    ctx.fillText(line, anchorX, yOffset);
  });

  ctx.restore();
};

export const exportComposedMedia = async (
  media: ComposerMediaItem
): Promise<ExportedMediaPayload> => {
  if (media.kind === "video") {
    const videoBlob = media.file instanceof Blob ? media.file : undefined;
    return {
      id: media.id,
      kind: "video",
      filename: media.name,
      mimeType: media.mimeType,
      dataUrl: media.objectUrl,
      blob: videoBlob,
      width: media.width,
      height: media.height,
    };
  }

  const source = media.exportedDataUrl ?? media.persistentPreview ?? media.objectUrl;
  const image = await ensureImage(source);

  const aspect = getAspectRatio(media.edits.crop.aspect, media);
  const outputLongEdge = 1080;
  const outputWidth = aspect >= 1 ? outputLongEdge : Math.round(outputLongEdge * aspect);
  const outputHeight = aspect >= 1 ? Math.round(outputLongEdge / aspect) : outputLongEdge;

  const baseCropWidth = image.width / image.height > aspect ? image.height * aspect : image.width;
  const baseCropHeight = image.width / image.height > aspect ? image.height : image.width / aspect;

  const zoom = clamp(media.edits.crop.zoom, 1, 3);
  const sourceWidth = baseCropWidth / zoom;
  const sourceHeight = baseCropHeight / zoom;

  const maxShiftX = Math.max(0, (baseCropWidth - sourceWidth) / 2);
  const maxShiftY = Math.max(0, (baseCropHeight - sourceHeight) / 2);

  const centerX = image.width / 2 + clamp(media.edits.crop.offsetX, -1, 1) * maxShiftX;
  const centerY = image.height / 2 + clamp(media.edits.crop.offsetY, -1, 1) * maxShiftY;

  const sourceX = clamp(centerX - sourceWidth / 2, 0, Math.max(0, image.width - sourceWidth));
  const sourceY = clamp(centerY - sourceHeight / 2, 0, Math.max(0, image.height - sourceHeight));

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create canvas context.");
  }

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = Math.max(1, Math.round(sourceWidth));
  cropCanvas.height = Math.max(1, Math.round(sourceHeight));

  const cropCtx = cropCanvas.getContext("2d");
  if (!cropCtx) {
    throw new Error("Unable to create crop context.");
  }

  cropCtx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    cropCanvas.width,
    cropCanvas.height
  );

  ctx.save();
  ctx.filter = buildCssFilter(media.edits.filter, media.edits.adjustments);
  ctx.translate(outputWidth / 2, outputHeight / 2);
  ctx.rotate((media.edits.crop.rotation * Math.PI) / 180);
  ctx.drawImage(cropCanvas, -outputWidth / 2, -outputHeight / 2, outputWidth, outputHeight);
  ctx.restore();

  const vignette = media.edits.adjustments.vignette;
  if (vignette > 0) {
    const gradient = ctx.createRadialGradient(
      outputWidth / 2,
      outputHeight / 2,
      outputWidth * 0.18,
      outputWidth / 2,
      outputHeight / 2,
      outputWidth * 0.72
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, `rgba(0,0,0,${Math.min(0.68, vignette / 100)})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, outputWidth, outputHeight);
  }

  media.edits.textLayers.forEach((layer) => {
    drawLayer(ctx, layer, outputWidth, outputHeight);
  });

  const mimeType = media.mimeType.includes("png") ? "image/png" : "image/jpeg";
  const dataUrl = canvas.toDataURL(mimeType, 0.92);
  const blob = await new Promise<Blob | undefined>((resolve) => {
    canvas.toBlob((result) => {
      resolve(result ?? undefined);
    }, mimeType, 0.92);
  });

  const ext = mimeType === "image/png" ? "png" : "jpg";
  const baseName = media.name.replace(/\.[^/.]+$/, "") || "image";

  return {
    id: media.id,
    kind: "image",
    filename: `${baseName}-edited.${ext}`,
    mimeType,
    dataUrl,
    blob,
    width: outputWidth,
    height: outputHeight,
  };
};

export const exportComposerPayload = async (mediaItems: ComposerMediaItem[]) => {
  const exported: ExportedMediaPayload[] = [];
  for (const media of mediaItems) {
    exported.push(await exportComposedMedia(media));
  }
  return exported;
};
