import { expect, test as base } from "@playwright/test";
import { E2E_TEACHER_PASSCODE } from "./constants";

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto("/teacher/attendance/week");
    if (new URL(page.url()).pathname === "/teacher/login") {
      await page.getByLabel("패스코드").fill(E2E_TEACHER_PASSCODE);
      await page.getByRole("button", { name: "로그인" }).click();
      await expect(page).toHaveURL(/\/teacher\/attendance\/week/);
    }
    await use(page);
  },
});

export { expect };
