"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ImagePlus, UploadCloud, Video, X, GripVertical, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ComposerMediaItem } from "@/types/composer";

interface MediaDropzoneProps {
  mediaItems: ComposerMediaItem[];
  activeMediaId: string | null;
  onFilesSelected: (files: File[]) => void;
  onRemove: (mediaId: string) => void;
  onActivate: (mediaId: string) => void;
  onReorder: (from: number, to: number) => void;
}

export function MediaDropzone({
  mediaItems,
  activeMediaId,
  onFilesSelected,
  onRemove,
  onActivate,
  onReorder,
}: MediaDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const openPicker = () => inputRef.current?.click();

  const handleDropFiles = (fileList: FileList | null) => {
    if (!fileList?.length) {
      return;
    }
    onFilesSelected(Array.from(fileList));
  };

  return (
    <section className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*,video/*"
        multiple
        onChange={(event) => {
          handleDropFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />

      <motion.div
        whileTap={{ scale: 0.995 }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleDropFiles(event.dataTransfer.files);
        }}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-dashed p-5 transition shadow-lg",
          "bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl",
          dragging
            ? "border-cyan-300/60 shadow-[0_0_0_1px_rgba(34,211,238,.3)]"
            : "border-slate-200/60 dark:border-slate-700/80"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white/5 p-2.5 text-cyan-200">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Drop files here or upload</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Supports multiple images/videos. Drag thumbnails to reorder your carousel.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={openPicker}
            className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 text-slate-950 hover:from-cyan-300 hover:to-blue-400"
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </motion.div>

      {mediaItems.length ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{mediaItems.length} item(s) in carousel</span>
            <span>Drag to reorder</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {mediaItems.map((item, index) => {
              const active = item.id === activeMediaId;
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (dragIndex === null) {
                      return;
                    }
                    onReorder(dragIndex, index);
                    setDragIndex(null);
                  }}
                  className={cn(
                    "group relative w-24 shrink-0 overflow-hidden rounded-xl border transition shadow",
                    active
                      ? "border-cyan-300 shadow-[0_0_0_1px_rgba(34,211,238,.35)]"
                      : "border-slate-200 dark:border-slate-700"
                  )}
                >
                  <button
                    type="button"
                    className="relative block h-24 w-full"
                    onClick={() => onActivate(item.id)}
                  >
                    {item.kind === "image" ? (
                      <Image
                        src={item.objectUrl}
                        alt={item.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <>
                        <video src={item.objectUrl} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 grid place-items-center bg-black/35 text-white">
                          <PlayCircle className="h-6 w-6" />
                        </div>
                      </>
                    )}
                    <div className="pointer-events-none absolute left-1 top-1 rounded-md bg-black/55 px-1 py-0.5 text-[10px] text-white">
                      {index + 1}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 px-1 pb-1">
                    <div className="h-1.5 overflow-hidden rounded bg-white/20">
                      <motion.div
                        className={cn(
                          "h-full",
                          item.uploadStatus === "uploaded" ? "bg-emerald-400" : "bg-cyan-400"
                        )}
                        initial={false}
                        animate={{ width: `${item.uploadProgress}%` }}
                      />
                    </div>
                  </div>
                  <div className="pointer-events-none absolute bottom-2 right-1 text-white/80">
                    {item.kind === "video" ? (
                      <Video className="h-3.5 w-3.5" />
                    ) : (
                      <GripVertical className="h-3.5 w-3.5" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
