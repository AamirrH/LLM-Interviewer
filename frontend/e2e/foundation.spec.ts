import { expect, test } from "@playwright/test";

test("reports real readiness and the empty practice state", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await request.get("/api/readiness");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ready", storage: "ready" });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Good practice starts here." }),
  ).toBeVisible();
  await expect(page.getByText("Workbench online")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your first case is still ahead." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start practice" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Check connection" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Workbench online")).toBeVisible();
  expect(errors).toEqual([]);
  await page.screenshot({
    path: "../artifacts/foundation-desktop.png",
    fullPage: true,
  });
});

test("recovers after an unavailable connection", async ({ page }) => {
  await page.route("**/api/readiness", (route) =>
    route.fulfill({
      status: 503,
      json: { status: "unavailable", storage: "unknown" },
    }),
  );
  await page.goto("/");
  await expect(page.getByText("Connection unavailable")).toBeVisible();
  await expect(
    page.getByText("Start the local backend, then check the connection again."),
  ).toBeVisible();
  await page.screenshot({
    path: "../artifacts/foundation-unavailable.png",
    fullPage: true,
  });
  await page.unroute("**/api/readiness");
  await page.getByRole("button", { name: "Check connection" }).click();
  await expect(page.getByText("Workbench online")).toBeVisible();
});

test("fits a narrow screen and exposes keyboard navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByText("Workbench online")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to workspace" }),
  ).toBeFocused();
  await page.screenshot({
    path: "../artifacts/foundation-mobile.png",
    fullPage: true,
  });
});
