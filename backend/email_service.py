import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")  # Your email
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")  # App password
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)

def send_meal_plan_email(to_email: str, username: str, meal_plan_data: dict):
    """Send meal plan email notification"""
    if not SMTP_USER or not SMTP_PASSWORD or not to_email:
        print("Email config missing - skipping email send")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your 7-Day Meal Plan from Nutri Champ 🍽️"
        msg["From"] = FROM_EMAIL
        msg["To"] = to_email
        
        # Build HTML email
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c7a7b;">Hello {username}! 👋</h2>
              <p>Your personalized 7-day meal plan is ready!</p>
              
              <div style="background: #f0fff4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">📅 Weekly Meal Plan</h3>
                """
        
        # Add meal plan days
        meal_plan = meal_plan_data.get("meal_plan", {})
        for day, meals in meal_plan.items():
            day_name = day.replace("_", " ").title()
            html_body += f"""
                <div style="margin: 15px 0; padding: 10px; background: white; border-radius: 5px;">
                  <strong style="color: #2f855a;">{day_name}</strong>
                  <div style="margin-top: 8px;">
                    <div>🍳 <strong>Breakfast:</strong> {meals.get('breakfast', 'N/A')}</div>
                    <div>🥗 <strong>Lunch:</strong> {meals.get('lunch', 'N/A')}</div>
                    <div>🍽️ <strong>Dinner:</strong> {meals.get('dinner', 'N/A')}</div>
                    <div>🍎 <strong>Snacks:</strong> {meals.get('snacks', 'N/A')}</div>
                  </div>
                </div>
                """
        
        # Add nutrition summary
        nutrition = meal_plan_data.get("nutrition_summary", {})
        if nutrition:
            html_body += f"""
              <div style="background: #e6fffa; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <h3 style="margin-top: 0;">📊 Daily Nutrition Target</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                  <div>Calories: <strong>{nutrition.get('calories', 'N/A')}</strong></div>
                  <div>Protein: <strong>{nutrition.get('protein_g', 'N/A')}g</strong></div>
                  <div>Carbs: <strong>{nutrition.get('carbs_g', 'N/A')}g</strong></div>
                  <div>Fat: <strong>{nutrition.get('fat_g', 'N/A')}g</strong></div>
                </div>
              </div>
            """
        
        html_body += """
              <p style="margin-top: 30px;">Stay on track and reach your goals! 💪</p>
              <p style="color: #666; font-size: 12px;">- Nutri Champ Team</p>
            </div>
          </body>
        </html>
        """
        
        msg.attach(MIMEText(html_body, "html"))
        
        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"Email send error: {e}")
        return False

def send_verification_email(to_email: str, username: str, code: str):
    if not SMTP_USER or not SMTP_PASSWORD or not to_email:
        print("Email config missing - skipping verification email")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Verify your Nutri Champ email"
        msg["From"] = FROM_EMAIL
        msg["To"] = to_email
        html = f"""
        <html><body>
        <p>Hi {username},</p>
        <p>Your verification code is:</p>
        <h2 style='letter-spacing:4px'>{code}</h2>
        <p>Enter this code in the app to verify your email.</p>
        </body></html>
        """
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Verification email error: {e}")
        return False

def send_reset_email(to_email: str, username: str, token: str):
    if not SMTP_USER or not SMTP_PASSWORD or not to_email:
        print("Email config missing - skipping reset email")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Reset your Nutri Champ password"
        msg["From"] = FROM_EMAIL
        msg["To"] = to_email
        html = f"""
        <html><body>
        <p>Hi {username},</p>
        <p>Use this token to reset your password:</p>
        <h2 style='letter-spacing:2px'>{token}</h2>
        <p>If you didn't request this, ignore this email.</p>
        </body></html>
        """
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Reset email error: {e}")
        return False

