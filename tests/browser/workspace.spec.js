import { test, expect } from "@playwright/test";

test("GARON 3 startar tomt med ärlig chatt och separata huvudkontorssidor", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Välkommen tillbaka", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("AI är inte aktiverad", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Meddelande till GARON")
    .fill("Hjälp mig tänka vidare.");
  await expect(
    page.getByRole("button", { name: "Skicka meddelande" }),
  ).toBeDisabled();
  await page
    .getByRole("navigation", { name: "Huvudkontor" })
    .getByRole("button", { name: "Godkännanden", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Inga beslut väntar" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Inkorg", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Din inkorg är inte ansluten" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Schemalagt", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Ingenting är schemalagt" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Aktivitet", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "En ny början", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Verksamheter", exact: true }).click();
  await expect(page.getByText("GARON Core", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Din organisation börjar här" }),
  ).toBeVisible();
  await expect(page.getByText(/SITELY|dropshipping/i)).toHaveCount(0);
  const state = await (await request.get("/api/state")).json();
  expect(state.businesses).toEqual([]);
  expect(state.messages).toEqual([]);
  expect(state.usage).toEqual([]);
});

test("skapa, öppna, anpassa, byta namn och bekräfta borttagning av en verksamhet", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Skapa verksamhet", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Namn", { exact: true }).fill("Min ateljé");
  await dialog.getByLabel("Beskrivning").fill("En arbetsyta för mina idéer.");
  await dialog.getByRole("button", { name: "Skapa", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("button", { name: "Visa meny för Min ateljé", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Mina verksamheter" })
    .getByRole("button", { name: "Översikt", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Min ateljé", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Min ateljé", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Redigera", exact: true }).click();
  await dialog.getByLabel("Namn", { exact: true }).fill("Ateljé Nova");
  await dialog.getByLabel("Visa Uppdrag").check();
  await dialog.getByLabel("Visa Agenter").check();
  await dialog.getByRole("button", { name: "Spara ändringar" }).click();
  await expect(
    page.getByRole("heading", { name: "Ateljé Nova", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("group", { name: "Verksamhetens sidor" })
    .getByRole("button", { name: "Agenter", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Inga agenter är anslutna" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Alla verksamheter", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Ateljé Nova Verksamhet" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Zooma in" }).click();
  await expect(page.getByText("115%", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Återställ nätverksvy" }).click();
  await page.getByRole("button", { name: "Listvy", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Ateljé Nova En arbetsyta/ }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByRole("button", { name: "Ta bort Ateljé Nova", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /Ateljé Nova En arbetsyta/ }),
  ).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Ta bort Ateljé Nova", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Plats för det du vill bygga" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Plats för det du vill bygga" }),
  ).toBeVisible();
});

test("tema, alla accentfärger, egen färg och kompakt sidopanel sparas", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Inställningar", exact: true })
    .click();
  await page.getByRole("radio", { name: "Ljust" }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  for (const [name, color] of [
    ["Blå", "#8aafff"],
    ["Lila", "#b399ef"],
    ["Grön", "#7fbea2"],
    ["Orange", "#e8ab7c"],
  ]) {
    await page
      .getByRole("button", { name: `Accentfärg ${name}`, exact: true })
      .click();
    expect(
      await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--accent")
          .trim(),
      ),
    ).toBe(color);
  }
  await page.getByLabel("Egen accentfärg").fill("#c46a81");
  await page.getByRole("button", { name: "Kompakt", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).toHaveAttribute("data-density", "compact");
  expect(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim(),
    ),
  ).toBe("#c46a81");
  await page.getByRole("radio", { name: "Mörkt" }).check();
  await page.getByRole("button", { name: "Normal", exact: true }).click();
  await page.getByRole("button", { name: "Minne", exact: true }).click();
  await expect(
    page.getByText("Automatiskt AI-minne är inte aktiverat", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ny anteckning", exact: true })
    .click();
  await page.getByRole("dialog").getByLabel("Rubrik").fill("Min riktning");
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Anteckning", exact: true })
    .fill("Bygg steg för steg.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Spara", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Min riktning", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Redigera Min riktning" }).click();
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Anteckning", exact: true })
    .fill("Ett genomtänkt steg i taget.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Spara", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByText("Ett genomtänkt steg i taget.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Plugins", exact: true }).click();
  await expect(
    page.getByText("Inga plugins är anslutna", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "AI-modeller", exact: true }).click();
  await expect(
    page.getByText("AI-anrop är spärrade", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Allmänt", exact: true }).click();
  await page.getByRole("switch", { name: "Bekräftelser i appen" }).uncheck();
  await page.reload();
  await expect(
    page.getByRole("switch", { name: "Bekräftelser i appen" }),
  ).not.toBeChecked();
});

test("mobil navigation, dialoger, samtliga sidor och båda teman fungerar", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const routes = [
    "home",
    "approvals",
    "inbox",
    "scheduled",
    "activity",
    "businesses",
    "settings",
    "settings/memory",
    "settings/plugins",
    "settings/models",
    "settings/general",
  ];
  for (const theme of ["dark", "light"])
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await page.getByRole("heading", { name: "Välkommen tillbaka" }).waitFor();
      await page.evaluate((theme) => {
        const data = JSON.parse(
          localStorage.getItem("garon.v3.preferences") || "{}",
        );
        localStorage.setItem(
          "garon.v3.preferences",
          JSON.stringify({ ...data, theme }),
        );
      }, theme);
      for (const route of routes) {
        await page.goto(`/#${route}`);
        await page.locator("main h1").waitFor();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${route} ${theme} ${width}px`,
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
  await page.getByRole("button", { name: "Öppna navigation" }).click();
  await page.getByRole("button", { name: "Inkorg", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Inkorg", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
