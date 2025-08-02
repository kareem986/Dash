import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Student } from "../../types";
import { QURAN_PARTS } from "../../constants";
import { Button } from "../UI/Button";
import { Input } from "../UI/Input";
import { MultiSelect } from "../UI/MultiSelect";
import { FileUpload } from "../UI/FileUpload";

interface StudentFormProps {
  initialData?: Student | null;
  onSave: (data: FormData) => void;
  onCancel: () => void;
  validationErrors?: Record<string, string[]>;
}

export const StudentForm: React.FC<StudentFormProps> = ({
  initialData,
  onSave,
  onCancel,
  validationErrors = {},
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Student>({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    certificate: "",
    student_img: "",
    birth_date: "",
    phone_number: "",
    address: "",
    enroll_date: "",
    notes: "",
    quran_memorized_parts: [],
    quran_passed_parts: [],
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        password_confirmation: "",
        quran_memorized_parts: initialData.quran_memorized_parts || [],
        quran_passed_parts: initialData.quran_passed_parts || [],
      });
    }
  }, [initialData]);

  const handleChange = (field: keyof Student, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      formData.password &&
      formData.password !== formData.password_confirmation
    ) {
      alert(t('validation.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("email", formData.email);
      form.append("password", formData.password);
      form.append("password_confirmation", formData.password_confirmation);
      form.append("certificate", formData.certificate || "");
      form.append("birth_date", formData.birth_date);
      form.append("phone_number", formData.phone_number);
      form.append("address", formData.address);
      form.append("enroll_date", formData.enroll_date);
      console.log("imageFile:", imageFile);
      form.append("notes", formData.notes || "");
      if (imageFile) {
        form.append("student_img", imageFile);
      }

      if (imageFile) {
        form.append("student_img", imageFile); // ✅ هذه أهم سطر
      }

      // ملاحظة: لازم تحول الآراي لسلسلة مفصولة بفواصل
      form.append(
        "quran_memorized_parts",
        JSON.stringify(formData.quran_memorized_parts)
      );
      form.append(
        "quran_passed_parts",
        JSON.stringify(formData.quran_passed_parts)
      );

      await onSave(form); // onSave لازم يقبل FormData الآن
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-8 py-6 border-b border-gray-100">
        <h3 className="text-xl font-semibold text-gray-900">
          {initialData ? t('students.editStudent') : t('students.addStudent')}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {initialData ? 'تحديث تفاصيل الطالب أدناه' : 'املأ التفاصيل لتسجيل طالب جديد'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Personal Information */}
        <div className="space-y-6">
          <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            {t('students.personalInformation')}
          </h4>
          
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label={t('students.fullName')}
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          required
          error={validationErrors.name?.[0]}
        />

        <Input
          label={t('students.email')}
          type="email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          required
          error={validationErrors.email?.[0]}
        />
        <div className="relative">
          <Input
            label={t('students.password')}
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            required={!initialData}
            error={validationErrors.password?.[0]}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-sm text-gray-500"
            tabIndex={-1}
          >
            {showPassword ? t('students.hide') : t('students.show')}
          </button>
        </div>

        <div className="relative">
          <Input
            label={t('students.confirmPassword')}
            type={showConfirmPassword ? "text" : "password"}
            value={formData.password_confirmation}
            onChange={(e) =>
              handleChange("password_confirmation", e.target.value)
            }
            required={!initialData}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-[38px] text-sm text-gray-500"
            tabIndex={-1}
          >
            {showConfirmPassword ? t('students.hide') : t('students.show')}
          </button>
        </div>

        <Input
          label={t('students.phoneNumber')}
          value={formData.phone_number}
          onChange={(e) => handleChange("phone_number", e.target.value)}
          required
          error={validationErrors.phone_number?.[0]}
        />

        <Input
          label={t('students.birthDate')}
          type="date"
          value={formData.birth_date}
          onChange={(e) => handleChange("birth_date", e.target.value)}
          required
          error={validationErrors.birth_date?.[0]}
        />

        <Input
          label={t('students.enrollmentDate')}
          type="date"
          value={formData.enroll_date}
          onChange={(e) => handleChange("enroll_date", e.target.value)}
          required
          error={validationErrors.enroll_date?.[0]}
        />
      </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-6">
          <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            {t('students.contactAddress')}
          </h4>
          
      <Input
        label={t('students.address')}
        value={formData.address}
        onChange={(e) => handleChange("address", e.target.value)}
        required
        error={validationErrors.address?.[0]}
      />
        </div>

        {/* Academic Information */}
        <div className="space-y-6">
          <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            {t('students.academicDetails')}
          </h4>
          
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label={t('students.certificate')}
          value={formData.certificate}
          onChange={(e) => handleChange("certificate", e.target.value)}
          error={validationErrors.certificate?.[0]}
        />
        <Input
          label={t('students.notes')}
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          error={validationErrors.notes?.[0]}
        />

        <FileUpload
          label={t('students.profileImage')}
          value={imageFile}
          onChange={setImageFile}
          helperText={t('students.uploadProfileImage')}
        />
      </div>
        </div>

        {/* Quran Progress */}
        <div className="space-y-6">
          <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            {t('students.quranProgress')}
          </h4>
          
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MultiSelect
          label={t('students.quranMemorizedParts')}
          options={QURAN_PARTS}
          value={formData.quran_memorized_parts}
          onChange={(value) => handleChange("quran_memorized_parts", value)}
          placeholder={t('students.selectMemorizedParts')}
          error={validationErrors.quran_memorized_parts?.[0]}
        />

        <MultiSelect
          label={t('students.quranPassedParts')}
          options={QURAN_PARTS}
          value={formData.quran_passed_parts}
          onChange={(value) => handleChange("quran_passed_parts", value)}
          placeholder={t('students.selectPassedParts')}
          error={validationErrors.quran_passed_parts?.[0]}
        />
      </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={loading} size="lg">
          {initialData ? t('students.updateStudent') : t('students.createStudent')}
        </Button>
      </div>
      </form>
    </div>
  );
};
