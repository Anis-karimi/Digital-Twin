import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";

import { TeacherCourses } from "@/Pages/Teacher/TeacherCoursesPage";
import { Language } from "@/Pages/Language";
import { Theme } from "@/Pages/Theme";
import { TeacherCourseDoc } from "@/Pages/Teacher/CourseDocManagment";
import { TeacherNotification } from "@/Pages/Teacher/TeacherNotification";
import { TeacherHome } from "@/Pages/Teacher/TeacherHome";
import { TeacherSettings } from "@/Pages/Teacher/TeacherSettings";
import { ChatArea } from "@/Pages/Teacher/ChatArea";
import { TeacherLessonsPage } from "@/Pages/Teacher/TeacherLessonPage";
import { TeacherContacts } from "@/Pages/Teacher/TeacherContacts";
import { TeacherExams } from "@/Pages/Teacher/TeacherExamsPage";

import { StudentHome } from "@/Pages/Student/StudentHome";
import { StudentSettings } from "@/Pages/Student/StudentSettings";
import { StudentExams } from "@/Pages/Student/StudentExamsPage";
import { StudentExamPage } from "@/Pages/Student/StudentExamPage";
import { StudentExamResultPage } from "@/Pages/Student/StudentExamResultPage";
import { StudentExplore } from "@/Pages/Student/StudentExplorePage";
import { CourseInformation } from "@/Pages/Student/StudentCourseInformation";

import { QuizFirstPage } from "@/Pages/QuizFirstPage";
import { QuizQuestionsPage } from "@/Pages/QuizQuestionsPage";
import { QuizResultPage } from "@/Pages/QuizResultPage";
import { ReviewAnswers } from "@/Pages/ReviewAnswersPage";

import { AppProvider, AppContext } from "@/Context/AppContext";
import { TeacherLayout } from "@/Layouts/TeacherLayout";
import { StudentLayout } from "@/Layouts/StudentLayout";
import { Login } from "@/Pages/Login";

function StudentsRoute() {
  const { role } = useContext(AppContext);
  if (role === "student") {
    return <StudentHome />;
  }
  return <Navigate to="/TeacherContacts/os" replace />;
}

function App() {
  return (
    <AppProvider>
      <div style={{ textAlign: "center" }}>
        <Router>
          <Routes>
            {/* ==================== Auth ==================== */}
            <Route path="/login" element={<Login />} />

            {/* ==================== Teacher ==================== */}

            <Route element={<TeacherLayout />}>
              <Route path="/" element={<TeacherHome />} />

              <Route path="/Language" element={<Language />} />

              <Route path="/Theme" element={<Theme />} />

              <Route path="/TeacherCourses" element={<TeacherCourses />} />

              <Route
                path="/TeacherCourseDoc/:id"
                element={<TeacherCourseDoc />}
              />

              <Route
                path="/TeacherNotification"
                element={<TeacherNotification />}
              />

              <Route path="/TeacherSettings" element={<TeacherSettings />} />

              <Route path="/TeacherExams" element={<TeacherExams />}></Route>

              <Route
                path="/TeacherContacts/:lessonId"
                element={<TeacherContacts />}
              />
              <Route
                path="/TeacherContacts"
                element={<Navigate to="/TeacherContacts/os" replace />}
              />

              <Route
                path="/TeacherLessonsPage/:lessonId"
                element={<TeacherLessonsPage />}
              />
            </Route>

            {/* ==================== Chat ==================== */}

            <Route path="/ChatArea/course/:id" element={<ChatArea />} />

            <Route path="/ChatArea/student/:id" element={<ChatArea />} />

            {/* ==================== Student ==================== */}

            <Route element={<StudentLayout />}>
              <Route path="/Student" element={<StudentHome />} />
              <Route path="/student" element={<StudentHome />} />
              <Route path="/StudentHome" element={<StudentHome />} />
              <Route path="/students" element={<StudentsRoute />} />
              <Route path="/Students" element={<StudentsRoute />} />

              <Route path="/StudentSettings" element={<StudentSettings />} />
              <Route path="/StudentExams" element={<StudentExams />} />
              <Route
                path="/studentexams"
                element={<Navigate to="/StudentExams" replace />}
              />
              <Route
                path="/StudentExam"
                element={<Navigate to="/StudentExams" replace />}
              />
              <Route
                path="/studentexam"
                element={<Navigate to="/StudentExams" replace />}
              />
              <Route path="/StudentExam/:id" element={<StudentExamPage />} />
              <Route path="/studentexam/:id" element={<StudentExamPage />} />
              <Route
                path="/StudentExamResult/:id"
                element={<StudentExamResultPage />}
              />
              <Route
                path="/studentexamresult/:id"
                element={<StudentExamResultPage />}
              />
              <Route
                path="/ExamResult/:id"
                element={<StudentExamResultPage />}
              />
              <Route
                path="/examresult/:id"
                element={<StudentExamResultPage />}
              />
              <Route path="/StudentExplore" element={<StudentExplore />} />
              <Route path="/CourseInformation/:id" element={<CourseInformation/>} />
            </Route>
            {/* =================== Quiz Pages =================== */}

            <Route path="/QuizFirstPage" element={<QuizFirstPage />} />
            <Route path="/QuizQuestionsPage" element={<QuizQuestionsPage />} />
            <Route path="/Quiz-result" element={<QuizResultPage />} />
            <Route path="/Review-Answers" element={<ReviewAnswers />} />

            {/* ==================== Not Found ==================== */}

            <Route path="*" element={<div>Not Found</div>} />
          </Routes>
        </Router>
      </div>
    </AppProvider>
  );
}

export default App;
