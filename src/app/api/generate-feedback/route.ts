import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { promises as fs } from 'fs';

// Define TrainingDay interface based on your CSV structure
interface TrainingDay {
  Dato: string;
  Ukedag: string;
  Ukenummer: string;
  Fokus: string;
  Økt_Beskrivelse: string;
  Thomas_Pace_Mål: string;
  Monika_Pace_Mål: string;
  Kommentar: string;
}

// Define SupabaseTrainingEntry interface based on your Supabase table structure
interface SupabaseTrainingEntry {
  dato: string;
  thomas_fullfort: boolean;
  monika_fullfort: boolean;
  thomas_fullfort_tidspunkt?: string | null;
  monika_fullfort_tidspunkt?: string | null;
  thomas_rpe?: number | null;
  monika_rpe?: number | null;
  thomas_actual_pace?: string | null;
  monika_actual_pace?: string | null;
  thomas_kommentar?: string | null;
  monika_kommentar?: string | null;
  trener_thomas_kommentar?: string | null;
  trener_monika_kommentar?: string | null;
  thomas_pushups?: number | null;
  monika_pushups?: number | null;
  thomas_pushups_knaer?: number | null;
  monika_pushups_knaer?: number | null;
  thomas_kroppsvektscurl?: number | null;
  monika_kroppsvektscurl?: number | null;
}

// Access your API key as an environment variable (process.env.GEMINI_API_KEY)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { user, date, userComment, rpe, pace } = await req.json();

    if (!user || !date) {
      return NextResponse.json({ error: 'Missing user or date' }, { status: 400 });
    }

    // 1. Fetch all relevant data from Supabase for the specific user
    const { data: allSupabaseData, error: supabaseError } = await supabase
      .from('treningsprogram')
      .select('*, thomas_pushups, monika_pushups, thomas_pushups_knaer, monika_pushups_knaer, thomas_kroppsvektscurl, monika_kroppsvektscurl')
      .order('dato', { ascending: true });

    if (supabaseError) {
      console.error('Supabase error:', supabaseError);
      return NextResponse.json({ error: 'Failed to fetch Supabase data' }, { status: 500 });
    }

    // Filter data for the specific user and date
    // currentUserData is not used, so it's removed to fix ESLint error
    const userHistory: SupabaseTrainingEntry[] = allSupabaseData.filter((item: SupabaseTrainingEntry) => {
      if (user === 'thomas') return item.thomas_fullfort;
      if (user === 'monika') return item.monika_fullfort;
      return false;
    });

    // 2. Fetch the entire training program from CSV
    const csvFilePath = path.join(process.cwd(), 'public', 'treningsprogram.csv');
    const csvFileContent = await fs.readFile(csvFilePath, 'utf-8');
    const trainingProgram: TrainingDay[] = parse(csvFileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Find the current training day and the next day's training
    const currentTrainingDay = trainingProgram.find(td => td.Dato === date);
    const currentIndex = trainingProgram.findIndex(td => td.Dato === date);
    const nextTrainingDay = currentIndex !== -1 && currentIndex + 1 < trainingProgram.length
      ? trainingProgram[currentIndex + 1]
      : null;

    // Construct user's specific history for the prompt
    let historyPrompt = '';
    userHistory.forEach((item: SupabaseTrainingEntry) => {
      const rpeValue = user === 'thomas' ? item.thomas_rpe : item.monika_rpe;
      const paceValue = user === 'thomas' ? item.thomas_actual_pace : item.monika_actual_pace;
      const commentValue = user === 'thomas' ? item.thomas_kommentar : item.monika_kommentar;
      const trainerCommentValue = user === 'thomas' ? item.trener_thomas_kommentar : item.trener_monika_kommentar;
      const pushupsValue = user === 'thomas' ? item.thomas_pushups : item.monika_pushups;
      const pushupsKnaerValue = user === 'thomas' ? item.thomas_pushups_knaer : item.monika_pushups_knaer;
      const kroppsvektscurlValue = user === 'thomas' ? item.thomas_kroppsvektscurl : item.monika_kroppsvektscurl;

      historyPrompt += `\n--- Økt ${item.dato} ---`;
      historyPrompt += `\nDin kommentar: ${commentValue || 'Ingen'}`;
      historyPrompt += `\nRPE: ${rpeValue || 'Ikke satt'}`;
      historyPrompt += `\nPace: ${paceValue || 'Ikke satt'}`;
      if (pushupsValue !== null && pushupsValue !== undefined) historyPrompt += `\nPushups: ${pushupsValue}`;
      if (pushupsKnaerValue !== null && pushupsKnaerValue !== undefined) historyPrompt += `\nPushups (knær): ${pushupsKnaerValue}`;
      if (kroppsvektscurlValue !== null && kroppsvektscurlValue !== undefined) historyPrompt += `\nKroppsvektscurl: ${kroppsvektscurlValue}`;
      historyPrompt += `\nTrenerens tidligere tilbakemelding: ${trainerCommentValue || 'Ingen'}`;
    });

    // 3. Construct the prompt for Gemini AI
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });

    const prompt = `
      Du er en faglig sterk og motiverende trener, med ekspertise på nivå med Olympiatoppen. Din tone er folkelig, direkte og lett å forstå, men alltid konstruktiv og støttende.

      **Ditt hovedmål er å bygge utøveren opp, ikke bryte ned.**

      **Kontekst:**
      Dette er et 8-ukers løpeprogram. Brukeren har nettopp fullført økten for ${date}.

      **Brukerens historikk (tidligere økter og tilbakemeldinger):**
      ${historyPrompt}

      **Dagens økt (${date}):**
      - **Fokus:** ${currentTrainingDay?.Fokus || 'Ukjent'}
      - **Planlagt økt:** ${currentTrainingDay?.Økt_Beskrivelse || 'Ukjent'}
      - **Brukerens kommentar:** ${userComment || 'Ingen'}
      - **Opplevd anstrengelse (RPE):** ${rpe || 'Ikke logget'}
      - **Faktisk pace:** ${pace || 'Ikke logget'}
      ${ currentTrainingDay?.Økt_Beskrivelse.includes('Styrketrening') ? `
      - **Viktig kontekst for styrketrening:** Planen var 4 sett med 8 repetisjoner (totalt 32). Brukeren har logget det totale antallet repetisjoner, noe som er helt korrekt. **Anta at de har utført øvelsen i sett som planlagt.** Deres kommentar om "juksing" og usikkerhet handler utelukkende om den tekniske utførelsen av hver repetisjon, ikke om antall sett. Gi ros for å ha fullført det planlagte volumet, og gi deretter konstruktive tips til hvordan de kan bli tryggere på selve teknikken.
      - **Logget Pushups:** ${user === 'thomas' ? allSupabaseData.find(d => d.dato === date)?.thomas_pushups : allSupabaseData.find(d => d.dato === date)?.monika_pushups || 'Ikke logget'}
      - **Logget Pushups (knær):** ${user === 'thomas' ? allSupabaseData.find(d => d.dato === date)?.thomas_pushups_knaer : allSupabaseData.find(d => d.dato === date)?.monika_pushups_knaer || 'Ikke logget'}
      - **Logget Kroppsvektscurl:** ${user === 'thomas' ? allSupabaseData.find(d => d.dato === date)?.thomas_kroppsvektscurl : allSupabaseData.find(d => d.dato === date)?.monika_kroppsvektscurl || 'Ikke logget'}
      ` : ''}

      **Neste økt (${nextTrainingDay ? nextTrainingDay.Dato : 'N/A'}):**
      - **Fokus:** ${nextTrainingDay ? nextTrainingDay.Fokus : 'Ingen planlagt økt'}
      - **Planlagt økt:** ${nextTrainingDay ? nextTrainingDay.Økt_Beskrivelse : 'Ingen planlagt økt'}

      **Din oppgave:**
      Gi en tilbakemelding som er:
      1.  **Faglig sterk:** Gi innsikt som en profesjonell trener ville gjort. Forklar *hvorfor* noe er bra eller kan forbedres.
      2.  **Konstruktiv og ærlig:** Adresser brukerens kommentarer og resultater direkte, men fokuser på læring og forbedring. Unngå sarkasme og frekkhet.
      3.  **Oppmuntrende:** Anerkjenn innsatsen og motiver for neste økt. Finn noe positivt, selv i en dårlig økt.
      4.  **Nyttig:** Gi konkrete tips eller noe brukeren kanskje ikke har tenkt på.
      5.  **Folkelig:** Bruk et enkelt og direkte språk, men unngå overdreven banning eller aggressivitet.

      Strukturer svaret ditt med en kort analyse av dagens økt, og se deretter fremover mot neste. Hold det konsist (maks 150 ord).
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiFeedback = response.text();

    // 4. Save AI's response to Supabase
    const updateColumn = user === 'thomas' ? 'trener_thomas_kommentar' : 'trener_monika_kommentar';
    const { error: updateError } = await supabase
      .from('treningsprogram')
      .update({ [updateColumn]: aiFeedback })
      .eq('dato', date);

    if (updateError) {
      console.error('Error updating AI feedback in Supabase:', updateError);
      return NextResponse.json({ error: 'Failed to save AI feedback' }, { status: 500 });
    }

    return NextResponse.json({ feedback: aiFeedback });

  } catch (error) {
    console.error('Error generating feedback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
