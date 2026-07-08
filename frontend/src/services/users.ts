import api from './api';
import { User, Association, ProfileUpdateData, PasswordChangeData } from '../types';

export const usersService = {
  async getMe(): Promise<User> {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  async updateProfile(data: ProfileUpdateData): Promise<User> {
    const response = await api.put<User>('/users/me', data);
    return response.data;
  },

  async changePassword(data: PasswordChangeData): Promise<any> {
    const response = await api.put('/users/me/password', data);
    return response.data;
  },

  async linkCaregiver(caregiverEmail: string): Promise<Association> {
    const response = await api.post<Association>('/users/link-caregiver', { caregiver_email: caregiverEmail });
    return response.data;
  },

  async linkPatient(patientEmail: string): Promise<Association> {
    const response = await api.post<Association>('/users/link-patient', { patient_email: patientEmail });
    return response.data;
  },

  async getAssociations(): Promise<Association[]> {
    const response = await api.get<Association[]>('/users/associations');
    return response.data;
  },

  async respondToAssociation(id: number, statusUpdate: 'active' | 'rejected'): Promise<Association> {
    const response = await api.put<Association>(`/users/associations/${id}?status_update=${statusUpdate}`);
    return response.data;
  }
};
