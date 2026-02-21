# Streaming-iostream-_LOC8W2

## AI-Powered Hackathon Lifecycle Platform  

**HACKATHON360** is a centralized, AI-integrated web platform designed to digitize the complete hackathon lifecycle — from secure student registration to real-time result declaration.  

Developed by **Team Streaming<iostream> for LOC 8.0**, it replaces manual paperwork, fragmented tools, and biased judging with a transparent, API-driven ecosystem.

---

## 🌟 KEY FEATURES  

### 🤖 AI & Integrity Engines  

- **AI Judging Assistant**  
  Integrates Gemini/LLM APIs to act as a co-judge, providing real-time marking suggestions and scoring justifications to assist human judges.

- **GitHub Authenticity Checker**  
  Uses GitHub APIs to analyze repository timelines, commit history, and contributor activity to discourage project reuse and ensure originality.

- **AI PPT Feedback System**  
  Generates instant structured feedback on innovation, clarity, and impact of project presentations.

- **Transparent Auto-Leaderboard**  
  Real-time ranking updates based on structured digital scoring inputs and AI-assisted evaluation.

---

### 🎟️ Smart Event Operations  

- **Fully QR-Driven Flow**  
  Entry, attendance, and meal access handled via dynamic, time-bound QR codes.

- **Admin Command Center**  
  Live dashboard to monitor attendance, scoring trends, and resource usage in real time.

- **Secure Student Verification**  
  Automated registration with ID uploads and email verification to prevent fake entries.

---
## 🏗️ TECH STACK  

**Frontend:** Next.js 14 + Tailwind CSS  
**Backend:** Supabase (PostgreSQL + Auth + Storage)  
**APIs:** GitHub REST API, Gemini / LLM APIs  
**Security:** Supabase Row Level Security (RLS), Time-Bound QR Validation  
**Deployment:** Vercel  

---

## 📐 SYSTEM WORKFLOW  

### 👤 Participant Side  
Registration → ID Verification → QR Generation → Project Submission (GitHub + PPT)

### 🔍 Verification Layer  
GitHub timeline analysis + AI-driven PPT feedback

### ⚙️ Operations  
Admin scans QR for attendance, entry, and meal distribution

### 🧑‍⚖️ Judging  
Secure login → AI Judging Assistant suggestions → Digital scoring by judges

### 📊 Output  
Live leaderboard → Result declaration → Archived audit trail

---

## 🗄️ DATABASE SCHEMA (SUPABASE)

### Participants  

<ul> <li>id</li> <li>name</li> <li>email</li> <li>problem_statement</li> <li>qr_code</li> <li>is_verified</li> <li>checked_in</li>
</ul>

### Submissions  

<ul> <li>id</li> <li>team_id</li> <li>github_url</li> <li>ppt_url</li> <li>auth_score</li> <li>ai_feedback</li> <li>ai_suggested_score</li>
</ul> 


### Scores  

<ul> <li>id</li> <li>submission_id</li> <li>innovation</li> <li>technical</li> <li>impact</li> <li>presentation</li> <li>total</li>
</ul> 


### Users / Roles  

<ul>  <li>id</li> <li>email</li> <li>role (Admin | Judge | Student)</li>
</ul> 


---

## 🛡️ CHALLENGES & MITIGATIONS  

**Fake GitHub repositories or manipulated commits**  
→ Deep timeline and contributor pattern analysis  

**AI bias or inconsistent scoring**  
→ Hybrid evaluation (AI assists, humans decide)  

**QR misuse or duplication**  
→ Time-bound dynamic QR codes with one-time validation  

---

# 🤝 HOW TO CONTRIBUTE  

> ⚠️ This project currently uses **direct collaboration (no forking).**  
> Contributors will work on role-specific branches.

---

## 🌿 Branch Structure  

- `main` → Admin / Core Platform  
- `judge` → Judge Panel Features  
- `student` → Participant Portal  

Work only on the branch relevant to your assigned role.

---

## 🛠️ Setup Steps  

### 1️⃣ Clone the Repository in your local

```bash
git clone https://github.com/your-org/Streaming-iostream-_LOC8W2.git
cd Streaming-iostream-_LOC8W2

### 2️⃣ Switch to Your Assigned Branch

```bash
git checkout judge
# OR
git checkout student
# OR
git checkout main
```

### 3️⃣ Create a Feature Branch

```bash
git checkout -b feature-your-module-name
```

### 4️⃣ Make Changes

```bash
git add .
git commit -m "Add: AI Judging Assistant UI integration"
```
Use clear, descriptive commit messages.

### 6️⃣ Push to Remote

```bash
git push origin feature-your-module-name
```

## 7️⃣ Open a Pull Request

Create a PR targeting your role branch:

- **Judge features → `judge`**
- **Student features → `student`**
- **Core/Admin features → `main`**

After review, changes will be merged.

---

## 📌 Contribution Guidelines

- ✔ Follow existing folder structure  
- ✔ Write clean, maintainable code  
- ✔ Ensure responsiveness and accessibility  
- ✔ Test features before submitting PR  
- ✔ Avoid breaking existing functionality  

---

## 🏁 Vision

**HACKATHON360 aims to make hackathons fair, transparent, scalable, and fully digital — empowering organizers, judges, and participants alike.**








