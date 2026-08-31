import type { Exam, Subject } from "./types";

export const EXAMS: Array<{ id: Exam; name: string; description: string }> = [
  { id: "NEET-PG", name: "NEET PG", description: "National Eligibility cum Entrance Test" },
  { id: "INI-CET", name: "INI-CET", description: "Institute of National Importance" },
  { id: "FMGE", name: "FMGE", description: "Foreign Medical Graduate Examination" }
];

export const SUBJECTS: Subject[] = [
  { id: "anatomy", name: "Anatomy", code: "A", short: "Anat" },
  { id: "physiology", name: "Physiology", code: "P", short: "Physio" },
  { id: "biochemistry", name: "Biochemistry", code: "B", short: "Biochem" },
  { id: "pathology", name: "Pathology", code: "T", short: "Path" },
  { id: "pharmacology", name: "Pharmacology", code: "F", short: "Pharma" },
  { id: "microbiology", name: "Microbiology", code: "M", short: "Micro" },
  { id: "forensic-medicine", name: "Forensic Medicine", code: "R", short: "FMT" },
  { id: "community-medicine", name: "Community Medicine", code: "C", short: "PSM" },
  { id: "medicine", name: "Medicine", code: "D", short: "Medicine" },
  { id: "dermatology", name: "Dermatology", code: "E", short: "Derma" },
  { id: "psychiatry", name: "Psychiatry", code: "Y", short: "Psych" },
  { id: "pediatrics", name: "Pediatrics", code: "K", short: "Peds" },
  { id: "surgery", name: "Surgery", code: "S", short: "Surg" },
  { id: "orthopedics", name: "Orthopedics", code: "O", short: "Ortho" },
  { id: "radiology", name: "Radiology", code: "L", short: "Radio" },
  { id: "anesthesiology", name: "Anesthesiology", code: "N", short: "Anes" },
  { id: "ent", name: "ENT", code: "Q", short: "ENT" },
  { id: "ophthalmology", name: "Ophthalmology", code: "V", short: "Ophtha" },
  { id: "obstetrics-gynecology", name: "Obstetrics & Gynecology", code: "G", short: "OBG" }
];

export const SAMPLE_TOPIC = {
  id: "upper-limb",
  name: "Upper Limb"
};

export const getSubject = (id: string) => SUBJECTS.find((s) => s.id === id);
