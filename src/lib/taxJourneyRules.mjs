export const journeySupport = {
  minimumStartDate: "2020-04-06",
  maximumStartDate: "today",
  note:
    "The minimum start date is a product support boundary for v1, not a tax-law rule.",
};

export const rulesetMetadata = {
  rulesVersion: "2026-09-03",
  lastReviewed: "2026-09-03",
  checkedAgainst: "GOV.UK/HMRC",
  status: "current",
};

export const milestoneStates = {
  yourDate: {
    id: "your-date",
    label: "YOUR DATE",
    description: "A calendar date mechanically derived from the start date.",
  },
  checkApplies: {
    id: "check-whether-this-applies",
    label: "CHECK WHETHER THIS APPLIES",
    description:
      "A conditional tax/admin point that may need checking against the user's circumstances.",
  },
  mayApply: {
    id: "may-apply",
    label: "MAY APPLY",
    description:
      "A downstream conditional event that must not be treated as confirmed from the start date alone.",
  },
};

export const officialSources = {
  selfAssessmentDeadlines: {
    authority: "HM Revenue & Customs",
    title: "Self Assessment tax returns: Deadlines",
    url: "https://www.gov.uk/self-assessment-tax-returns/deadlines",
    lastChecked: "2026-09-03",
    status: "current",
  },
  registerForSelfAssessment: {
    authority: "HM Revenue & Customs",
    title: "Register for Self Assessment",
    url: "https://www.gov.uk/register-for-self-assessment",
    lastChecked: "2026-09-03",
    status: "current",
  },
  tradingAllowance: {
    authority: "HM Revenue & Customs",
    title: "Tax-free allowances on property and trading income",
    url: "https://www.gov.uk/guidance/tax-free-allowances-on-property-and-trading-income",
    lastChecked: "2026-09-03",
    status: "current",
    metadataOnly: true,
    boundary: {
      fullRelief: "Annual gross trading income of £1,000 or less",
      tellHmrcTrigger: "Annual gross trading income of more than £1,000",
    },
    note:
      "This threshold is not used to determine obligations because v1 does not collect income.",
  },
  paymentsOnAccount: {
    authority: "HM Revenue & Customs",
    title: "Understand your Self Assessment tax bill: Payments on account",
    url: "https://www.gov.uk/understand-self-assessment-bill/payments-on-account",
    lastChecked: "2026-09-03",
    status: "current",
    metadataOnly: true,
    conditionsToCheck: [
      "No payments on account are required if the relevant amount is below £1,000.",
      "No payments on account are required if more than 80% of the assessed tax is collected outside Self Assessment.",
    ],
    note:
      "The journey can show a possible second payment date, but it must not calculate Payments on Account eligibility.",
  },
  selfEmployedRecords: {
    authority: "HM Revenue & Customs",
    title: "Business records if you're self-employed",
    url: "https://www.gov.uk/self-employed-records",
    lastChecked: "2026-09-03",
    status: "current",
  },
  selfEmployedRecordRetention: {
    authority: "HM Revenue & Customs",
    title: "Business records if you're self-employed: How long to keep your records",
    url: "https://www.gov.uk/self-employed-records/how-long-to-keep-your-records",
    lastChecked: "2026-09-03",
    status: "current",
  },
  mtdEligibility: {
    authority: "HM Revenue & Customs",
    title: "Find out if and when you need to use Making Tax Digital for Income Tax",
    url: "https://www.gov.uk/guidance/find-out-if-and-when-you-need-to-use-making-tax-digital-for-income-tax",
    lastChecked: "2026-09-03",
    status: "current",
    metadataOnly: true,
    thresholdTimetable: [
      {
        taxYearChecked: "2024/25",
        qualifyingIncomeThreshold: "more than £50,000",
        mtdStartDate: "2026-04-06",
      },
      {
        taxYearChecked: "2025/26",
        qualifyingIncomeThreshold: "more than £30,000",
        mtdStartDate: "2027-04-06",
      },
      {
        taxYearChecked: "2026/27",
        qualifyingIncomeThreshold: "more than £20,000",
        mtdStartDate: "2028-04-06",
      },
    ],
    note:
      "MTD metadata is explanatory only and does not alter basic Self Assessment filing or payment dates.",
  },
  visaWorkConditions: {
    authority: "UK Visas and Immigration",
    title: "Check if you need a UK visa",
    url: "https://www.gov.uk/check-uk-visa",
    lastChecked: "2026-09-03",
    status: "current",
    metadataOnly: true,
  },
};
