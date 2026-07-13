"use client";

import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Edit3, RefreshCcw, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ComposerDraft } from "@/types/composer";

interface DraftsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drafts: ComposerDraft[];
  onRestore: (draftId: string) => void;
  onDelete: (draftId: string) => void;
}

export function DraftsModal({
  open,
  onOpenChange,
  drafts,
  onRestore,
  onDelete,
}: DraftsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden border-slate-700 bg-slate-950 text-slate-100">
        <DialogHeader>
          <DialogTitle>Drafts</DialogTitle>
          <DialogDescription className="text-slate-400">
            View, edit, delete, or restore saved drafts.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {drafts.length ? (
              drafts.map((draft) => (
                <motion.div
                  key={draft.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl border border-slate-700 bg-slate-900/60 p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-100">{draft.title}</p>
                      <p className="line-clamp-2 text-xs text-slate-400">{draft.caption || "No caption"}</p>
                      <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                        <span>{draft.postType.toUpperCase()}</span>
                        <span>{draft.media.length} media</span>
                        <span>{formatDistanceToNow(new Date(draft.updatedAt), { addSuffix: true })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onRestore(draft.id);
                          onOpenChange(false);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-cyan-300/35 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-100"
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onRestore(draft.id);
                          onOpenChange(false);
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-600 bg-slate-800/75 px-2 py-1 text-xs text-slate-200"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(draft.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                key="no-drafts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400"
              >
                No drafts yet. Enable "Save as Draft" to capture your progress.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
