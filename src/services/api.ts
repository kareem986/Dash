import axios, { AxiosRequestConfig } from "axios";
import { BASE_URL } from "../constants";
import type { EntityType } from "../types";

class ApiService {
  private baseURL = BASE_URL;

  private getToken() {
    return localStorage.getItem("authToken");
  }

  private getAxiosConfig(data?: any): AxiosRequestConfig {
    const token = this.getToken();
    const isFormData = data instanceof FormData;

    return {
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        "ngrok-skip-browser-warning": "true",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  }
async getRecitationsByCourse(courseId: number) {
  const config = this.getAxiosConfig();
  const response = await axios.get(`${this.baseURL}/recitation/course/${courseId}`, config);
  return response.data;
}

  async create(entity: EntityType, data: any) {
    try {
      const isFormData = data instanceof FormData;
      const res = await axios.post(`${this.baseURL}/${entity}/store`, data, {
        headers: {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          "ngrok-skip-browser-warning": "true",
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
      });
      return res.data;
    } catch (error: any) {
      console.error(`❌ Failed to create ${entity}:`, error);
      console.error("Validation error details:", error.response?.data);
      throw error;
    }
  }

  async update(entity: EntityType, id: number, data: any) {
    try {
      const isFormData = data instanceof FormData;
      
      // Special handling for recitation updates
      if (entity === 'recitation' && data.course_id && data.lesson_id) {
        const res = await axios.post(
          `${this.baseURL}/recitation/update/${data.course_id}/${data.lesson_id}`,
          data,
          {
            headers: {
              ...(isFormData ? {} : { "Content-Type": "application/json" }),
              "ngrok-skip-browser-warning": "true",
              Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
            },
          }
        );
        return res.data;
      }
      
      // Default update for other entities
      const res = await axios.post(
        `${this.baseURL}/${entity}/update/${id}`,
        data,
        {
          headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            "ngrok-skip-browser-warning": "true",
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
          },
        }
      );
      return res.data;
    } catch (error: any) {
      console.error(`❌ Failed to update ${entity} with ID ${id}:`, error);
      console.error("Validation error details:", error.response?.data);
      throw error;
    }
  }

  async delete(entity: EntityType, id: number) {
    try {
      const config = this.getAxiosConfig();
      const url = `${this.baseURL}/${entity}/delete/${id}`;
      const response = await axios.delete(url, config);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to delete ${entity} with ID ${id}:`, error);
      throw error;
    }
  }

  async getAll(entity: EntityType) {
    try {
      const config = this.getAxiosConfig();
      const entityMap: Record<EntityType, string> = {
        courses: "courses",
        students: "students",
        instructors: "instructors",
        lessons: "lessons",
        exams: "exams",
        atten: "atten",
        stdExam: "stdExam",
        recitation: "recitation",
        courseFiles: "courseFiles",
      };
      const url = `${this.baseURL}/${entityMap[entity]}`;
      const response = await axios.get(url, config);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to fetch ${entity}:`, error);
      throw error;
    }
  }

  async getById(entity: EntityType, id: number) {
    try {
      const config = this.getAxiosConfig();
      const entityMap: Record<EntityType, string> = {
        courses: "courses",
        students: "students",
        instructors: "instructors",
        lessons: "lessons",
        exams: "exams",
        atten: "atten",
        stdExam: "stdExam",
        recitation: "recitation",
        courseFiles: "courseFiles",
      };
      const url = `${this.baseURL}/${entityMap[entity]}/${id}`;
      const response = await axios.get(url, config);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to fetch ${entity} by ID ${id}:`, error);
      throw error;
    }
  }

  async getCourseStudents(courseId: number) {
    try {
      const config = this.getAxiosConfig();
      const response = await axios.get(`${this.baseURL}/courses/${courseId}/students`, config);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to fetch students for course ${courseId}:`, error);
      throw error;
    }
  }

  async getCourseLessons(courseId: number) {
    try {
      const config = this.getAxiosConfig();
      const response = await axios.get(`${this.baseURL}/courses/${courseId}/lessons`, config);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to fetch lessons for course ${courseId}:`, error);
      throw error;
    }
  }

  async createRecitation(courseId: number, lessonId: number, data: any) {
    try {
      const config = this.getAxiosConfig(data);
      const response = await axios.post(
        `${this.baseURL}/recitation/store/${courseId}/${lessonId}`,
        data,
        config
      );
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to create recitation for course ${courseId}, lesson ${lessonId}:`, error);
      throw error;
    }
  }
}

export const apiService = new ApiService();