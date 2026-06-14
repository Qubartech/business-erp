import { Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { TimeTrackerProvider } from "@/features/time/TimeTrackerContext";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import UsersListPage from "@/pages/users/UsersListPage";
import UserFormPage from "@/pages/users/UserFormPage";
import ProjectsListPage from "@/pages/projects/ProjectsListPage";
import ProjectFormPage from "@/pages/projects/ProjectFormPage";
import ProjectDetailPage from "@/pages/projects/ProjectDetailPage";
import TasksListPage from "@/pages/tasks/TasksListPage";
import TaskFormPage from "@/pages/tasks/TaskFormPage";
import TaskDetailPage from "@/pages/tasks/TaskDetailPage";
import NotesPage from "@/pages/notes/NotesPage";
import TimePage from "@/pages/time/TimePage";
import DocumentsPage from "@/pages/documents/DocumentsPage";
import SettingsPage from "@/pages/settings/SettingsPage";

export function App() {
  return (
    <TimeTrackerProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />

          <Route path="users" element={<ProtectedRoute roles={["admin"]}><UsersListPage /></ProtectedRoute>} />
          <Route path="users/new" element={<ProtectedRoute roles={["admin"]}><UserFormPage /></ProtectedRoute>} />
          <Route path="users/:id" element={<ProtectedRoute roles={["admin"]}><UserFormPage /></ProtectedRoute>} />

          <Route path="projects" element={<ProjectsListPage />} />
          <Route path="projects/new" element={<ProtectedRoute roles={["admin","manager"]}><ProjectFormPage /></ProtectedRoute>} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="projects/:id/edit" element={<ProtectedRoute roles={["admin","manager"]}><ProjectFormPage /></ProtectedRoute>} />

          <Route path="tasks" element={<TasksListPage />} />
          <Route path="tasks/new" element={<ProtectedRoute roles={["admin","manager"]}><TaskFormPage /></ProtectedRoute>} />
          <Route path="tasks/:id" element={<TaskDetailPage />} />
          <Route path="tasks/:id/edit" element={<ProtectedRoute roles={["admin","manager"]}><TaskFormPage /></ProtectedRoute>} />

          <Route path="notes" element={<NotesPage />} />
          <Route path="time" element={<TimePage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="settings" element={<ProtectedRoute roles={["admin"]}><SettingsPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </TimeTrackerProvider>
  );
}
