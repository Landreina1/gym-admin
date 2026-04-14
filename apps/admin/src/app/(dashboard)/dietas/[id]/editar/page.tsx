'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { dietService } from '@/services/diet.service';
import { DietForm } from '@/components/diets/DietForm';

export default function EditarDietaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: diet, isLoading } = useQuery({
    queryKey: ['diet-template', id],
    queryFn: () => dietService.getTemplate(id),
  });

  if (isLoading) return <div className="animate-pulse h-48 bg-gray-200 rounded-2xl" />;
  if (!diet) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Editar dieta</h1>
          <p className="text-sm text-gray-400 mt-0.5">{diet.name}</p>
        </div>
      </div>
      <DietForm diet={diet} />
    </div>
  );
}
