import React, { useEffect, useState } from "react";
import { useToken } from "@/context/TokenContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronRight } from "lucide-react";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  role: {
    id: string;
    name: string;
  };
}

interface Package {
  id: number;
  name: string;
  student: string;
  instrument: number;
  duration: number;
  lessons_quota: number;
  status: string;
  start_datetime: string;
  end_datetime: string;
  remarks: string;
}

interface Lesson {
  id: number;
  package: number;
  status: string;
  start_datetime: string;
}

const API_URL_USERS = "http://localhost:8055/users";
const API_URL_PACKAGES = "http://localhost:8055/items/packages";
const API_URL_LESSONS = "http://localhost:8055/items/lessons";
const API_URL_INSTRUMENTS = "http://localhost:8055/items/instruments";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];
const STATUS_COLORS = {
  active: "#10B981",
  completed: "#6366F1",
  draft: "#F59E0B",
  expired: "#EF4444",
  default: "#6B7280",
};

const PackageManagement: React.FC = () => {
  const { token } = useToken();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [packages, setPackages] = useState<Package[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [instruments, setInstruments] = useState<{ [key: number]: string }>({});
  const [expandedPackages, setExpandedPackages] = useState<Set<number>>(
    new Set()
  );
  const [expandedPackageNames, setExpandedPackageNames] = useState<Set<string>>(
    new Set()
  );
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        const [
          usersResponse,
          packagesResponse,
          lessonsResponse,
          instrumentsResponse,
        ] = await Promise.all([
          fetch(API_URL_USERS, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(API_URL_PACKAGES, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(API_URL_LESSONS, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(API_URL_INSTRUMENTS, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const usersData = await usersResponse.json();
        const packagesData = await packagesResponse.json();
        const lessonsData = await lessonsResponse.json();
        const instrumentsData = await instrumentsResponse.json();

        // Process users
        const usersMap: { [key: string]: User } = {};
        usersData.data.forEach((user: User) => {
          usersMap[user.id] = user;
        });
        setUsers(usersMap);

        setPackages(packagesData.data || []);
        setLessons(lessonsData.data || []);

        // Process instruments
        const instrumentsMap: { [key: number]: string } = {};
        instrumentsData.data.forEach((instrument: any) => {
          instrumentsMap[instrument.id] = instrument.name;
        });
        setInstruments(instrumentsMap);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const togglePackageName = (packageName: string) => {
    const newExpanded = new Set(expandedPackageNames);
    if (newExpanded.has(packageName)) {
      newExpanded.delete(packageName);
    } else {
      newExpanded.add(packageName);
    }
    setExpandedPackageNames(newExpanded);
  };

  const toggleStudent = (studentId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  const groupedPackages = packages.reduce(
    (acc: { [key: string]: { [key: string]: Package[] } }, pkg) => {
      if (!acc[pkg.name]) {
        acc[pkg.name] = {};
      }
      if (!acc[pkg.name][pkg.student]) {
        acc[pkg.name][pkg.student] = [];
      }
      acc[pkg.name][pkg.student].push(pkg);
      return acc;
    },
    {}
  );

  const togglePackage = (packageId: number) => {
    const newExpanded = new Set(expandedPackages);
    if (newExpanded.has(packageId)) {
      newExpanded.delete(packageId);
    } else {
      newExpanded.add(packageId);
    }
    setExpandedPackages(newExpanded);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="w-full h-96" />
          <Skeleton className="w-full h-96" />
          <Skeleton className="w-full h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  // package data process
  const packagesByStatus = packages.reduce(
    (acc: { [key: string]: number }, pkg) => {
      acc[pkg.status] = (acc[pkg.status] || 0) + 1;
      return acc;
    },
    {}
  );

  const packagesByInstrument = packages.reduce(
    (acc: { [key: string]: number }, pkg) => {
      const instrumentName = instruments[pkg.instrument] || "Unknown";
      acc[instrumentName] = (acc[instrumentName] || 0) + 1;
      return acc;
    },
    {}
  );

  const getPackageProgress = (packageId: number) => {
    const packageLessons = lessons.filter(
      (lesson) => lesson.package === packageId
    );
    const completedLessons = packageLessons.filter(
      (lesson) => lesson.status === "attended"
    ).length;
    const pkg = packages.find((p) => p.id === packageId);
    return {
      total: packageLessons.length,
      completed: completedLessons,
      quota: pkg?.lessons_quota || 0,
    };
  };

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Package Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Package Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(packagesByStatus).map(
                    ([status, count]) => ({
                      name: status,
                      value: count,
                    })
                  )}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={130}
                  dataKey="value"
                >
                  {Object.entries(packagesByStatus).map(([status], index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        STATUS_COLORS[status as keyof typeof STATUS_COLORS] ||
                        STATUS_COLORS.default
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Packages by Instrument */}
        <Card>
          <CardHeader>
            <CardTitle>Packages by Instrument</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(packagesByInstrument).map(
                  ([name, count]) => ({
                    name,
                    count,
                  })
                )}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0088FE" name="Number of Packages" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Package Details Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Package Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-3 px-4 text-left">Package Name</th>
                    <th className="py-3 px-4 text-right">Total Students</th>
                    <th className="py-3 px-4 text-right">Active Packages</th>
                    <th className="py-3 px-4 text-right">Total Lessons</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedPackages)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([packageName, studentPackages]) => {
                      const isPackageExpanded =
                        expandedPackageNames.has(packageName);
                      const allPackagesForName =
                        Object.values(studentPackages).flat();
                      const activePackages = allPackagesForName.filter(
                        (p) => p.status === "active"
                      ).length;
                      const totalLessons = allPackagesForName.reduce(
                        (sum, pkg) => {
                          const progress = getPackageProgress(pkg.id);
                          return sum + progress.total;
                        },
                        0
                      );

                      return (
                        <React.Fragment key={packageName}>
                          {/* Package Name Row */}
                          <tr
                            className="border-b hover:bg-gray-50 cursor-pointer font-medium"
                            onClick={() => togglePackageName(packageName)}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                {isPackageExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                                <span>{packageName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {Object.keys(studentPackages).length}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {activePackages}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {totalLessons}
                            </td>
                          </tr>

                          {/* Student Level Rows */}
                          {isPackageExpanded &&
                            Object.entries(studentPackages).map(
                              ([studentId, studentPkgs]) => {
                                const isStudentExpanded =
                                  expandedStudents.has(studentId);
                                const student = users[studentId];
                                const studentProgress = studentPkgs.reduce(
                                  (acc, pkg) => {
                                    const progress = getPackageProgress(pkg.id);
                                    return {
                                      total: acc.total + progress.total,
                                      completed:
                                        acc.completed + progress.completed,
                                      quota: acc.quota + progress.quota,
                                    };
                                  },
                                  { total: 0, completed: 0, quota: 0 }
                                );

                                return (
                                  <React.Fragment key={studentId}>
                                    <tr
                                      className="border-b hover:bg-gray-50 cursor-pointer bg-gray-50"
                                      onClick={() => toggleStudent(studentId)}
                                    >
                                      <td className="py-3 px-4 pl-8">
                                        <div className="flex items-center space-x-2">
                                          {isStudentExpanded ? (
                                            <ChevronDown className="w-4 h-4" />
                                          ) : (
                                            <ChevronRight className="w-4 h-4" />
                                          )}
                                          <span>
                                            {student
                                              ? `${student.first_name} ${student.last_name}`
                                              : "Unknown Student"}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 text-right">
                                        {studentPkgs.length}
                                      </td>
                                      <td className="py-3 px-4 text-right">
                                        {
                                          studentPkgs.filter(
                                            (p) => p.status === "active"
                                          ).length
                                        }
                                      </td>
                                      <td className="py-3 px-4">
                                        <div className="flex items-center justify-end">
                                          <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                                            <div
                                              className="bg-blue-600 h-2.5 rounded-full"
                                              style={{
                                                width: `${
                                                  (studentProgress.completed /
                                                    studentProgress.quota) *
                                                  100
                                                }%`,
                                              }}
                                            />
                                          </div>
                                          <span>
                                            {studentProgress.completed}/
                                            {studentProgress.quota}
                                          </span>
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Package Details */}
                                    {isStudentExpanded && (
                                      <tr>
                                        <td
                                          colSpan={4}
                                          className="bg-gray-100 p-4"
                                        >
                                          <div className="space-y-4">
                                            {studentPkgs.map((pkg) => {
                                              const progress =
                                                getPackageProgress(pkg.id);
                                              return (
                                                <div
                                                  key={pkg.id}
                                                  className="bg-white p-4 rounded-lg shadow-sm"
                                                >
                                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                      <p className="text-sm text-gray-500">
                                                        Start Date
                                                      </p>
                                                      <p>
                                                        {new Date(
                                                          pkg.start_datetime
                                                        ).toLocaleDateString()}
                                                      </p>
                                                    </div>
                                                    <div>
                                                      <p className="text-sm text-gray-500">
                                                        End Date
                                                      </p>
                                                      <p>
                                                        {pkg.end_datetime
                                                          ? new Date(
                                                              pkg.end_datetime
                                                            ).toLocaleDateString()
                                                          : "Not set"}
                                                      </p>
                                                    </div>
                                                    <div>
                                                      <p className="text-sm text-gray-500">
                                                        Duration (minutes)
                                                      </p>
                                                      <p>{pkg.duration}</p>
                                                    </div>
                                                    <div>
                                                      <p className="text-sm text-gray-500">
                                                        Status
                                                      </p>
                                                      <span
                                                        className={`px-2 py-1 rounded-full text-sm inline-block mt-1
                                            ${
                                              pkg.status === "active"
                                                ? "bg-green-100 text-green-800"
                                                : ""
                                            }
                                            ${
                                              pkg.status === "completed"
                                                ? "bg-indigo-100 text-indigo-800"
                                                : ""
                                            }
                                            ${
                                              pkg.status === "draft"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : ""
                                            }
                                            ${
                                              pkg.status === "expired"
                                                ? "bg-red-100 text-red-800"
                                                : ""
                                            }
                                          `}
                                                      >
                                                        {pkg.status}
                                                      </span>
                                                    </div>
                                                  </div>

                                                  {pkg.remarks && (
                                                    <div className="mb-4">
                                                      <p className="text-sm text-gray-500">
                                                        Remarks
                                                      </p>
                                                      <p>{pkg.remarks}</p>
                                                    </div>
                                                  )}

                                                  <div>
                                                    <p className="text-sm text-gray-500 mb-2">
                                                      Recent Lessons
                                                    </p>
                                                    <table className="w-full">
                                                      <thead>
                                                        <tr className="border-b border-gray-200">
                                                          <th className="py-2 px-4 text-left">
                                                            Date
                                                          </th>
                                                          <th className="py-2 px-4 text-left">
                                                            Time
                                                          </th>
                                                          <th className="py-2 px-4 text-left">
                                                            Status
                                                          </th>
                                                        </tr>
                                                      </thead>
                                                      <tbody>
                                                        {lessons
                                                          .filter(
                                                            (lesson) =>
                                                              lesson.package ===
                                                              pkg.id
                                                          )
                                                          .sort(
                                                            (a, b) =>
                                                              new Date(
                                                                b.start_datetime
                                                              ).getTime() -
                                                              new Date(
                                                                a.start_datetime
                                                              ).getTime()
                                                          )
                                                          .slice(0, 5)
                                                          .map((lesson) => (
                                                            <tr
                                                              key={lesson.id}
                                                              className="border-b border-gray-200"
                                                            >
                                                              <td className="py-2 px-4">
                                                                {new Date(
                                                                  lesson.start_datetime
                                                                ).toLocaleDateString()}
                                                              </td>
                                                              <td className="py-2 px-4">
                                                                {new Date(
                                                                  lesson.start_datetime
                                                                ).toLocaleTimeString(
                                                                  [],
                                                                  {
                                                                    hour: "2-digit",
                                                                    minute:
                                                                      "2-digit",
                                                                  }
                                                                )}
                                                              </td>
                                                              <td className="py-2 px-4">
                                                                <span
                                                                  className={`px-2 py-1 rounded-full text-sm
                                                      ${
                                                        lesson.status ===
                                                        "attended"
                                                          ? "bg-green-100 text-green-800"
                                                          : ""
                                                      }
                                                      ${
                                                        lesson.status ===
                                                        "cancelled"
                                                          ? "bg-red-100 text-red-800"
                                                          : ""
                                                      }
                                                      ${
                                                        lesson.status ===
                                                        "pending"
                                                          ? "bg-yellow-100 text-yellow-800"
                                                          : ""
                                                      }
                                                    `}
                                                                >
                                                                  {
                                                                    lesson.status
                                                                  }
                                                                </span>
                                                              </td>
                                                            </tr>
                                                          ))}
                                                      </tbody>
                                                    </table>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              }
                            )}
                        </React.Fragment>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Key Package Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold">Total Packages</h3>
                <p className="text-3xl font-bold">{packages.length}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="text-lg font-semibold">Active Packages</h3>
                <p className="text-3xl font-bold">
                  {packages.filter((p) => p.status === "active").length}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="text-lg font-semibold">Completion Rate</h3>
                <p className="text-3xl font-bold">
                  {(
                    (packages.filter((p) => p.status === "completed").length /
                      packages.length) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="text-lg font-semibold">Average Duration</h3>
                <p className="text-3xl font-bold">
                  {Math.round(
                    packages.reduce((sum, pkg) => sum + pkg.duration, 0) /
                      packages.length
                  )}{" "}
                  min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PackageManagement;
