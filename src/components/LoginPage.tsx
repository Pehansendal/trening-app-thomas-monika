'use client';

import React from 'react';

interface LoginPageProps {
  onLogin: (user: 'thomas' | 'monika') => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Velg bruker</h1>
        <p className="text-gray-600 mb-8">
          For å se og oppdatere treningsprogrammet, velg hvem du er:
        </p>
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => onLogin('thomas')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-xl transition duration-300 ease-in-out transform hover:scale-105"
          >
            Logg inn som Thomas
          </button>
          <button
            onClick={() => onLogin('monika')}
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-lg text-xl transition duration-300 ease-in-out transform hover:scale-105"
          >
            Logg inn som Monika
          </button>
        </div>
      </div>
    </div>
  );
}
