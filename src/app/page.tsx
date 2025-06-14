import { getTrainingProgram, TrainingDay } from '@/lib/csv';
import { supabase } from '@/lib/supabase';
import TrainingItem from '@/components/TrainingItem';
import Image from 'next/image'; // Import Image component

export const dynamic = 'force-dynamic'; // Ensure data is always fresh

export default async function Home() {
  const trainingProgram = await getTrainingProgram();

  // Fetch completion status from Supabase
  const { data: completionStatus, error } = await supabase
    .from('treningsprogram')
    .select('dato, thomas_fullfort, monika_fullfort');

  if (error) {
    console.error('Error fetching completion status:', error);
    // Handle error gracefully, maybe show a message to the user
  }

  const completionMap = new Map();
  completionStatus?.forEach((status) => {
    completionMap.set(status.dato, {
      thomas_fullfort: status.thomas_fullfort,
      monika_fullfort: status.monika_fullfort,
    });
  });

  return (
    <main className="flex min-h-screen flex-col items-center p-0 sm:p-8 bg-gray-50">
      <div className="relative w-full h-64 mb-8">
        <Image
          src="/image.png" // Using image.png as a generic header image
          alt="Treningsprogram Header"
          layout="fill"
          objectFit="cover"
          className="brightness-75"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-5xl font-extrabold text-white text-center drop-shadow-lg">
            Thomas & Monika's Treningsprogram
          </h1>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row w-full max-w-7xl px-4 sm:px-0 gap-8">
        {/* Left Image - Sticky */}
        <div className="hidden lg:flex flex-col items-center w-full lg:w-1/5 sticky top-8 self-start">
          <Image
            src="/monikasint.jpg"
            alt="Monika"
            width={250}
            height={250}
            objectFit="contain"
            className="rounded-lg shadow-md mb-8"
          />
          {/* You can add more images or content here */}
        </div>

        {/* Main Content */}
        <div className="w-full lg:w-3/5">
          {trainingProgram.map((training: TrainingDay) => {
            const status = completionMap.get(training.dato) || {
              thomas_fullfort: false,
              monika_fullfort: false,
            };
            return (
              <TrainingItem
                key={training.dato}
                training={training}
                initialThomasCompleted={status.thomas_fullfort}
                initialMonikaCompleted={status.monika_fullfort}
              />
            );
          })}
        </div>

        {/* Right Image - Sticky */}
        <div className="hidden lg:flex flex-col items-center w-full lg:w-1/5 sticky top-8 self-start">
          <Image
            src="/aVTtLKsU.jpg"
            alt="Trening"
            width={250}
            height={250}
            objectFit="contain"
            className="rounded-lg shadow-md mb-8"
          />
          {/* You can add more images or content here */}
        </div>
      </div>
    </main>
  );
}
