"use client";

import { useState, useTransition } from "react";
import { uploadExcelAction, type ImportResult } from "./actions";
import { SLOT_LABEL } from "@/lib/slot";

export function ImportsForm() {
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            try {
              const res = await uploadExcelAction(fd);
              setResult(res);
              if (!res.ok && res.message) setError(res.message);
            } catch (err) {
              setError(err instanceof Error ? err.message : "업로드 실패");
            }
          });
        }}
        className="ui-card p-4 sm:p-5"
      >
        <label className="block text-sm font-bold text-slate-900">
          Excel 파일 (.xlsx)
        </label>
        <div className="mt-1.5 space-y-1 rounded-xl bg-slate-50/90 p-3 text-xs text-slate-600">
          <p>• 단순 양식 열: 학번, 이름, 반, 날짜(YYYY-MM-DD), 구분(오자/야자/심자)</p>
          <p>• 설문 원본(제출내역/제출내역_텍스트)을 그대로 업로드 가능 (기준 월요일 생략 시 이번 주 월요일 자동 적용)</p>
          <p>• 내려받은 주간 출결표에 표시(출·지·조·결·인)를 채워 다시 올리면 주간 출결표에 그대로 반영</p>
        </div>
        <input
          type="file"
          name="file"
          accept=".xlsx,.xls"
          required
          className="mt-3 block w-full min-h-[42px] rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-1.5 text-sm file:mr-3 file:min-h-[36px] file:rounded-lg file:border-0 file:bg-slate-900 file:px-3.5 file:text-xs file:font-semibold file:text-white"
        />
        <label className="mt-3.5 block text-sm font-bold text-slate-900">
          기준 월요일 <span className="text-xs font-normal text-slate-500">(설문 업로드 시, 비우면 이번 주 자동)</span>
        </label>
        <input
          type="date"
          name="weekMonday"
          className="ui-input mt-1.5 block w-full sm:w-auto"
        />
        <button
          type="submit"
          disabled={isPending}
          className="ui-btn mt-4 w-full bg-gradient-to-r from-slate-900 to-indigo-950 px-5 py-2.5 font-semibold text-white shadow-sm sm:w-auto"
        >
          {isPending ? "업로드 중..." : "업로드"}
        </button>
        {error && (
          <p className="mt-2.5 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
      </form>

      {result && result.ok && (
        <div className="ui-card p-4 sm:p-5">
          <h3 className="text-sm font-bold text-slate-900">업로드 결과</h3>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700 sm:grid-cols-4 lg:grid-cols-8">
            <div className="rounded-xl bg-slate-50 p-2.5">
              <dt className="text-xs text-slate-500">전체 행</dt>
              <dd className="mt-0.5 text-base font-bold">{result.totalRows}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5">
              <dt className="text-xs text-slate-500">유효 행</dt>
              <dd className="mt-0.5 text-base font-bold">{result.validRows}</dd>
            </div>
            <div className="rounded-xl bg-emerald-50/70 p-2.5">
              <dt className="text-xs text-emerald-700">신규 생성</dt>
              <dd className="mt-0.5 text-base font-bold text-emerald-700">{result.createdRows}</dd>
            </div>
            <div className="rounded-xl bg-sky-50/70 p-2.5">
              <dt className="text-xs text-sky-700">기존 갱신</dt>
              <dd className="mt-0.5 text-base font-bold text-sky-700">{result.updatedRows}</dd>
            </div>
            <div className="rounded-xl bg-red-50/70 p-2.5">
              <dt className="text-xs text-red-700">이전 제거</dt>
              <dd className="mt-0.5 text-base font-bold text-red-700">{result.removedRows}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5">
              <dt className="text-xs text-slate-500">기존 유지</dt>
              <dd className="mt-0.5 text-base font-bold">{result.existingSkipped}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5">
              <dt className="text-xs text-slate-500">중복 행</dt>
              <dd className="mt-0.5 text-base font-bold">{result.duplicateRows}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5">
              <dt className="text-xs text-slate-500">캘린더 제외</dt>
              <dd className="mt-0.5 text-base font-bold">{result.excludedByCalendar}</dd>
            </div>
          </dl>

          {result.perDate.length > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-semibold text-slate-600">
                날짜·슬롯별 생성 수
              </h4>
              <ul className="mt-1 text-sm text-slate-700">
                {result.perDate.map((r) => (
                  <li key={`${r.date}-${r.slot}`}>
                    {r.date} · {SLOT_LABEL[r.slot]}: {r.count}명
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-semibold text-red-600">
                오류/제외 행 ({result.errors.length})
              </h4>
              <ul className="mt-1 max-h-64 space-y-0.5 overflow-auto text-sm text-slate-700">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    {e.row}행: {e.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
