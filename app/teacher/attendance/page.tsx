import Link from "next/link";
import type { Route } from "next";
import type { StudySlot } from "@prisma/client";
import { prisma } from "@/lib/db";
import { kstTodayString, kstWeekMonday, parseKstDateString } from "@/lib/date";
import { SLOT_LABEL, SLOT_ORDER } from "@/lib/slot";
import { AttendanceTable, type AttendanceRow } from "./AttendanceTable";

export const dynamic = "force-dynamic";

interface SearchParams {
  date?: string;
  slot?: string;
}

const SLOTS = new Set<StudySlot>(["OJA", "YAJA", "SIMJA"]);

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const today = kstTodayString();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date ?? "")
    ? (params.date as string)
    : today;
  const slot: StudySlot = SLOTS.has(params.slot as StudySlot)
    ? (params.slot as StudySlot)
    : "OJA";

  const dateUtc = parseKstDateString(date);
  const weekMonday = kstWeekMonday(date);
  const plans = await prisma.participationPlan.findMany({
    where: { date: dateUtc, slot },
    include: { student: true, attendance: true },
    orderBy: [{ student: { classroom: "asc" } }, { student: { studentNo: "asc" } }],
  });

  const rows: AttendanceRow[] = plans.map((p) => ({
    planId: p.id,
    studentNo: p.student.studentNo,
    name: p.student.name,
    classroom: p.student.classroom,
    state: p.attendance?.state ?? "UNCHECKED",
    checkInAt: p.attendance?.checkInAt?.toISOString() ?? null,
    checkOutAt: p.attendance?.checkOutAt?.toISOString() ?? null,
    absenceNote: p.attendance?.absenceNote ?? null,
  }));

  const slotCounts = await prisma.participationPlan.groupBy({
    by: ["slot"],
    where: { date: dateUtc },
    _count: { _all: true },
  });
  const countMap = new Map(slotCounts.map((s) => [s.slot, s._count._all]));

  return (
    <div className="space-y-4">
      {/* 상단 세그먼트 탭 (Apple HIG / Material 3 스타일) */}
      <div className="grid grid-cols-2 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1 backdrop-blur-sm sm:inline-flex sm:w-auto">
        <Link
          href={`/teacher/attendance/week?monday=${weekMonday}` as Route}
          className="rounded-xl px-4 py-2 text-center text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          주간 출결 (엑셀 양식)
        </Link>
        <Link
          href={`/teacher/attendance?date=${date}&slot=${slot}` as Route}
          className="rounded-xl bg-white px-4 py-2 text-center text-sm font-bold text-slate-900 shadow-sm transition"
        >
          일일 출결 (상세)
        </Link>
      </div>

      <div className="ui-card flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            일일 출결 체크
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            {date} · {SLOT_LABEL[slot]} (신청 <span className="font-semibold text-slate-700">{rows.length}명</span>) · 전체 학생 주간 표는 [주간 출결 (엑셀 양식)] 탭을 확인하세요.
          </p>
        </div>
        <form className="flex flex-wrap items-center gap-2 text-sm" method="get">
          <label htmlFor="date" className="text-xs font-medium text-slate-600 sm:text-sm">날짜</label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={date}
            className="ui-input flex-1 sm:flex-none"
          />
          <input type="hidden" name="slot" value={slot} />
          <button
            type="submit"
            className="ui-btn bg-slate-900 px-4 text-white hover:bg-slate-800"
          >
            이동
          </button>
        </form>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
        {SLOT_ORDER.map((s) => {
          const href = `/teacher/attendance?date=${date}&slot=${s}` as Route;
          const active = s === slot;
          return (
            <Link
              key={s}
              href={href}
              className={`ui-btn px-3 py-2 text-center text-xs sm:text-sm ${
                active
                  ? "bg-gradient-to-r from-slate-900 to-indigo-950 font-semibold text-white shadow-sm"
                  : "border border-slate-200/90 bg-white/90 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {SLOT_LABEL[s]} ({countMap.get(s) ?? 0})
            </Link>
          );
        })}
      </div>

      <AttendanceTable date={date} slot={slot} rows={rows} />
    </div>
  );
}
