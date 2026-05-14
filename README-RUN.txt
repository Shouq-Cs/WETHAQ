WETHAQ Backend Database Version

How to run:
1. Open the WETHAQ-main folder in Visual Studio Code.
2. Open Terminal.
3. Go to backend folder:
   cd backend
4. Install packages:
   npm install
5. Start server:
   npm start
6. Open in browser:
   http://localhost:5000/index.html

Database file:
backend/database.json

This file stores:
- users
- complaints
- authorizedUsers
- logs

Authorized staff/admin accounts for testing:
Staff:
- staff1@ksu.edu.sa
- staff2@ksu.edu.sa

Admin:
- admin1@ksu.edu.sa

Important:
Staff/Admin registration works only if the email exists in authorizedUsers inside backend/database.json.
Students must use an email ending with @student.ksu.edu.sa.
Do not delete database.json if you want to keep saved users and complaints.
