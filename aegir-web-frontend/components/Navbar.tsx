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
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<string>("home");

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
    setActivePage(page);
    setCurrentPage(page);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const navItems = [
    { id: "home", label: "Home", icon: "/home.png" },
    {
      id: "instruments",
      label: "Instruments",
      icon: "/instrument.png",
    },
    {
      id: "student-analytics",
      label: "Students",
      icon: "/student.png",
    },
    {
      id: "teacher-analytics",
      label: "Teachers",
      icon: "/teacher.png",
    },
    {
      id: "lessons-analytics",
      label: "Lessons",
      icon: "/lesson.png",
    },
    {
      id: "package-management",
      label: "Packages",
      icon: "/package.png",
    },
    {
      id: "financial-overview",
      label: "Financials",
      icon: "/finance.png",
    },
  ];

  return (
    <>
      {/* Hamburger Menu */}
      {isMobile && (
        <button
          onClick={toggleNavbar}
          className="fixed top-4 left-4 z-50 text-white bg-gray-800 p-2 rounded-lg focus:outline-none hover:bg-gray-700 transition-colors duration-200"
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
            : `top-0 left-0 h-full ${isSidebarOpen ? "w-64" : "w-20"}`
        } bg-gray-800 text-white transition-all duration-300 ease-in-out z-40 shadow-lg`}
      >
        {/* Desktop Logo/Toggle */}
        {!isMobile && (
          <div
            className="flex items-center p-4 cursor-pointer hover:bg-gray-700 transition-colors duration-200"
            onClick={toggleNavbar}
          >
            <img
              src="/arrow-expand-white.png"
              className={`w-8 h-8 transition-transform duration-300 ${
                isSidebarOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
            <span
              className={`ml-2 font-semibold text-lg ${
                isSidebarOpen ? "block" : "hidden"
              }`}
            >
              Menu
            </span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className={`mt-4 ${isMobile ? "pt-16" : ""}`}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handlePageChange(item.id)}
              className={`w-full ${
                isMobile ? "text-center" : "text-left"
              } p-4 hover:bg-teal-600 transition-colors duration-200 ${
                activePage === item.id ? "bg-teal-700" : ""
              } focus:outline-none group`}
            >
              {!isSidebarOpen && !isMobile ? (
                <div className="flex justify-center items-center relative">
                  <img
                    src={item.icon}
                    alt={item.label}
                    className="w-6 h-6 object-contain filter brightness-0 invert"
                  />
                  {/* Tooltip for collapsed state */}
                  <div className="absolute left-20 hidden group-hover:block bg-gray-900 text-white px-2 py-1 rounded-md text-sm whitespace-nowrap">
                    {item.label}
                  </div>
                </div>
              ) : (
                <div
                  className={`flex ${
                    isMobile ? "justify-center" : ""
                  } items-center space-x-3`}
                >
                  <img
                    src={item.icon}
                    alt={item.label}
                    className="w-6 h-6 object-contain filter brightness-0 invert"
                  />
                  <span className="font-medium tracking-wide">
                    {item.label}
                  </span>
                </div>
              )}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Navbar;
