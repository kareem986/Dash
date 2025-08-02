import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Plus, Search } from "lucide-react";
import { Exam } from "../../types";
import { apiService } from "../../services/api";
import { Button } from "../UI/Button";
import { Input } from "../UI/Input";
import { Modal } from "../UI/Modal";
import { Table } from "../UI/Table";
import { ExamForm } from "../Forms/ExamForm";

export const ExamManagement: React.FC = () => {
  const { t } = useTranslation();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAll("exams");
      setExams(response.exams || []);
    } catch (error) {
      console.error(t('messages.failedToFetch'), error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleSave = async (examData: Exam) => {
    try {
      if (editingExam?.id) {
        await apiService.update("exams", editingExam.id, examData);
      } else {
        await apiService.create("exams", examData);
      }

      await fetchExams();
      setIsModalOpen(false);
      setEditingExam(null);
      setValidationErrors({});
    } catch (error: any) {
      console.error(t('messages.failedToSave'), error);
      if (error.response?.status === 422) {
        setValidationErrors(error.response.data.errors || {});
      }
    }
  };

  const handleDelete = async (exam: Exam) => {
    if (window.confirm(t('validation.confirmDeleteExam'))) {
      try {
        await apiService.delete("exams", exam.id!);
        await fetchExams();
      } catch (error) {
        console.error(t('messages.failedToDelete'), error);
      }
    }
  };

  const filteredExams = exams.filter((exam) =>
    exam.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: "title", label: t('exams.title') },
    { key: "exam_date", label: t('exams.date') },
    { key: "max_mark", label: t('exams.maxMark') },
    { key: "passing_mark", label: t('exams.passingMark') },
    { key: "course_id", label: t('exams.courseId') },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              placeholder={t('exams.searchExams')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} className="mr-2" />
          {t('exams.addExam')}
        </Button>
      </div>

      <Table
        columns={columns}
        data={filteredExams}
        onEdit={(exam) => {
          setEditingExam(exam);
          setIsModalOpen(true);
        }}
        onDelete={handleDelete}
        loading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExam(null);
        }}
        title={editingExam ? t('exams.editExam') : t('exams.addExam')}
        size="lg"
      >
        <ExamForm
          initialData={editingExam}
          onSave={handleSave}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingExam(null);
          }}
          validationErrors={validationErrors}
        />
      </Modal>
    </div>
  );
};