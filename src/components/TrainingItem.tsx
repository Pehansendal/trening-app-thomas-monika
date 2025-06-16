'use client';

import React, { useState } from 'react';
import { TrainingDay } from '@/lib/csv';
import { supabase } from '@/lib/supabase';

interface TrainingCompletionStatus {
  thomas_fullfort: boolean;
  monika_fullfort: boolean;
  thomas_rpe?: number | null;
  monika_rpe?: number | null;
  thomas_actual_pace?: string | null;
  monika_actual_pace?: string | null;
}

interface TrainingItemProps {
  training: TrainingDay;
  initialCompletionStatus: TrainingCompletionStatus; // Updated prop name
  loggedInUser: 'thomas' | 'monika';
  onUpdate: () => Promise<void>; // Callback to refresh data in parent
}

export default function TrainingItem({
  training,
  initialCompletionStatus,
  loggedInUser,
  onUpdate, // Destructure onUpdate
}: TrainingItemProps) {
  // Local state for inputs before saving
  const [currentThomasRpe, setCurrentThomasRpe] = useState<number | undefined>(initialCompletionStatus.thomas_rpe ?? undefined);
  const [currentMonikaRpe, setCurrentMonikaRpe] = useState<number | undefined>(initialCompletionStatus.monika_rpe ?? undefined);
  const [currentThomasActualPace, setCurrentThomasActualPace] = useState<string>(initialCompletionStatus.thomas_actual_pace || '');
  const [currentMonikaActualPace, setCurrentMonikaActualPace] = useState<string>(initialCompletionStatus.monika_actual_pace || '');

  // Use props directly for completed status to reflect parent's state
  const thomasCompleted = initialCompletionStatus.thomas_fullfort;
  const monikaCompleted = initialCompletionStatus.monika_fullfort;


  const isPastCutoff = () => {
    const twoDaysInMillis = 2 * 24 * 60 * 60 * 1000;
    const trainingDate = new Date(training.dato);
    const cutoffDate = new Date(trainingDate.getTime() + twoDaysInMillis);
    return new Date() > cutoffDate;
  };

  const handleCheckboxChange = async (person: 'thomas' | 'monika', checked: boolean) => {
    // Prevent unchecking if already completed (permanent logging)
    if ((person === 'thomas' && thomasCompleted && !checked) || (person === 'monika' && monikaCompleted && !checked)) {
        alert("Du kan ikke fjerne en allerede logget økt.");
        return; // Do not proceed
    }

    // Prevent checking if past cutoff
    if (isPastCutoff() && checked) {
      alert("Du kan ikke logge en økt som er mer enn 2 dager gammel.");
      return; // Do not proceed
    }

    const updateData: { [key: string]: any } = {};
    const date = training.dato;

    if (person === 'thomas') {
      updateData.thomas_fullfort = checked;
      updateData.thomas_fullfort_tidspunkt = checked ? new Date().toISOString() : null;
      if (checked) {
        updateData.thomas_rpe = currentThomasRpe;
        updateData.thomas_actual_pace = currentThomasActualPace;
      } else { // If unchecking (though prevented, good to have logic)
        updateData.thomas_rpe = null;
        updateData.thomas_actual_pace = null;
      }
    } else { // person === 'monika'
      updateData.monika_fullfort = checked;
      updateData.monika_fullfort_tidspunkt = checked ? new Date().toISOString() : null;
      if (checked) {
        updateData.monika_rpe = currentMonikaRpe;
        updateData.monika_actual_pace = currentMonikaActualPace;
      } else {
        updateData.monika_rpe = null;
        updateData.monika_actual_pace = null;
      }
    }

    const { error } = await supabase
      .from('treningsprogram')
      .upsert({ dato: date, ...updateData }, { onConflict: 'dato' });

    if (error) {
      console.error('Error updating Supabase:', error);
      alert('Klarte ikke å oppdatere status. Prøv igjen.');
    } else {
      await onUpdate(); // Call parent's update function to refresh data
    }
  };

  return (
    <div className="border border-gray-200 p-6 mb-6 rounded-xl shadow-lg bg-white hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-2xl font-extrabold text-gray-800">
          {training.dato} - {training.ukedag}
        </h2>
        <span className="text-lg font-semibold text-gray-600 bg-blue-100 px-3 py-1 rounded-full">
          Uke {training.ukenr}
        </span>
      </div>

      <p className="text-xl font-bold text-blue-700 mb-3">{training.fokus}</p>
      <p className="text-gray-700 mb-4 leading-relaxed">{training.oktBeskrivelse}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base text-gray-600 mb-5">
        <div>
          <p className="mb-1">
            <span className="font-semibold text-gray-800">Thomas Pace Mål:</span>{' '}
            {training.thomasPaceMal}
          </p>
          <p>
            <span className="font-semibold text-gray-800">Monika Pace Mål:</span>{' '}
            {training.monikaPaceMal}
          </p>
        </div>
        <div>
          <p>
            <span className="font-semibold text-gray-800">Kommentar:</span>{' '}
            {training.kommentar}
          </p>
        </div>
      </div>

      {/* Inputs for RPE and Actual Pace */}
      {loggedInUser === 'thomas' && !thomasCompleted && !isPastCutoff() && (
        <div className="mt-4 space-y-3 p-3 border rounded-md bg-blue-50">
          <div>
            <label htmlFor={`thomas-rpe-${training.dato}`} className="block text-sm font-medium text-gray-700">Thomas - Opplevd anstrengelse (1-10):</label>
            <input
              type="range"
              id={`thomas-rpe-${training.dato}`}
              min="1"
              max="10"
              value={currentThomasRpe || ''}
              onChange={(e) => setCurrentThomasRpe(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={thomasCompleted || isPastCutoff()}
            />
            <span className="text-sm text-blue-700 font-semibold ml-2">{currentThomasRpe}</span>
          </div>
          <div>
            <label htmlFor={`thomas-pace-${training.dato}`} className="block text-sm font-medium text-gray-700">Thomas - Pace på økt (f.eks. 5:30 min/km):</label>
            <input
              type="text"
              id={`thomas-pace-${training.dato}`}
              value={currentThomasActualPace}
              onChange={(e) => setCurrentThomasActualPace(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              disabled={thomasCompleted || isPastCutoff()}
            />
          </div>
        </div>
      )}
      {/* Display Thomas's logged data if completed, visible to both */}
      {thomasCompleted && (
        <div className="mt-4 text-sm text-gray-600 p-3 border rounded-md bg-blue-50">
          <p className="font-medium text-blue-800">Thomas' faktiske økt:</p>
          <p>Opplevd anstrengelse: {initialCompletionStatus.thomas_rpe || 'Ikke satt'}</p>
          <p>Pace: {initialCompletionStatus.thomas_actual_pace || 'Ikke satt'}</p>
        </div>
      )}

      {/* Input fields for Monika */}
      {loggedInUser === 'monika' && !monikaCompleted && !isPastCutoff() && (
         <div className="mt-4 space-y-3 p-3 border rounded-md bg-pink-50">
          <div>
            <label htmlFor={`monika-rpe-${training.dato}`} className="block text-sm font-medium text-gray-700">Monika - Opplevd anstrengelse (1-10):</label>
            <input
              type="range"
              id={`monika-rpe-${training.dato}`}
              min="1"
              max="10"
              value={currentMonikaRpe || ''}
              onChange={(e) => setCurrentMonikaRpe(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={monikaCompleted || isPastCutoff()}
            />
            <span className="text-sm text-pink-700 font-semibold ml-2">{currentMonikaRpe}</span>
          </div>
          <div>
            <label htmlFor={`monika-pace-${training.dato}`} className="block text-sm font-medium text-gray-700">Monika - Pace på økt (f.eks. 7.00):</label>
            <input
              type="text"
              id={`monika-pace-${training.dato}`}
              value={currentMonikaActualPace}
              onChange={(e) => setCurrentMonikaActualPace(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              disabled={monikaCompleted || isPastCutoff()}
            />
          </div>
        </div>
      )}
      {/* Display Monika's logged data if completed, visible to both */}
      {monikaCompleted && (
        <div className="mt-4 text-sm text-gray-600 p-3 border rounded-md bg-pink-50">
          <p className="font-medium text-pink-800">Monikas faktiske økt:</p>
          <p>Opplevd anstrengelse: {initialCompletionStatus.monika_rpe || 'Ikke satt'}</p>
          <p>Pace: {initialCompletionStatus.monika_actual_pace || 'Ikke satt'}</p>
        </div>
      )}


      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-8 pt-4 mt-4 border-t border-gray-200">
        <label className="flex items-center cursor-pointer group">
          <input
            type="checkbox"
            className="form-checkbox h-6 w-6 text-blue-600 rounded-md transition-colors duration-200 focus:ring-2 focus:ring-blue-500"
            checked={thomasCompleted}
            onChange={(e) => handleCheckboxChange('thomas', e.target.checked)}
            disabled={loggedInUser === 'monika' || thomasCompleted || isPastCutoff()}
          />
          <span className="ml-3 text-lg text-gray-800 font-medium group-hover:text-blue-700 transition-colors duration-200">
            Thomas Fullført
          </span>
        </label>
        <label className="flex items-center cursor-pointer group">
          <input
            type="checkbox"
            className="form-checkbox h-6 w-6 text-pink-600 rounded-md transition-colors duration-200 focus:ring-2 focus:ring-pink-500"
            checked={monikaCompleted}
            onChange={(e) => handleCheckboxChange('monika', e.target.checked)}
            disabled={loggedInUser === 'thomas' || monikaCompleted || isPastCutoff()}
          />
          <span className="ml-3 text-lg text-gray-800 font-medium group-hover:text-pink-700 transition-colors duration-200">
            Monika Fullført
          </span>
        </label>
      </div>
    </div>
  );
}
