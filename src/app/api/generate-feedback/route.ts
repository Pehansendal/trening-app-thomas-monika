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
      .select('*')
      .order('dato', { ascending: true });

    if (supabaseError) {
      console.error('Supabase error:', supabaseError);
      return NextResponse.json({ error: 'Failed to fetch Supabase data' }, { status: 500 });
    }

    // Filter data for the specific user and date
    const currentUserData = allSupabaseData.find((item: any) => item.dato === date);
    const userHistory = allSupabaseData.filter((item: any) => {
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
    userHistory.forEach((item: any) => {
      const rpeValue = user === 'thomas' ? item.thomas_rpe : item.monika_rpe;
      const paceValue = user === 'thomas' ? item.thomas_actual_pace : item.monika_actual_pace;
      const commentValue = user === 'thomas' ? item.thomas_kommentar : item.monika_kommentar;
      const trainerCommentValue = user === 'thomas' ? item.trener_thomas_kommentar : item.trener_monika_kommentar;

      historyPrompt += `\n--- Økt ${item.dato} ---`;
      historyPrompt += `\nDin kommentar: ${commentValue || 'Ingen'}`;
      historyPrompt += `\nRPE: ${rpeValue || 'Ikke satt'}`;
      historyPrompt += `\nPace: ${paceValue || 'Ikke satt'}`;
      historyPrompt += `\nTrenerens tidligere tilbakemelding: ${trainerCommentValue || 'Ingen'}`;
    });

    // 3. Construct the prompt for Gemini AI
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });

    const prompt = `
      Du er en profesjonell, men folkelig og brutalt ærlig løpetrener.
      Dette er et 8-ukers løpeprogram. Brukeren har nettopp fullført økten for ${date}.

      Her er brukerens historikk og tidligere tilbakemeldinger:
      ${historyPrompt}

      Dagens økt (${date}):
      Fokus: ${currentTrainingDay?.Fokus || 'Ukjent'}
      Beskrivelse: ${currentTrainingDay?.Økt_Beskrivelse || 'Ukjent'}
      Din kommentar: ${userComment || 'Ingen'}
      RPE: ${rpe || 'Ikke satt'}
      Pace: ${pace || 'Ikke satt'}

      ${nextTrainingDay ? `Morgendagens økt (${nextTrainingDay.Dato}):
      Fokus: ${nextTrainingDay.Fokus}
      Beskrivelse: ${nextTrainingDay.Økt_Beskrivelse}` : 'Ingen planlagt økt for i morgen.'}

      Gi en nyttig, ærlig, folkelig og **oppmuntrende** tilbakemelding på dagens økt, og gjerne en kommentar om morgendagens økt.
      Hold tilbakemeldingen relativt kort og konsis, maks 150 ord.
      Vær motiverende, men også direkte og ærlig om prestasjonen.
      Bruk gjerne litt humor og folkelige uttrykk.
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
