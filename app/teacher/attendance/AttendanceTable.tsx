"use client";

import { useState, useTransition } from "react";
import type { StudySlot, AttState } from "@prisma/client";
import { SLOT_LABEL, STATE_LABEL } from "@/lib/slot";
import { formatKstTime } from "@/lib/date";
import {
  checkInAction,
  checkOutAction,
  markAbsentAction,
  markExcusedAction,
  resetAction,
  updateAbsenceNoteAction,
} from "./actions";

export interface AttendanceRow {
  planId: string;
  studentNo: string;
  name: string;
  classroom: string;
  state: AttState;
  checkInAt: string | null;
  checkOutAt: string | null;
  absenceNote: string | null;
}

interface Props {
  date: string;
  slot: StudySlot;
  rows: AttendanceRow[];
}

const STATE_STYLE: Record<AttState, string> = {
  UNCHECKED: "bg-slate-100 text-slate-600",
  PRESENT: "bg-emerald-100 text-emerald-800",
  LATE: "bg-amber-100 text-amber-800",
  LEAVE_EARLY: "bg-orange-100 text-orange-800",
  ABSENT: "bg-red-100 text-red-800",
  EXCUSED: "bg-sky-100 text-sky-800",
};

interface ActionButtonsProps {
  row: AttendanceRow;
  date: string;
  slot: StudySlot;
  pending: boolean;
  onOpenAbsence: (row: AttendanceRow) => void;
  startTransition: (cb: () => Promise<void> | void) => void;
}

function ActionButtons({
  row,
  date,
  slot,
  pending,
  onOpenAbsence,
  startTransition,
}: ActionButtonsProps) {
  const base =
    "min-h-[40px] rounded-xl px-3 text-xs font-semibold text-white shadow-sm transition active:scale-95 disabled:opacity-45 sm:min-h-[36px] sm:px-2.5";
  const canCheckOut =
    row.state === "PRESENT" || row.state === "LATE" || row.state === "LEAVE_EARLY";
  return (
    <div className="grid grid-cols-5 gap-1.5 sm:flex sm:flex-wrap sm:gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() =>
            checkInAction({ planId: row.planId, date, slot }),
          )
        }
        className={`${base} bg-emerald-600 hover:bg-emerald-700`}
      >
        입실
      </button>
      <button
        type="button"
        disabled={pending || !canCheckOut}
        title={canCheckOut ? undefined : "입실 후에만 퇴실을 기록할 수 있습니다."}
        onClick={() =>
          startTransition(async () => {
            await checkOutAction({ planId: row.planId, date, slot });
          })
        }
        className={`${base} bg-orange-600 hover:bg-orange-700`}
      >
        퇴실
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => onOpenAbsence(row)}
        className={`${base} bg-red-600 hover:bg-red-700`}
      >
        불참
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => markExcusedAction({ planId: row.planId }))
        }
        className={`${base} bg-sky-600 hover:bg-sky-700`}
      >
        인정
      </button>
      <button
        type="button"
        disabled={pending || row.state === "UNCHECKED"}
        onClick={() =>
          startTransition(() => resetAction({ planId: row.planId }))
        }
        className="min-h-[40px] rounded-xl border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 active:scale-95 disabled:opacity-45 sm:min-h-[36px] sm:px-2.5"
      >
        초기화
      </button>
    </div>
  );
}

export function AttendanceTable({ date, slot, rows }: Props) {
  const [pending, startTransition] = useTransition();
  const [absenceFor, setAbsenceFor] = useState<AttendanceRow | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [query, setQuery] = useState("");

  if (rows.length === 0) {
    return (
      <div className="ui-card p-5 text-sm text-slate-600">
        해당 날짜·슬롯({SLOT_LABEL[slot]})의 대상자가 없습니다. 명부 업로드 화면에서 Excel을 업로드하세요.
      </div>
    );
  }

  const openAbsence = (row: AttendanceRow) => {
    setAbsenceFor(row);
    setNoteDraft(row.absenceNote ?? "");
  };

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
      {/* 빠른 검색 바 */}
      <div className="ui-card flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름·학번·반 빠른 검색..."
          aria-label="출결 학생 검색"
          className="ui-input w-full sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span>전체 {rows.length}명</span>
          <span>·</span>
          <span className="text-emerald-700 font-medium">
            출석 {rows.filter((r) => r.state === "PRESENT").length}
          </span>
          <span>·</span>
          <span className="text-red-700 font-medium">
            결석 {rows.filter((r) => r.state === "ABSENT").length}
          </span>
          <span>·</span>
          <span>
            미체크 {rows.filter((r) => r.state === "UNCHECKED").length}
          </span>
        </div>
      </div>

      {/* 모바일: 카드 기반 디자인 (Card-based Design) */}
      <ul className="space-y-2.5 sm:hidden">
        {filteredRows.map((row) => (
          <li
            key={row.planId}
            className="ui-card p-3.5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {row.name}
                  </span>
                  <span
                    className={`inline-block rounded-lg px-2 py-0.5 text-[11px] font-semibold ${STATE_STYLE[row.state]}`}
                  >
                    {STATE_LABEL[row.state]}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  <span className="font-mono">{row.studentNo}</span>
                  <span className="mx-1">·</span>
                  <span>{row.classroom}</span>
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 px-2 py-1 text-right text-[11px] text-slate-600">
                <div>
                  입실 <span className="font-mono">{row.checkInAt ? formatKstTime(new Date(row.checkInAt)) : "-"}</span>
                </div>
                <div>
                  퇴실 <span className="font-mono">{row.checkOutAt ? formatKstTime(new Date(row.checkOutAt)) : "-"}</span>
                </div>
              </div>
            </div>
            {row.absenceNote && (
              <p className="mt-2 rounded-xl bg-red-50/90 px-2.5 py-1.5 text-xs text-red-800">
                사유: {row.absenceNote}
              </p>
            )}
            <div className="mt-3">
              <ActionButtons
                row={row}
                date={date}
                slot={slot}
                pending={pending}
                onOpenAbsence={openAbsence}
                startTransition={startTransition}
              />
            </div>
          </li>
        ))}
      </ul>

      {/* 데스크톱: 테이블 */}
      <div className="ui-card hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50/90 text-left text-xs text-slate-600">
            <tr>
              <th className="px-3.5 py-2.5">학번</th>
              <th className="px-3.5 py-2.5">이름</th>
              <th className="px-3.5 py-2.5">반</th>
              <th className="px-3.5 py-2.5">상태</th>
              <th className="px-3.5 py-2.5">입실</th>
              <th className="px-3.5 py-2.5">퇴실</th>
              <th className="px-3.5 py-2.5">사유</th>
              <th className="px-3.5 py-2.5 text-right">액션</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.planId} className="border-b last:border-b-0 hover:bg-slate-50/60">
                <td className="px-3.5 py-2.5 font-mono text-xs text-slate-700">
                  {row.studentNo}
                </td>
                <td className="px-3.5 py-2.5 font-medium text-slate-900">{row.name}</td>
                <td className="px-3.5 py-2.5 text-slate-600">{row.classroom}</td>
                <td className="px-3.5 py-2.5">
                  <span
                    className={`inline-block rounded-lg px-2 py-0.5 text-xs font-semibold ${STATE_STYLE[row.state]}`}
                  >
                    {STATE_LABEL[row.state]}
                  </span>
                </td>
                <td className="px-3.5 py-2.5 font-mono text-xs text-slate-600">
                  {row.checkInAt ? formatKstTime(new Date(row.checkInAt)) : "-"}
                </td>
                <td className="px-3.5 py-2.5 font-mono text-xs text-slate-600">
                  {row.checkOutAt ? formatKstTime(new Date(row.checkOutAt)) : "-"}
                </td>
                <td className="px-3.5 py-2.5 text-xs text-slate-600">
                  {row.absenceNote ?? "-"}
                </td>
                <td className="px-3.5 py-2.5">
                  <div className="flex justify-end">
                    <ActionButtons
                      row={row}
                      date={date}
                      slot={slot}
                      pending={pending}
                      onOpenAbsence={openAbsence}
                      startTransition={startTransition}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {absenceFor && (
        <div className="ui-glass sticky bottom-[max(4.25rem,calc(env(safe-area-inset-bottom)+3.75rem))] z-20 rounded-2xl border p-4 shadow-xl sm:bottom-4">
          <h3 className="text-sm font-bold text-slate-900">
            불참 사유 입력 — {absenceFor.name} ({absenceFor.studentNo})
          </h3>
          <p className="mt-1 text-xs text-red-600">
            질병명·건강정보·가정사 등 민감한 상세 개인정보는 입력하지 마세요.
          </p>
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value.slice(0, 200))}
            rows={3}
            maxLength={200}
            className="ui-input mt-2 w-full"
            placeholder="사유 (최대 200자)"
          />
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>{noteDraft.length}/200</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setAbsenceFor(null);
                  setNoteDraft("");
                }}
                className="ui-btn border border-slate-300 bg-white px-3 text-xs text-slate-700"
              >
                취소
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  const planId = absenceFor.planId;
                  const note = noteDraft;
                  startTransition(async () => {
                    await markAbsentAction({ planId, note });
                    setAbsenceFor(null);
                    setNoteDraft("");
                  });
                }}
                className="ui-btn bg-red-600 px-3 text-xs text-white"
              >
                불참 저장
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  const planId = absenceFor.planId;
                  const note = noteDraft;
                  startTransition(async () => {
                    await updateAbsenceNoteAction({ planId, note });
                    setAbsenceFor(null);
                    setNoteDraft("");
                  });
                }}
                className="ui-btn border border-slate-300 bg-white px-3 text-xs text-slate-700"
              >
                사유만 갱신
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
