import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TEACHER_SESSION_COOKIE, verifyTeacherSessionToken } from "@/lib/session-token";

export async function hasTeacherSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyTeacherSessionToken(
    cookieStore.get(TEACHER_SESSION_COOKIE)?.value,
    process.env.SESSION_SECRET,
  );
}

export async function requireTeacher(): Promise<void> {
  if (!(await hasTeacherSession())) redirect("/teacher/login");
}
