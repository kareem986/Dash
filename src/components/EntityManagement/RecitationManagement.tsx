import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Plus, Search } from "lucide-react";
import { Recitation, Course, Lesson } from "../../types";
import { apiService } from "../../services/api";
import { Button } from "../UI/Button";
import { Input } from "../UI/Input";
import { Select } from "../UI/Select";
import { Modal } from "../UI/Modal";
import { Table } from "../UI/Table";
import { RecitationForm } from "../Forms/RecitationForm";

interface RecitationResponse {
  course_id: string;
  course_title: string;
  recitations_by_lesson: {
    lesson_id: number;
    lesson_title: string;
    lesson_date: string;
    recitations: {
      student_id: number;
      student_name: string;
      student_img?: string;
      recitation_per_page: number[];
      recitation_evaluation: string;
      current_juz: string;
      current_juz_page: string;
      recitation_notes: string;
      homework: number[];
    }[];
  }[];
}

export const RecitationManagement: React.FC = () => {
  const { t } = useTranslation();
  const [recitations, setRecitations] = useState<Recitation[]>([]);
  const [tahfeezCourses, setTahfeezCourses] = useState<Course[]>([]);
  const [courseLessons, setCourseLessons] = useState<Lesson[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedCourseName, setSelectedCourseName] = useState<string>("");
  const [courseRecitations, setCourseRecitations] =
    useState<RecitationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecitation, setEditingRecitation] = useState<Recitation | null>(
    null
  );
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string[]>
  >({});
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const [pendingRecitations, setPendingRecitations] = useState<any[]>([]);
  const [infoMessage, setInfoMessage] = useState<string>("");

  const fetchTahfeezCourses = async () => {
    try {
      const response = await apiService.getAll("courses");
      const allCourses = response.courses || [];
      const tahfeezOnly = allCourses.filter(
        (course: Course) => course.type === "TahfeezCourse"
      );
      setTahfeezCourses(tahfeezOnly);
    } catch (error) {
      console.error(t('messages.failedToFetch'), error);
    }
  };

  const fetchRecitationsByCourse = async (courseId: number) => {
    setLoading(true);
    try {
      const data: RecitationResponse = await apiService.getRecitationsByCourse(
        courseId
      );
      setCourseRecitations(data);

      const flatRecitations: Recitation[] = [];
      data.recitations_by_lesson.forEach((lesson) => {
        lesson.recitations.forEach((recitation) => {
          flatRecitations.push({
            id: `${lesson.lesson_id}-${recitation.student_id}`,
            student_id: recitation.student_id,
            student_img: recitation.student_img || null,
            course_id: parseInt(data.course_id),
            lesson_id: lesson.lesson_id,
            recitation_per_page: recitation.recitation_per_page,
            recitation_evaluation: recitation.recitation_evaluation,
            current_juz: recitation.current_juz
              ? parseInt(recitation.current_juz.replace("Juz ", ""))
              : 1,
            current_juz_page: recitation.current_juz_page
              ? parseInt(recitation.current_juz_page)
              : 1,
            student_name: recitation.student_name,
            lesson_title: lesson.lesson_title,
            lesson_date: lesson.lesson_date,
            recitation_notes: recitation.recitation_notes,
            homework: recitation.homework,
          });
        });
      });

      setRecitations(flatRecitations);
    } catch (error) {
      console.error(t('messages.failedToFetch'), error);
      setRecitations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTahfeezCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    const selectedCourseData = tahfeezCourses.find(
      (course) => course.id === selectedCourse
    );
    const lessons = selectedCourseData?.lessons || [];
    setCourseLessons(lessons);
  }, [selectedCourse, tahfeezCourses]);

  const handleCourseChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const courseId = parseInt(e.target.value);
    if (!courseId) {
      setSelectedCourse(null);
      setSelectedCourseName("");
      setCourseRecitations(null);
      setCourseLessons([]);
      setRecitations([]);
      setPendingRecitations([]);
      setInfoMessage("");
      return;
    }

    setSelectedCourse(courseId);

    const selectedCourseData = tahfeezCourses.find(
      (course) => course.id === courseId
    );
    setSelectedCourseName(selectedCourseData?.title || "");

    await fetchRecitationsByCourse(courseId);
    setPendingRecitations([]);
    setInfoMessage("");
  };

  const handleEdit = (recitation: Recitation) => {
    setEditingRecitation(recitation);
    setSelectedStudent({
      id: recitation.student_id,
      name: recitation.student_name,
      student_img: recitation.student_img || null,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (recitationData: any) => {
    try {
      setValidationErrors({});

      if (editingRecitation) {
        const updateData = {
          ...recitationData,
          course_id: editingRecitation.course_id,
          lesson_id: editingRecitation.lesson_id,
          current_juz: recitationData.current_juz
            ? `Juz ${recitationData.current_juz.toString()}`
            : null,
          current_juz_page: recitationData.current_juz_page
            ? recitationData.current_juz_page.toString()
            : null,
        };

        await apiService.update("recitation", 0, updateData);
      } else {
        if (!selectedCourse || !recitationData.lesson_id) {
          throw new Error(t('validation.courseAndLessonRequired'));
        }

        const requestData = {
          recitations: recitationData.students.map((studentId: number) => ({
            student_id: studentId,
            recitation_per_page: recitationData.recitation_per_page || [],
            recitation_evaluation: recitationData.recitation_evaluation || null,
            current_juz: recitationData.current_juz
              ? `Juz ${recitationData.current_juz.toString()}`
              : null,
            recitation_notes: recitationData.recitation_notes || null,
            homework: recitationData.homework || [],
          })),
        };

        const response = await apiService.createRecitation(
          selectedCourse,
          recitationData.lesson_id,
          requestData
        );

        if (response?.data) {
          const data: RecitationResponse = response.data;
          const flatRecitations: Recitation[] = [];
          data.recitations_by_lesson.forEach((lesson) => {
            lesson.recitations.forEach((recitation) => {
              flatRecitations.push({
                id: `${lesson.lesson_id}-${recitation.student_id}`,
                student_id: recitation.student_id,
                student_img: recitation.student_img || null,
                course_id: parseInt(data.course_id),
                lesson_id: lesson.lesson_id,
                recitation_per_page: recitation.recitation_per_page,
                recitation_evaluation: recitation.recitation_evaluation,
                current_juz:
                  parseInt(recitation.current_juz.replace("Juz ", "")) || 1,
                current_juz_page: parseInt(recitation.current_juz_page) || 1,
                student_name: recitation.student_name,
                lesson_title: lesson.lesson_title,
                lesson_date: lesson.lesson_date,
                recitation_notes: recitation.recitation_notes,
                homework: recitation.homework,
              });
            });
          });
          setPendingRecitations(flatRecitations);
        }

        if (response?.message) {
          setInfoMessage(response.message);
        }
      }

      if (selectedCourse) {
        await fetchRecitationsByCourse(selectedCourse);
      }

      setIsModalOpen(false);
      setEditingRecitation(null);
      setSelectedStudent(null);
    } catch (error: any) {
      console.error(t('messages.failedToSave'), error);
      if (error.response?.status === 422) {
        setValidationErrors(error.response.data.errors);
      }
    }
  };

  const handleDelete = async (recitation: Recitation) => {
    if (
      window.confirm(t('validation.confirmDeleteRecitation'))
    ) {
      try {
        await apiService.delete("recitation", recitation.id!);
        if (selectedCourse) {
          await fetchRecitationsByCourse(selectedCourse);
        }
      } catch (error) {
        console.error(t('messages.failedToDelete'), error);
      }
    }
  };

  const filteredRecitations = recitations.filter(
    (record) =>
      record.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.lesson_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.recitation_evaluation
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const courseOptions = tahfeezCourses.map((course) => ({
    value: course.id!,
    label: course.title,
  }));

  const columns = [
    {
      key: "student_name",
      label: t('recitation.studentName'),
      render: (value: string) => (
        <span className="font-medium text-gray-900">{value || t('common.notAvailable')}</span>
      ),
    },
    {
      key: "lesson_title",
      label: t('recitation.lesson'),
      render: (value: string, row: Recitation) => (
        <div>
          <div className="font-medium">{value || t('common.notAvailable')}</div>
          <div className="text-sm text-gray-500">{row.lesson_date}</div>
        </div>
      ),
    },
    {
      key: "current_juz",
      label: t('recitation.currentJuz'),
      render: (value: number, row: Recitation) => (
        <span className="text-sm">
          {t('recitation.juz')} {value}, {t('recitation.page')} {row.current_juz_page}
        </span>
      ),
    },
    {
      key: "recitation_evaluation",
      label: t('recitation.evaluation'),
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === "Excellent"
              ? "bg-green-100 text-green-800"
              : value === "Good"
              ? "bg-blue-100 text-blue-800"
              : value === "Fair"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {t(`recitation.${value.toLowerCase()}`)}
        </span>
      ),
    },
    {
      key: "recitation_per_page",
      label: t('recitation.pagesRecited'),
      render: (value: number[]) => (
        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">
          {value?.length || 0} {t('recitation.pages')}
        </span>
      ),
    },
    {
      key: "homework",
      label: t('recitation.homework'),
      render: (value: number[]) => (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
          {value?.length || 0} {t('recitation.assignments')}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Select
            label={t('recitation.selectTahfeezCourse')}
            value={selectedCourse || ""}
            onChange={handleCourseChange}
            options={courseOptions}
          />

          {selectedCourse && (
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <Input
                placeholder={t('recitation.searchRecitations')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          )}
        </div>
        <Button onClick={() => setIsModalOpen(true)} disabled={!selectedCourse}>
          <Plus size={16} className="mr-2" />
          {t('recitation.addRecitation')}
        </Button>
      </div>

      {/* Course Info Display */}
      {selectedCourse && selectedCourseName && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {t('recitation.selectedCourse')}: {selectedCourseName}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">
                {t('recitation.availableLessons')}:
              </span>
              <p className="text-gray-800">{courseLessons.length}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">
                {t('recitation.recitationRecords')}:
              </span>
              <p className="text-gray-800">{filteredRecitations.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Show message when no course is selected */}
      {!selectedCourse && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">📚</div>
          <p className="text-gray-500">
            {t('recitation.selectCourseMessage')}
          </p>
        </div>
      )}

      {/* Main recitations table */}
      {selectedCourse && (
        <Table
          data={filteredRecitations}
          columns={columns}
          loading={loading}
          onEdit={(recitation: Recitation) => {
            setEditingRecitation(recitation);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
          validationErrors={validationErrors}
        />
      )}

      {/* New table to display the data from the create response */}
      {pendingRecitations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2 text-indigo-700">
            {infoMessage || t('messages.pendingRecitations')}
          </h3>
          <Table
            data={pendingRecitations}
            columns={columns}
            loading={false}
            // no edit/delete on this table
          />
        </div>
      )}

      {/* Modal for add/edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecitation(null);
          setValidationErrors({});
        }}
        title={editingRecitation ? t('recitation.editRecitation') : t('recitation.addRecitation')}
      >
        {Array.isArray(courseLessons) && (
          <>
            {console.log(
              "📥 Rendering RecitationForm with lessons:",
              courseLessons
            )}
            <RecitationForm
        recitation={editingRecitation || null}
        courseLessons={courseLessons}
        selectedStudent={selectedStudent}
        onSave={handleSave}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingRecitation(null);
          setSelectedStudent(null);
          setValidationErrors({});
        }}
        validationErrors={validationErrors}
      />
          </>
        )}
      </Modal>
    </div>
  );
};