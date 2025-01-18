import React, { useEffect, useState } from "react";
import { TokenProvider, useToken } from "@/context/TokenContext";
import Navbar from "@/components/Navbar";
import InstrumentsOverview from "@/components/InstrumentsOverview";
import StudentAnalytics from "@/components/StudentAnalytics";
import TeacherAnalytics from "@/components/TeacherAnalytics";
import LessonsAnalytics from "@/components/LessonAnalytics";
import FinancialOverview from "@/components/FinancialOverview";
import PackageManagement from "@/components/PackageManagement";
import HomeSection from "@/components/HomeSection";
const LOGIN_URL = "http://localhost:8055/auth/login";
const EMAIL = "test@test.com";
const PASSWORD = "interview";

const App: React.FC = () => {
  return (
    <TokenProvider>
      <HomePage />
    </TokenProvider>
  );
};

const HomePage: React.FC = () => {
  const { token, setToken } = useToken();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState("home");
  const [isMobile, setIsMobile] = useState(false);

  // Window resize mobile handle
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch(LOGIN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: EMAIL,
            password: PASSWORD,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.data?.access_token) {
          const accessToken = data.data.access_token;
          setToken(accessToken);
          localStorage.setItem("token", accessToken);
        } else {
          console.error("Token not found in response data");
        }
      } catch (error) {
        console.error("Failed to log in:", error);
      }
    };

    if (!token) {
      fetchToken();
    }
  }, [token, setToken]);

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const renderPageContent = () => {
    switch (currentPage) {
      case "home":
        return (
          // <div className="p-6 bg-white rounded-lg shadow-lg">
          //   <h1 className="text-3xl font-bold text-gray-800 mb-4">
          //     Welcome to Music School Analytics
          //   </h1>
          //   <p className="text-gray-600">
          //     Your comprehensive dashboard for managing and analyzing music
          //     school operations. Navigate through different sections to explore
          //     detailed insights about instruments, students, teachers, lessons,
          //     and financial data.
          //   </p>
          // </div>
          <HomeSection />
        );

      case "instruments":
        return (
          <div>
            <div className="p-6 bg-white rounded-lg shadow-lg mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Instruments
              </h1>
              <p className="text-gray-600">
                Track the distribution and popularity of different instruments
                across the school. View instrument allocation among students and
                teachers, and see the preferences.
              </p>
            </div>
            <InstrumentsOverview />
          </div>
        );

      case "student-analytics":
        return (
          <div>
            <div className="p-6 bg-white rounded-lg shadow-lg mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Student Analytics
              </h1>
              <p className="text-gray-600">
                Gain insights into student performance, progress, and
                engagement. Monitor package utilization, track learning paths,
                and analyze student distribution across different instruments
                and programs.
              </p>
            </div>
            <StudentAnalytics />
          </div>
        );

      case "teacher-analytics":
        return (
          <div>
            <div className="p-6 bg-white rounded-lg shadow-lg mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Teacher Analytics
              </h1>
              <p className="text-gray-600">
                Evaluate teacher workload, student allocation, and lesson
                effectiveness, according to each teachers performance.
              </p>
            </div>
            <TeacherAnalytics />
          </div>
        );

      case "lessons-analytics":
        return (
          <div>
            <div className="p-6 bg-white rounded-lg shadow-lg mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Lesson Analytics
              </h1>
              <p className="text-gray-600">
                Monitor lesson scheduling, attendance, and completion rates.
                Analyze lesson effectiveness, track student in different lesson
                types, and optimize scheduling to maximize learning outcomes.
              </p>
            </div>
            <LessonsAnalytics />
          </div>
        );

      case "financial-overview":
        return (
          <div>
            <div className="p-6 bg-white rounded-lg shadow-lg mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Financial Overview
              </h1>
              <p className="text-gray-600">
                Track revenue streams, analyze payment patterns, and monitor
                financial performance. Get insights into package sales, payment
                trends, and financial metrics.
              </p>
            </div>
            <FinancialOverview />
          </div>
        );

      case "package-management":
        return (
          <div>
            <div className="p-6 bg-white rounded-lg shadow-lg mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Packages
              </h1>
              <p className="text-gray-600">
                Manage and track lesson packages, monitor usage rates, and
                analyze package performance. View detailed insights into package
                popularity, completion rates, and student preferences.
              </p>
            </div>
            <PackageManagement />
          </div>
        );

      default:
        return (
          <div className="p-6 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Page Not Found
            </h1>
            <p className="text-gray-600">
              The requested page could not be found. Please select a valid
              option from the navigation menu.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        setCurrentPage={setCurrentPage}
      />
      <main
        className={`flex-1 transition-all duration-300 p-8 
          ${
            isMobile
              ? "mt-16" // The content to be rendered below the hamburger
              : isSidebarOpen
              ? "ml-64"
              : "ml-16"
          }`}
      >
        <div className="container mx-auto">{renderPageContent()}</div>
      </main>
    </div>
  );
};

export default App;
