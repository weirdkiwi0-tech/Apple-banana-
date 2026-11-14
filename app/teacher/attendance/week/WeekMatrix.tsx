"use client";

import { useState, useTransition } from "react";
import type { AttState, StudySlot } from "@prisma/client";
import { SLOT_LABEL, SLOT_ORDER, STATE_LABEL } from "@/lib/slot";
import {
  WEEKDAY_LABELS,
  attendanceMark,
  type WeekRow,
} from "@/lib/weekly-attendance";
import { cycleCellAction } from "./actions";
import { StudentDetailDialog } from "./StudentDetailDialog";

const CELL_STYLE: Record<AttState, string> = {
  UNCHECKED: "bg-slate-50 text-slate-400 hover:bg-slate-100 border-slate-200/80",
  PRESENT: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200",
  LATE: "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200",
  LEAVE_EARLY: "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200",
  ABSENT: "bg-red-100 text-red-800 hover:bg-red-200 border-red-200",
  EXCUSED: "bg-sky-100 text-sky-800 hover:bg-sky-200 border-sky-200",
};

const LEGEND: Array<{ mark: string; label: string; badgeClass: string }> = [
  { mark: "○", label: "미체크(예정)", badgeClass: "bg-slate-100 text-slate-600" },
  { mark: "출", label: "출석", badgeClass: "bg-emerald-100 text-emerald-800" },
  { mark: "지", label: "지각", badgeClass: "bg-amber-100 text-amber-800" },
  { mark: "조", label: "조퇴", badgeClass: "bg-orange-100 text-orange-800" },
  { mark: "결", label: "결석", badgeClass: "bg-red-100 text-red-800" },
  { mark: "인", label: "인정결석", badgeClass: "bg-sky-100 text-sky-800" },
];

interface Props {
  dates: string[];
  rows: WeekRow[];
}

export function WeekMatrix({ dates, rows }: Props) {
  const [pending, startTransition] = useTransition();
  const [mobileSlot, setMobileSlot] = useState<StudySlot>("YAJA");
  const [query, setQuery] = useState("");
  const [openStudent, setOpenStudent] = useState<{
    studentNo: string;
    name: string;
    classroom: string;
  } | null>(null);

  if (rows.length === 0) {
    return (
      <div className="ui-card p-5 text-sm text-slate-600">
        이 주(월~금)에 참여 계획이 없습니다. 명부 업로드 화면에서 설문 Excel을 업로드하세요.
      </div>
    );
  }
  const trimmed = query.trim().toLowerCase();
  const filteredRows = trimmed
    ? rows.filter(
        (r) =>
          r.name.toLowerCase().includes(trimmed) ||
          r.studentNo.toLowerCase().includes(trimmed) ||
          r.classroom.toLowerCase().includes(trimmed),
      )
    : rows;

  return (
    <div className="space-y-3">
      {/* 검색 & 모바일 슬롯 선택 바 */}
      <div className="ui-card flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 sm:hidden">
          {SLOT_ORDER.map((s) => {
            const active = mobileSlot === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setMobileSlot(s)}
                className={`min-h-[36px] rounded-lg px-2 py-1 text-xs font-semibold transition ${
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {SLOT_LABEL[s]}
              </button>
            );
          })}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름·학번·반 빠른 검색..."
            aria-label="학생 검색"
            className="ui-input w-full"
          />
        </div>
        <p className="text-xs text-slate-500">
          표시 인원 <span className="font-semibold text-slate-800">{filteredRows.length}</span>명 · 이름을 누르면 상세 연락처 수정
        </p>
      </div>

      {/* 모바일 전용: 카드 기반 주간 매트릭스 (가로 스크롤 없이 한 화면에 월~금 터치) */}
      <ul className="space-y-2.5 sm:hidden" aria-label="모바일 주간 출결 카드">
        {filteredRows.map((row) => (
          <li key={row.studentNo} className="ui-card p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {row.name}
                </span>
                <span className="font-mono text-xs text-slate-500">{row.studentNo}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {row.classroom}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setOpenStudent({
                      studentNo: row.studentNo,
                      name: row.name,
                      classroom: row.classroom,
                    })
                  }
                  className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  상세
                </button>
              </div>
            </div>

            <div className="mt-2.5 grid grid-cols-5 gap-1.5">
              {WEEKDAY_LABELS.map((wd, i) => {
                const cell = row.cells[mobileSlot][i] ?? null;
                const date = dates[i];
                if (!cell) {
                  return (
                    <button
                      key={`${mobileSlot}-${i}`}
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await cycleCellAction({
                            studentNo: row.studentNo,
                            date,
                            slot: mobileSlot,
                          });
                        })
                      }
                      className="flex min-h-[48px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-1 text-slate-400 transition active:scale-95 disabled:opacity-50"
                    >
                      <span className="text-[10px] text-slate-400">{wd}</span>
                      <span className="text-xs font-semibold">+</span>
                    </button>
                  );
                }
                return (
                  <button
                    key={`${mobileSlot}-${i}`}
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await cycleCellAction({ planId: cell.planId });
                      })
                    }
                    className={`flex min-h-[48px] flex-col items-center justify-center rounded-xl border py-1 transition active:scale-95 disabled:opacity-50 ${CELL_STYLE[cell.state]}`}
                  >
                    <span className="text-[10px] opacity-75">{wd}</span>
                    <span className="text-xs font-bold">{attendanceMark(cell.state)}</span>
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>

      {/* 태블릿/데스크톱 및 전체 매트릭스 테이블 (학번/이름 왼쪽 고정으로 작은 화면 가로 스크롤 편의성 확보) */}
      <div className="ui-card overflow-x-auto">
        <table className="min-w-max w-full text-sm">
          <thead className="bg-slate-50/90 text-xs text-slate-600">
            <tr>
              <th className="sticky left-0 z-10 border-b bg-slate-50 px-3 py-2.5 text-left font-semibold" rowSpan={2}>
                학번
              </th>
              <th className="sticky left-[4.5rem] z-10 border-b bg-slate-50 px-3 py-2.5 text-left font-semibold shadow-[2px_0_4px_-2px_rgba(15,23,42,0.06)]" rowSpan={2}>
                이름
              </th>
              <th className="border-b px-3 py-2.5 text-left font-semibold" rowSpan={2}>
                반
              </th>
              {SLOT_ORDER.map((slot) => (
                <th
                  key={slot}
                  className="border-b border-l px-2 py-1.5 text-center font-semibold text-slate-800"
                  colSpan={WEEKDAY_LABELS.length}
                >
                  {SLOT_LABEL[slot]}
                </th>
              ))}
            </tr>
            <tr>
              {SLOT_ORDER.flatMap((slot) =>
                WEEKDAY_LABELS.map((wd, i) => (
                  <th
                    key={`${slot}-${i}`}
                    className={`border-b px-1.5 py-1 text-center font-medium ${i === 0 ? "border-l" : ""}`}
                    title={dates[i] ?? ""}
                  >
                    {wd}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.studentNo} className="border-b last:border-b-0 hover:bg-slate-50/60">
                <td className="sticky left-0 z-10 bg-white px-3 py-1.5 font-mono text-xs text-slate-600">
                  {row.studentNo}
                </td>
                <td className="sticky left-[4.5rem] z-10 whitespace-nowrap bg-white px-3 py-1.5 shadow-[2px_0_4px_-2px_rgba(15,23,42,0.06)]">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenStudent({
                        studentNo: row.studentNo,
                        name: row.name,
                        classroom: row.classroom,
                      })
                    }
                    title={`${row.name} 상세 정보`}
                    className="rounded-lg px-1.5 py-0.5 text-left font-semibold text-slate-900 underline decoration-slate-300 underline-offset-2 hover:bg-slate-100 hover:decoration-slate-500"
                  >
                    {row.name}
                  </button>
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-xs text-slate-600">
                  {row.classroom}
                </td>
                {SLOT_ORDER.flatMap((slot) =>
                  WEEKDAY_LABELS.map((wd, i) => {
                    const cell = row.cells[slot][i] ?? null;
                    const leftBorder = i === 0 ? "border-l" : "";
                    const date = dates[i];
                    if (!cell) {
                      return (
                        <td
                          key={`${slot}-${i}`}
                          className={`p-0.5 text-center ${leftBorder}`}
                        >
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              startTransition(async () => {
                                await cycleCellAction({
                                  studentNo: row.studentNo,
                                  date,
                                  slot,
                                });
                              })
                            }
                            title={`${row.name} · ${SLOT_LABEL[slot]} ${wd} (미신청 — 클릭 시 출석 등록)`}
                            className="min-h-[36px] w-9 rounded-lg text-xs text-slate-300 transition hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 disabled:opacity-50"
                          >
                            +
                          </button>
                        </td>
                      );
                    }
                    return (
                      <td key={`${slot}-${i}`} className={`p-0.5 text-center ${leftBorder}`}>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await cycleCellAction({ planId: cell.planId });
                            })
                          }
                          title={`${row.name} · ${SLOT_LABEL[slot]} ${wd} — ${STATE_LABEL[cell.state]} (클릭: 출석→결석→인정→미체크)`}
                          className={`min-h-[36px] w-9 rounded-lg text-xs font-bold transition active:scale-95 disabled:opacity-50 ${CELL_STYLE[cell.state]}`}
                        >
                          {attendanceMark(cell.state)}
                        </button>
                      </td>
                    );
                  }),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ui-card flex flex-wrap items-center gap-x-3 gap-y-1.5 p-3 text-xs text-slate-600">
        {LEGEND.map((l) => (
          <span key={l.mark} className="inline-flex items-center gap-1.5">
            <span className={`inline-block min-w-[1.35rem] rounded-md px-1 py-0.5 text-center font-bold ${l.badgeClass}`}>
              {l.mark}
            </span>
            {l.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-slate-400">
          <span className="inline-block min-w-[1.35rem] rounded-md bg-slate-100 px-1 py-0.5 text-center font-bold">+</span>
          미신청 (클릭 시 출석 등록)
        </span>
      </div>
      <p className="px-1 text-xs text-slate-500">
        셀을 누르면 출석(출)→결석(결)→인정(인)→미체크(○) 순으로 변경됩니다. 미신청(+) 칸을 누르면 즉시 현장 출석으로 등록됩니다.
      </p>

      {openStudent && (
        <StudentDetailDialog
          studentNo={openStudent.studentNo}
          name={openStudent.name}
          classroom={openStudent.classroom}
          onClose={() => setOpenStudent(null)}
        />
      )}
    </div>
  );
}
