import { journeySupport, milestoneStates, rulesetMetadata } from "./taxJourneyRules.mjs";

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export class TaxJourneyValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "TaxJourneyValidationError";
    this.code = code;
  }
}

export function buildFirstTaxJourney(startDate, options = {}) {
  const parsedStartDate = validateStartDate(startDate, options);
  const taxYearStartYear =
    parsedStartDate.month > 4 ||
    (parsedStartDate.month === 4 && parsedStartDate.day >= 6)
      ? parsedStartDate.year
      : parsedStartDate.year - 1;
  const taxYearEndYear = taxYearStartYear + 1;

  const taxYearStart = toIsoDate(taxYearStartYear, 4, 6);
  const taxYearEnd = toIsoDate(taxYearEndYear, 4, 5);
  const taxYearLabel = `${taxYearStartYear}/${String(taxYearEndYear).slice(2)}`;

  const milestones = [
    {
      id: "start-date",
      title: "You start",
      date: parsedStartDate.iso,
      state: milestoneStates.yourDate,
      kind: "mechanically-derived",
    },
    {
      id: "tax-year-end",
      title: "The tax year ends",
      date: taxYearEnd,
      state: milestoneStates.yourDate,
      kind: "mechanically-derived",
    },
    {
      id: "potential-notification",
      title: "Tell HMRC if you need to complete a tax return",
      date: toIsoDate(taxYearEndYear, 10, 5),
      state: milestoneStates.checkApplies,
      kind: "conditional",
    },
    {
      id: "online-return",
      title: "Online Self Assessment return deadline",
      date: toIsoDate(taxYearEndYear + 1, 1, 31),
      state: milestoneStates.checkApplies,
      kind: "conditional",
    },
    {
      id: "payment-deadline",
      title: "Self Assessment payment deadline",
      date: toIsoDate(taxYearEndYear + 1, 1, 31),
      state: milestoneStates.checkApplies,
      kind: "conditional",
    },
    {
      id: "possible-second-payment-on-account",
      title: "Possible second Payment on Account",
      date: toIsoDate(taxYearEndYear + 1, 7, 31),
      state: milestoneStates.mayApply,
      kind: "conditional",
    },
  ];

  return {
    startDate: parsedStartDate.iso,
    taxYearStart,
    taxYearEnd,
    taxYearLabel,
    potentialNotificationDate: toIsoDate(taxYearEndYear, 10, 5),
    onlineReturnDeadline: toIsoDate(taxYearEndYear + 1, 1, 31),
    paymentDeadline: toIsoDate(taxYearEndYear + 1, 1, 31),
    possibleSecondPaymentOnAccountDate: toIsoDate(taxYearEndYear + 1, 7, 31),
    daysFromStartThroughTaxYearEnd:
      daysBetweenInclusive(parsedStartDate.iso, taxYearEnd),
    milestones,
    ruleset: rulesetMetadata,
  };
}

export function validateStartDate(startDate, options = {}) {
  const parsedStartDate = parseIsoCalendarDate(startDate);
  const minimumStartDate = parseIsoCalendarDate(journeySupport.minimumStartDate);
  const today = parseIsoCalendarDate(
    options.today || getTodayIsoDateInUk(),
    "today",
  );

  if (compareCalendarDates(parsedStartDate, minimumStartDate) < 0) {
    throw new TaxJourneyValidationError(
      "outside-supported-range",
      `Start date must be on or after ${journeySupport.minimumStartDate}.`,
    );
  }

  if (compareCalendarDates(parsedStartDate, today) > 0) {
    throw new TaxJourneyValidationError(
      "future-date",
      "Start date cannot be in the future.",
    );
  }

  return parsedStartDate;
}

export function parseIsoCalendarDate(value, fieldName = "startDate") {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TaxJourneyValidationError(
      "invalid-date",
      `${fieldName} must be a non-empty YYYY-MM-DD string.`,
    );
  }

  const match = ISO_DATE_PATTERN.exec(value);

  if (!match) {
    throw new TaxJourneyValidationError(
      "invalid-date",
      `${fieldName} must use YYYY-MM-DD format.`,
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) {
    throw new TaxJourneyValidationError("invalid-date", "Month is invalid.");
  }

  const maxDay = daysInMonth(year, month);

  if (day < 1 || day > maxDay) {
    throw new TaxJourneyValidationError("invalid-date", "Day is invalid.");
  }

  return {
    iso: toIsoDate(year, month, day),
    year,
    month,
    day,
  };
}

function daysBetweenInclusive(startIsoDate, endIsoDate) {
  const start = parseIsoCalendarDate(startIsoDate);
  const end = parseIsoCalendarDate(endIsoDate);

  return (
    (Date.UTC(end.year, end.month - 1, end.day) -
      Date.UTC(start.year, start.month - 1, start.day)) /
      MS_PER_DAY +
    1
  );
}

function compareCalendarDates(a, b) {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

function getTodayIsoDateInUk() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const partValue = (type) => parts.find((part) => part.type === type).value;

  return `${partValue("year")}-${partValue("month")}-${partValue("day")}`;
}

function daysInMonth(year, month) {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function toIsoDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0",
  )}`;
}
