import React from 'react';
import { Menu, Bell, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
  activeEntity: string;
}

export const Header: React.FC<HeaderProps> = ({ setIsSidebarOpen, activeEntity }) => {
  const { t } = useTranslation();
  
  const getEntityTitle = (entity: string) => {
    const titles: Record<string, string> = {
      courses: t('titles.coursesManagement'),
      students: t('titles.studentsManagement'),
      instructors: t('titles.instructorsManagement'),
      lessons: t('titles.lessonsManagement'),
      exams: t('titles.examsManagement'),
      attendance: t('titles.attendanceManagement'),
      studentExams: t('titles.studentExamsManagement'),
      recitation: t('titles.recitationManagement'),
      courseFiles: t('titles.courseFilesManagement'),
    };
    return titles[entity] || t('titles.dashboard');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-[#0e4d3c] hover:bg-gray-100 transition-colors"
          >
            <Menu size={24} />
          </button>
          <h2 className="text-2xl font-semibold text-[#0e4d3c] mr-2 lg:mr-0">
            {getEntityTitle(activeEntity)}
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full text-gray-600 hover:text-[#0e4d3c] hover:bg-gray-100 transition-colors">
            <Bell size={20} />
          </button>
          <button className="p-2 rounded-full text-gray-600 hover:text-[#0e4d3c] hover:bg-gray-100 transition-colors">
            <User size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};