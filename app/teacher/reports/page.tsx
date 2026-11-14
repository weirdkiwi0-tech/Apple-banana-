import Link from "next/link";
import type { Route } from "next";
import { kstTodayString } from "@/lib/date";
import { SLOT_ORDER, SLOT_LABEL } from "@/lib/slot";
import { loadReport, type ReportFilter } from "./report-data";
import { ReportChart } from "./ReportChart";
import type { StudySlot } from "@prisma/client";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLOTS = new Set<StudySlot>(["OJA", "YAJA", "SIMJA"]);

function defaultRange(): { from: string; to: string } {
  const today = kstTodayString();
  const parts = today.split("-").map(Number);
  const [y = 1970, m = 1, d = 1] = parts;
  const end = new Date(Date.UTC(y, m - 1, d));
  const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const from = `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}-${pad(start.getUTCDate())}`;
  return { from, to: today };
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; slot?: string }>;
}) {
  const params = await searchParams;
  const range = defaultRange();
  const from = params.from && DATE_RE.test(params.from) ? params.from : range.from;
  const to = params.to && DATE_RE.test(params.to) ? params.to : range.to;
  const slot: ReportFilter["slot"] = SLOTS.has(params.slot as StudySlot)
    ? (params.slot as StudySlot)
    : "ALL";

  const { rows, series, totalPlans } = await loadReport({ from, to, slot });
  const q = `from=${from}&to=${to}&slot=${slot}`;

  return (
    <div className="space-y-4">
      <div className="ui-card flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">리포트</h1>
          <p className="mt-0.5 text-xs text-slate-500">
            기간·슬롯별 출결 통계 및 참여율 시계열 리포트를 확인합니다.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:flex sm:flex-wrap">
          <Link
            href={`/teacher/reports/download/csv?${q}` as Route}
            prefetch={false}
            className="ui-btn border border-slate-200 bg-white px-3.5 py-2 text-center text-slate-700 hover:bg-slate-50"
          >
            CSV 다운로드
          </Link>
          <Link
            href={`/teacher/reports/download/xlsx?${q}` as Route}
            prefetch={false}
            className="ui-btn bg-gradient-to-r from-slate-900 to-indigo-950 px-3.5 py-2 text-center text-white shadow-sm"
          >
            결과 Excel 다운로드
          </Link>
        </div>
      </div>

      <form className="ui-card p-4" method="get">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <label className="text-xs font-semibold text-slate-700 sm:text-sm">
            시작일
            <input
              name="from"
              type="date"
              defaultValue={from}
              className="ui-input mt-1 block w-full"
            />
          </label>
          <label className="text-xs font-semibold text-slate-700 sm:text-sm">
            종료일
            <input
              name="to"
              type="date"
              defaultValue={to}
              className="ui-input mt-1 block w-full"
            />
          </label>
          <label className="text-xs font-semibold text-slate-700 sm:text-sm">
            슬롯
            <select
              name="slot"
              defaultValue={slot}
              className="ui-input mt-1 block w-full"
            >
              <option value="ALL">전체</option>
              {SLOT_ORDER.map((s) => (
                <option key={s} value={s}>
                  {SLOT_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="ui-btn w-full bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
            >
              적용
            </button>
          </div>
        </div>
        <p className="mt-2.5 text-xs text-slate-500">
          대상 기간 총 대상자: {totalPlans}건
        </p>
      </form>

      <ReportChart series={series} />

      {/* 모바일 전용: 학생별 리포트 요약 카드 (가로 스크롤 없이 한눈에 확인) */}
      <ul className="space-y-2.5 sm:hidden" aria-label="모바일 학생별 리포트">
        {rows.map((r) => (
          <li key={r.studentNo} className="ui-card p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-sm font-bold text-slate-900">{r.name}</span>
                <span className="ml-2 font-mono text-xs text-slate-500">{r.studentNo}</span>
                <span className="ml-1.5 text-xs text-slate-500">· {r.classroom}</span>
              </div>
              <span className="rounded-lg bg-slate-900 px-2.5 py-0.5 text-xs font-bold text-white">
                {r.rate === "-" ? "-" : `${r.rate}%`}
              </span>
            </div>
            <div className="mt-2.5 grid grid-cols-6 gap-1 text-center text-[11px]">
              <div className="rounded-lg bg-slate-50 py-1">
                <div className="text-slate-400">대상</div>
                <div className="font-bold text-slate-800">{r.total}</div>
              </div>
              <div className="rounded-lg bg-emerald-50/80 py-1">
                <div className="text-emerald-700">출석</div>
                <div className="font-bold text-emerald-800">{r.present}</div>
              </div>
              <div className="rounded-lg bg-amber-50/80 py-1">
                <div className="text-amber-700">지각</div>
                <div className="font-bold text-amber-800">{r.late}</div>
              </div>
              <div className="rounded-lg bg-orange-50/80 py-1">
                <div className="text-orange-700">조퇴</div>
                <div className="font-bold text-orange-800">{r.leaveEarly}</div>
              </div>
              <div className="rounded-lg bg-red-50/80 py-1">
                <div className="text-red-700">결석</div>
                <div className="font-bold text-red-800">{r.absent}</div>
              </div>
              <div className="rounded-lg bg-sky-50/80 py-1">
                <div className="text-sky-700">인정</div>
                <div className="font-bold text-sky-800">{r.excused}</div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="ui-card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b bg-slate-50/90 text-left text-xs text-slate-600">
            <tr>
              <th className="px-3 py-2.5">학번</th>
              <th className="px-3 py-2.5">이름</th>
              <th className="px-3 py-2.5">반</th>
              <th className="px-3 py-2.5 text-right">대상일수</th>
              <th className="px-3 py-2.5 text-right">출석</th>
              <th className="px-3 py-2.5 text-right">지각</th>
              <th className="px-3 py-2.5 text-right">조퇴</th>
              <th className="px-3 py-2.5 text-right">결석</th>
              <th className="px-3 py-2.5 text-right">인정</th>
              <th className="px-3 py-2.5 text-right">미체크</th>
              <th className="px-3 py-2.5 text-right">참석률(%)</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-6 text-center text-slate-500">
                  데이터가 없습니다.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.studentNo} className="border-b last:border-b-0 hover:bg-slate-50/60">
                <td className="px-3 py-2 font-mono text-xs">{r.studentNo}</td>
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2 text-slate-600">{r.classroom}</td>
                <td className="px-3 py-2 text-right">{r.total}</td>
                <td className="px-3 py-2 text-right text-emerald-700 font-medium">{r.present}</td>
                <td className="px-3 py-2 text-right">{r.late}</td>
                <td className="px-3 py-2 text-right">{r.leaveEarly}</td>
                <td className="px-3 py-2 text-right text-red-700 font-medium">{r.absent}</td>
                <td className="px-3 py-2 text-right">{r.excused}</td>
                <td className="px-3 py-2 text-right text-slate-400">{r.unchecked}</td>
                <td className="px-3 py-2 text-right font-bold text-slate-900">
                  {r.rate === "-" ? "-" : r.rate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
