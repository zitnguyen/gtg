import axiosClient from '../api/axiosClient';

const classService = {
  // Get all classes
  getAll: (params) => {
    return axiosClient.get('/classes', { params });
  },
  
  // Get class by ID
  getById: (id) => {
    return axiosClient.get(`/classes/${id}`);
  },
  
  // Get classes for a specific teacher
  getByTeacher: (teacherId) => {
    return axiosClient.get(`/classes/teacher/${teacherId}`);
  },

  // Create new class
  create: (data) => {
    return axiosClient.post('/classes', data);
  },

  // Update class
  update: (id, data) => {
    return axiosClient.put(`/classes/${id}`, data);
  },
  addStudent: (classId, studentId) => {
    return axiosClient.post(`/classes/${classId}/students`, { studentId });
  },
  removeStudent: (classId, studentId) => {
    return axiosClient.delete(`/classes/${classId}/students/${studentId}`);
  },
  getEvents: (classId, params) => {
    return axiosClient.get(`/operations/classes/${classId}/events`, { params });
  },
  cancelSession: (classId, data) => {
    return axiosClient.post(`/operations/classes/${classId}/cancel-session`, data);
  },
  scheduleMakeup: (classId, data) => {
    return axiosClient.post(`/operations/classes/${classId}/makeup-session`, data);
  },
  substituteTeacher: (classId, data) => {
    return axiosClient.post(`/operations/classes/${classId}/substitute`, data);
  },
  joinWaitlist: (classId, data) => {
    return axiosClient.post(`/operations/classes/${classId}/waitlist`, data);
  },
  getWaitlist: (classId) => {
    return axiosClient.get(`/operations/classes/${classId}/waitlist`);
  },
  promoteWaitlist: (waitlistId) => {
    return axiosClient.post(`/operations/waitlist/${waitlistId}/promote`);
  },
  cancelWaitlist: (waitlistId) => {
    return axiosClient.delete(`/operations/waitlist/${waitlistId}`);
  },

  // Delete class
  delete: (id) => {
    return axiosClient.delete(`/classes/${id}`);
  }
};

export default classService;
