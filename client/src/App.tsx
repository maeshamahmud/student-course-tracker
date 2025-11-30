import { useState } from "react";
import "./index.css";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
});

type RowStatus = "editing" | "saved";

interface StudentRow {
  tempId: number;
  studentName: string;
  studentId?: number;
  grade: string;
  status: RowStatus;
  loading: boolean;
  error?: string;
}

interface CourseBox {
  tempId: number;
  courseName: string;
  courseId?: number;
  loading: boolean;
  error?: string;
  students: StudentRow[];
}

interface CourseGradeRow {
  course_id: number;
  course_name: string;
  student_id: number | null;
  student_name: string | null;
  grade: string | null;
}

interface StudentCourseRow {
  student_id: number;
  student_name: string;
  course_id: number | null;
  course_name: string | null;
  grade: string | null;
}

function App() {
  const [courses, setCourses] = useState<CourseBox[]>([]);

  const [courseSummaryName, setCourseSummaryName] = useState<string>("");
  const [studentSummaryName, setStudentSummaryName] = useState<string>("");

  const [courseSummary, setCourseSummary] = useState<CourseGradeRow[] | null>(
    null
  );
  const [studentSummary, setStudentSummary] =
    useState<StudentCourseRow[] | null>(null);

  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const addCourseBox = () => {
    setCourses((prev) => [
      ...prev,
      {
        tempId: Date.now(),
        courseName: "",
        courseId: undefined,
        loading: false,
        error: undefined,
        students: [],
      },
    ]);
  };

  const updateCourse = (tempId: number, updates: Partial<CourseBox>) => {
    setCourses((prev) =>
      prev.map((c) => (c.tempId === tempId ? { ...c, ...updates } : c))
    );
  };

  const handleCourseNameChange = (tempId: number, value: string) => {
    updateCourse(tempId, { courseName: value });
  };

  const saveCourse = async (box: CourseBox) => {
    if (!box.courseName.trim()) return;

    updateCourse(box.tempId, { loading: true, error: undefined });

    try {
      const res = await api.post("/courses", { name: box.courseName.trim() });
      const { id } = res.data;

      updateCourse(box.tempId, {
        courseId: id,
        loading: false,
      });
    } catch (err) {
      console.error(err);
      updateCourse(box.tempId, {
        loading: false,
        error: "Failed to save course",
      });
    }
  };


  const updateStudentRow = (
    courseTempId: number,
    rowTempId: number,
    updates: Partial<StudentRow>
  ) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.tempId === courseTempId
          ? {
              ...course,
              students: course.students.map((row) =>
                row.tempId === rowTempId ? { ...row, ...updates } : row
              ),
            }
          : course
      )
    );
  };

  const addStudentRow = (courseTempId: number) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.tempId === courseTempId
          ? {
              ...course,
              students: [
                ...course.students,
                {
                  tempId: Date.now() + Math.random(),
                  studentName: "",
                  studentId: undefined,
                  grade: "",
                  status: "editing",
                  loading: false,
                },
              ],
            }
          : course
      )
    );
  };

  const handleStudentNameChange = (
    courseTempId: number,
    rowTempId: number,
    value: string
  ) => {
    updateStudentRow(courseTempId, rowTempId, { studentName: value });
  };

  const handleGradeChange = (
    courseTempId: number,
    rowTempId: number,
    value: string
  ) => {
    updateStudentRow(courseTempId, rowTempId, { grade: value });
  };

  const saveStudentAndEnrollment = async (
    course: CourseBox,
    row: StudentRow
  ) => {
    if (!course.courseId) return;
    if (!row.studentName.trim() || !row.grade.trim()) return;

    updateStudentRow(course.tempId, row.tempId, {
      loading: true,
      error: undefined,
    });

    try {
      // 1) create student
      const studentRes = await api.post("/students", {
        name: row.studentName.trim(),
      });
      const { id: studentId } = studentRes.data;

      // 2) create enrollment
      const enrollRes = await api.post("/enrollments", {
        studentId,
        courseId: course.courseId,
        grade: row.grade.trim(),
      });

      console.log("Enrollment saved:", enrollRes.data);

      updateStudentRow(course.tempId, row.tempId, {
        studentId,
        status: "saved",
        loading: false,
      });
    } catch (err) {
      console.error(err);
      updateStudentRow(course.tempId, row.tempId, {
        loading: false,
        error: "Failed to save enrollment",
      });
    }
  };


  const fetchCourseSummary = async () => {
    const name = courseSummaryName.trim();
    if (!name) {
      setSummaryError("Please enter a course name");
      return;
    }

    setSummaryError(null);
    setSummaryLoading(true);
    setStudentSummary(null);

    try {
      const res = await api.get<CourseGradeRow[]>("/courses-by-name", {
        params: { name },
      });
      setCourseSummary(res.data);
    } catch (err) {
      console.error(err);
      setSummaryError("Failed to fetch course grades");
      setCourseSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchStudentSummary = async () => {
    const name = studentSummaryName.trim();
    if (!name) {
      setSummaryError("Please enter a student name");
      return;
    }

    setSummaryError(null);
    setSummaryLoading(true);
    setCourseSummary(null);

    try {
      const res = await api.get<StudentCourseRow[]>("/students-by-name", {
        params: { name },
      });
      setStudentSummary(res.data);
    } catch (err) {
      console.error(err);
      setSummaryError("Failed to fetch student courses");
      setStudentSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };


  return (
    <div className="page">
      <h1>Student Course Tracker</h1>

      <div className="main-container">
        <div className="add-courses">
          <button onClick={addCourseBox}>Add Course</button>
        </div>

        {courses.map((course) => (
          <div className="course-card" key={course.tempId}>
            {/* Course header */}
            <div className="field-group">
              <label className="field-label">Course</label>
              {course.courseId ? (
                <div className="value-label">{course.courseName}</div>
              ) : (
                <input
                  className="input"
                  placeholder="Enter course name..."
                  value={course.courseName}
                  onChange={(e) =>
                    handleCourseNameChange(course.tempId, e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !course.loading) {
                      saveCourse(course);
                    }
                  }}
                />
              )}
            </div>

            {course.error && <div className="error">{course.error}</div>}
            {course.loading && (
              <div className="status">Saving course...</div>
            )}

            {course.courseId && (
              <>
                <div className="students-header">
                  <span>Students & Grades</span>
                  <button
                    className="small-button"
                    onClick={() => addStudentRow(course.tempId)}
                  >
                    + Add Student
                  </button>
                </div>

                {course.students.map((row) => (
                  <div className="student-row" key={row.tempId}>
                    {row.status === "saved" ? (
                      <>
                        <div className="value-label row-item">
                          {row.studentName}
                        </div>
                        <div className="value-label row-item grade-pill">
                          {row.grade}
                        </div>
                      </>
                    ) : (
                      <>
                        <input
                          className="input row-item"
                          placeholder="Student name..."
                          value={row.studentName}
                          onChange={(e) =>
                            handleStudentNameChange(
                              course.tempId,
                              row.tempId,
                              e.target.value
                            )
                          }
                        />
                        <input
                          className="input row-item"
                          placeholder="Grade (e.g. A+)"
                          value={row.grade}
                          onChange={(e) =>
                            handleGradeChange(
                              course.tempId,
                              row.tempId,
                              e.target.value
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !row.loading) {
                              saveStudentAndEnrollment(course, row);
                            }
                          }}
                        />
                      </>
                    )}

                    {row.loading && (
                      <div className="status small">Saving...</div>
                    )}
                    {row.error && (
                      <div className="error small">{row.error}</div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="summary-section">
        <h2>Summary</h2>

        <div className="summary-controls">
          <div className="summary-block">
            <label className="field-label">
              All grades of a specific course (by name)
            </label>
            <div className="summary-row">
              <input
                className="input"
                placeholder="Course name (e.g. SOEN 321)"
                value={courseSummaryName}
                onChange={(e) => setCourseSummaryName(e.target.value)}
              />
              <button onClick={fetchCourseSummary}>
                Show Course Grades
              </button>
            </div>
          </div>

          <div className="summary-block">
            <label className="field-label">
              All courses of a specific student (by name)
            </label>
            <div className="summary-row">
              <input
                className="input"
                placeholder="Student name (e.g. Alice)"
                value={studentSummaryName}
                onChange={(e) => setStudentSummaryName(e.target.value)}
              />
              <button onClick={fetchStudentSummary}>
                Show Student Courses
              </button>
            </div>
          </div>
        </div>

        {summaryLoading && <div className="status">Loading...</div>}
        {summaryError && <div className="error">{summaryError}</div>}

        {courseSummary && courseSummary.length > 0 && (
          <div className="summary-table-wrapper">
            <h3>Course: {courseSummary[0].course_name}</h3>
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {courseSummary.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.student_name ?? "-"}</td>
                    <td>{row.grade ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {studentSummary && studentSummary.length > 0 && (
          <div className="summary-table-wrapper">
            <h3>Student: {studentSummary[0].student_name}</h3>
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {studentSummary.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.course_name ?? "-"}</td>
                    <td>{row.grade ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(courseSummary?.length === 0 || studentSummary?.length === 0) &&
          !summaryLoading &&
          !summaryError && (
            <div className="status">
              No records found for that name (check spelling).
            </div>
          )}
      </div>
    </div>
  );
}

export default App;
