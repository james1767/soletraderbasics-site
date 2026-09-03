export const bankingSetupMetadata = {
  lastReviewed: "2026-09-03",
  checkedAgainst: "GOV.UK / HMRC / Business.gov.uk",
  status: "current",
};

export const officialBankingSources = {
  selfEmployedRecords: {
    title: "Business records if you're self-employed: What records to keep",
    url: "https://www.gov.uk/self-employed-records/what-records-to-keep",
  },
  businessBankAccount: {
    title: "Getting a business bank account",
    url: "https://www.business.gov.uk/support/accounting-tax-cashflow/getting-a-business-bank-account/",
  },
  companyRecords: {
    title: "Company and accounting records",
    url: "https://www.gov.uk/running-a-limited-company/company-and-accounting-records",
  },
  businessStructure: {
    title: "Set up a business",
    url: "https://www.gov.uk/set-up-business",
  },
};

export const priorityCopy = {
  transactionOrganisation: {
    title: "Transaction organisation",
    text: "You expect regular business income or spending. Keeping that activity easy to identify may make your records simpler to manage.",
  },
  cashHandling: {
    title: "Cash & cheque access",
    text: "Check how deposits can be made and whether limits, locations or charges matter for the way you trade.",
  },
  customerPayments: {
    title: "Customer payments",
    text: "Customers will regularly pay this account. Check that the payment arrangements suit the way you invoice and receive money.",
  },
  tradingNameCheck: {
    title: "Trading name",
    text: "Check with the provider what account name customers should use when paying you and how payments to your trading name are handled.",
  },
  transactionSeparation: {
    title: "Transaction separation",
    text: "You expect to separate business activity from personal spending. A dedicated banking arrangement may make this easier.",
  },
  recordKeepingSetup: {
    title: "Record-keeping setup",
    text: "Decide how you will reliably identify business income and expenses before transactions start accumulating.",
  },
  softwareIntegration: {
    title: "Software integration",
    text: "Check that prospective accounts work with the bookkeeping or accounting software you intend to use.",
  },
  futureFacilities: {
    title: "Future facilities",
    text: "You may want to check whether facilities you could need later are available, eligible for your business and priced appropriately.",
  },
  businessFacilities: {
    title: "Business facilities",
    text: "Compare the particular facilities you need, such as borrowing, overdrafts, additional cards or payment services, together with eligibility and charges.",
  },
};

export const providerQuestionCopy = {
  permissionStatus: "Does the provider permit the business use I intend?",
  transactionOrganisation: "How will this account help me keep business income and spending easy to identify?",
  cashHandling: "How can I deposit cash and what limits or charges apply?",
  customerPayments: "What payment facilities apply when customers pay this account?",
  tradingNameCheck: "What account name should customers use when paying me?",
  transactionSeparation: "Will this arrangement make business transactions easier to distinguish from personal spending?",
  recordKeepingSetup: "What record-keeping process will I use before transactions start accumulating?",
  softwareIntegration: "Does this account connect to my bookkeeping/accounting software?",
  futureFacilities: "Which facilities might I need later, and what eligibility or charges would apply?",
  businessFacilities: "Are the specific borrowing, card, overdraft or payment facilities I need available and am I eligible?",
};

export function getScopeResult(scope) {
  if (scope === "sole-trader") {
    return { canContinue: true, message: "This tool is designed for sole traders." };
  }

  if (scope === "limited-company") {
    return {
      canContinue: false,
      title: "This tool is designed for sole traders.",
      message:
        "A limited company is a separate legal entity and its finances must be clearly separated from those of its owners and directors. Use the GOV.UK company guidance instead.",
      link: officialBankingSources.companyRecords,
    };
  }

  return {
    canContinue: false,
    title: "Check your business structure first.",
    message:
      "Choose your business structure before using this sole-trader banking setup tool.",
    link: officialBankingSources.businessStructure,
  };
}

export function getPermissionState(permission) {
  if (permission === "yes") {
    return {
      status: "confirmed",
      title: "Account terms checked.",
      text: "The account-permission check is marked as confirmed.",
    };
  }

  if (permission === "no") {
    return {
      status: "attention",
      title: "This account isn't suitable for that use",
      text: "Being a sole trader doesn't automatically mean every personal account can be used for business. If the provider doesn't permit your intended business activity, choose an arrangement that does.",
    };
  }

  return {
    status: "attention",
    title: "Check the account terms",
    text: "Before using the account for business transactions, check the provider's current terms or ask the provider whether your intended use is permitted.",
  };
}

const strengthOrder = { lower: 1, normal: 2, strong: 3 };

function upsertRequirement(requirements, key, strength = "normal") {
  if (!priorityCopy[key]) return;
  const existing = requirements.get(key);
  if (!existing || strengthOrder[strength] > strengthOrder[existing.strength]) {
    requirements.set(key, { key, strength, ...priorityCopy[key] });
  }
}

export function buildBankingRequirements(answers = {}) {
  const requirements = new Map();

  if (answers.activity === "regular") {
    upsertRequirement(requirements, "transactionOrganisation");
  }
  if (answers.activity === "high") {
    upsertRequirement(requirements, "transactionOrganisation", "strong");
  }

  if (answers.cashCheques === "occasionally") {
    upsertRequirement(requirements, "cashHandling");
  }
  if (answers.cashCheques === "regularly") {
    upsertRequirement(requirements, "cashHandling", "strong");
  }

  if (answers.customerPayments === "regularly") {
    upsertRequirement(requirements, "customerPayments");
  }
  if (
    answers.customerPayments === "regularly" &&
    answers.tradingName === "yes"
  ) {
    upsertRequirement(requirements, "tradingNameCheck");
  }

  if (answers.recordOrganisation === "need-separation") {
    upsertRequirement(requirements, "transactionSeparation");
  }
  if (answers.recordOrganisation === "not-decided") {
    upsertRequirement(requirements, "recordKeepingSetup");
  }

  if (answers.software === "yes") {
    upsertRequirement(requirements, "softwareIntegration");
  }

  if (answers.facilities === "possibly") {
    upsertRequirement(requirements, "futureFacilities", "lower");
  }
  if (answers.facilities === "yes") {
    upsertRequirement(requirements, "businessFacilities", "strong");
  }

  return [...requirements.values()];
}

export function classifyBankingRequirements(requirements = []) {
  const strengthTotal = requirements.reduce(
    (total, item) => total + (strengthOrder[item.strength] || 2),
    0,
  );

  if (requirements.length <= 1 && strengthTotal <= 2) {
    return {
      level: "simple",
      heading: "Your banking needs currently look fairly simple.",
      text: "That does not determine which type of account you should use. Make sure your chosen account permits the business activity you intend and that your record-keeping setup lets you identify business transactions.",
    };
  }

  if (requirements.length >= 5 || strengthTotal >= 9) {
    return {
      level: "specialised",
      heading: "Your business has more specialised banking requirements.",
      text: "Look for an arrangement that handles the requirements you've identified rather than choosing an account on headline price alone.",
    };
  }

  return {
    level: "several",
    heading: "You have several banking needs worth checking.",
    text: "Use the priorities below when deciding whether your current arrangement remains practical and when comparing alternatives.",
  };
}

export function buildArrangementComparison(requirements = [], permission) {
  const keys = new Set(requirements.map((item) => item.key));
  const permissionNeedsAttention = permission !== "yes";

  const existingPersonal = ["Provider permission"];
  if (permissionNeedsAttention) {
    existingPersonal.push("Current account terms need checking");
  }
  if (
    keys.has("transactionOrganisation") ||
    keys.has("transactionSeparation") ||
    keys.has("recordKeepingSetup")
  ) {
    existingPersonal.push("Transaction identification and separation");
  }
  if (keys.has("cashHandling")) existingPersonal.push("Cash facilities");
  if (keys.has("softwareIntegration")) {
    existingPersonal.push("Software compatibility");
  }
  if (keys.has("tradingNameCheck")) {
    existingPersonal.push("Payment-name arrangements");
  }

  const separate = [
    "Keeps business activity operationally separate",
    "May simplify identification of transactions",
    "If a personal product, business-use terms still need checking",
  ];
  if (keys.has("softwareIntegration") || keys.has("businessFacilities")) {
    separate.push("Facilities and integrations vary");
  }

  const business = ["Intended for business banking"];
  if (keys.has("cashHandling")) business.push("Cash handling where relevant");
  if (keys.has("softwareIntegration")) business.push("Integrations where relevant");
  if (keys.has("customerPayments") || keys.has("tradingNameCheck")) {
    business.push("Payment arrangements");
  }
  if (keys.has("businessFacilities") || keys.has("futureFacilities")) {
    business.push("Business facilities");
  }
  business.push("Fees, features and eligibility vary");

  return [
    {
      title: "Existing personal account",
      heading: "Things you'd need to check",
      items: existingPersonal,
    },
    {
      title: "Separate account",
      heading: "What separation could help with",
      items: separate,
    },
    {
      title: "Business account",
      heading: "Features worth comparing",
      items: business,
    },
  ];
}

export function buildProviderQuestions(requirements = [], permission) {
  const keys = new Set(requirements.map((item) => item.key));
  if (permission !== "yes") keys.add("permissionStatus");

  return [...keys]
    .map((key) => providerQuestionCopy[key])
    .filter(Boolean);
}

export function buildBankingSetupResult(answers = {}) {
  const requirements = buildBankingRequirements(answers);

  return {
    scope: getScopeResult(answers.scope),
    permission: getPermissionState(answers.permission),
    requirements,
    summary: classifyBankingRequirements(requirements),
    arrangements: buildArrangementComparison(requirements, answers.permission),
    providerQuestions: buildProviderQuestions(requirements, answers.permission),
  };
}

export function resultContainsAccountRecommendation(result) {
  const text = JSON.stringify(result).toLowerCase();
  return [
    "we recommend a business account",
    "a personal account is right for you",
    "you need a business account",
    "recommended account",
    "best account type",
    "winner",
    "percentage match",
  ].some((phrase) => text.includes(phrase));
}
