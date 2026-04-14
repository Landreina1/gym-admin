'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { DietForm } from '@/components/diets/DietForm';

export default function NuevaDietaPage() {
  const router = useRouter();
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Nueva dieta</h1>
          <p className="text-sm text-gray-400 mt-0.5">Completá los datos de la dieta</p>
        </div>
      </div>
      <DietForm />
    </div>
  );
}
