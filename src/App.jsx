import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";

import { Nav } from "@/Components/Nav";

import { TeacherResource } from "@/Pages/Teacher/TeacherResourcesManagement";
import { Language } from "@/Pages/Language";
import { Theme } from "@/Pages/Theme";
import { TeacherCourseDoc } from "@/Pages/Teacher/CourseDocManagment";
import { TeacherNotification } from "@/Pages/Teacher/TeacherNotification";
import { TeacherHome } from "@/Pages/Teacher/TeacherHome";
import { TeacherSettings } from "@/Pages/Teacher/TeacherSettings";
import { ChatArea } from "@/Pages/Teacher/ChatArea";

// import { TeacherMyCourses } from "@/Pages/Teacher/TeacherMyCoursesPage";

import { TeacherLessonsPage } from "@/Pages/Teacher/TeacherLessonPage";
import { TeacherContacts } from "@/Pages/Teacher/TeacherContacts";
import { StudentHome } from "@/Pages/Student/StudentHome";
import { StudentSettings } from "@/Pages/Student/StudentSettings";

import { QuizFirstPage } from "@/Pages/QuizFirstPage";
import { QuizQuestionsPage } from "@/Pages/QuizQuestionsPage";
import { QuizResultPage } from "@/Pages/QuizResultPage";
import { ReviewAnswers } from "@/Pages/ReviewAnswersPage";

import { TeacherExams } from "./Pages/Teacher/TeacherExamsPage";

import { AppProvider, AppContext } from "@/Context/AppContext";
import { TeacherLayout } from "@/Layouts/TeacherLayout";
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
          <Nav />

          <Routes>
            {/* ==================== Auth ==================== */}
            <Route path="/login" element={<Login />} />

            {/* ==================== Teacher ==================== */}

            <Route element={<TeacherLayout />}>
              <Route path="/" element={<TeacherHome />} />

              <Route path="/Language" element={<Language />} />

              <Route path="/Theme" element={<Theme />} />

              <Route path="/TeacherResource" element={<TeacherResource />} />

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

            <Route path="/Student" element={<StudentHome />} />
            <Route path="/student" element={<StudentHome />} />
            <Route path="/StudentHome" element={<StudentHome />} />
            <Route path="/students" element={<StudentsRoute />} />
            <Route path="/Students" element={<StudentsRoute />} />

            <Route path="/StudentSettings" element={<StudentSettings />} />

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
