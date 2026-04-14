'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { studentsService } from '@/services/students.service';
import { StudentForm } from '@/components/students/StudentForm';

export default function EditStudentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentsService.getOne(id),
  });

  if (isLoading) return <div className="animate-pulse h-48 bg-gray-200 rounded-xl" />;
  if (!student) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Editar alumno</h1>
          <p className="text-sm text-gray-400 mt-0.5">{student.firstName} {student.lastName}</p>
        </div>
      </div>
      <StudentForm student={student} />
    </div>
  );
}
