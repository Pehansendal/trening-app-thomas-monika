import { parse } from 'csv-parse/sync';
import path from 'path';
import { promises as fs } from 'fs';

export async function getTrainingProgram() {
  const filePath = path.join(process.cwd(), 'public', 'treningsprogram.csv');
  const fileContent = await fs.readFile(filePath, { encoding: 'utf-8' });

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  interface CsvRecord {
    Dato: string;
    Ukedag: string;
    Ukenummer: string;
    Fokus: string;
    Økt_Beskrivelse: string;
    Thomas_Pace_Mål: string;
    Monika_Pace_Mål: string;
    Kommentar: string;
  }

  return records.map((record: CsvRecord) => ({
    dato: record.Dato,
    ukedag: record.Ukedag,
    ukenr: parseInt(record.Ukenummer),
    fokus: record.Fokus,
    oktBeskrivelse: record.Økt_Beskrivelse,
    thomasPaceMal: record.Thomas_Pace_Mål,
    monikaPaceMal: record.Monika_Pace_Mål,
    kommentar: record.Kommentar,
  }));
}

export type TrainingDay = Awaited<ReturnType<typeof getTrainingProgram>>[number];
