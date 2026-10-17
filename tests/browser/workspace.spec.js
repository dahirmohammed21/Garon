import { test, expect } from "@playwright/test";

test("en användare kan skapa, godkänna, slutföra och återläsa ett uppdrag", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Översikt." })).toBeVisible();
  await page.screenshot({ path: "/tmp/garon-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Projekt", exact: true }).click();
  await page.getByRole("button", { name: "Öppna uppdrag", exact: true }).click();
  await page.getByRole("button", { name: "Nytt uppdrag", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Vad vill du göra?").fill("Planera GARONs nästa fas");
  await dialog
    .getByLabel("Beskrivning")
    .fill("Ta fram en konkret plan för agentverktyg.");
  await dialog.getByLabel("Kräver mitt godkännande").check();
  await dialog.getByRole("button", { name: "Skapa uppdrag" }).click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("navigation", { name: "Huvudkontor" })
    .getByRole("button", { name: "Beslut & godkännanden" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Planera GARONs nästa fas" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Godkänn", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Allt är under kontroll" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Projekt", exact: true })
    .click();
  await page.getByRole("button", { name: "Öppna uppdrag", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Planera GARONs nästa fas Personligt uppdrag",
    })
    .click();
  await dialog
    .getByRole("combobox", { name: "Status", exact: true })
    .selectOption("done");
  await dialog.getByRole("button", { name: "Spara ändringar" }).click();
  await expect(page.getByText("Slutfört", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Slutfört", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Minne & kunskap" }).click();
  await page.getByRole("button", { name: "Nytt minne", exact: true }).click();
  await dialog.getByLabel("Rubrik").fill("Min första projektidé");
  await dialog
    .getByLabel("Anteckning")
    .fill("Bygga en personlig plattform steg för steg.");
  await dialog.getByRole("button", { name: "Spara minne" }).click();
  await expect(
    page.getByRole("heading", { name: "Min första projektidé" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Agentnätverk", exact: true }).click();
  await page.getByRole("button", { name: "Skapa agent", exact: true }).click();
  await dialog.getByLabel("Agentens namn").fill("Research");
  await dialog
    .getByLabel("Roll och syfte")
    .fill("Samla kunskap och föreslå nästa steg.");
  await dialog.getByRole("button", { name: "Skapa agentroll" }).click();
  await expect(
    page.getByRole("heading", { name: "Research", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pausa", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Aktivera", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "GARON – Min affärspartner" }).click();
  await expect(page.getByText("AI pausad", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Skicka meddelande" }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Inställningar", exact: true })
    .click();
  await page.getByLabel("Månadsbudget för AI (USD)").fill("2");
  await page.getByRole("button", { name: "Spara inställningar" }).click();
  await page
    .getByRole("button", { name: "Ekonomi & AI-kostnader", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /2,00/ }).first(),
  ).toBeVisible();
  await page.getByLabel("Global sökning").fill("projektidé");
  await page
    .getByRole("button", { name: "Min första projektidé Minne" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Min första projektidé" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("mobil navigation, demo och dialog fungerar utan horisontell scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Översikt." })).toBeVisible();
  await page.getByLabel("Visa design-demo").check();
  await expect(page.getByText(/Design-demo: endast kort/)).toBeVisible();
  await page.screenshot({ path: "/tmp/garon-mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Öppna navigation" }).click();
  await page
    .getByRole("button", { name: "Projekt", exact: true })
    .click();
  await page.getByRole("button", { name: "Öppna uppdrag", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Fristående uppdrag." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Nytt uppdrag", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test('Fas 1 skiljer mellan sparade uppdrag, demonstrationer och planerad organisation', async ({page,request})=>{
 const before=await (await request.get('/api/state')).json();
 await page.goto('/');
 await page.getByRole('heading',{name:'Översikt.'}).waitFor();
 await page.getByLabel('Visa design-demo').check();
 await expect(page.getByText(/Design-demo: endast kort/)).toBeVisible();
 await page.getByRole('button',{name:'Verksamheter',exact:true}).click();
 await expect(page.getByRole('heading',{name:'SITELY',exact:true})).toBeVisible();
 await page.getByText('Utforska exempelstrukturen').first().click();
 await expect(page.getByText('Utveckla tjänsteerbjudandet')).toBeVisible();
 await page.getByLabel('Visa design-demo').uncheck();
 await expect(page.getByRole('heading',{name:'SITELY',exact:true})).not.toBeVisible();
 await page.getByRole('button',{name:'AI-ledning',exact:true}).click();
 await expect(page.getByRole('heading',{name:'OpenAI-chef',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Claude-chef',exact:true})).toBeVisible();
 await expect(page.getByText('Inte aktiverad',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'GARON – Min affärspartner',exact:true}).click();
 await page.getByRole('button',{name:/Operativa instruktioner/}).click();
 await page.getByRole('button',{name:/Förbered en plan för en ny verksamhet/}).click();
 await expect(page.getByLabel('Meddelande till GARON')).toHaveValue('Förbered en plan för en ny verksamhet');
 await expect(page.getByRole('button',{name:'Skicka meddelande'})).toBeDisabled();
 await page.getByRole('button',{name:/Visa ett märkt exempel/}).click();
 await expect(page.getByText('Demo · inte ett AI-genererat svar',{exact:true})).toBeVisible();
 const after=await (await request.get('/api/state')).json();
 for(const key of ['tasks','agents','notes','messages','activity','usage','settings'])expect(after[key]).toEqual(before[key]);
 expect(after.ai.enabled).toBe(false);
});

test('alla vyer fungerar på desktop och mobil utan JavaScript-fel eller sidöverflöde',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const routes=['overview','chat','businesses','projects','approvals','activity','leadership','agents','memory','finance','integrations','settings','tasks'];
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:1000});
  for(const route of routes){
   await page.goto(`/#${route}`);
   await page.locator('main h1').waitFor();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} at ${width}px`).toBe(true);
  }
 }
 await page.goto('/');await page.locator('main h1').waitFor();
 await page.getByRole('button',{name:'Fäll in sidopanel'}).click();
 await expect(page.getByRole('button',{name:'Öppna navigation'})).toBeVisible();
 await page.reload();await page.locator('main h1').waitFor();
 await expect(page.getByRole('button',{name:'Öppna navigation'})).toBeVisible();
 await page.getByRole('button',{name:'Öppna navigation'}).click();
 await page.screenshot({path:'/tmp/garon-phase1-desktop.png',fullPage:true});
 expect(errors).toEqual([]);
});
