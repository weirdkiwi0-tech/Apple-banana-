import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

process.env.TZ = "Asia/Seoul";

vi.mock("@/lib/auth", () => ({
  requireTeacher: vi.fn().mockResolvedValue(undefined),
  hasTeacherSession: vi.fn().mockResolvedValue(true),
}));
