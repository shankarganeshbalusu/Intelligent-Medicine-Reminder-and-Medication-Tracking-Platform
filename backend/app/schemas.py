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

