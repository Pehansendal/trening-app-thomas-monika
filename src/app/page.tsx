'use client'; // Add 'use client' directive

import React, { useState, useEffect, useCallback } from 'react'; // Import useState, useEffect, and useCallback
import { TrainingDay } from '@/lib/csv'; // Keep TrainingDay type
import { supabase } from '@/lib/supabase';
import TrainingItem from '@/components/TrainingItem';
import LoginPage from '@/components/LoginPage'; // Import LoginPage
import Image from 'next/image'; // Import Image component

// Define TrainingCompletionStatus at the top level or import if defined elsewhere
interface TrainingCompletionStatus {
  thomas_fullfort: boolean;
  monika_fullfort: boolean;
  thomas_rpe?: number | null;
  monika_rpe?: number | null;
  thomas_actual_pace?: string | null;
  monika_actual_pace?: string | null;
  thomas_kommentar?: string | null;
  monika_kommentar?: string | null;
  trener_thomas_kommentar?: string | null;
  trener_monika_kommentar?: string | null;
}

export default function Home() {
  const [trainingProgram, setTrainingProgram] = useState<TrainingDay[]>([]);
  const [completionMap, setCompletionMap] = useState<Map<string, TrainingCompletionStatus>>(new Map());
  const [loggedInUser, setLoggedInUser] = useState<'thomas' | 'monika' | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    // Fetch training program from API route
    const programResponse = await fetch('/api/training-program');
    if (programResponse.ok) {
      const programData: TrainingDay[] = await programResponse.json();
      setTrainingProgram(programData);
    } else {
      console.error('Failed to fetch training program from API');
    }

    const { data: completionStatusData, error } = await supabase
      .from('treningsprogram')
      .select('dato, thomas_fullfort, monika_fullfort, thomas_rpe, monika_rpe, thomas_actual_pace, monika_actual_pace, thomas_kommentar, monika_kommentar, trener_thomas_kommentar, trener_monika_kommentar');

    if (error) {
      console.error('Error fetching completion status:', error);
    }

    const map = new Map<string, TrainingCompletionStatus>();
    completionStatusData?.forEach((status) => {
      map.set(status.dato, {
        thomas_fullfort: status.thomas_fullfort,
        monika_fullfort: status.monika_fullfort,
        thomas_rpe: status.thomas_rpe,
        monika_rpe: status.monika_rpe,
        thomas_actual_pace: status.thomas_actual_pace,
        monika_actual_pace: status.monika_actual_pace,
        thomas_kommentar: status.thomas_kommentar,
        monika_kommentar: status.monika_kommentar,
        trener_thomas_kommentar: status.trener_thomas_kommentar,
        trener_monika_kommentar: status.trener_monika_kommentar,
      });
    });
    setCompletionMap(map);
  }, []); // Empty dependency array as fetchData itself doesn't depend on external component state that changes


  useEffect(() => {
    // User will now always be null on initial load, forcing login
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loggedInUser) {
      fetchData();
    }
  }, [loggedInUser, fetchData]); // fetchData depends on loggedInUser

  // Separate useEffect for playing sound when loggedInUser is set

  const handleUpdateStatus = async () => {
    // This function will be called by TrainingItem after a successful Supabase update
    // It will re-fetch all data to ensure the UI is in sync
    if (loggedInUser) {
      await fetchData();
    }
  };

  const handleLogin = (user: 'thomas' | 'monika') => {
    // localStorage.setItem('loggedInUser', user); // Fjernet lagring til localStorage
    setLoggedInUser(user);
  };

  const handleLogout = () => {
    // localStorage.removeItem('loggedInUser'); // Fjernet fjerning fra localStorage
    setLoggedInUser(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-700">Laster...</p>
      </div>
    );
  }

  if (!loggedInUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-0 sm:p-8 bg-gray-50">
      <div className="relative w-full h-64 mb-8">
        <Image
          src="/toppbanneren.png" // Byttet til nytt bannerbilde
          alt="Treningsprogram Header"
          layout="fill"
          objectFit="cover"
          className="brightness-75" // Beholder brightness justering, kan justeres ved behov
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-4xl font-extrabold text-gray-900 text-center"> {/* Endret størrelse og farge */}
            Thomas & Monika's Treningsprogram {/* Fikset apostrof - v3 */}
          </h1>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out"
      >
        Logg ut ({loggedInUser})
      </button>

      <div className="flex flex-col w-full max-w-4xl px-4 sm:px-0 gap-8">
        {/* Main Content */}
        <div className="w-full">
          {trainingProgram.map((training: TrainingDay) => {
            const status = completionMap.get(training.dato) || {
              thomas_fullfort: false,
              monika_fullfort: false,
              thomas_rpe: null,
              monika_rpe: null,
              thomas_actual_pace: null,
              monika_actual_pace: null,
              thomas_kommentar: null,
              monika_kommentar: null,
              trener_thomas_kommentar: null,
              trener_monika_kommentar: null,
            };
            return (
              <TrainingItem
                key={training.dato}
                training={training}
                initialCompletionStatus={status}
                loggedInUser={loggedInUser}
                onUpdate={handleUpdateStatus} // Pass the update handler
              />
            );
          })}
        </div>
      </div>
    </main>
  );
}
