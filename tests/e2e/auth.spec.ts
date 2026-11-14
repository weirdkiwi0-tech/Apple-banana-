import { expect, test } from "@playwright/test";
import { E2E_TEACHER_PASSCODE } from "./constants";

test("교사 화면은 인증 전 로그인으로 이동한다", async ({ page }) => {
  await page.goto("/teacher/attendance/week");

  await expect(page).toHaveURL(/\/teacher\/login/);
  await expect(page.getByRole("heading", { name: "교사 로그인" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "모바일 하단 빠른 메뉴" })).toHaveCount(0);
});

test("패스코드 로그인 후 요청한 화면으로 이동한다", async ({ page }) => {
  await page.goto("/teacher/attendance/week");

  await page.getByLabel("패스코드").fill("incorrect-passcode");
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page.getByText("패스코드가 올바르지 않습니다.", { exact: true })).toBeVisible();

  await page.getByLabel("패스코드").fill(E2E_TEACHER_PASSCODE);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page).toHaveURL(/\/teacher\/attendance\/week/);

  await expect(page.getByRole("navigation", { name: "모바일 하단 빠른 메뉴" })).toBeVisible();
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await page.getByRole("button", { name: "로그아웃" }).click();
  await expect(page).toHaveURL(/\/teacher\/login/);
  await expect(page.getByRole("navigation", { name: "모바일 하단 빠른 메뉴" })).toHaveCount(0);

  await page.goto("/teacher/attendance/week");
  await expect(page).toHaveURL(/\/teacher\/login/);
});
