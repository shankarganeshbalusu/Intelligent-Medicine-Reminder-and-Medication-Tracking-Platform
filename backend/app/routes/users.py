from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

@router.put("/me", response_model=schemas.UserResponse)
def update_profile(
    profile_in: schemas.ProfileUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if profile_in.name is not None:
        current_user.name = profile_in.name
    if profile_in.email is not None:
        # Check if email is already taken
        if profile_in.email != current_user.email:
            existing = db.query(models.User).filter(models.User.email == profile_in.email).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use"
                )
            current_user.email = profile_in.email
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/link-caregiver", response_model=schemas.AssociationResponse)
def link_caregiver(
    link_in: schemas.CaregiverLinkCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Only patients can invite caregivers
    if current_user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only patients can associate themselves with a caregiver"
        )
    
    # Find the caregiver
    caregiver = db.query(models.User).filter(
        models.User.email == link_in.caregiver_email,
        models.User.role == "caregiver"
    ).first()
    if not caregiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Caregiver with this email not found or does not have caregiver role"
        )
    
    # Check if link already exists
    existing = db.query(models.PatientCaregiver).filter(
        models.PatientCaregiver.patient_id == current_user.id,
        models.PatientCaregiver.caregiver_id == caregiver.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An association with this caregiver already exists (Status: {existing.status})"
        )
    
    new_link = models.PatientCaregiver(
        patient_id=current_user.id,
        caregiver_id=caregiver.id,
        status="pending"
    )
    db.add(new_link)
    db.commit()
    db.refresh(new_link)
    
    # Helper dict for mapping to response schema
    return {
        "id": new_link.id,
        "patient_id": new_link.patient_id,
        "caregiver_id": new_link.caregiver_id,
        "status": new_link.status,
        "created_at": new_link.created_at,
        "patient_name": current_user.name,
        "patient_email": current_user.email,
        "caregiver_name": caregiver.name,
        "caregiver_email": caregiver.email
    }


@router.post("/link-patient", response_model=schemas.AssociationResponse)
def link_patient(
    link_in: schemas.PatientLinkCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Only caregivers can invite patients
    if current_user.role != "caregiver":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only caregivers can request association with a patient"
        )
    
    # Find the patient
    patient = db.query(models.User).filter(
        models.User.email == link_in.patient_email,
        models.User.role == "patient"
    ).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient with this email not found or does not have patient role"
        )
    
    # Check if link already exists
    existing = db.query(models.PatientCaregiver).filter(
        models.PatientCaregiver.patient_id == patient.id,
        models.PatientCaregiver.caregiver_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An association with this patient already exists (Status: {existing.status})"
        )
    
    new_link = models.PatientCaregiver(
        patient_id=patient.id,
        caregiver_id=current_user.id,
        status="pending"
    )
    db.add(new_link)
    db.commit()
    db.refresh(new_link)
    
    return {
        "id": new_link.id,
        "patient_id": new_link.patient_id,
        "caregiver_id": new_link.caregiver_id,
        "status": new_link.status,
        "created_at": new_link.created_at,
        "patient_name": patient.name,
        "patient_email": patient.email,
        "caregiver_name": current_user.name,
        "caregiver_email": current_user.email
    }


@router.get("/associations", response_model=List[schemas.AssociationResponse])
def get_associations(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "patient":
        links = db.query(models.PatientCaregiver).filter(
            models.PatientCaregiver.patient_id == current_user.id
        ).all()
    elif current_user.role == "caregiver":
        links = db.query(models.PatientCaregiver).filter(
            models.PatientCaregiver.caregiver_id == current_user.id
        ).all()
    else:
        # Admins see all
        links = db.query(models.PatientCaregiver).all()
        
    res = []
    for link in links:
        res.append({
            "id": link.id,
            "patient_id": link.patient_id,
            "caregiver_id": link.caregiver_id,
            "status": link.status,
            "created_at": link.created_at,
            "patient_name": link.patient.name,
            "patient_email": link.patient.email,
            "caregiver_name": link.caregiver.name,
            "caregiver_email": link.caregiver.email
        })
    return res


@router.put("/associations/{link_id}", response_model=schemas.AssociationResponse)
def respond_to_link(
    link_id: int,
    status_update: str,  # "active" or "rejected"
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if status_update not in ["active", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'active' or 'rejected'"
        )
        
    link = db.query(models.PatientCaregiver).filter(
        models.PatientCaregiver.id == link_id
    ).first()
    
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link request not found"
        )
        
    # The response can be done by:
    # 1. The patient (if the caregiver invited them)
    # 2. The caregiver (if the patient invited them)
    # Basically, if they are involved in the link and not the sole initiator, or simple check:
    # Any of the parties involved can update the status
    if current_user.id != link.patient_id and current_user.id != link.caregiver_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to respond to this association request"
        )
        
    link.status = status_update
    db.commit()
    db.refresh(link)
    
    return {
        "id": link.id,
        "patient_id": link.patient_id,
        "caregiver_id": link.caregiver_id,
        "status": link.status,
        "created_at": link.created_at,
        "patient_name": link.patient.name,
        "patient_email": link.patient.email,
        "caregiver_name": link.caregiver.name,
        "caregiver_email": link.caregiver.email
    }


@router.put("/me/password", status_code=status.HTTP_200_OK)
def change_password(
    pwd_in: schemas.PasswordChange,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if not auth.verify_password(pwd_in.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    current_user.password_hash = auth.get_password_hash(pwd_in.new_password)
    db.commit()
    return {"status": "password updated successfully"}

