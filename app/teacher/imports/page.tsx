import { ImportsForm } from "./ImportsForm";

export const dynamic = "force-dynamic";

export default function ImportsPage() {
  return (
    <div className="space-y-4">
      <div className="ui-card p-4">
        <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
          Excel 명부 업로드
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Excel 파일을 업로드하면 학생·날짜·슬롯별 출결 대상자가 생성됩니다.
          기존 출결 기록은 자동 삭제되지 않으며, 동일 학생·날짜·슬롯은 중복 생성되지 않습니다.
        </p>
      </div>
      <ImportsForm />
    </div>
  );
}
