import React from 'react';
import ReactMarkdown from 'react-markdown';

interface FeedbackModalProps {
  content: string;
  onClose: () => void;
}

export default function FeedbackModal({ content, onClose }: FeedbackModalProps) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Trenerens Tilbakemelding</h2>
        <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-gray-700 mb-6">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        <button
          onClick={onClose}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out w-full"
        >
          Lukk
        </button>
      </div>
    </div>
  );
}
