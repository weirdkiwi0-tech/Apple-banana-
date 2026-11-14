import { prisma } from "@/lib/db";
import { SLOT_ORDER } from "@/lib/slot";
import { SlotEditor } from "./SlotEditor";
import type { StudySlot } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function SlotsPage() {
  const configs = await prisma.slotConfig.findMany();
  const map = new Map(configs.map((c) => [c.slot, c]));

  const slots = SLOT_ORDER.map((slot) => {
    const c = map.get(slot);
    if (!c) {
      return {
        slot: slot as StudySlot,
        startTime: "19:00",
        endTime: "20:30",
        lateThresholdMinutes: 10 as number | null,
        active: true,
      };
    }
    return {
      slot: c.slot,
      startTime: c.startTime,
      endTime: c.endTime,
      lateThresholdMinutes: c.lateThresholdMinutes,
      active: c.active,
    };
  });

  return (
    <div className="space-y-4">
      <div className="ui-card p-4">
        <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
          슬롯 설정
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          슬롯별 시작·종료 시간과 지각 기준(분)을 설정합니다. 지각 기준을 비우면 지각 자동 판정이 비활성화되고 입실은 항상 출석으로 기록됩니다.
        </p>
      </div>
      <SlotEditor slots={slots} />
    </div>
  );
}
