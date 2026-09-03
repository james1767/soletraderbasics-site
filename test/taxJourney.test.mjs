import assert from "node:assert/strict";
import test from "node:test";

import {
  TaxJourneyValidationError,
  buildFirstTaxJourney,
  parseIsoCalendarDate,
} from "../src/lib/taxJourney.mjs";
import {
  journeySupport,
  officialSources,
  rulesetMetadata,
} from "../src/lib/taxJourneyRules.mjs";

const TODAY = "2029-12-31";

test("normal case 1 derives the full first journey for 2026-04-06", () => {
  const journey = buildFirstTaxJourney("2026-04-06", { today: TODAY });

  assert.equal(journey.taxYearStart, "2026-04-06");
  assert.equal(journey.taxYearEnd, "2027-04-05");
  assert.equal(journey.taxYearLabel, "2026/27");
  assert.equal(journey.potentialNotificationDate, "2027-10-05");
  assert.equal(journey.onlineReturnDeadline, "2028-01-31");
  assert.equal(journey.paymentDeadline, "2028-01-31");
  assert.equal(journey.possibleSecondPaymentOnAccountDate, "2028-07-31");
});

test("normal in-year starts end on 2027-04-05", () => {
  for (const startDate of ["2026-09-01", "2027-01-01", "2027-03-01"]) {
    assert.equal(
      buildFirstTaxJourney(startDate, { today: TODAY }).taxYearEnd,
      "2027-04-05",
    );
  }
});

test("critical 5 April boundary stays in the ending tax year", () => {
  const journey = buildFirstTaxJourney("2027-04-05", { today: TODAY });

  assert.equal(journey.taxYearStart, "2026-04-06");
  assert.equal(journey.taxYearEnd, "2027-04-05");
  assert.equal(journey.taxYearLabel, "2026/27");
});

test("critical 6 April boundary starts the next tax year", () => {
  const journey = buildFirstTaxJourney("2027-04-06", { today: TODAY });

  assert.equal(journey.taxYearStart, "2027-04-06");
  assert.equal(journey.taxYearEnd, "2028-04-05");
  assert.equal(journey.taxYearLabel, "2027/28");
  assert.equal(journey.potentialNotificationDate, "2028-10-05");
  assert.equal(journey.onlineReturnDeadline, "2029-01-31");
  assert.equal(journey.paymentDeadline, "2029-01-31");
  assert.equal(journey.possibleSecondPaymentOnAccountDate, "2029-07-31");
});

test("valid leap dates are accepted", () => {
  assert.equal(
    buildFirstTaxJourney("2028-02-29", { today: TODAY }).taxYearEnd,
    "2028-04-05",
  );
});

test("impossible dates and malformed input are rejected", () => {
  for (const value of ["2027-02-29", "2027-04-31", "not-a-date", ""]) {
    assert.throws(
      () => buildFirstTaxJourney(value, { today: TODAY }),
      TaxJourneyValidationError,
    );
  }
});

test("lower supported boundary is accepted", () => {
  assert.equal(
    buildFirstTaxJourney("2020-04-06", { today: TODAY }).taxYearStart,
    "2020-04-06",
  );
});

test("dates before the lower supported boundary are rejected", () => {
  assert.throws(
    () => buildFirstTaxJourney("2020-04-05", { today: TODAY }),
    /on or after 2020-04-06/,
  );
});

test("future dates are rejected deterministically", () => {
  assert.throws(
    () => buildFirstTaxJourney("2026-09-04", { today: "2026-09-03" }),
    /future/,
  );
});

test("parsing does not rely on timezone-sensitive Date string rollover", () => {
  assert.deepEqual(parseIsoCalendarDate("2028-02-29"), {
    iso: "2028-02-29",
    year: 2028,
    month: 2,
    day: 29,
  });
  assert.throws(() => parseIsoCalendarDate("2027-02-29"), /invalid/);
});

test("return model preserves date states instead of confirmed obligations", () => {
  const journey = buildFirstTaxJourney("2026-09-01", { today: TODAY });

  assert.equal(journey.milestones[1].state.label, "YOUR DATE");
  assert.equal(journey.milestones[2].state.label, "CHECK WHETHER THIS APPLIES");
  assert.equal(journey.milestones[5].state.label, "MAY APPLY");
});

test("rule and source metadata is separate from calculation code", () => {
  assert.equal(journeySupport.minimumStartDate, "2020-04-06");
  assert.equal(rulesetMetadata.lastReviewed, "2026-09-03");
  assert.equal(rulesetMetadata.status, "current");
  assert.equal(
    officialSources.tradingAllowance.boundary.tellHmrcTrigger,
    "Annual gross trading income of more than £1,000",
  );
  assert.match(officialSources.mtdEligibility.url, /^https:\/\/www\.gov\.uk\//);
});
