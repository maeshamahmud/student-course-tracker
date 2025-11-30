import express from "express";
import mysql from "mysql2";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 8080;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("MySQL Connection Error:", err);
  } else {
    console.log("MySQL Connected!");
  }
});

app.get("/", (req, res) => {
  res.send("Student Course Tracker API is running");
});

app.post("/courses", (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Course name is required" });
  }

  const sql = "INSERT INTO courses (name) VALUES (?)";

  db.query(sql, [name.trim()], (err, result) => {
    if (err) {
      console.error("Error inserting course:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.status(201).json({
      id: result.insertId,
      name: name.trim(),
    });
  });
});

app.post("/students", (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Student name is required" });
  }

  const sql = "INSERT INTO students (name) VALUES (?)";

  db.query(sql, [name.trim()], (err, result) => {
    if (err) {
      console.error("Error inserting student:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.status(201).json({
      id: result.insertId,
      name: name.trim(),
    });
  });
});

app.post("/enrollments", (req, res) => {
  const { studentId, courseId, grade } = req.body;

  if (!studentId || !courseId || !grade || !grade.trim()) {
    return res
      .status(400)
      .json({ error: "studentId, courseId and grade are required" });
  }

  const sql =
    "INSERT INTO enrollment (student_id, course_id, grade) VALUES (?, ?, ?)";

  db.query(sql, [studentId, courseId, grade.trim()], (err, result) => {
    if (err) {
      console.error("Error inserting enrollment:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.status(201).json({
      id: result.insertId,
      studentId,
      courseId,
      grade: grade.trim(),
    });
  });
});

app.get("/courses/:id/grades", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      c.id AS course_id,
      c.name AS course_name,
      s.id AS student_id,
      s.name AS student_name,
      e.grade
    FROM courses c
    LEFT JOIN enrollment e ON c.id = e.course_id
    LEFT JOIN students s ON s.id = e.student_id
    WHERE c.id = ?;
  `;

  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error("Error fetching course grades:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(rows);
  });
});

app.get("/students/:id/courses", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      s.id AS student_id,
      s.name AS student_name,
      c.id AS course_id,
      c.name AS course_name,
      e.grade
    FROM students s
    LEFT JOIN enrollment e ON s.id = e.student_id
    LEFT JOIN courses c ON c.id = e.course_id
    WHERE s.id = ?;
  `;

  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error("Error fetching student courses:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(rows);
  });
});

app.get("/courses-by-name", (req, res) => {
    const { name } = req.query;
  
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Course name is required" });
    }
  
    const sql = `
      SELECT 
        c.id AS course_id,
        c.name AS course_name,
        s.id AS student_id,
        s.name AS student_name,
        e.grade
      FROM courses c
      LEFT JOIN enrollment e ON c.id = e.course_id
      LEFT JOIN students s ON s.id = e.student_id
      WHERE c.name = ?;
    `;
  
    db.query(sql, [name.trim()], (err, rows) => {
      if (err) {
        console.error("Error fetching course grades by name:", err);
        return res.status(500).json({ error: "Database error" });
      }
  
      res.json(rows);
    });
  });
  
  app.get("/students-by-name", (req, res) => {
    const { name } = req.query;
  
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Student name is required" });
    }
  
    const sql = `
      SELECT 
        s.id AS student_id,
        s.name AS student_name,
        c.id AS course_id,
        c.name AS course_name,
        e.grade
      FROM students s
      LEFT JOIN enrollment e ON s.id = e.student_id
      LEFT JOIN courses c ON c.id = e.course_id
      WHERE s.name = ?;
    `;
  
    db.query(sql, [name.trim()], (err, rows) => {
      if (err) {
        console.error("Error fetching student courses by name:", err);
        return res.status(500).json({ error: "Database error" });
      }
  
      res.json(rows);
    });
  });  

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
