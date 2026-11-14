"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  CalendarDays,
  CheckSquare,
  Upload,
  BarChart3,
  Clock,
  CalendarOff,
  History,
} from "lucide-react";

const NAV: Array<{
  href: Route;
  label: string;
  shortLabel: string;
  icon: typeof CalendarDays;
}> = [
  {
    href: "/teacher/attendance/week",
    label: "주간 출결 (엑셀)",
    shortLabel: "주간출결",
    icon: CalendarDays,
  },
  {
    href: "/teacher/attendance",
    label: "일일 출결",
    shortLabel: "일일출결",
    icon: CheckSquare,
  },
  {
    href: "/teacher/imports",
    label: "명부 업로드",
    shortLabel: "업로드",
    icon: Upload,
  },
  {
    href: "/teacher/reports",
    label: "리포트",
    shortLabel: "통계",
    icon: BarChart3,
  },
  {
    href: "/teacher/slots",
    label: "슬롯 설정",
    shortLabel: "슬롯",
    icon: Clock,
  },
  {
    href: "/teacher/calendar",
    label: "캘린더 예외",
    shortLabel: "예외일",
    icon: CalendarOff,
  },
  {
    href: "/teacher/logs",
    label: "운영 기록",
    shortLabel: "기록",
    icon: History,
  },
];

const QUICK_MOBILE_NAV = NAV.slice(0, 5);

export function TeacherHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  // 라우트 변경 시 메뉴 자동 닫기
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 바깥 클릭·Esc 로 닫기
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="ui-glass sticky top-0 z-30 border-b pt-[env(safe-area-inset-top)]">
        <div
          ref={ref}
          className="relative mx-auto max-w-5xl px-3.5 py-2.5 sm:px-6 sm:py-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="teacher-nav"
                aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
                className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-slate-200/90 bg-white/90 text-slate-700 shadow-sm transition hover:bg-slate-100 active:scale-95"
              >
                {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
              </button>
              <Link
                href={"/teacher/attendance/week" as Route}
                className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-slate-900 to-indigo-900 text-xs font-bold text-white shadow-sm">
                  야
                </span>
                <span>야자·심자 관리</span>
              </Link>
            </div>

            {/* 태블릿/데스크톱: 상단 필 네비게이션 */}
            <nav
              aria-label="데스크톱 빠른 이동"
              className="hidden items-center gap-1 md:flex"
            >
              {NAV.map((n) => {
                const active = pathname === n.href;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100/90 hover:text-slate-900"
                    }`}
                  >
                    {n.shortLabel}
                  </Link>
                );
              })}
            </nav>
          </div>

          {open && (
            <nav
              id="teacher-nav"
              aria-label="주요 화면"
              className="ui-card absolute inset-x-3.5 top-full z-30 mt-2 overflow-hidden p-1.5 shadow-xl sm:inset-x-6 sm:max-w-xs"
            >
              {NAV.map((n) => {
                const active = pathname === n.href;
                const Icon = n.icon;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
                      active
                        ? "bg-slate-900 font-semibold text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-100/80"
                    }`}
                  >
                    <Icon size={17} aria-hidden className={active ? "text-white" : "text-slate-400"} />
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* 모바일 전용 하단 글래스 탭바 (아이폰/갤럭시 한 손 조작 최적화) */}
      <nav
        aria-label="모바일 하단 빠른 메뉴"
        className="ui-glass fixed inset-x-0 bottom-0 z-20 border-t pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(15,23,42,0.06)] sm:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 px-1 py-1">
          {QUICK_MOBILE_NAV.map((n) => {
            const active = pathname === n.href;
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[11px] font-medium transition active:scale-95 ${
                  active
                    ? "text-slate-900 font-semibold"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <span
                  className={`flex h-6 w-10 items-center justify-center rounded-full transition ${
                    active ? "bg-slate-900/10 text-slate-900" : ""
                  }`}
                >
                  <Icon size={17} aria-hidden />
                </span>
                <span className="truncate">{n.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
