import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Course } from '../../types';
import { apiService } from '../../services/api';
// import { COURSE_TYPES } from '../../constants';
import { Button } from '../UI/Button';
import { Input } from '../UI/Input';
import { Modal } from '../UI/Modal';
import { Table } from '../UI/Table';
import { CourseForm } from '../Forms/CourseForm';

export const CourseManagement: React.FC = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

const fetchCourses = async () => {
  setLoading(true);
  try {
    const response = await apiService.getAll('courses');
    setCourses(response.courses || []); // ✅ التصحيح هون
  } catch (error) {
    console.error('Failed to fetch courses:', error);
  } finally {
    setLoading(false);
  }
};



  useEffect(() => {
    fetchCourses();
  }, []);
const handleSave = async (formData: FormData) => {
  try {
    // ✅ طباعة محتوى formData للتحقق من القيم المرسلة
    for (let pair of formData.entries()) {
      console.log(`📦 FormData field: ${pair[0]} =`, pair[1]);
    }

    if (editingCourse?.id) {
      await apiService.update('courses', editingCourse.id, formData, true);
    } else {
      await apiService.create('courses', formData, true);
    }

    await fetchCourses();
    setIsModalOpen(false);
    setEditingCourse(null);
  } catch (error: any) {
    console.error('❌ Failed to save course:', error);

    // ✅ طباعة الرد الكامل من الخادم
    console.error('📩 Full response data:', error.response?.data);

    // ✅ طباعة تفاصيل أخطاء التحقق فقط
    const validationErrors = error.response?.data?.errors;
    console.error('📄 Validation errors:', validationErrors);

    // إعادة رمي الأخطاء لنموذج CourseForm
    throw validationErrors || { general: ['حدث خطأ غير متوقع.'] };
  }
};




  const handleDelete = async (course: Course) => {
    if (window.confirm(t('validation.confirmDeleteCourse'))) {
      try {
        await apiService.delete('courses', course.id!);
        await fetchCourses();
      } catch (error) {
        console.error('Failed to delete course:', error);
      }
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: 'title', label: t('courses.title') },
    { 
      key: 'type', 
      label: t('courses.type'),
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'TahfeezCourse' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {value === 'TahfeezCourse' ? t('courses.tahfeezCourse') : t('courses.other')}
        </span>
      )
    },
    { key: 'level', label: t('courses.level') },
    { key: 'start_date', label: t('courses.startDate') },
    { key: 'expected_end_date', label: t('courses.expectedEndDate') },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder={t('courses.searchCourses')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 w-64"
            />
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          {t('courses.addCourse')}
        </Button>
      </div>

      <Table
        columns={columns}
        data={filteredCourses}
        onEdit={(course) => {
          setEditingCourse(course);
          setIsModalOpen(true);
        }}
        onDelete={handleDelete}
        loading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCourse(null);
        }}
        title={editingCourse ? t('courses.editCourse') : t('courses.addCourse')}
        size="lg"
      >
        <CourseForm
          initialData={editingCourse}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingCourse(null);
          }}
        />
      </Modal>
    </div>
  );
};