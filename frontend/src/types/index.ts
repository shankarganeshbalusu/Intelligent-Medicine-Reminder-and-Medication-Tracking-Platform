export interface User {
  id: number;
  name: string;
  email: string;
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
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

