import { test, expect } from "@playwright/test";
test("skrivbordets widgets kan tas bort, läggas till, flyttas och återställas", async ({
  page,
  request,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Översikt", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Verksamheter", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Skicka till GARON" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Ta bort widgets", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ta bort Godkännanden", exact: true })
    .click();
  await expect(
    page
      .locator(".widget-desktop")
      .getByRole("heading", { name: "Godkännanden", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Lägg till widget", exact: true })
    .click();
  await page
    .locator(".widget-menu")
    .getByRole("button", { name: "Godkännanden", exact: true })
    .click();
  const header = page
    .locator(".widget-desktop .desktop-widget")
    .filter({
      has: page.getByRole("heading", { name: "Godkännanden", exact: true }),
    })
    .locator(".widget-drag");
  await header.scrollIntoViewIfNeeded();
  const box = await header.boundingBox();
  await page.mouse.move(box.x + 45, box.y + 17);
  await page.mouse.down();
  await page.mouse.move(box.x + 155, box.y + 65, { steps: 12 });
  await page.mouse.up();
  const resizedWidget = page
    .locator(".widget-desktop .desktop-widget")
    .filter({
      has: page.getByRole("heading", { name: "Godkännanden", exact: true }),
    });
  const originalHeight = (
    await (await request.get("/api/v4/ui")).json()
  ).layout.find((row) => row.i === "approvals").h;
  const handle = resizedWidget.locator(".react-resizable-handle");
  await handle.scrollIntoViewIfNeeded();
  const handleBox = await handle.boundingBox();
  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2 + 65,
    { steps: 10 },
  );
  await page.mouse.up();
  await expect
    .poll(
      async () =>
        (await (await request.get("/api/v4/ui")).json()).layout.find(
          (row) => row.i === "approvals",
        ).h,
    )
    .toBeGreaterThan(originalHeight);
  const before = (await (await request.get("/api/v4/ui")).json()).layout;
  await page.reload();
  await page.getByRole("heading", { name: "Översikt", exact: true }).waitFor();
  expect((await (await request.get("/api/v4/ui")).json()).layout).toEqual(
    before,
  );
  expect(before.some((row) => row.i === "approvals")).toBe(true);
  expect(errors).toEqual([]);
});
test("verksamhetsmall, valfria projekt, uppdrag och agentplacering fungerar", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Skapa verksamhet", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Välj mall", exact: true }).click();
  await dialog
    .getByRole("combobox", { name: "Mall", exact: true })
    .selectOption("project");
  await dialog.getByLabel("Namn", { exact: true }).fill("Min verksamhet");
  await dialog.getByRole("button", { name: "Skapa", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("button", { name: "Öppna Min verksamhet", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Verksamhetens sidor" })
    .getByRole("button", { name: "Projekt", exact: true })
    .click();
  await page.getByRole("button", { name: "Nytt projekt", exact: true }).click();
  await dialog.getByLabel("Projektnamn").fill("Första projektet");
  await dialog.getByRole("button", { name: "Skapa", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Första projektet" }),
  ).toBeVisible();
  await page
    .getByRole("group", { name: "Verksamhetens sidor" })
    .getByRole("button", { name: "Uppdrag", exact: true })
    .click();
  await page.getByRole("button", { name: "Nytt uppdrag", exact: true }).click();
  await dialog.getByLabel("Uppdragets namn").fill("Ett riktigt arbetssteg");
  await dialog.getByRole("button", { name: "Skapa", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Ett riktigt arbetssteg" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Agentnätverk", exact: true }).click();
  await page.getByRole("button", { name: "Skapa agent", exact: true }).click();
  await dialog.getByLabel("Namn", { exact: true }).fill("Kodagent");
  await dialog
    .getByLabel("Arbetsuppgift eller roll")
    .fill("Programmering och systemarkitektur");
  await dialog.getByRole("button", { name: "Föreslå placering" }).click();
  await expect(dialog.getByLabel("Mellanchef")).toHaveValue("anthropic");
  await dialog.getByRole("button", { name: "Godkänn och spara" }).click();
  await page
    .getByRole("button", { name: "Redigera Kodagent", exact: true })
    .click();
  await dialog.getByLabel("Namn", { exact: true }).fill("Min specialist");
  await dialog.getByLabel("Mellanchef").selectOption("openai");
  await dialog.getByRole("button", { name: "Godkänn och spara" }).click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Min specialist", exact: true }),
  ).toBeVisible();
});
test("minne, schemalagda interna objekt och verkliga beslut kan hanteras", async ({
  page,
}) => {
  await page.goto("/#settings/memory");
  await page.getByRole("button", { name: "Ny minnespost" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Rubrik", { exact: true }).fill("Mitt mål");
  await dialog
    .getByLabel("Innehåll", { exact: true })
    .fill("Bygg långsiktigt.");
  await dialog.getByRole("button", { name: "Spara minne" }).click();
  await expect(page.getByRole("heading", { name: "Mitt mål" })).toBeVisible();
  await page.getByRole("button", { name: "Schemalagt", exact: true }).click();
  await page.getByRole("button", { name: "Schemalägg", exact: true }).click();
  await dialog.getByLabel("Rubrik", { exact: true }).fill("Min påminnelse");
  const local = await page.evaluate(() => {
    const date = new Date(Date.now() + 3600000);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });
  await dialog.getByLabel("Lokal tid").fill(local);
  await dialog.getByRole("button", { name: "Spara", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Min påminnelse" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Avbryt Min påminnelse", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Huvudkontor" })
    .getByRole("button", { name: "Godkännanden", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Nytt beslutsförslag", exact: true })
    .click();
  await dialog.getByLabel("Rubrik", { exact: true }).fill("Ett viktigt beslut");
  await dialog
    .getByLabel("Åtgärd och bakgrund")
    .fill("Granska en idé. Inga externa åtgärder.");
  await dialog.getByRole("button", { name: "Spara förslag" }).click();
  await page.getByRole("button", { name: "Godkänn", exact: true }).click();
  await expect(
    page.getByText(
      "Beslutet är registrerat. Ingen extern åtgärd är ansluten.",
      { exact: true },
    ),
  ).toBeVisible();
});
test("tre chattkanaler är ärligt frånkopplade och utkast sparas", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Meddelande till GARON", { exact: true })
    .fill("Ett privat utkast som ska sparas.");
  await page.getByRole("button", { name: "AI-ledning", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Skicka till ChatGPT" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Skicka till Claude" }),
  ).toBeDisabled();
  await page
    .getByLabel("Meddelande till ChatGPT", { exact: true })
    .fill("Ett separat utkast.");
  await page
    .getByRole("navigation", { name: "Huvudkontor" })
    .getByRole("button", { name: "Översikt", exact: true })
    .click();
  await expect(
    page.getByLabel("Meddelande till GARON", { exact: true }),
  ).toHaveValue("Ett privat utkast som ska sparas.");
  await page.reload();
  await expect(
    page.getByLabel("Meddelande till GARON", { exact: true }),
  ).toHaveValue("Ett privat utkast som ska sparas.");
  await page
    .getByRole("button", { name: "Inställningar", exact: true })
    .click();
  await page.getByRole("radio", { name: "Ljust" }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page
    .getByRole("button", { name: "Återställ standardutseende" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
test("alla huvudvyer fungerar på MacBook och mobil utan fel eller överflöde", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const routes = [
    "home",
    "leadership",
    "agents",
    "approvals",
    "inbox",
    "scheduled",
    "activity",
    "settings",
    "settings/models",
    "settings/memory",
    "settings/plugins",
    "settings/costs",
    "settings/general",
  ];
  for (const theme of ["dark", "light"]) {
    await page.goto("/#settings");
    await page
      .getByRole("radio", { name: theme === "dark" ? "Mörkt" : "Ljust" })
      .check();
    await page.waitForTimeout(450);
    for (const width of [320, 390, 768, 1440])
      for (const route of routes) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`/#${route}`);
        await page.locator("main h1").waitFor();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${route} ${width}px`,
        ).toBe(true);
      }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Öppna navigation" }).click();
  await page
    .getByRole("button", { name: "Skapa verksamhet", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(errors).toEqual([]);
});
