"use client";

import { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Hash, Sparkles, Smile, Wand2 } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { MAX_CAPTION_LENGTH, QUICK_EMOJIS } from "@/types/composer";
import { composerHashtagMatches, composerMentionMatches } from "@/store/useComposerStore";

interface CaptionEditorProps {
  value: string;
  previewMode: boolean;
  onTogglePreview: (next: boolean) => void;
  onChange: (next: string) => void;
  onGenerateCaptions: () => void;
  onGenerateHashtags: () => void;
  captionSuggestions: string[];
  hashtagSuggestions: string[];
  onApplyCaptionSuggestion: (value: string) => void;
  onApplyHashtag: (value: string) => void;
}

const replaceWordAtCursor = (
  text: string,
  cursor: number,
  replacement: string
): { text: string; cursor: number } => {
  const before = text.slice(0, cursor);
  const after = text.slice(cursor);
  const start = Math.max(before.lastIndexOf(" "), before.lastIndexOf("\n")) + 1;
  const nextValue = `${text.slice(0, start)}${replacement} ${after}`;
  const nextCursor = start + replacement.length + 1;
  return { text: nextValue, cursor: nextCursor };
};

export function CaptionEditor({
  value,
  previewMode,
  onTogglePreview,
  onChange,
  onGenerateCaptions,
  onGenerateHashtags,
  captionSuggestions,
  hashtagSuggestions,
  onApplyCaptionSuggestion,
  onApplyHashtag,
}: CaptionEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursor, setCursor] = useState(0);
  const [expanded, setExpanded] = useState(false);

  type TokenContext =
    | { type: "mention"; items: string[] }
    | { type: "hashtag"; items: string[] }
    | { type: null; items: string[] };

  const tokenContext = useMemo<TokenContext>(() => {
    const before = value.slice(0, cursor);
    const start = Math.max(before.lastIndexOf(" "), before.lastIndexOf("\n")) + 1;
    const token = before.slice(start);

    if (token.startsWith("@") && token.length > 1) {
      const query = token.slice(1);
      return {
        type: "mention",
        items: composerMentionMatches(query),
      };
    }

    if (token.startsWith("#") && token.length > 1) {
      const query = token.slice(1);
      return {
        type: "hashtag",
        items: composerHashtagMatches(query),
      };
    }

    return { type: null, items: [] };
  }, [cursor, value]);

  const insertAtCursor = (chunk: string) => {
    if (!textareaRef.current) {
      onChange(`${value}${chunk}`);
      return;
    }

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const next = `${value.slice(0, start)}${chunk}${value.slice(end)}`;

    onChange(next);

    window.requestAnimationFrame(() => {
      if (!textareaRef.current) {
        return;
      }
      const nextCursor = start + chunk.length;
      textareaRef.current.focus();
      textareaRef.current.selectionStart = nextCursor;
      textareaRef.current.selectionEnd = nextCursor;
      setCursor(nextCursor);
    });
  };

  return (
    <section className="space-y-3 rounded-2xl border bg-card/30 dark:bg-card/35 border-border dark:border-slate-700 p-4 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-100">Caption</p>
          <p className="text-xs text-slate-400">Supports **bold** and _italic_ preview.</p>
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-slate-300">
          <Switch checked={previewMode} onCheckedChange={onTogglePreview} />
          Preview Mode
        </label>
      </div>

      {!previewMode ? (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            maxLength={MAX_CAPTION_LENGTH}
            onFocus={() => setExpanded(true)}
            onBlur={() => setExpanded(false)}
            onChange={(event) => {
              onChange(event.target.value);
              setCursor(event.target.selectionStart);
            }}
            onSelect={(event) => setCursor(event.currentTarget.selectionStart)}
            onKeyUp={(event) => setCursor((event.target as HTMLTextAreaElement).selectionStart)}
            placeholder="Write a compelling caption. Use @mentions and #hashtags."
            className={cn(
              "w-full resize-none rounded-xl border bg-white/50 dark:bg-slate-900/70 px-3 py-3 text-foreground placeholder:text-muted-foreground outline-none ring-cyan-400 transition",
              expanded ? "min-h-[140px]" : "min-h-[110px]",
              "focus:ring-2",
              "border-border dark:border-slate-700"
            )}
          />

          {tokenContext.items.length ? (
            <div className="absolute left-2 right-2 top-[calc(100%+6px)] z-40 rounded-xl border bg-card/40 dark:bg-card/60 border-border dark:border-slate-700 p-2 shadow-xl backdrop-blur">
              <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                {tokenContext.type === "mention" ? "Mention suggestions" : "Hashtag suggestions"}
              </p>
              <div className="grid gap-1">
                {tokenContext.items.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="rounded-md px-2 py-1 text-left text-sm text-slate-200 hover:bg-slate-800"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      const formatted = tokenContext.type === "mention" ? `@${item}` : `#${item}`;
                      const next = replaceWordAtCursor(value, cursor, formatted);
                      onChange(next.text);

                      window.requestAnimationFrame(() => {
                        if (!textareaRef.current) {
                          return;
                        }
                        textareaRef.current.focus();
                        textareaRef.current.selectionStart = next.cursor;
                        textareaRef.current.selectionEnd = next.cursor;
                        setCursor(next.cursor);
                      });
                    }}
                  >
                    {tokenContext.type === "mention" ? `@${item}` : `#${item}`}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="min-h-[120px] rounded-xl border border-slate-700 bg-slate-950/65 p-3">
          {value.trim() ? (
            <article className="prose prose-invert max-w-none text-sm">
              <ReactMarkdown>{value}</ReactMarkdown>
            </article>
          ) : (
            <p className="text-sm text-slate-400">Nothing to preview yet.</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-300"
            >
              <Smile className="h-3.5 w-3.5" />
              Emoji
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-60 border-slate-700 bg-slate-950/95 p-3">
            <div className="grid grid-cols-6 gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="rounded-md p-1 text-base hover:bg-slate-800"
                  onClick={() => insertAtCursor(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1.5 text-xs text-cyan-100"
          onClick={onGenerateCaptions}
        >
          <Wand2 className="h-3.5 w-3.5" />
          Suggest Caption
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-100"
          onClick={onGenerateHashtags}
        >
          <Hash className="h-3.5 w-3.5" />
          Generate Hashtags
        </button>

        <span className="ml-auto text-xs text-slate-400">
          {value.length}/{MAX_CAPTION_LENGTH}
        </span>
      </div>

      {captionSuggestions.length ? (
        <div className="space-y-2 rounded-xl border bg-card/40 dark:bg-card/60 border-border dark:border-slate-700 p-3">
          <div className="inline-flex items-center gap-1 text-xs font-medium text-foreground/80">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            AI caption suggestions
          </div>
          <div className="grid gap-2">
            {captionSuggestions.slice(0, 3).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="rounded-lg border bg-white/50 dark:bg-slate-900/65 border-border dark:border-slate-700 px-3 py-2 text-left text-xs text-foreground hover:border-cyan-300/40"
                onClick={() => onApplyCaptionSuggestion(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {hashtagSuggestions.length ? (
        <div className="flex flex-wrap gap-2 rounded-xl border bg-card/40 dark:bg-card/60 border-border dark:border-slate-700 p-3">
          {hashtagSuggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              className="rounded-full border bg-white/50 dark:bg-slate-900/65 border-border dark:border-slate-700 px-2.5 py-1 text-xs text-foreground hover:bg-muted/30"
              onClick={() => onApplyHashtag(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
