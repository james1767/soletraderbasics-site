import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  bankingSetupMetadata,
  buildBankingSetupResult,
  buildProviderQuestions,
  getPermissionState,
  getScopeResult,
  resultContainsAccountRecommendation,
} from "../src/lib/bankingSetup.mjs";

const baseAnswers = {
  scope: "sole-trader",
  permission: "yes",
  activity: "occasional",
  cashCheques: "no",
  customerPayments: "rarely",
  recordOrganisation: "easy",
  software: "no",
  facilities: "no",
};

test("scope gate lets sole traders continue", () => {
  assert.equal(getScopeResult("sole-trader").canContinue, true);
});

test("scope gate exits limited companies to official company guidance", () => {
  const result = getScopeResult("limited-company");

  assert.equal(result.canContinue, false);
  assert.match(result.message, /limited company is a separate legal entity/i);
  assert.match(result.link.url, /^https:\/\/www\.gov\.uk\/running-a-limited-company/);
});

test("scope gate exits unsure users to business structure guidance", () => {
  const result = getScopeResult("not-sure");

  assert.equal(result.canContinue, false);
  assert.match(result.title, /business structure/i);
  assert.match(result.link.url, /^https:\/\/www\.gov\.uk\/set-up-business/);
});

test("permission yes creates confirmed state", () => {
  const result = getPermissionState("yes");

  assert.equal(result.status, "confirmed");
  assert.match(result.title, /checked/i);
});

test("permission no creates persistent warning", () => {
  const result = getPermissionState("no");

  assert.equal(result.status, "attention");
  assert.match(result.title, /isn't suitable/i);
});

test("permission unknown creates persistent warning", () => {
  const result = getPermissionState("unknown");

  assert.equal(result.status, "attention");
  assert.match(result.title, /check the account terms/i);
});

test("regular and high activity generate transaction organisation", () => {
  assert.equal(
    buildBankingSetupResult({ ...baseAnswers, activity: "regular" })
      .requirements[0].key,
    "transactionOrganisation",
  );
  assert.equal(
    buildBankingSetupResult({ ...baseAnswers, activity: "high" })
      .requirements[0].strength,
    "strong",
  );
});

test("cash occasional and regular generate cash handling with stronger regular priority", () => {
  assert.equal(
    buildBankingSetupResult({ ...baseAnswers, cashCheques: "occasionally" })
      .requirements[0].key,
    "cashHandling",
  );
  assert.equal(
    buildBankingSetupResult({ ...baseAnswers, cashCheques: "regularly" })
      .requirements[0].strength,
    "strong",
  );
});

test("regular customer payments and trading name generate their priorities", () => {
  const result = buildBankingSetupResult({
    ...baseAnswers,
    customerPayments: "regularly",
    tradingName: "yes",
  });

  assert.deepEqual(
    result.requirements.map((item) => item.key),
    ["customerPayments", "tradingNameCheck"],
  );
});

test("trading name does not apply when direct customer payments are rare", () => {
  const result = buildBankingSetupResult({
    ...baseAnswers,
    customerPayments: "rarely",
    tradingName: "yes",
  });

  assert.equal(result.requirements.some((item) => item.key === "tradingNameCheck"), false);
});

test("record organisation answers generate separation and setup priorities", () => {
  assert.equal(
    buildBankingSetupResult({
      ...baseAnswers,
      recordOrganisation: "need-separation",
    }).requirements[0].key,
    "transactionSeparation",
  );
  assert.equal(
    buildBankingSetupResult({
      ...baseAnswers,
      recordOrganisation: "not-decided",
    }).requirements[0].key,
    "recordKeepingSetup",
  );
});

test("software and facilities generate their priorities", () => {
  const result = buildBankingSetupResult({
    ...baseAnswers,
    software: "yes",
    facilities: "yes",
  });

  assert.deepEqual(
    result.requirements.map((item) => item.key),
    ["softwareIntegration", "businessFacilities"],
  );
});

test("possible future facilities generate a lower-priority note", () => {
  const result = buildBankingSetupResult({
    ...baseAnswers,
    facilities: "possibly",
  });

  assert.equal(result.requirements[0].key, "futureFacilities");
  assert.equal(result.requirements[0].strength, "lower");
});

test("result summaries classify simple, several and specialised requirements", () => {
  assert.equal(buildBankingSetupResult(baseAnswers).summary.level, "simple");
  assert.equal(
    buildBankingSetupResult({
      ...baseAnswers,
      activity: "regular",
      software: "yes",
    }).summary.level,
    "several",
  );
  assert.equal(
    buildBankingSetupResult({
      ...baseAnswers,
      activity: "high",
      cashCheques: "regularly",
      customerPayments: "regularly",
      tradingName: "yes",
      software: "yes",
      facilities: "yes",
    }).summary.level,
    "specialised",
  );
});

test("results never recommend an account type", () => {
  const result = buildBankingSetupResult({
    ...baseAnswers,
    activity: "high",
    cashCheques: "regularly",
    customerPayments: "regularly",
    tradingName: "yes",
    recordOrganisation: "need-separation",
    software: "yes",
    facilities: "yes",
  });

  assert.equal(resultContainsAccountRecommendation(result), false);
});

test("account permission warning survives into results and provider questions", () => {
  const result = buildBankingSetupResult({ ...baseAnswers, permission: "unknown" });

  assert.equal(result.permission.status, "attention");
  assert.match(result.providerQuestions.join(" "), /provider permit/i);
});

test("change answers can retain state while reset can clear state in the page script", async () => {
  const page = await readFile(
    new URL("../src/pages/guides/banking/sole-trader-banking-setup/index.astro", import.meta.url),
    "utf8",
  );

  assert.match(page, /function changeAnswers\(\)/);
  assert.match(page, /function resetForm\(\)/);
  assert.match(page, /form\.reset\(\)/);
});

test("provider questions are generated from selected requirements without URL state", () => {
  const questions = buildProviderQuestions(
    [{ key: "cashHandling" }, { key: "softwareIntegration" }, { key: "tradingNameCheck" }],
    "yes",
  );

  assert.deepEqual(questions, [
    "How can I deposit cash and what limits or charges apply?",
    "Does this account connect to my bookkeeping/accounting software?",
    "What account name should customers use when paying me?",
  ]);
});

test("primary route has correct canonical and print route has noindex/follow canonical", async () => {
  const primary = await readFile(
    new URL("../src/pages/guides/banking/sole-trader-banking-setup/index.astro", import.meta.url),
    "utf8",
  );
  const print = await readFile(
    new URL("../src/pages/resources/sole-trader-banking-setup-print.astro", import.meta.url),
    "utf8",
  );

  assert.match(
    primary,
    /https:\/\/soletraderbasics\.com\/guides\/banking\/sole-trader-banking-setup\//,
  );
  assert.match(print, /<meta name="robots" content="noindex, follow" \/>/);
  assert.match(
    print,
    /<link rel="canonical" href=\{interactiveCanonicalUrl\} \/>/,
  );
});

test("interactive route uses semantic controls and accessible dynamic announcement", async () => {
  const page = await readFile(
    new URL("../src/pages/guides/banking/sole-trader-banking-setup/index.astro", import.meta.url),
    "utf8",
  );

  assert.match(page, /<fieldset class="tool-question"/);
  assert.match(page, /<legend>Are you operating as a sole trader\?<\/legend>/);
  assert.match(page, /type="radio"/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /:focus-visible/);
});

test("evidence metadata is current and separate from UI", () => {
  assert.equal(bankingSetupMetadata.lastReviewed, "2026-09-03");
  assert.equal(bankingSetupMetadata.checkedAgainst, "GOV.UK / HMRC / Business.gov.uk");
  assert.equal(bankingSetupMetadata.status, "current");
});
