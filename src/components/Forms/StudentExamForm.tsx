import React, { useState, useEffect } from 'react';
import { StudentExam, Exam, Student } from '../../types';
import { apiService } from '../../services/api';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';

interface StudentExamFormProps {
  initialData?: StudentExam | null;
  selectedExam?: number | null;
  courseStudents?: Student[];
  onSave: (data: StudentExam) => void;
  onCancel: () => void;
  validationErrors?: Record<string, string[]>;
}

export const StudentExamForm: React.FC<StudentExamFormProps> = ({
  initialData,
  selectedExam,
  courseStudents = [],
  onSave,
  onCancel,
  validationErrors = {},
}) => {
  const [formData, setFormData] = useState<StudentExam>({
    exam_id: 0,
    student_id: 0,
    student_mark: 0,
  });

  const [exams, setExams] = useState<Exam[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else if (selectedExam) {
      setFormData(prev => ({ ...prev, exam_id: selectedExam }));
    }
    fetchExamsAndStudents();
  }, [initialData, selectedExam]);

  const fetchExamsAndStudents = async () => {
    try {
      const [examsResponse, studentsResponse] = await Promise.all([
        apiService.getAll('exams'),
        apiService.getAll('students'),
      ]);
      setExams(examsResponse.exams || []);
      setAllStudents(studentsResponse.students || []);
    } catch (error) {
      console.error('Failed to fetch exams and students:', error);
    }
  };

  const handleChange = (field: keyof StudentExam, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  // Use course students if available and exam is selected, otherwise use all students
  const availableStudents = selectedExam && courseStudents.length > 0 
    ? courseStudents 
    : allStudents;

  const examOptions = exams.map((exam: any) => ({
    value: exam.id!,
    label: `${exam.title} - ${exam.course?.title || 'Unknown Course'}`,
  }));

  const studentOptions = availableStudents.map((student) => ({
    value: student.id!,
    label: student.name,
  }));

  const selectedExamData = exams.find(exam => exam.id === formData.exam_id);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-8 py-6 border-b border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900">
          {initialData ? 'Edit Student Exam Record' : 'Add New Student Exam Record'}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {initialData 
            ? 'Update the student exam details below' 
            : 'Fill in the details to record a student exam result'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Exam and Student Selection */}
        <div className="space-y-6">
          <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Exam & Student Information
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Exam"
              value={formData.exam_id}
              onChange={(e) => handleChange('exam_id', parseInt(e.target.value))}
              options={examOptions}
              error={validationErrors.exam_id?.[0]}
              disabled={!!selectedExam}
              required
            />

            <Select
              label={selectedExam && courseStudents.length > 0 ? "Course Students" : "All Students"}
              value={formData.student_id}
              onChange={(e) => handleChange('student_id', parseInt(e.target.value))}
              options={studentOptions}
              error={validationErrors.student_id?.[0]}
              required
            />
          </div>

          {selectedExam && courseStudents.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Only students enrolled in the selected exam's course are shown.
              </p>
            </div>
          )}
        </div>

        {/* Exam Details Display */}
        {selectedExamData && (
          <div className="space-y-6">
            <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Exam Details
            </h4>
            
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600">Maximum Mark:</span>
                <p className="text-lg font-bold text-blue-600">{(selectedExamData as any).max_mark || 0}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Passing Mark:</span>
                <p className="text-lg font-bold text-yellow-600">{(selectedExamData as any).passing_mark || 0}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Course:</span>
                <p className="text-lg font-semibold text-gray-800">{(selectedExamData as any).course?.title || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Student Mark */}
        <div className="space-y-6">
          <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Student Performance
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Student Mark"
              type="number"
              min="0"
              max={(selectedExamData as any)?.max_mark || 100}
              value={formData.student_mark}
              onChange={(e) => handleChange('student_mark', parseInt(e.target.value))}
              error={validationErrors.student_mark?.[0]}
              helperText={selectedExamData ? `Maximum possible mark: ${(selectedExamData as any).max_mark}` : undefined}
              required
            />

            {formData.student_mark > 0 && selectedExamData && (
              <div className="flex items-center justify-center">
                <div className={`text-center p-4 rounded-lg ${
                  formData.student_mark >= ((selectedExamData as any).passing_mark || 0)
                    ? 'bg-green-100 border border-green-200'
                    : 'bg-red-100 border border-red-200'
                }`}>
                  <p className="text-sm font-medium text-gray-600 mb-1">Result</p>
                  <p className={`text-lg font-bold ${
                    formData.student_mark >= ((selectedExamData as any).passing_mark || 0)
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {formData.student_mark >= ((selectedExamData as any).passing_mark || 0) ? 'PASS' : 'FAIL'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.student_mark}/{(selectedExamData as any).max_mark}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onCancel} size="lg">
            Cancel
          </Button>
          <Button type="submit" loading={loading} size="lg">
            {initialData ? 'Update Student Exam' : 'Create Student Exam'}
          </Button>
        </div>
      </form>
    </div>
  );
};