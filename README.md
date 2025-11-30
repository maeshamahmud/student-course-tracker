# Student Course Tracker

A small full-stack web application that simulates a basic academic management system.  
An instructor can:

- Create courses
- Enroll students into courses
- Assign letter grades
- View:
  - All grades for a specific course
  - All courses taken by a specific student

Built with:

- Frontend: React + TypeScript (Vite)
- Backend: Node.js + Express
- Database: MySQL

# Step 1 : Clone
git clone HTTPS URL
cd student-course-tracker

# Step 2 : Install Dependencies
cd server
npm install

cd ../client
npm install

# Step 3 : Create Database

CREATE DATABASE IF NOT EXISTS myapp;
USE myapp;

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS enrollment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  grade VARCHAR(2),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

# Step 4 : .env file
create .env

put: 
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=myapp
PORT=8080

# Step 5 : start backend
npm start

you should see:
MySQL Connected!
Server listening on http://localhost:8080

# Step 6 : start frontend
cd client
npm run dev

thats it


