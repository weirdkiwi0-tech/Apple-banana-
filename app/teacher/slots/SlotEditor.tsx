"use client";

import { useState, useTransition } from "react";
import type { StudySlot } from "@prisma/client";
import { SLOT_LABEL } from "@/lib/slot";
import { updateSlotAction } from "./actions";

interface SlotRow {
  slot: StudySlot;
  startTime: string;
  endTime: string;
  lateThresholdMinutes: number | null;
  active: boolean;
}

export function SlotEditor({ slots }: { slots: SlotRow[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {message && (
        <p className="ui-card border-emerald-200 bg-emerald-50/90 px-4 py-2.5 text-sm font-medium text-emerald-800">
          {message}
        </p>
      )}
      {slots.map((s) => (
        <form
          key={s.slot}
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              const res = await updateSlotAction(fd);
              setMessage(res.message ?? null);
            });
          }}
          className="ui-card p-4 sm:p-5"
        >
          <input type="hidden" name="slot" value={s.slot} />
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">{SLOT_LABEL[s.slot]}</h3>
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
              <input
                name="active"
                type="checkbox"
                defaultChecked={s.active}
                className="h-4 w-4 rounded border-slate-300 accent-slate-900"
              />
              활성
            </label>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <label className="text-xs font-semibold text-slate-700 sm:text-sm">
              시작
              <input
                name="startTime"
                type="time"
                defaultValue={s.startTime}
                required
                className="ui-input mt-1 block w-full"
              />
            </label>
            <label className="text-xs font-semibold text-slate-700 sm:text-sm">
              종료
              <input
                name="endTime"
                type="time"
                defaultValue={s.endTime}
                required
                className="ui-input mt-1 block w-full"
              />
            </label>
            <label className="col-span-2 text-xs font-semibold text-slate-700 sm:col-span-1 sm:text-sm">
              지각 기준(분)
              <input
                name="lateThresholdMinutes"
                type="number"
                min={0}
                step={1}
                defaultValue={s.lateThresholdMinutes ?? ""}
                placeholder="비우면 지각 판정 비활성"
                className="ui-input mt-1 block w-full"
              />
            </label>
          </div>
          <div className="mt-3.5 flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="ui-btn w-full bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 sm:w-auto"
            >
              저장
            </button>
          </div>
        </form>
      ))}
    </div>
  );
}
