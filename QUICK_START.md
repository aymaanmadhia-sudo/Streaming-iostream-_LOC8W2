# 🚀 QUICK START - Run Your Website

## Step 1: Open Terminal
- Press `Windows + R`
- Type `cmd` and press Enter
- OR open PowerShell
- Navigate to your project:
  ```bash
  cd "c:\Users\Aymaan Madhia\hackathon-system"
  ```

## Step 2: Start the Server
```bash
npm run dev
```

Wait until you see:
```
✓ Ready in X seconds
○ Local: http://localhost:3000
```

## Step 3: Open Browser
Go to: **http://localhost:3000**

---

## If Port 3000 is Busy:
```bash
npm run dev:3001
```
Then go to: **http://localhost:3001**

---

## If npm run dev Fails:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Check Node.js:**
   ```bash
   node --version
   ```
   Should be v18 or higher. Download from nodejs.org if missing.

3. **Clear cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```
   (Windows: `rmdir /s .next`)

---

## All Pages:

- **Home:** http://localhost:3000
- **Student Register:** http://localhost:3000/student/register  
- **Student Login:** http://localhost:3000/student/login
- **Student Dashboard:** http://localhost:3000/student/dashboard
- **Submit Project:** http://localhost:3000/student/submit
- **Admin:** http://localhost:3000/admin
- **Judge:** http://localhost:3000/judge
- **Dashboard:** http://localhost:3000/dashboard

---

**The website runs on YOUR computer, not online. You must run `npm run dev` first!**
