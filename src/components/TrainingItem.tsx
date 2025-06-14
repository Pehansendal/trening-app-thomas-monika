'use client';

import React, { useState } from 'react';
import { TrainingDay } from '@/lib/csv';
import { supabase } from '@/lib/supabase';

interface TrainingItemProps {
  training: TrainingDay;
  initialThomasCompleted: boolean;
  initialMonikaCompleted: boolean;
}

export default function TrainingItem({
  training,
  initialThomasCompleted,
  initialMonikaCompleted,
}: TrainingItemProps) {
  const [thomasCompleted, setThomasCompleted] = useState(initialThomasCompleted);
  const [monikaCompleted, setMonikaCompleted] = useState(initialMonikaCompleted);

  const handleCheckboxChange = async (person: 'thomas' | 'monika', checked: boolean) => {
    const updateData: { [key: string]: boolean | string | null } = {};
    const date = training.dato; // Assuming training.dato is in 'YYYY-MM-DD' format

    if (person === 'thomas') {
      setThomasCompleted(checked);
      updateData.thomas_fullfort = checked;
      updateData.thomas_fullfort_tidspunkt = checked ? new Date().toISOString() : null;
    } else {
      setMonikaCompleted(checked);
      updateData.monika_fullfort = checked;
      updateData.monika_fullfort_tidspunkt = checked ? new Date().toISOString() : null;
    }

    // Upsert into Supabase
    const { error } = await supabase
      .from('treningsprogram') // Use the correct table name
      .upsert({ dato: date, ...updateData }, { onConflict: 'dato' });

    if (error) {
      console.error('Error updating Supabase:', error);
      // Revert state if there's an error
      if (person === 'thomas') {
        setThomasCompleted(!checked);
      } else {
        setMonikaCompleted(!checked);
      }
      alert('Klarte ikke å oppdatere status. Prøv igjen.');
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

      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-8 pt-4 border-t border-gray-100">
        <label className="flex items-center cursor-pointer group">
          <input
            type="checkbox"
            className="form-checkbox h-6 w-6 text-blue-600 rounded-md transition-colors duration-200 focus:ring-2 focus:ring-blue-500"
            checked={thomasCompleted}
            onChange={(e) => handleCheckboxChange('thomas', e.target.checked)}
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
          />
          <span className="ml-3 text-lg text-gray-800 font-medium group-hover:text-pink-700 transition-colors duration-200">
            Monika Fullført
          </span>
        </label>
      </div>
    </div>
  );
}
