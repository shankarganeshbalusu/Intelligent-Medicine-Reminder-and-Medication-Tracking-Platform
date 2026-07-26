from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from app import models, schemas, auth
from app.database import get_db

router = APIRouter(prefix="/medicines", tags=["medicines"])

def generate_reminders_for_medicine(db: Session, medicine: models.Medicine, start_from_date: datetime.date, end_date: datetime.date):
    if medicine.custom_times:
        times = [t.strip() for t in medicine.custom_times.split(",") if t.strip()]
    else:
        time_mappings = {
            1: ["09:00"],
            2: ["09:00", "21:00"],
            3: ["09:00", "14:00", "21:00"],
            4: ["09:00", "13:00", "18:00", "22:00"]
        }
        times = time_mappings.get(medicine.times_per_day, ["09:00"])

    selected_days = []
    if medicine.days_of_week and medicine.days_of_week != "Daily":
        selected_days = [d.strip() for d in medicine.days_of_week.split(",") if d.strip()]

    current_date = start_from_date
    while current_date <= end_date:
        weekday = current_date.strftime("%A")
        if not selected_days or weekday in selected_days:
            for t in times:
                reminder = models.Reminder(
                    medicine_id=medicine.id,
                    dose_time=t,
                    reminder_date=datetime.datetime.combine(current_date, datetime.time.min),
                    status="pending"
                )
                db.add(reminder)
        current_date += datetime.timedelta(days=1)

@router.post("", response_model=schemas.MedicineResponse, status_code=status.HTTP_201_CREATED)
def create_medicine(
    medicine_in: schemas.MedicineCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    db_medicine = models.Medicine(
        user_id=current_user.id,
        name=medicine_in.name,
        dosage=medicine_in.dosage,
        quantity=medicine_in.quantity,
        times_per_day=medicine_in.times_per_day,
        duration_days=medicine_in.duration_days,
        custom_times=medicine_in.custom_times,
        days_of_week=medicine_in.days_of_week,
        source="manual"
    )
    db.add(db_medicine)
    db.commit()
    db.refresh(db_medicine)

    start_date = datetime.date.today()
    end_date = start_date + datetime.timedelta(days=medicine_in.duration_days - 1)
    generate_reminders_for_medicine(db, db_medicine, start_date, end_date)
    db.commit()
    
    return db_medicine

@router.get("", response_model=List[schemas.MedicineResponse])
def get_medicines(
    patient_id: Optional[int] = None,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if patient_id:
        # Check caregiver link status
        link = db.query(models.PatientCaregiver).filter(
            models.PatientCaregiver.patient_id == patient_id,
            models.PatientCaregiver.caregiver_id == current_user.id,
            models.PatientCaregiver.status == "active"
        ).first()
        if not link and current_user.id != patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to view this patient's medicines"
            )
        user_id = patient_id
    else:
        user_id = current_user.id

    return db.query(models.Medicine).filter(models.Medicine.user_id == user_id).all()

@router.get("/reminders/today", response_model=List[schemas.ReminderResponse])
def get_today_reminders(
    patient_id: Optional[int] = None,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if patient_id:
        # Check caregiver link status
        link = db.query(models.PatientCaregiver).filter(
            models.PatientCaregiver.patient_id == patient_id,
            models.PatientCaregiver.caregiver_id == current_user.id,
            models.PatientCaregiver.status == "active"
        ).first()
        if not link and current_user.id != patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to view this patient's reminders"
            )
        user_id = patient_id
    else:
        user_id = current_user.id

    today_start = datetime.datetime.combine(datetime.date.today(), datetime.time.min)
    
    db_reminders = db.query(models.Reminder).join(models.Medicine).filter(
        models.Medicine.user_id == user_id,
        models.Reminder.reminder_date == today_start
    ).all()

    res = []
    for r in db_reminders:
        res.append({
            "id": r.id,
            "medicine_id": r.medicine_id,
            "dose_time": r.dose_time,
            "reminder_date": r.reminder_date,
            "status": r.status,
            "created_at": r.created_at,
            "medicine_name": r.medicine.name,
            "medicine_dosage": r.medicine.dosage
        })
    return res

@router.put("/reminders/{reminder_id}/status", response_model=schemas.ReminderResponse)
def update_reminder_status(
    reminder_id: int,
    status_update: str,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if status_update not in ["taken", "missed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be 'taken' or 'missed'"
        )

    reminder = db.query(models.Reminder).filter(models.Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found"
        )

    if reminder.medicine.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this reminder"
        )

    # Decrement stock count if marking as taken
    if status_update == "taken" and reminder.status != "taken":
        if reminder.medicine.quantity > 0:
            reminder.medicine.quantity -= 1
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Medication stock is empty. Please refill."
            )

    reminder.status = status_update
    
    # Create logs history record
    log = models.MedicationLog(
        reminder_id=reminder.id,
        user_id=current_user.id,
        status=status_update
    )
    db.add(log)
    db.commit()
    db.refresh(reminder)

    return {
        "id": reminder.id,
        "medicine_id": reminder.medicine_id,
        "dose_time": reminder.dose_time,
        "reminder_date": reminder.reminder_date,
        "status": reminder.status,
        "created_at": reminder.created_at,
        "medicine_name": reminder.medicine.name,
        "medicine_dosage": reminder.medicine.dosage
    }

@router.get("/medication-logs", response_model=List[schemas.MedicationLogResponse])
def get_medication_logs(
    patient_id: Optional[int] = None,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if patient_id:
        # Check caregiver link status
        link = db.query(models.PatientCaregiver).filter(
            models.PatientCaregiver.patient_id == patient_id,
            models.PatientCaregiver.caregiver_id == current_user.id,
            models.PatientCaregiver.status == "active"
        ).first()
        if not link and current_user.id != patient_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to view this patient's logs"
            )
        user_id = patient_id
    else:
        user_id = current_user.id

    logs = db.query(models.MedicationLog).filter(
        models.MedicationLog.user_id == user_id
    ).order_by(models.MedicationLog.logged_at.desc()).all()
    
    res = []
    for l in logs:
        res.append({
            "id": l.id,
            "reminder_id": l.reminder_id,
            "user_id": l.user_id,
            "status": l.status,
            "logged_at": l.logged_at,
            "medicine_name": l.reminder.medicine.name if l.reminder else "Unknown",
            "dose_time": l.reminder.dose_time if l.reminder else "Unknown"
        })
    return res

@router.put("/{medicine_id}", response_model=schemas.MedicineResponse)
def update_medicine(
    medicine_id: int,
    medicine_in: schemas.MedicineCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found"
        )
    if medicine.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this medicine"
        )

    medicine.name = medicine_in.name
    medicine.dosage = medicine_in.dosage
    medicine.quantity = medicine_in.quantity
    medicine.times_per_day = medicine_in.times_per_day
    medicine.duration_days = medicine_in.duration_days
    medicine.custom_times = medicine_in.custom_times
    medicine.days_of_week = medicine_in.days_of_week
    
    db.query(models.Reminder).filter(
        models.Reminder.medicine_id == medicine_id,
        models.Reminder.status == "pending"
    ).delete()

    today_date = datetime.date.today()
    start_from = max(medicine.start_date.date(), today_date)
    end_date = medicine.start_date.date() + datetime.timedelta(days=medicine.duration_days - 1)
    
    if start_from <= end_date:
        generate_reminders_for_medicine(db, medicine, start_from, end_date)

    db.commit()
    db.refresh(medicine)
    return medicine

@router.delete("/{medicine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medicine(
    medicine_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found"
        )
    if medicine.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this medicine"
        )

    db.delete(medicine)
    db.commit()
    return None

