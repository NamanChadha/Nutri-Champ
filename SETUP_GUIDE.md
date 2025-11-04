# Nutri Champ - Setup Guide

## 🎉 What's New

### ✅ Database System
- All meal plans and food analyses are now saved to SQLite database
- User profiles include email for notifications
- Full persistence across sessions

### ✅ Email Notifications
- Automatic email sent when a 7-day meal plan is generated
- Beautiful HTML email with full meal plan breakdown
- Configure SMTP settings in `.env`

### ✅ Enhanced Meal Plan UI
- Stunning visual cards for each day
- Meal icons and color-coded design
- Hover animations and smooth transitions
- Day names (Monday-Sunday) instead of day_1, day_2, etc.

### ✅ Google Fitness Integration
- Connect Google Fit account
- Track daily steps and calories burned
- Display on dashboard

## 🔧 Backend Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables (.env)
Create `backend/.env` with:
```env
# Required
MY_API_KEY=your_gemini_api_key
SECRET_KEY=your_long_random_secret_key_here

# Email (for meal plan notifications)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=your_email@gmail.com

# Google Fitness (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5173/fitness-callback
```

### 3. Email Setup (Gmail Example)
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use app password in `SMTP_PASSWORD`

### 4. Google Fitness Setup
1. Go to https://console.cloud.google.com/
2. Create project → Enable Google Fitness API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `http://localhost:5173/fitness-callback`
5. Copy Client ID and Secret to `.env`

### 5. Initialize Database
The database will auto-create on first run. To reset:
```bash
rm nutri_champ.db
# Restart server to recreate
```

### 6. Run Backend
```bash
cd backend
uvicorn main:app --reload
```

## 🎨 Frontend Setup

### 1. Install Dependencies
```bash
cd Frontend
npm install
```

### 2. Run Frontend
```bash
npm run dev
```

## 📊 New API Endpoints

### Get Saved Meal Plans
```
GET /meal-plans
Returns: Array of saved meal plans for current user
```

### Get Food Analyses
```
GET /food-analyses
Returns: Array of saved food analyses for current user
```

### Google Fitness Auth
```
GET /google-fitness/auth-url
Returns: OAuth URL for Google Fitness

POST /google-fitness/token
Body: { "code": "oauth_code" }
Returns: Access tokens

GET /google-fitness/data
Returns: Steps and calories burned today
```

## 🗄️ Database Schema

### Users
- id, username, password_hash, email, name, age, height, weight, goal, created_at

### MealPlans
- id, user_id, title, meal_plan_data (JSON), nutrition_summary (JSON), restrictions, preferences, created_at

### FoodAnalyses
- id, user_id, food_name, image_filename, nutrition_data (JSON), created_at

## 🚀 Features Summary

1. **Database Persistence**: Everything is saved
2. **Email Notifications**: Meal plans sent via email
3. **Enhanced UI**: Beautiful meal plan cards with animations
4. **Google Fitness**: Track steps and calories
5. **Password Security**: Rate limiting, lockouts, strength meter
6. **Toast Notifications**: Modern UI feedback
7. **Animated Counters**: Stats count up on display

## 🎯 Quick Test Checklist

- [ ] Register with email
- [ ] Generate meal plan → Check email inbox
- [ ] Analyze food (text or image) → Saved to DB
- [ ] View enhanced meal plan UI
- [ ] Connect Google Fitness
- [ ] Change password
- [ ] View saved meal plans and analyses

## 📝 Notes

- Database file: `backend/nutri_champ.db`
- Email sends only if user has email in profile
- Google Fitness requires OAuth setup (see above)
- All meal plans and analyses are automatically saved

## 🐛 Troubleshooting

**Email not sending?**
- Check SMTP credentials in `.env`
- Verify app password (not regular password for Gmail)
- Check spam folder

**Google Fitness not working?**
- Ensure OAuth credentials are set in `.env`
- Verify redirect URI matches your frontend URL
- Check browser console for errors

**Database issues?**
- Delete `nutri_champ.db` and restart server
- Check file permissions



