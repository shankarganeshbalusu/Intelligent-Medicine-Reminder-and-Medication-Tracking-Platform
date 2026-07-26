import api from './api';
import { Medicine, MedicineCreateData, Reminder, MedicationLog } from '../types';

export const medicinesService = {
  async createMedicine(data: MedicineCreateData): Promise<Medicine> {
    const response = await api.post<Medicine>('/medicines', data);
    return response.data;
  },

  async updateMedicine(id: number, data: MedicineCreateData): Promise<Medicine> {
    const response = await api.put<Medicine>(`/medicines/${id}`, data);
    return response.data;
  },

  async deleteMedicine(id: number): Promise<void> {
    await api.delete(`/medicines/${id}`);
  },

  async getMedicines(patientId?: number): Promise<Medicine[]> {
    const url = patientId ? `/medicines?patient_id=${patientId}` : '/medicines';
    const response = await api.get<Medicine[]>(url);
    return response.data;
  },

  async getTodayReminders(patientId?: number): Promise<Reminder[]> {
    const url = patientId ? `/medicines/reminders/today?patient_id=${patientId}` : '/medicines/reminders/today';
    const response = await api.get<Reminder[]>(url);
    return response.data;
  },

  async updateReminderStatus(id: number, statusUpdate: 'taken' | 'missed'): Promise<Reminder> {
    const response = await api.put<Reminder>(`/medicines/reminders/${id}/status?status_update=${statusUpdate}`);
    return response.data;
  },

  async getMedicationLogs(patientId?: number): Promise<MedicationLog[]> {
    const url = patientId ? `/medicines/medication-logs?patient_id=${patientId}` : '/medicines/medication-logs';
    const response = await api.get<MedicationLog[]>(url);
    return response.data;
  }
};
