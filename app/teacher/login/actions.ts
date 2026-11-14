"use server";

import { timingSafeEqual } from "node:crypto";
import type { Route } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { createTeacherSessionToken, TEACHER_SESSION_COOKIE } from "@/lib/session-token";

const DEFAULT_SESSION_HOURS = 12;

function safeNextPath(value: FormDataEntryValue | null): Route {
  if (
    typeof value === "string" &&
    value.startsWith("/teacher/") &&
    !value.startsWith("/teacher/login") &&
    !value.includes("\\")
  ) {
    return value as Route;
  }
  return "/teacher/attendance/week";
}

export async function loginAction(formData: FormData): Promise<void> {
  const nextPath = safeNextPath(formData.get("next"));
  const passcode = formData.get("passcode");
  const configuredPasscode = process.env.TEACHER_PASSCODE;
  const secret = process.env.SESSION_SECRET;
  const hours = Number(process.env.SESSION_HOURS ?? DEFAULT_SESSION_HOURS);

  if (
    typeof configuredPasscode !== "string" ||
    configuredPasscode.length < 12 ||
    typeof secret !== "string" ||
    secret.length < 32 ||
    !Number.isInteger(hours) ||
    hours < 1 ||
    hours > 168
  ) {
    redirect("/teacher/login?error=setup");
  }

  if (typeof passcode !== "string" || passcode.length > 256) {
    redirect(`/teacher/login?error=invalid&next=${encodeURIComponent(nextPath)}`);
  }

  const provided = Buffer.from(passcode);
  const expected = Buffer.from(configuredPasscode);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    redirect(`/teacher/login?error=invalid&next=${encodeURIComponent(nextPath)}`);
  }

  const expiresAt = Date.now() + hours * 60 * 60 * 1000;
  const token = await createTeacherSessionToken(secret, expiresAt);
  const cookieStore = await cookies();
  cookieStore.set(TEACHER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });

  redirect(nextPath);
}

export async function logoutAction(): Promise<void> {
  await requireTeacher();
  const cookieStore = await cookies();
  cookieStore.delete(TEACHER_SESSION_COOKIE);
  redirect("/teacher/login");
}
