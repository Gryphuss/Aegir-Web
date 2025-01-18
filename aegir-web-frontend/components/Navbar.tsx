import React, { useState, useEffect } from "react";

interface NavbarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<string>>;
}

const Navbar: React.FC<NavbarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  setCurrentPage,
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(false); // mobile state

  // window resize for mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleNavbar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Hamburger Menu*/}
      {isMobile && (
        <button
          onClick={toggleNavbar}
          className="fixed top-4 left-4 z-50 text-white bg-gray-800 p-2 rounded-md focus:outline-none"
        >
          {isSidebarOpen ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      )}

      {/* Sidebar Menu */}
      <div
        className={`fixed ${
          isMobile
            ? `top-0 left-0 w-full transform ${
                isSidebarOpen ? "translate-y-0" : "-translate-y-full"
              }`
            : `top-0 left-0 h-full ${isSidebarOpen ? "w-64" : "w-16"}`
        } bg-gray-800 text-white transition-all duration-300 ease-in-out z-40`}
      >
        {/* Desktop Arrow */}
        {!isMobile && (
          <div
            className="flex items-center p-4 cursor-pointer"
            onClick={toggleNavbar}
          >
            <img
              src="/arrow-expand-white.png"
              className={`w-8 h-8 transition-transform duration-300 ${
                isSidebarOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
            <span className={`ml-2 ${isSidebarOpen ? "block" : "hidden"}`}>
              Menu
            </span>
          </div>
        )}

        <nav className={`mt-4 ${isMobile ? "pt-16" : ""}`}>
          {[
            { id: "home", label: "Home" },
            { id: "instruments", label: "Instruments" },
            { id: "student-analytics", label: "Student Analytics" },
            { id: "teacher-analytics", label: "Teacher Analytics" },
            { id: "lessons-analytics", label: "Lesson Analytics" },
            { id: "financial-overview", label: "Financial Overview" },
            { id: "package-management", label: "Package Management" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handlePageChange(item.id)}
              className={`w-full text-left p-4 hover:bg-teal-500 transition-colors duration-200 ${
                !isSidebarOpen && !isMobile ? "justify-center items-center" : ""
              }`}
            >
              <span
                className={!isSidebarOpen && !isMobile ? "hidden" : "block"}
              >
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Navbar;
