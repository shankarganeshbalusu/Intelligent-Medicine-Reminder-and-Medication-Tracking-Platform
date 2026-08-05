import asyncio
import datetime
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy.orm import Session

from app import models
from app.database import SessionLocal

# SMTP settings (loaded from environment variables if present)
SMTP_SERVER = os.getenv("SMTP_SERVER", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "noreply@pillsync.com")

import subprocess
import os

def send_email_notification(to_email: str, subject: str, html_body: str):
    """Sends email via Node.js send_email.js script using Nodemailer."""
    try:
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        script_path = os.path.join(backend_dir, "send_email.js")
        
        # Check if the correct Node.js binary is installed in AppData
        node_bin = "node"
        appdata_node = r"C:\Users\MY PC\AppData\Local\nodejs\node.exe"
        if os.path.exists(appdata_node):
            node_bin = appdata_node
            
        result = subprocess.run(
            [node_bin, script_path, to_email, subject, html_body],
            capture_output=True,
            text=True,
            cwd=backend_dir,
            check=True
        )
        
        stdout = result.stdout.encode('ascii', 'ignore').decode('ascii')
        print(f"[NODEMAILER EMAIL DISPATCHER]\n{stdout}")
    except subprocess.CalledProcessError as e:
        safe_stdout = (e.stdout or "").encode('ascii', 'ignore').decode('ascii')
        safe_stderr = (e.stderr or "").encode('ascii', 'ignore').decode('ascii')
        print(f"[NODEMAILER EMAIL DISPATCHER ERROR] Script failed with status {e.returncode}")
        print(f"Stdout: {safe_stdout}")
        print(f"Stderr: {safe_stderr}")
    except Exception as e:
        safe_err = str(e).encode('ascii', 'ignore').decode('ascii')
        print(f"[NODEMAILER EMAIL DISPATCHER ERROR] Unexpected failure: {safe_err}")


def print_mock_email(to_email: str, subject: str, html_body: str):
    """Fallback mock print representation of the email notification."""
    try:
        title_str = "[EMAIL NOTIFICATION] (Local Mock Mode)"
        to_str = f"To:      {to_email}"
        sub_str = f"Subject: {subject}"
        
        import re
        clean_text = html_body.replace("<p>", "").replace("</p>", "\n").replace("<strong>", "").replace("</strong>", "").replace("<br>", "\n")
        clean_text = re.sub(r'<[^>]*>', '', clean_text)
        clean_text = "\n".join([line.strip() for line in clean_text.splitlines() if line.strip()])
        
        def safe_print(msg: str):
            print(msg.encode('ascii', 'ignore').decode('ascii'))
            
        safe_print("=" * 70)
        safe_print(title_str)
        safe_print(to_str)
        safe_print(sub_str)
        safe_print("-" * 70)
        safe_print(clean_text)
        safe_print("=" * 70)
    except Exception as e:
        print(f"[MOCK EMAIL ERROR] Failed to print mock logs: {e}")


async def check_and_send_reminders():
    """Background task to poll and check reminders every 60 seconds."""
    while True:
        try:
            db: Session = SessionLocal()
            now = datetime.datetime.now()
            today_date = datetime.datetime.combine(datetime.date.today(), datetime.time.min)
            current_time_str = now.strftime("%H:%M")
            
            # 1. Check for active reminders due in the current minute
            due_reminders = db.query(models.Reminder).join(models.Medicine).filter(
                models.Reminder.reminder_date == today_date,
                models.Reminder.dose_time == current_time_str,
                models.Reminder.status == "pending",
                models.Medicine.notifications_enabled == True
            ).all()

            for reminder in due_reminders:
                patient = reminder.medicine.user
                recipient = patient.notification_email or patient.email
                if not recipient:
                    print(f"[EMAIL SENDER] Skipped reminder {reminder.id} for {patient.name} - no notification email configured.")
                    reminder.status = "notified"
                    continue
                
                import random
                quotes = [
                    "Health is wealth.",
                    "To keep the body in good health is a duty. Otherwise, we shall not be able to keep our mind strong and clear. - Buddha",
                    "A healthy outside starts from the inside. - Robert Urich",
                    "He who has health has hope; and he who has hope has everything. - Arabian Proverb",
                    "Your body is a temple, but only if you treat it as one. - Astrid Alauda",
                    "An apple a day keeps the doctor away.",
                    "Health is not valued till sickness comes. - Thomas Fuller",
                    "The first wealth is health. - Ralph Waldo Emerson"
                ]
                quote = random.choice(quotes)
                
                subject = f"💊 PillSync Reminder: Time to take {reminder.medicine.name}"
                html_body = f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                  <h2 style="color: #0f172a; margin-bottom: 16px;">💊 PillSync Medication Reminder</h2>
                  <p style="color: #475569; font-size: 14px; line-height: 1.5;">Hello <strong>{patient.name}</strong>,</p>
                  <p style="color: #475569; font-size: 14px; line-height: 1.5;">This is a reminder to take your scheduled dose of <strong>{reminder.medicine.name} ({reminder.medicine.dosage})</strong>.</p>
                  <p style="color: #475569; font-size: 14px; line-height: 1.5;">Scheduled time: <strong>{reminder.dose_time}</strong> today.</p>
                  
                  <p style="margin: 24px 0; text-align: left;">
                    <a href="http://localhost:5173/medicines" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">Confirm Taking Medication</a>
                  </p>
                  
                  <p style="color: #475569; font-size: 12px; line-height: 1.5;">Or open the link directly: <a href="http://localhost:5173/medicines" style="color: #10b981; text-decoration: underline;">http://localhost:5173/medicines</a></p>
                  
                  <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
                    <span style="display: block; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #10b981; margin-bottom: 4px;">Motivational Health Quote</span>
                    <p style="color: #334155; font-size: 14px; font-style: italic; margin: 0;">"{quote}"</p>
                  </div>
                  
                  <p style="color: #64748b; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 24px;">PillSync Intelligent Medicine Tracker</p>
                </div>
                """
                
                send_email_notification(recipient, subject, html_body)
                
                # Set reminder notified state
                reminder.status = "notified"
            
            # 2. Check for overdue reminders (marked notified for > 1 hour and not actioned)
            # Find reminders scheduled today or in the past with status "notified" or "pending" that are overdue
            overdue_cutoff = now - datetime.timedelta(hours=1)
            overdue_time_str = overdue_cutoff.strftime("%H:%M")
            
            overdue_reminders = db.query(models.Reminder).join(models.Medicine).filter(
                models.Reminder.reminder_date <= today_date,
                models.Reminder.status.in_(["pending", "notified"])
            ).all()
            
            for r in overdue_reminders:
                # Parse dose time hour and minute
                try:
                    dose_hour, dose_min = map(int, r.dose_time.split(":"))
                    dose_dt = datetime.datetime.combine(r.reminder_date.date(), datetime.time(dose_hour, dose_min))
                    
                    if dose_dt < overdue_cutoff:
                        # Mark reminder as missed
                        r.status = "missed"
                        
                        # Add medication compliance log
                        log = models.MedicationLog(
                            reminder_id=r.id,
                            user_id=r.medicine.user_id,
                            status="missed"
                        )
                        db.add(log)
                        
                        # Fetch caregiver connection relationship
                        patient = r.medicine.user
                        caregiver_link = db.query(models.PatientCaregiver).filter(
                            models.PatientCaregiver.patient_id == patient.id,
                            models.PatientCaregiver.status == "active"
                        ).first()
                        
                        if r.medicine.notifications_enabled and caregiver_link:
                            caregiver = caregiver_link.caregiver
                            caregiver_recipient = caregiver.notification_email or caregiver.email
                            if caregiver_recipient:
                                caregiver_subject = f"⚠️ Alert: Patient {patient.name} missed a dose"
                                caregiver_html = f"""
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                                  <h2 style="color: #ef4444; margin-bottom: 16px;">⚠️ PillSync Adherence Alert</h2>
                                  <p style="color: #475569; font-size: 14px; line-height: 1.5;">Hello <strong>{caregiver.name}</strong>,</p>
                                  <p style="color: #475569; font-size: 14px; line-height: 1.5;">This is an automated alert. Patient <strong>{patient.name}</strong> has missed their scheduled dose of <strong>{r.medicine.name} ({r.medicine.dosage})</strong>.</p>
                                  <p style="color: #475569; font-size: 14px; line-height: 1.5;">Scheduled time was: <strong>{r.dose_time}</strong> on <strong>{r.reminder_date.strftime('%Y-%m-%d')}</strong>.</p>
                                  
                                  <p style="margin: 24px 0; text-align: left;">
                                    <a href="http://localhost:5173/dashboard" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);">Open Caregiver Dashboard</a>
                                  </p>
                                  
                                  <p style="color: #475569; font-size: 12px; line-height: 1.5;">Or open the link directly: <a href="http://localhost:5173/dashboard" style="color: #ef4444; text-decoration: underline;">http://localhost:5173/dashboard</a></p>
                                  <p style="color: #475569; font-size: 14px; line-height: 1.5;">Please check in with the patient to ensure adherence.</p>
                                  <p style="color: #64748b; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-top: 24px;">PillSync Tracking Engine</p>
                                </div>
                                """
                                send_email_notification(caregiver_recipient, caregiver_subject, caregiver_html)
                            else:
                                print(f"[EMAIL SENDER] Skipped caregiver alert for {caregiver.name} - no notification email configured.")
                except ValueError:
                    continue # Skip invalid time strings
            
            db.commit()
            db.close()
        except Exception as err:
            print(f"[BACKGROUND WORKER ERROR]: {err}")
            
        # Poll database every 60 seconds
        await asyncio.sleep(60)
