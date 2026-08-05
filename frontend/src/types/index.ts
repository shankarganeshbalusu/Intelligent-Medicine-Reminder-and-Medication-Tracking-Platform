export interface User {
  id: number;
  name: string;
  email: string;
  notification_email?: string;
  role: string;
  created_at: string;
}

export interface UserLoginCredentials {
  email: string;
  password_hash?: string;
  password?: string;
}

export interface UserRegisterData {
  name: string;
  email: string;
  password?: string;
  password_hash?: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  role: string;
  name: string;
  email: string;
}

export interface Association {
  id: number;
  patient_id: number;
  caregiver_id: number;
  status: string;
  created_at: string;
  patient_name: string;
  patient_email: string;
  caregiver_name: string;
  caregiver_email: string;
}

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  notification_email?: string;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

export interface Medicine {
  id: number;
  user_id: number;
  name: string;
  generic_name?: string;
  dosage: string;
  quantity: number;
  times_per_day: number;
  start_date: string;
  duration_days: number;
  custom_times?: string;
  days_of_week?: string;
  source: string;
  food_relation?: string;
  created_at: string;
}

export interface MedicineCreateData {
  name: string;
  generic_name?: string;
  dosage: string;
  quantity: number;
  times_per_day: number;
  duration_days: number;
  custom_times?: string;
  days_of_week?: string;
  food_relation?: string;
}

export interface Reminder {
  id: number;
  medicine_id: number;
  dose_time: string;
  reminder_date: string;
  status: string;
  created_at: string;
  medicine_name?: string;
  medicine_dosage?: string;
  medicine_food_relation?: string;
}

export interface MedicationLog {
  id: number;
  reminder_id: number;
  user_id: number;
  status: string;
  logged_at: string;
  medicine_name?: string;
  dose_time?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  token: string;
  new_password: string;
}

export interface GoogleAuthData {
  email: string;
  name: string;
  role: string;
}



