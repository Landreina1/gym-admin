'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { StudentForm } from '@/components/students/StudentForm';

export default function NewStudentPage() {
  const router = useRouter();
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Nuevo alumno</h1>
          <p className="text-sm text-gray-400 mt-0.5">Registra los datos básicos para comenzar a gestionar al alumno</p>
        </div>
      </div>
      <StudentForm />
    </div>
  );
}
