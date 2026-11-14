import Link from "next/link";
import type { Route } from "next";
import { prisma } from "@/lib/db";
import {
  formatKstDate,
  isoAddDays,
  kstTodayString,
  kstWeekMonday,
  kstWeekdayDates,
  parseKstDateString,
} from "@/lib/date";
import { buildWeekMatrix, type WeekPlan } from "@/lib/weekly-attendance";
import { WeekMatrix } from "./WeekMatrix";

export const dynamic = "force-dynamic";

interface SearchParams {
  monday?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const base = DATE_RE.test(params.monday ?? "")
    ? (params.monday as string)
    : kstTodayString();
  const monday = kstWeekMonday(base);
  const dates = kstWeekdayDates(monday);
  const friday = dates[4] ?? monday;

  const [allStudents, plansRaw] = await Promise.all([
    prisma.student.findMany({
      where: { active: true },
      select: { studentNo: true, name: true, classroom: true },
      orderBy: [{ classroom: "asc" }, { studentNo: "asc" }],
    }),
    prisma.participationPlan.findMany({
      where: { date: { in: dates.map((d) => parseKstDateString(d)) } },
      include: { student: true, attendance: true },
    }),
  ]);

  const plans: WeekPlan[] = plansRaw.map((p) => ({
    planId: p.id,
    studentNo: p.student.studentNo,
    name: p.student.name,
    classroom: p.student.classroom,
    date: formatKstDate(p.date),
    slot: p.slot,
    state: p.attendance?.state ?? "UNCHECKED",
  }));
  const rows = buildWeekMatrix(monday, plans, allStudents);

  const prevMonday = isoAddDays(monday, -7);
  const nextMonday = isoAddDays(monday, 7);
  const thisMonday = kstWeekMonday(kstTodayString());

  return (
    <div className="space-y-4">
      {/* 상단 세그먼트 탭 (Apple HIG / Material 3 스타일) */}
      <div className="grid grid-cols-2 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-1 backdrop-blur-sm sm:inline-flex sm:w-auto">
        <Link
          href={`/teacher/attendance/week?monday=${monday}` as Route}
          className="rounded-xl bg-white px-4 py-2 text-center text-sm font-bold text-slate-900 shadow-sm transition"
        >
          주간 출결 (엑셀 양식)
        </Link>
        <Link
          href={`/teacher/attendance?date=${dates[0]}&slot=OJA` as Route}
          className="rounded-xl px-4 py-2 text-center text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          일일 출결 (상세)
        </Link>
      </div>

      <div className="ui-card flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            주간 출결표 (엑셀 양식)
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
            {monday} ~ {friday} · 총 <span className="font-semibold text-slate-700">{allStudents.length}명</span> 등록
          </p>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-xs sm:flex sm:flex-wrap sm:items-center sm:gap-2 sm:text-sm">
          <Link
            href={`/teacher/attendance/week?monday=${prevMonday}` as Route}
            className="ui-btn border border-slate-200 bg-white px-2.5 py-2 text-slate-700 hover:bg-slate-50"
          >
            ← 이전 주
          </Link>
          <Link
            href={`/teacher/attendance/week?monday=${thisMonday}` as Route}
            className="ui-btn border border-slate-200 bg-white px-2.5 py-2 text-slate-700 hover:bg-slate-50"
          >
            이번 주
          </Link>
          <Link
            href={`/teacher/attendance/week?monday=${nextMonday}` as Route}
            className="ui-btn border border-slate-200 bg-white px-2.5 py-2 text-slate-700 hover:bg-slate-50"
          >
            다음 주 →
          </Link>
          <a
            href={`/teacher/attendance/week/download/xlsx?monday=${monday}`}
            className="ui-btn col-span-3 bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 font-semibold text-white shadow-sm hover:from-emerald-700 hover:to-teal-700 sm:col-span-1"
          >
            엑셀 내려받기
          </a>
        </div>
      </div>

      <WeekMatrix dates={dates} rows={rows} />
    </div>
  );
}
