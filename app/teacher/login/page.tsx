import { loginAction } from "./actions";

interface LoginPageProps {
  searchParams: Promise<{ error?: string; next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <section className="mx-auto mt-12 max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">교사 로그인</h1>
      <p className="mt-2 text-sm text-slate-600">관리용 패스코드를 입력하세요.</p>

      {params.error === "invalid" && (
        <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          패스코드가 올바르지 않습니다.
        </p>
      )}
      {params.error === "setup" && (
        <p role="alert" className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          서버의 교사 인증 환경변수 설정을 확인해 주세요.
        </p>
      )}

      <form action={loginAction} className="mt-5 space-y-4">
        <input type="hidden" name="next" value={params.next ?? ""} />
        <label className="block text-sm font-medium text-slate-700" htmlFor="passcode">
          패스코드
        </label>
        <input
          id="passcode"
          name="passcode"
          type="password"
          autoComplete="current-password"
          required
          maxLength={256}
          className="min-h-11 w-full rounded-md border border-slate-300 px-3 text-base"
        />
        <button
          type="submit"
          className="min-h-11 w-full rounded-md bg-slate-900 px-4 font-semibold text-white hover:bg-slate-800"
        >
          로그인
        </button>
      </form>
    </section>
  );
}
