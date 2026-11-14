import { TeacherHeader } from "./TeacherHeader";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <TeacherHeader />
      <main className="mx-auto max-w-5xl px-3.5 pt-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] sm:px-6 sm:pt-7 sm:pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  );
}
