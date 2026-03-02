"use client";

import { CalendarClock, MapPin, Shield, Save } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LOCATION_OPTIONS } from "@/types/composer";

interface MetaPanelProps {
  location: string;
  audience: "public" | "followers" | "private";
  scheduleEnabled: boolean;
  scheduledAt: string;
  saveAsDraft: boolean;
  onLocationChange: (value: string) => void;
  onAudienceChange: (value: "public" | "followers" | "private") => void;
  onScheduleEnabledChange: (value: boolean) => void;
  onScheduleDateChange: (value: string) => void;
  onSaveDraftToggle: (value: boolean) => void;
  scheduleError?: string;
}

export function MetaPanel({
  location,
  audience,
  scheduleEnabled,
  scheduledAt,
  saveAsDraft,
  onLocationChange,
  onAudienceChange,
  onScheduleEnabledChange,
  onScheduleDateChange,
  onSaveDraftToggle,
  scheduleError,
}: MetaPanelProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-slate-950/35 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs text-slate-600 dark:text-slate-400">Location</label>
          <Select value={location || "none"} onValueChange={(value) => onLocationChange(value === "none" ? "" : value)}>
            <SelectTrigger className="h-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/70 text-slate-900 dark:text-slate-100">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No location</SelectItem>
              {LOCATION_OPTIONS.map((option) => (
                <SelectItem value={option} key={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-600 dark:text-slate-400">Audience</label>
          <Select value={audience} onValueChange={(value) => onAudienceChange(value as "public" | "followers" | "private") }>
            <SelectTrigger className="h-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/70 text-slate-900 dark:text-slate-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="followers">Followers</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200/60 dark:border-slate-700 bg-white/60 dark:bg-slate-900/50 p-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
            <CalendarClock className="h-3.5 w-3.5 text-cyan-300" />
            Schedule Post
          </div>
          <Switch checked={scheduleEnabled} onCheckedChange={onScheduleEnabledChange} />
        </div>

        {scheduleEnabled ? (
          <div className="space-y-1">
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => onScheduleDateChange(event.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/75 px-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-cyan-400"
            />
            {scheduleError ? <p className="text-xs text-rose-600 dark:text-rose-300">{scheduleError}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 dark:text-slate-300">
        <label className="inline-flex items-center gap-2">
          <Save className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-300" />
          <span>Save as Draft</span>
          <Switch checked={saveAsDraft} onCheckedChange={onSaveDraftToggle} />
        </label>
        <div className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
          <MapPin className="h-3.5 w-3.5" />
          {location || "No location"}
        </div>
        <div className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
          <Shield className="h-3.5 w-3.5" />
          {audience}
        </div>
      </div>
    </section>
  );
}
