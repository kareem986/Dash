import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  Calendar,
  FileText,
  CheckSquare,
  Award,
  Mic,
  FolderOpen,
  Menu,
  X
} from 'lucide-react';

interface SidebarProps {
  activeEntity: string;
  setActiveEntity: (entity: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeEntity, 
  setActiveEntity, 
  isOpen, 
  setIsOpen 
}) => {
  const { t } = useTranslation();
  
  const navigationItems = [
    { id: 'courses', label: t('navigation.courses'), icon: BookOpen },
    { id: 'students', label: t('navigation.students'), icon: Users },
    { id: 'instructors', label: t('navigation.instructors'), icon: GraduationCap },
    { id: 'lessons', label: t('navigation.lessons'), icon: Calendar },
    { id: 'exams', label: t('navigation.exams'), icon: FileText },
    { id: 'attendance', label: t('navigation.attendance'), icon: CheckSquare },
    { id: 'studentExams', label: t('navigation.studentExams'), icon: Award },
    { id: 'recitation', label: t('navigation.recitation'), icon: Mic },
    { id: 'courseFiles', label: t('navigation.courseFiles'), icon: FolderOpen },
  ];
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-64 bg-[#0e4d3c] transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        <div className="flex items-center justify-between p-6 border-b border-green-600">
          <h1 className="text-xl font-bold text-white">Yakhtimoon</h1>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-white hover:text-[#C6953E] transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="mt-8">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeEntity === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveEntity(item.id);
                  setIsOpen(false);
                }}
                className={`
                  w-full flex items-center px-6 py-3 text-left transition-all duration-200
                  ${isActive 
                    ? 'bg-[#C6953E] text-white shadow-lg' 
                    : 'text-green-100 hover:bg-green-700 hover:text-white'
                  }
                `}
              >
                <Icon size={20} className="ml-3" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};