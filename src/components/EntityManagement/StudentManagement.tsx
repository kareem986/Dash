import React, { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { Student } from "../../types";
import { apiService } from "../../services/api";
import { Button } from "../UI/Button";
import { Input } from "../UI/Input";
import { Modal } from "../UI/Modal";
import { Table } from "../UI/Table";
import { StudentForm } from "../Forms/StudentForm";

export const StudentManagement: React.FC = () => {
  const { t } = useTranslation();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAll("students");
      console.log("✅ students response:", response);
      setStudents(response.students || []); // لاحظ: بدون .data
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSave = async (studentData: FormData) => {
    try {
      setValidationErrors({});
      if (editingStudent?.id) {
        await apiService.update(
          "students",
          editingStudent.id,
          studentData,
          true
        ); // true هنا عشان يضيف هيدر FormData
      } else {
        await apiService.create("students", studentData, true); // نفس الشيء
      }
      await fetchStudents();
      setIsModalOpen(false);
      setEditingStudent(null);
    } catch (error: any) {
      console.error("Failed to save student:", error);
      if (error.response?.status === 422) {
        setValidationErrors(error.response.data.errors);
      }
    }
  };

  const handleDelete = async (student: Student) => {
    if (window.confirm(t('validation.confirmDeleteStudent'))) {
      try {
        await apiService.delete("students", student.id!);
        await fetchStudents();
      } catch (error) {
        console.error("Failed to delete student:", error);
      }
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: "name",
      label: t('students.name'),
      render: (value: string, row: Student) => (
        <div className="flex items-center space-x-3">
          {row.student_img && (
            <img
              src={row.student_img}
              alt={value}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    { key: "email", label: t('students.email') },
    { key: "phone_number", label: t('students.phone') },
    { key: "enroll_date", label: t('students.enrollmentDate') },
    {
      key: "quran_memorized_parts",
      label: t('students.memorizedParts'),
      render: (value: number[] | null | undefined) => (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
          {value?.length || 0} {t('students.parts')}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder={t('students.searchStudents')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 w-64"
            />
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          {t('students.addStudent')}
        </Button>
      </div>

      <Table
        columns={columns}
        data={filteredStudents}
        onEdit={(student) => {
          setEditingStudent(student);
          setIsModalOpen(true);
        }}
        onDelete={handleDelete}
        loading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStudent(null);
        }}
        title={editingStudent ? t('students.editStudent') : t('students.addStudent')}
        size="lg"
      >
        <StudentForm
          initialData={editingStudent}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingStudent(null);
          }}
          validationErrors={validationErrors}
        />
      </Modal>
    </div>
  );
};
