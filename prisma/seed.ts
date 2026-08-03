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
  { drugKey: "amlodipine", displayName: "Norvasc", genericName: "amlodipine", rxnorm: "17767", drugClass: "ccb", isOtc: false, ntiFlag: false },
  { drugKey: "losartan", displayName: "Cozaar", genericName: "losartan", rxnorm: "52175", drugClass: "arb", isOtc: false, ntiFlag: false },
  { drugKey: "hydrochlorothiazide", displayName: "Microzide", genericName: "hydrochlorothiazide", rxnorm: "5487", drugClass: "thiazide", isOtc: false, ntiFlag: false },
  { drugKey: "carvedilol", displayName: "Coreg", genericName: "carvedilol", rxnorm: "20352", drugClass: "beta_blocker", isOtc: false, ntiFlag: false },
  { drugKey: "clopidogrel", displayName: "Plavix", genericName: "clopidogrel", rxnorm: "32968", drugClass: "antiplatelet", isOtc: false, ntiFlag: false },
  { drugKey: "apixaban", displayName: "Eliquis", genericName: "apixaban", rxnorm: "1364430", drugClass: "doac", isOtc: false, ntiFlag: false },
  { drugKey: "rivaroxaban", displayName: "Xarelto", genericName: "rivaroxaban", rxnorm: "1114195", drugClass: "doac", isOtc: false, ntiFlag: false },
  { drugKey: "simvastatin", displayName: "Zocor", genericName: "simvastatin", rxnorm: "36567", drugClass: "statin", isOtc: false, ntiFlag: false },
  { drugKey: "rosuvastatin", displayName: "Crestor", genericName: "rosuvastatin", rxnorm: "301542", drugClass: "statin", isOtc: false, ntiFlag: false },
  { drugKey: "pravastatin", displayName: "Pravachol", genericName: "pravastatin", rxnorm: "42463", drugClass: "statin", isOtc: false, ntiFlag: false },
  { drugKey: "pantoprazole", displayName: "Protonix", genericName: "pantoprazole", rxnorm: "40790", drugClass: "ppi", isOtc: false, ntiFlag: false },
  { drugKey: "esomeprazole", displayName: "Nexium", genericName: "esomeprazole", rxnorm: "283742", drugClass: "ppi", isOtc: true, ntiFlag: false },
  { drugKey: "famotidine", displayName: "Pepcid", genericName: "famotidine", rxnorm: "4278", drugClass: "h2_blocker", isOtc: true, ntiFlag: false },
  { drugKey: "levothyroxine", displayName: "Synthroid", genericName: "levothyroxine", rxnorm: "10582", drugClass: "thyroid", isOtc: false, ntiFlag: true },
  { drugKey: "insulin_glargine", displayName: "Lantus", genericName: "insulin glargine", rxnorm: "274783", drugClass: "insulin", isOtc: false, ntiFlag: false },
  { drugKey: "glipizide", displayName: "Glucotrol", genericName: "glipizide", rxnorm: "4821", drugClass: "sulfonylurea", isOtc: false, ntiFlag: false },
  { drugKey: "sitagliptin", displayName: "Januvia", genericName: "sitagliptin", rxnorm: "593411", drugClass: "dpp4", isOtc: false, ntiFlag: false },
  { drugKey: "empagliflozin", displayName: "Jardiance", genericName: "empagliflozin", rxnorm: "1545653", drugClass: "sglt2", isOtc: false, ntiFlag: false },
  { drugKey: "albuterol", displayName: "ProAir", genericName: "albuterol", rxnorm: "435", drugClass: "beta_agonist", isOtc: false, ntiFlag: false },
  { drugKey: "fluticasone", displayName: "Flonase", genericName: "fluticasone", rxnorm: "41126", drugClass: "corticosteroid", isOtc: true, ntiFlag: false },
  { drugKey: "montelukast", displayName: "Singulair", genericName: "montelukast", rxnorm: "88249", drugClass: "leukotriene", isOtc: false, ntiFlag: false },
  { drugKey: "prednisone", displayName: "Deltasone", genericName: "prednisone", rxnorm: "8640", drugClass: "corticosteroid", isOtc: false, ntiFlag: false },
  { drugKey: "azithromycin", displayName: "Zithromax", genericName: "azithromycin", rxnorm: "18631", drugClass: "macrolide", isOtc: false, ntiFlag: false },
  { drugKey: "ciprofloxacin", displayName: "Cipro", genericName: "ciprofloxacin", rxnorm: "2551", drugClass: "fluoroquinolone", isOtc: false, ntiFlag: false },
  { drugKey: "doxycycline", displayName: "Vibramycin", genericName: "doxycycline", rxnorm: "3640", drugClass: "tetracycline", isOtc: false, ntiFlag: false },
  { drugKey: "cephalexin", displayName: "Keflex", genericName: "cephalexin", rxnorm: "2231", drugClass: "cephalosporin", isOtc: false, ntiFlag: false },
  { drugKey: "trimethoprim_sulfamethoxazole", displayName: "Bactrim", genericName: "sulfamethoxazole / trimethoprim", rxnorm: "198335", drugClass: "antibiotic", isOtc: false, ntiFlag: false },
  { drugKey: "fluoxetine", displayName: "Prozac", genericName: "fluoxetine", rxnorm: "4493", drugClass: "ssri", isOtc: false, ntiFlag: false },
  { drugKey: "escitalopram", displayName: "Lexapro", genericName: "escitalopram", rxnorm: "321988", drugClass: "ssri", isOtc: false, ntiFlag: false },
  { drugKey: "citalopram", displayName: "Celexa", genericName: "citalopram", rxnorm: "2556", drugClass: "ssri", isOtc: false, ntiFlag: false },
  { drugKey: "duloxetine", displayName: "Cymbalta", genericName: "duloxetine", rxnorm: "734064", drugClass: "snri", isOtc: false, ntiFlag: false },
  { drugKey: "venlafaxine", displayName: "Effexor", genericName: "venlafaxine", rxnorm: "39786", drugClass: "snri", isOtc: false, ntiFlag: false },
  { drugKey: "bupropion", displayName: "Wellbutrin", genericName: "bupropion", rxnorm: "42347", drugClass: "antidepressant", isOtc: false, ntiFlag: false },
  { drugKey: "trazodone", displayName: "Desyrel", genericName: "trazodone", rxnorm: "10737", drugClass: "antidepressant", isOtc: false, ntiFlag: false },
  { drugKey: "alprazolam", displayName: "Xanax", genericName: "alprazolam", rxnorm: "596", drugClass: "benzodiazepine", isOtc: false, ntiFlag: false },
  { drugKey: "lorazepam", displayName: "Ativan", genericName: "lorazepam", rxnorm: "6470", drugClass: "benzodiazepine", isOtc: false, ntiFlag: false },
  { drugKey: "clonazepam", displayName: "Klonopin", genericName: "clonazepam", rxnorm: "2598", drugClass: "benzodiazepine", isOtc: false, ntiFlag: false },
  { drugKey: "zolpidem", displayName: "Ambien", genericName: "zolpidem", rxnorm: "39993", drugClass: "hypnotic", isOtc: false, ntiFlag: false },
  { drugKey: "tramadol", displayName: "Ultram", genericName: "tramadol", rxnorm: "10689", drugClass: "opioid", isOtc: false, ntiFlag: false },
  { drugKey: "hydrocodone_acetaminophen", displayName: "Norco", genericName: "hydrocodone / acetaminophen", rxnorm: "214182", drugClass: "opioid", isOtc: false, ntiFlag: false },
  { drugKey: "oxycodone", displayName: "OxyContin", genericName: "oxycodone", rxnorm: "7804", drugClass: "opioid", isOtc: false, ntiFlag: false },
  { drugKey: "naproxen", displayName: "Aleve", genericName: "naproxen", rxnorm: "7258", drugClass: "nsaid", isOtc: true, ntiFlag: false },
  { drugKey: "celecoxib", displayName: "Celebrex", genericName: "celecoxib", rxnorm: "140587", drugClass: "nsaid", isOtc: false, ntiFlag: false },
  { drugKey: "cyclobenzaprine", displayName: "Flexeril", genericName: "cyclobenzaprine", rxnorm: "21949", drugClass: "muscle_relaxant", isOtc: false, ntiFlag: false },
  { drugKey: "allopurinol", displayName: "Zyloprim", genericName: "allopurinol", rxnorm: "519", drugClass: "gout", isOtc: false, ntiFlag: false },
  { drugKey: "tamsulosin", displayName: "Flomax", genericName: "tamsulosin", rxnorm: "77492", drugClass: "alpha_blocker", isOtc: false, ntiFlag: false },
  { drugKey: "ondansetron", displayName: "Zofran", genericName: "ondansetron", rxnorm: "26225", drugClass: "antiemetic", isOtc: false, ntiFlag: false },
  { drugKey: "loperamide", displayName: "Imodium", genericName: "loperamide", rxnorm: "6468", drugClass: "antidiarrheal", isOtc: true, ntiFlag: false },
  { drugKey: "docusate", displayName: "Colace", genericName: "docusate", rxnorm: "82003", drugClass: "stool_softener", isOtc: true, ntiFlag: false },
  { drugKey: "polyethylene_glycol", displayName: "MiraLAX", genericName: "polyethylene glycol 3350", rxnorm: "87636", drugClass: "laxative", isOtc: true, ntiFlag: false },
  { drugKey: "calcium_carbonate", displayName: "Tums", genericName: "calcium carbonate", rxnorm: "1897", drugClass: "antacid", isOtc: true, ntiFlag: false },
  { drugKey: "vitamin_d", displayName: "Vitamin D3", genericName: "cholecalciferol", rxnorm: "2418", drugClass: "supplement", isOtc: true, ntiFlag: false },
  { drugKey: "vitamin_b12", displayName: "Vitamin B12", genericName: "cyanocobalamin", rxnorm: "11248", drugClass: "supplement", isOtc: true, ntiFlag: false },
  { drugKey: "folic_acid", displayName: "Folic acid", genericName: "folic acid", rxnorm: "4511", drugClass: "supplement", isOtc: true, ntiFlag: false },
  { drugKey: "iron", displayName: "Ferrous sulfate", genericName: "ferrous sulfate", rxnorm: "24947", drugClass: "supplement", isOtc: true, ntiFlag: false },
  { drugKey: "fish_oil", displayName: "Fish oil / Omega-3", genericName: "omega-3 acid ethyl esters", rxnorm: "847230", drugClass: "supplement", isOtc: true, ntiFlag: false },
  { drugKey: "ginkgo", displayName: "Ginkgo biloba", genericName: "ginkgo biloba", rxnorm: null, drugClass: "herbal", isOtc: true, ntiFlag: false },
  { drugKey: "loratadine", displayName: "Claritin", genericName: "loratadine", rxnorm: "28889", drugClass: "antihistamine", isOtc: true, ntiFlag: false },
  { drugKey: "cetirizine", displayName: "Zyrtec", genericName: "cetirizine", rxnorm: "20610", drugClass: "antihistamine", isOtc: true, ntiFlag: false },
  { drugKey: "pseudoephedrine", displayName: "Sudafed", genericName: "pseudoephedrine", rxnorm: "8896", drugClass: "decongestant", isOtc: true, ntiFlag: false },
  { drugKey: "dextromethorphan", displayName: "Robitussin DM", genericName: "dextromethorphan", rxnorm: "3289", drugClass: "antitussive", isOtc: true, ntiFlag: false },
  { drugKey: "guaifenesin", displayName: "Mucinex", genericName: "guaifenesin", rxnorm: "5032", drugClass: "expectorant", isOtc: true, ntiFlag: false },
  { drugKey: "donepezil", displayName: "Aricept", genericName: "donepezil", rxnorm: "135447", drugClass: "cholinesterase_inhibitor", isOtc: false, ntiFlag: false },
  { drugKey: "memantine", displayName: "Namenda", genericName: "memantine", rxnorm: "310980", drugClass: "nmda", isOtc: false, ntiFlag: false },
  { drugKey: "levetiracetam", displayName: "Keppra", genericName: "levetiracetam", rxnorm: "114477", drugClass: "anticonvulsant", isOtc: false, ntiFlag: false },
  { drugKey: "lamotrigine", displayName: "Lamictal", genericName: "lamotrigine", rxnorm: "28439", drugClass: "anticonvulsant", isOtc: false, ntiFlag: false },
  { drugKey: "carbamazepine", displayName: "Tegretol", genericName: "carbamazepine", rxnorm: "2002", drugClass: "anticonvulsant", isOtc: false, ntiFlag: true },
  { drugKey: "phenytoin", displayName: "Dilantin", genericName: "phenytoin", rxnorm: "8183", drugClass: "anticonvulsant", isOtc: false, ntiFlag: true },
  { drugKey: "valproate", displayName: "Depakote", genericName: "divalproex sodium", rxnorm: "40254", drugClass: "anticonvulsant", isOtc: false, ntiFlag: true },
  { drugKey: "quetiapine", displayName: "Seroquel", genericName: "quetiapine", rxnorm: "51272", drugClass: "antipsychotic", isOtc: false, ntiFlag: false },
  { drugKey: "risperidone", displayName: "Risperdal", genericName: "risperidone", rxnorm: "35636", drugClass: "antipsychotic", isOtc: false, ntiFlag: false },
  { drugKey: "aripiprazole", displayName: "Abilify", genericName: "aripiprazole", rxnorm: "352374", drugClass: "antipsychotic", isOtc: false, ntiFlag: false },
  { drugKey: "methotrexate", displayName: "Trexall", genericName: "methotrexate", rxnorm: "6851", drugClass: "immunosuppressant", isOtc: false, ntiFlag: true },
  { drugKey: "alendronate", displayName: "Fosamax", genericName: "alendronate", rxnorm: "69634", drugClass: "bisphosphonate", isOtc: false, ntiFlag: false },
  { drugKey: "multivitamin", displayName: "Centrum / Multivitamin", genericName: "multivitamin", rxnorm: null, drugClass: "supplement", isOtc: true, ntiFlag: false },
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
