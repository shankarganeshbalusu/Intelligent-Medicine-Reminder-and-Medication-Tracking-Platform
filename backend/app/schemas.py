from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str  # patient, caregiver, admin

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    notification_email: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role: str
    name: str
    email: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    notification_email: Optional[EmailStr] = None

# Caregiver Patient Link schemas
class CaregiverLinkCreate(BaseModel):
    caregiver_email: EmailStr

class PatientLinkCreate(BaseModel):
    patient_email: EmailStr

class AssociationResponse(BaseModel):
    id: int
    patient_id: int
    caregiver_id: int
    status: str
    created_at: datetime.datetime
    patient_name: str
    patient_email: str
    caregiver_name: str
    caregiver_email: str

    class Config:
        from_attributes = True

class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class MedicineCreate(BaseModel):
    name: str
    dosage: str
    quantity: int
    times_per_day: int
    duration_days: int
    custom_times: Optional[str] = None
    days_of_week: Optional[str] = "Daily"


class MedicineResponse(BaseModel):
    id: int
    name: str
    dosage: str
    quantity: int
    times_per_day: int
    start_date: datetime.datetime
    duration_days: int
    custom_times: Optional[str] = None
    days_of_week: Optional[str] = "Daily"
    source: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class ReminderResponse(BaseModel):
    id: int
    medicine_id: int
    dose_time: str
    reminder_date: datetime.datetime
    status: str
    created_at: datetime.datetime
    medicine_name: Optional[str] = None
    medicine_dosage: Optional[str] = None

    class Config:
        from_attributes = True


class MedicationLogResponse(BaseModel):
    id: int
    reminder_id: int
    user_id: int
    status: str
    logged_at: datetime.datetime
    medicine_name: Optional[str] = None
    dose_time: Optional[str] = None

    class Config:
        from_attributes = True


class GoogleAuthRequest(BaseModel):
    email: EmailStr
    name: str
    role: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str


class TestEmailRequest(BaseModel):
    email: EmailStr



