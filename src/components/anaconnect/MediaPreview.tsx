"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Play, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildCssFilter,
  clamp,
  ComposerMediaItem,
  getAspectRatio,
  textLayerStyle,
} from "@/types/composer";

interface MediaPreviewProps {
  media: ComposerMediaItem | null;
  onRemove: (mediaId: string) => void;
  onAddText: (mediaId: string) => void;
  onSelectTextLayer: (mediaId: string, layerId: string | null) => void;
  onUpdateTextLayer: (
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
      background: boolean;
      align: "left" | "center" | "right";
    }>
  ) => void;
  onCropChange: (mediaId: string, patch: Partial<ComposerMediaItem["edits"]["crop"]>) => void;
}

type DragContext =
  | { mode: "crop"; x: number; y: number; baseX: number; baseY: number }
  | { mode: "text"; x: number; y: number; mediaId: string; layerId: string; baseX: number; baseY: number }
  | null;

export function MediaPreview({
  media,
  onRemove,
  onAddText,
  onSelectTextLayer,
  onUpdateTextLayer,
  onCropChange,
}: MediaPreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragContext>(null);

  const aspectRatio = useMemo(() => {
    if (!media) {
      return 1;
    }
    return getAspectRatio(media.edits.crop.aspect, media);
  }, [media]);

  if (!media) {
    return (
      <div className="grid min-h-[280px] place-items-center rounded-2xl border bg-white/60 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
        Upload media to preview your post.
      </div>
    );
  }

  const zoomMotion = Math.max(0, (media.edits.crop.zoom - 1) * 35);
  const previewTransform = `translate(${media.edits.crop.offsetX * zoomMotion}%, ${media.edits.crop.offsetY * zoomMotion}%) scale(${media.edits.crop.zoom}) rotate(${media.edits.crop.rotation}deg)`;
  const vignetteOpacity = Math.min(0.72, media.edits.adjustments.vignette / 100);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || !frameRef.current || !media) {
      return;
    }

    const rect = frameRef.current.getBoundingClientRect();
    const deltaX = event.clientX - dragState.x;
    const deltaY = event.clientY - dragState.y;

    if (dragState.mode === "crop") {
      const normalizedX = clamp(dragState.baseX + deltaX / (rect.width * 0.55), -1, 1);
      const normalizedY = clamp(dragState.baseY + deltaY / (rect.height * 0.55), -1, 1);
      onCropChange(media.id, { offsetX: normalizedX, offsetY: normalizedY });
      return;
    }

    const nextX = clamp(dragState.baseX + (deltaX / rect.width) * 100, -45, 45);
    const nextY = clamp(dragState.baseY + (deltaY / rect.height) * 100, -45, 45);

    onUpdateTextLayer(dragState.mediaId, dragState.layerId, {
      x: nextX,
      y: nextY,
    });
  };

  return (
    <motion.section
      key={media.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="truncate">{media.name}</span>
        <span>Drag preview to crop position</span>
      </div>
      <div
        ref={frameRef}
        style={{ aspectRatio }}
        className="group relative w-full overflow-hidden rounded-2xl border bg-white/40 dark:bg-slate-900/80 border-border dark:border-slate-700 shadow-lg"
        onPointerMove={handlePointerMove}
        onPointerUp={() => setDragState(null)}
        onPointerLeave={() => setDragState(null)}
      >
        <button
          type="button"
          className="absolute right-3 top-3 z-30 rounded-full bg-white/70 dark:bg-black/60 p-2 text-slate-900 dark:text-white opacity-0 transition group-hover:opacity-100"
          onClick={() => onRemove(media.id)}
        >
          <X className="h-4 w-4" />
        </button>

        <button
          type="button"
          className="absolute left-3 top-3 z-30 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 p-2 text-white shadow-lg"
          onClick={() => onAddText(media.id)}
        >
          <Plus className="h-4 w-4" />
        </button>

        <div
          className="absolute inset-0"
          onPointerDown={(event) => {
            if ((event.target as HTMLElement).dataset.layerid) {
              return;
            }
            setDragState({
              mode: "crop",
              x: event.clientX,
              y: event.clientY,
              baseX: media.edits.crop.offsetX,
              baseY: media.edits.crop.offsetY,
            });
          }}
        >
          {media.kind === "image" ? (
            <Image
              src={media.objectUrl}
              alt={media.name}
              fill
              sizes="(max-width: 1024px) 100vw, 700px"
              className="h-full w-full object-cover"
              style={{
                transform: previewTransform,
                filter: buildCssFilter(media.edits.filter, media.edits.adjustments),
                transition: dragState?.mode === "crop" ? "none" : "transform 140ms ease",
              }}
            />
          ) : (
            <>
              <video
                src={media.objectUrl}
                controls
                className="h-full w-full object-cover"
                style={{
                  transform: previewTransform,
                  filter: buildCssFilter(media.edits.filter, media.edits.adjustments),
                }}
              />
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <Play className="h-12 w-12 text-white/85" />
              </div>
            </>
          )}

          {vignetteOpacity > 0 ? (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(0,0,0,0) 44%, rgba(0,0,0,1) 100%)",
                opacity: vignetteOpacity,
              }}
            />
          ) : null}
        </div>

        {media.edits.textLayers.map((layer) => {
          const selected = layer.id === media.edits.selectedTextLayerId;
          return (
            <motion.div
              key={layer.id}
              data-layerid={layer.id}
              className={cn(
                "absolute z-20 max-w-[88%] min-w-[64px] cursor-move rounded px-2 py-1 text-sm leading-tight outline-none",
                selected ? "ring-1 ring-cyan-300" : "ring-0"
              )}
              style={textLayerStyle(layer)}
              onPointerDown={(event) => {
                event.stopPropagation();
                setDragState({
                  mode: "text",
                  x: event.clientX,
                  y: event.clientY,
                  mediaId: media.id,
                  layerId: layer.id,
                  baseX: layer.x,
                  baseY: layer.y,
                });
                onSelectTextLayer(media.id, layer.id);
              }}
              contentEditable={selected}
              suppressContentEditableWarning
              onInput={(event) => {
                onUpdateTextLayer(media.id, layer.id, {
                  text: event.currentTarget.textContent ?? "",
                });
              }}
              onClick={(event) => {
                event.stopPropagation();
                onSelectTextLayer(media.id, layer.id);
              }}
            >
              {layer.text}
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
