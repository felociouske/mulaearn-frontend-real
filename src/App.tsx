import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ToastProvider } from "@/lib/toast-context";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProtectedRoute from "@/components/dashboard/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterForm";
import ActivatePage from "@/pages/ActivatePage";
import OverviewPage from "@/pages/OverviewPage";
import ChatsPage from "@/pages/ChatsPage";
import ChatSessionPage from "@/pages/ChatSessionPage";
import ChatHistoryPage from "@/pages/ChatHistoryPage";
import ChatPlansPage from "@/pages/ChatPlansPage";
import SurveyPage from "@/pages/SurveyPage";
import SurveyHistoryPage from "@/pages/SurveyHistoryPage";
import WheelPage from "@/pages/WheelPage";
import WheelHistoryPage from "@/pages/WheelHistoryPage";
import AppReviewsPage from "@/pages/AppReviewsPage";
import AppReviewPlansPage from "@/pages/AppReviewPlansPage";
import AppReviewHistoryPage from "@/pages/AppReviewHistoryPage";
import MovieReviewsPage from "@/pages/MovieReviewsPage";
import MovieReviewPlansPage from "@/pages/MovieReviewPlansPage";
import MovieReviewHistoryPage from "@/pages/MovieReviewHistoryPage";
import LoanPlansPage from "@/pages/LoansPlansPage";
import ApplyLoanPage from "@/pages/ApplyLoanPage";
import LoanHistoryPage from "@/pages/LoanHistoryPage";
import WalletPage from "@/pages/WalletPage";
import DepositPage from "@/pages/DepositPage";
import WithdrawPage from "@/pages/WithdrawPage";
import ReferralsPage from "@/pages/ReferralsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import ContactPage from "@/pages/ContactPage";
import ProfilePage from "@/pages/ProfilePage";

// This is the App Router equivalent for a Vite SPA: one explicit route
// tree instead of Next's file-based routing. ThemeProvider wraps
// everything since even the login/register pages should respect the
// user's chosen theme. AuthProvider wraps EVERYTHING (public login/
// register pages need it to call login()/register(), and the dashboard
// routes need it for useAuth()).
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/activate"
            element={
              <ProtectedRoute requireActivation={false}>
                <ActivatePage />
              </ProtectedRoute>
            }
          />

          <Route element={<DashboardLayout />}>
            <Route path="/" element={<OverviewPage />} />

            {/* Chats */}
            <Route path="/chats" element={<ChatsPage />} />
            <Route path="/chats/history" element={<ChatHistoryPage />} />
            <Route path="/chats/:sessionId" element={<ChatSessionPage />} />

            {/* Survey & Wheel — replaces the old flat /tasks page */}
            <Route path="/survey" element={<SurveyPage />} />
            <Route path="/survey/history" element={<SurveyHistoryPage />} />
            <Route path="/wheel" element={<WheelPage />} />
            <Route path="/wheel/history" element={<WheelHistoryPage />} />
            <Route path="/tasks" element={<Navigate to="/survey" replace />} />

            {/* App reviews */}
            <Route path="/app-reviews" element={<AppReviewsPage />} />
            <Route path="/app-reviews/history" element={<AppReviewHistoryPage />} />

            {/* Movie reviews */}
            <Route path="/movie-reviews" element={<MovieReviewsPage />} />
            <Route path="/movie-reviews/history" element={<MovieReviewHistoryPage />} />

            {/* Loans */}
            <Route path="/loans/apply" element={<ApplyLoanPage />} />
            <Route path="/loans/plans" element={<LoanPlansPage />} />
            <Route path="/loans/history" element={<LoanHistoryPage />} />
            <Route path="/loans" element={<Navigate to="/loans/apply" replace />} />

            {/* Plans — nested under each section's dropdown, not a top-level page */}
            <Route path="/plans/chat" element={<ChatPlansPage />} />
            <Route path="/plans/app-review" element={<AppReviewPlansPage />} />
            <Route path="/plans/movie-review" element={<MovieReviewPlansPage />} />
            <Route path="/plans" element={<Navigate to="/plans/chat" replace />} />

            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/deposit" element={<DepositPage />} />
            <Route path="/withdraw" element={<WithdrawPage />} />
            <Route path="/referrals" element={<ReferralsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </AuthProvider>
      </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}