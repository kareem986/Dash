import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Award, Users, BookOpen } from 'lucide-react';
import { StudentExam, Exam, Student } from '../../types';
import { apiService } from '../../services/api';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Modal } from '../UI/Modal';
import { Table } from '../UI/Table';
import { StudentExamForm } from '../Forms/StudentExamForm';

interface StudentExamWithDetails extends StudentExam {
  student?: {
    id: number;
    name: string;
    email: string;
  };
  exam?: {
    id: number;
    title: string;
    course: {
      id: number;
      title: string;
    };
    max_mark: number;
    passing_mark: number;
  };
}

interface ExamWithCourse extends Exam {
  course: {
    id: number;
    title: string;
  };
}

export const StudentExamManagement: React.FC = () => {
  const { t } = useTranslation();
  const [studentExams, setStudentExams] = useState<StudentExamWithDetails[]>([]);
  const [exams, setExams] = useState<ExamWithCourse[]>([]);
  const [courseStudents, setCourseStudents] = useState<Student[]>([]);
  const [selectedExam, setSelectedExam] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudentExam, setEditingStudentExam] = useState<StudentExam | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  const fetchExams = async () => {
    try {
      const response = await apiService.getAll('exams');
      setExams(response.exams || []);
    } catch (error) {
      console.error(t('messages.failedToFetch'), error);
    }
  };

  const fetchStudentExams = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAll('stdExam');
      setStudentExams(response.studentExams || []);
    } catch (error) {
      console.error(t('messages.failedToFetch'), error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseStudents = async (courseId: number) => {
    try {
      const response = await apiService.getCourseStudents(courseId);
      setCourseStudents(response.students || []);
    } catch (error) {
      console.error(t('messages.failedToFetch'), error);
      setCourseStudents([]);
    }
  };

  useEffect(() => {
    fetchExams();
    fetchStudentExams();
  }, []);

  const handleExamChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const examId = parseInt(e.target.value);
    if (!examId) {
      setSelectedExam(null);
      setCourseStudents([]);
      return;
    }

    setSelectedExam(examId);
    const exam = exams.find(e => e.id === examId);
    if (exam?.course?.id) {
      await fetchCourseStudents(exam.course.id);
    }
  };

  const handleSave = async (studentExamData: StudentExam) => {
    try {
      setValidationErrors({});
      if (editingStudentExam?.id) {
        await apiService.update("stdExam", editingStudentExam.id, studentExamData);
      } else {
        await apiService.create("stdExam", studentExamData);
      }
      await fetchStudentExams();
      setIsModalOpen(false);
      setEditingStudentExam(null);
    } catch (error: any) {
      console.error(t('messages.failedToSave'), error);
      if (error.response?.status === 422) {
        setValidationErrors(error.response.data.errors);
      }
    }
  };

  const handleDelete = async (studentExam: StudentExam) => {
    if (window.confirm(t('validation.confirmDeleteStudentExam'))) {
      try {
        await apiService.delete('stdExam', studentExam.id!);
        await fetchStudentExams();
      } catch (error) {
        console.error(t('messages.failedToDelete'), error);
      }
    }
  };

  // Filter student exams based on selected exam and search term
  const getFilteredStudentExams = () => {
    let filtered = studentExams;

    if (selectedExam) {
      filtered = filtered.filter(record => record.exam?.id === selectedExam);
    }

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.exam?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.exam?.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // Get students who haven't taken the selected exam
  const getStudentsNotTakenExam = () => {
    if (!selectedExam || !courseStudents.length) return [];

    const studentsWhoTookExam = studentExams
      .filter(record => record.exam?.id === selectedExam)
      .map(record => record.student?.id);

    return courseStudents.filter(student => 
      !studentsWhoTookExam.includes(student.id)
    );
  };

  const selectedExamData = exams.find(e => e.id === selectedExam);
  const filteredStudentExams = getFilteredStudentExams();
  const studentsNotTakenExam = getStudentsNotTakenExam();

  const examOptions = exams.map(exam => ({
    value: exam.id!,
    label: `${exam.title} - ${exam.course.title}`
  }));

  const columns = [
    { 
      key: 'student_name', 
      label: t('studentExams.studentName'),
      render: (_: any, record: StudentExamWithDetails) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-medium text-gray-900">
            {record.student?.name || t('common.notAvailable')}
          </span>
        </div>
      )
    },
    { 
      key: 'exam_name', 
      label: t('studentExams.examName'),
      render: (_: any, record: StudentExamWithDetails) => (
        <div className="flex items-center space-x-2">
          <Award className="w-4 h-4 text-purple-600" />
          <span className="text-gray-900">{record.exam?.title || t('common.notAvailable')}</span>
        </div>
      )
    },
    { 
      key: 'course_name', 
      label: t('studentExams.courseName'),
      render: (_: any, record: StudentExamWithDetails) => (
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-green-600" />
          <span className="text-gray-900">{record.exam?.course?.title || t('common.notAvailable')}</span>
        </div>
      )
    },
    { 
      key: 'max_mark', 
      label: t('studentExams.maxMark'),
      render: (_: any, record: StudentExamWithDetails) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {record.exam?.max_mark || 0}
        </span>
      )
    },
    { 
      key: 'passing_mark', 
      label: t('studentExams.passingMark'),
      render: (_: any, record: StudentExamWithDetails) => (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          {record.exam?.passing_mark || 0}
        </span>
      )
    },
    { 
      key: 'student_mark', 
      label: t('studentExams.studentMark'),
      render: (value: number, record: StudentExamWithDetails) => {
        const passingMark = record.exam?.passing_mark || 0;
        const isPassing = value >= passingMark;
        return (
          <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
            isPassing 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {value}
          </span>
        );
      }
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Select
            label={t('studentExams.selectExam')}
            value={selectedExam || ""}
            onChange={handleExamChange}
            options={examOptions}
          />

          {selectedExam && (
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <Input
                placeholder={t('studentExams.searchStudentExams')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          )}
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          {t('studentExams.addStudentExam')}
        </Button>
      </div>

      {/* Exam Details Card */}
      {selectedExamData && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2 text-purple-600" />
            {t('studentExams.examDetails')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">{t('studentExams.exam')}:</span>
              <p className="text-gray-800 font-semibold">{selectedExamData.title}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">{t('courses.title')}:</span>
              <p className="text-gray-800 font-semibold">{selectedExamData.course.title}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">{t('studentExams.maxMark')}:</span>
              <p className="text-blue-600 font-bold">{selectedExamData.max_mark}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">{t('studentExams.passingMark')}:</span>
              <p className="text-yellow-600 font-bold">{selectedExamData.passing_mark}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {selectedExam && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('studentExams.studentsTakenExam')}</p>
                <p className="text-2xl font-bold text-green-600">{filteredStudentExams.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('studentExams.studentsNotTaken')}</p>
                <p className="text-2xl font-bold text-red-600">{studentsNotTakenExam.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('studentExams.totalCourseStudents')}</p>
                <p className="text-2xl font-bold text-blue-600">{courseStudents.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Students Not Taken Exam */}
      {selectedExam && studentsNotTakenExam.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-md font-semibold text-yellow-800 mb-3 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            {t('studentExams.studentsNotTakenExam')} ({studentsNotTakenExam.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {studentsNotTakenExam.map(student => (
              <div key={student.id} className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-yellow-800 font-medium">{student.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Table */}
      <Table
        columns={columns}
        data={filteredStudentExams}
        onEdit={(studentExam) => {
          setEditingStudentExam(studentExam);
          setIsModalOpen(true);
        }}
        onDelete={handleDelete}
        loading={loading}
      />

      {/* Show message when no exam is selected */}
      {!selectedExam && !loading && (
        <div className="text-center py-12">
          <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('studentExams.selectExamToView')}
          </h3>
          <p className="text-gray-500">
            {t('studentExams.selectExamMessage')}
          </p>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStudentExam(null);
        }}
        title={editingStudentExam ? t('studentExams.editStudentExam') : t('studentExams.addStudentExam')}
        size="lg"
      >
        <StudentExamForm
          initialData={editingStudentExam}
          selectedExam={selectedExam}
          courseStudents={courseStudents}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingStudentExam(null);
          }}
          validationErrors={validationErrors}
        />
      </Modal>
    </div>
  );
};