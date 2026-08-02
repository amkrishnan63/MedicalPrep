import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const drugs = [
  { drugKey: "warfarin", displayName: "Coumadin", genericName: "warfarin", rxnorm: "11289", drugClass: "anticoagulant", isOtc: false, ntiFlag: true },
  { drugKey: "ibuprofen", displayName: "Advil", genericName: "ibuprofen", rxnorm: "5640", drugClass: "nsaid", isOtc: true, ntiFlag: false },
  { drugKey: "aspirin", displayName: "Bayer Aspirin", genericName: "aspirin", rxnorm: "1191", drugClass: "nsaid", isOtc: true, ntiFlag: false },
  { drugKey: "metformin", displayName: "Glucophage", genericName: "metformin", rxnorm: "6809", drugClass: "antidiabetic", isOtc: false, ntiFlag: false },
  { drugKey: "lisinopril", displayName: "Zestril", genericName: "lisinopril", rxnorm: "29046", drugClass: "ace_inhibitor", isOtc: false, ntiFlag: false },
  { drugKey: "atorvastatin", displayName: "Lipitor", genericName: "atorvastatin", rxnorm: "83367", drugClass: "statin", isOtc: false, ntiFlag: false },
  { drugKey: "omeprazole", displayName: "Prilosec", genericName: "omeprazole", rxnorm: "7646", drugClass: "ppi", isOtc: true, ntiFlag: false },
  { drugKey: "metoprolol", displayName: "Lopressor", genericName: "metoprolol", rxnorm: "6918", drugClass: "beta_blocker", isOtc: false, ntiFlag: false },
  { drugKey: "amoxicillin", displayName: "Amoxil", genericName: "amoxicillin", rxnorm: "723", drugClass: "penicillin", isOtc: false, ntiFlag: false },
  { drugKey: "diphenhydramine", displayName: "Benadryl", genericName: "diphenhydramine", rxnorm: "3498", drugClass: "anticholinergic", isOtc: true, ntiFlag: false },
  { drugKey: "oxybutynin", displayName: "Ditropan", genericName: "oxybutynin", rxnorm: "3264", drugClass: "anticholinergic", isOtc: false, ntiFlag: false },
  { drugKey: "st_johns_wort", displayName: "St. John's Wort", genericName: "hypericum perforatum", rxnorm: null, drugClass: "herbal", isOtc: true, ntiFlag: false },
  { drugKey: "sertraline", displayName: "Zoloft", genericName: "sertraline", rxnorm: "36437", drugClass: "ssri", isOtc: false, ntiFlag: false },
  { drugKey: "digoxin", displayName: "Lanoxin", genericName: "digoxin", rxnorm: "3407", drugClass: "cardiac_glycoside", isOtc: false, ntiFlag: true },
  { drugKey: "lithium", displayName: "Lithobid", genericName: "lithium", rxnorm: "6448", drugClass: "mood_stabilizer", isOtc: false, ntiFlag: true },
  { drugKey: "melatonin", displayName: "Melatonin", genericName: "melatonin", rxnorm: "6718", drugClass: "supplement", isOtc: true, ntiFlag: false },
  { drugKey: "acetaminophen", displayName: "Tylenol", genericName: "acetaminophen", rxnorm: "161", drugClass: "analgesic", isOtc: true, ntiFlag: false },
  { drugKey: "furosemide", displayName: "Lasix", genericName: "furosemide", rxnorm: "4603", drugClass: "loop_diuretic", isOtc: false, ntiFlag: false },
  { drugKey: "potassium", displayName: "K-Dur", genericName: "potassium chloride", rxnorm: "8591", drugClass: "electrolyte", isOtc: false, ntiFlag: false },
  { drugKey: "gabapentin", displayName: "Neurontin", genericName: "gabapentin", rxnorm: "25480", drugClass: "anticonvulsant", isOtc: false, ntiFlag: false },
];

const rules = [
  {
    leftKey: "warfarin",
    rightKey: "ibuprofen",
    severity: "Serious",
    title: "Warfarin + NSAID bleeding risk",
    whatText: "Warfarin (blood thinner) and ibuprofen (NSAID pain reliever)",
    soWhatText: "Using them together can substantially increase bleeding risk.",
    nowWhatText: "Do not stop warfarin on your own. Contact your pharmacist or clinician promptly and ask whether ibuprofen is appropriate. Ask about safer pain options such as acetaminophen if suitable.",
    vendorCode: "DDI-WAR-IBU-01",
  },
  {
    leftKey: "warfarin",
    rightKey: "aspirin",
    severity: "Serious",
    title: "Warfarin + aspirin bleeding risk",
    whatText: "Warfarin and aspirin",
    soWhatText: "Combined use can increase bleeding risk, including serious bleeds.",
    nowWhatText: "Do not change these medicines yourself. Call your pharmacist or clinician before combining them.",
    vendorCode: "DDI-WAR-ASA-01",
  },
  {
    leftKey: "diphenhydramine",
    rightKey: "oxybutynin",
    severity: "Caution",
    title: "Duplicate anticholinergic effects",
    whatText: "Diphenhydramine and oxybutynin (both anticholinergic)",
    soWhatText: "Together they can increase sedation, confusion, dry mouth, and fall risk—especially in older adults.",
    nowWhatText: "Ask your pharmacist or clinician whether both are still needed and if safer alternatives exist. Do not stop prescription medicines on your own.",
    vendorCode: "DUP-ACH-01",
  },
  {
    leftKey: "st_johns_wort",
    rightKey: "sertraline",
    severity: "Serious",
    title: "St. John's wort + SSRI interaction",
    whatText: "St. John's wort (supplement) and sertraline (SSRI)",
    soWhatText: "This combination may raise the risk of serotonin-related side effects.",
    nowWhatText: "Do not start or stop either on your own. Contact your pharmacist or clinician before using St. John's wort with antidepressants.",
    vendorCode: "DDI-SJW-SSRI-01",
  },
  {
    leftKey: "warfarin",
    rightKey: "omeprazole",
    severity: "Caution",
    title: "Warfarin + omeprazole monitoring",
    whatText: "Warfarin and omeprazole",
    soWhatText: "Omeprazole may affect how warfarin works; bleeding risk may change and monitoring may be needed.",
    nowWhatText: "Tell your clinician or pharmacist about this combination. Do not adjust warfarin dosing yourself.",
    vendorCode: "DDI-WAR-OME-01",
  },
  {
    leftKey: "lisinopril",
    rightKey: "ibuprofen",
    severity: "Caution",
    title: "ACE inhibitor + NSAID kidney caution",
    whatText: "Lisinopril (ACE inhibitor) and ibuprofen (NSAID)",
    soWhatText: "Together they may reduce kidney function or blood pressure control, especially in older adults or dehydration.",
    nowWhatText: "Ask a pharmacist or clinician before regular NSAID use. Do not change blood pressure medicines yourself.",
    vendorCode: "DDI-ACE-NSAID-01",
  },
  {
    leftKey: "metoprolol",
    rightKey: "digoxin",
    severity: "Caution",
    title: "Beta blocker + digoxin heart rate",
    whatText: "Metoprolol and digoxin",
    soWhatText: "Combined use can slow heart rate more than either alone; clinicians often monitor closely.",
    nowWhatText: "This may be intentional—confirm with the care team. Do not change doses yourself. Digoxin is a narrow-therapeutic-index medicine monitored by clinicians/labs.",
    vendorCode: "DDI-BB-DIG-01",
  },
];

async function main() {
  await prisma.interactionRule.deleteMany();
  await prisma.drugCatalog.deleteMany();

  for (const d of drugs) {
    await prisma.drugCatalog.create({ data: d });
  }
  for (const r of rules) {
    await prisma.interactionRule.create({ data: r });
  }

  const email = "ajay@medicalprep.demo";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash("demo1234", 10);
    const user = await prisma.user.create({
      data: {
        email,
        name: "Ajay Krishnan",
        passwordHash,
      },
    });

    const profile = await prisma.profile.create({
      data: {
        displayName: "Grandma Eleanor",
        birthYear: 1948,
        ownerId: user.id,
        otcPromptCompleted: true,
        memberships: {
          create: { userId: user.id, role: "OWNER" },
        },
        allergies: {
          create: {
            substance: "penicillin",
            reaction: "rash",
            severity: "severe",
          },
        },
        medications: {
          create: [
            {
              displayName: "Coumadin",
              genericName: "warfarin",
              drugKey: "warfarin",
              rxnorm: "11289",
              strength: "5 mg",
              dose: "5 mg",
              frequency: "daily",
              scheduleTimes: JSON.stringify(["18:00"]),
              indication: "Atrial fibrillation",
              source: "manual",
            },
            {
              displayName: "Glucophage",
              genericName: "metformin",
              drugKey: "metformin",
              rxnorm: "6809",
              strength: "500 mg",
              dose: "500 mg",
              frequency: "twice daily",
              scheduleTimes: JSON.stringify(["08:00", "20:00"]),
              indication: "Type 2 diabetes",
              source: "manual",
            },
            {
              displayName: "Zestril",
              genericName: "lisinopril",
              drugKey: "lisinopril",
              rxnorm: "29046",
              strength: "10 mg",
              dose: "10 mg",
              frequency: "daily",
              scheduleTimes: JSON.stringify(["08:00"]),
              indication: "Hypertension",
              source: "manual",
            },
            {
              displayName: "Lipitor",
              genericName: "atorvastatin",
              drugKey: "atorvastatin",
              rxnorm: "83367",
              strength: "20 mg",
              dose: "20 mg",
              frequency: "daily at bedtime",
              scheduleTimes: JSON.stringify(["21:00"]),
              indication: "Cholesterol",
              source: "manual",
            },
          ],
        },
      },
    });

    console.log("Seeded demo user ajay@medicalprep.demo / demo1234");
    console.log("Seeded profile", profile.displayName);
  } else {
    console.log("Demo user already exists");
  }

  console.log(`Seeded ${drugs.length} drugs and ${rules.length} interaction rules`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
