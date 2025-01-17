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

interface Lesson {
  id: number;
  package: number;
  teacher: string;
  start_datetime: string;
  status: string;
  remarks: string;
}

interface Package {
  id: number;
  name: string;
  student: string;
  instrument: number;
  duration: number;
  lessons_quota: number;
  status: string;
}

const API_URL_USERS = "http://localhost:8055/users";
const API_URL_LESSONS = "http://localhost:8055/items/lessons";
const API_URL_PACKAGES = "http://localhost:8055/items/packages";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];
const STATUS_COLORS = {
  attended: "#10B981",
  cancelled: "#EF4444",
  pending: "#F59E0B",
  default: "#6B7280",
};

const LessonsAnalytics: React.FC = () => {
  const { token } = useToken();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        const [usersResponse, lessonsResponse, packagesResponse] =
          await Promise.all([
            fetch(API_URL_USERS, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(API_URL_LESSONS, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(API_URL_PACKAGES, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

        const usersData = await usersResponse.json();
        const lessonsData = await lessonsResponse.json();
        const packagesData = await packagesResponse.json();

        const usersMap: { [key: string]: User } = {};
        usersData.data.forEach((user: User) => {
          usersMap[user.id] = user;
        });

        setUsers(usersMap);
        setLessons(lessonsData.data || []);
        setPackages(packagesData.data || []);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const toggleMonth = (month: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(month)) {
      newExpanded.delete(month);
    } else {
      newExpanded.add(month);
    }
    setExpandedMonths(newExpanded);
  };

  // simple helper function to for display format
  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleString(
      "default",
      {
        month: "long",
        year: "numeric",
      }
    );
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

  // Process lesson data
  const lessonsByStatus = lessons.reduce(
    (acc: { [key: string]: number }, lesson) => {
      acc[lesson.status] = (acc[lesson.status] || 0) + 1;
      return acc;
    },
    {}
  );

  // Group lessons by month for trend analysis
  const lessonsByMonthTrends = lessons.reduce(
    (acc: { [key: string]: any }, lesson) => {
      const date = new Date(lesson.start_datetime);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!acc[monthKey]) {
        acc[monthKey] = { total: 0, attended: 0, cancelled: 0, pending: 0 };
      }

      acc[monthKey].total += 1;
      acc[monthKey][lesson.status] = (acc[monthKey][lesson.status] || 0) + 1;

      return acc;
    },
    {}
  );

  // Group lessons by month for displaying on the detail table
  const lessonsByMonth = lessons.reduce(
    (acc: { [key: string]: Lesson[] }, lesson) => {
      const date = new Date(lesson.start_datetime);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(lesson);
      return acc;
    },
    {}
  );

  // Group lessons by date (may not be used)
  const lessonsByDate = lessons.reduce(
    (acc: { [key: string]: Lesson[] }, lesson) => {
      const date = new Date(lesson.start_datetime).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(lesson);
      return acc;
    },
    {}
  );

  const trendData = Object.entries(lessonsByMonthTrends)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]: [string, any]) => ({
      month,
      total: data.total,
      attended: data.attended || 0,
      cancelled: data.cancelled || 0,
      pending: data.pending || 0,
    }));

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lesson Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Lesson Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(lessonsByStatus).map(
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
                  {Object.entries(lessonsByStatus).map(([status], index) => (
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

        {/* Lesson Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Lesson Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#0088FE"
                  name="Total Lessons"
                />
                <Line
                  type="monotone"
                  dataKey="attended"
                  stroke="#10B981"
                  name="Attended"
                />
                <Line
                  type="monotone"
                  dataKey="cancelled"
                  stroke="#EF4444"
                  name="Cancelled"
                />
                <Line
                  type="monotone"
                  dataKey="pending"
                  stroke="#F59E0B"
                  name="Pending"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Lessons List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Lesson Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-3 px-4 text-left">Month</th>
                    <th className="py-3 px-4 text-right">Total Lessons</th>
                    <th className="py-3 px-4 text-right">Attended</th>
                    <th className="py-3 px-4 text-right">Cancelled</th>
                    <th className="py-3 px-4 text-right">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(lessonsByMonth)
                    .sort(([a], [b]) => b.localeCompare(a)) // Sort by month descending
                    .map(([month, monthLessons]) => {
                      const isExpanded = expandedMonths.has(month);
                      const statusCounts = monthLessons.reduce(
                        (acc: { [key: string]: number }, lesson) => {
                          acc[lesson.status] = (acc[lesson.status] || 0) + 1;
                          return acc;
                        },
                        {}
                      );

                      return (
                        <React.Fragment key={month}>
                          <tr
                            className="border-b hover:bg-gray-50 cursor-pointer"
                            onClick={() => toggleMonth(month)}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                                <span>{formatMonth(month)}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {monthLessons.length}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {statusCounts["attended"] || 0}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {statusCounts["cancelled"] || 0}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {statusCounts["pending"] || 0}
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr>
                              <td colSpan={5} className="bg-gray-50 p-4">
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
                                        Teacher
                                      </th>
                                      <th className="py-2 px-4 text-left">
                                        Package
                                      </th>
                                      <th className="py-2 px-4 text-left">
                                        Status
                                      </th>
                                      <th className="py-2 px-4 text-left">
                                        Remarks
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {monthLessons
                                      .sort(
                                        (a, b) =>
                                          new Date(a.start_datetime).getTime() -
                                          new Date(b.start_datetime).getTime()
                                      )
                                      .map((lesson) => {
                                        const teacher = users[lesson.teacher];
                                        const lessonDate = new Date(
                                          lesson.start_datetime
                                        );
                                        const packageInfo = packages.find(
                                          (p) => p.id === lesson.package
                                        );

                                        return (
                                          <tr
                                            key={lesson.id}
                                            className="border-b border-gray-200"
                                          >
                                            <td className="py-2 px-4">
                                              {lessonDate.toLocaleDateString()}
                                            </td>
                                            <td className="py-2 px-4">
                                              {lessonDate.toLocaleTimeString(
                                                [],
                                                {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                }
                                              )}
                                            </td>
                                            <td className="py-2 px-4">
                                              {teacher
                                                ? `${teacher.first_name} ${teacher.last_name}`
                                                : "Unknown"}
                                            </td>
                                            <td className="py-2 px-4">
                                              {packageInfo
                                                ? packageInfo.name
                                                : "-"}
                                            </td>
                                            <td className="py-2 px-4">
                                              <span
                                                className={`px-2 py-1 rounded-full text-sm
                                          ${
                                            lesson.status === "attended"
                                              ? "bg-green-100 text-green-800"
                                              : ""
                                          }
                                          ${
                                            lesson.status === "cancelled"
                                              ? "bg-red-100 text-red-800"
                                              : ""
                                          }
                                          ${
                                            lesson.status === "pending"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : ""
                                          }
                                        `}
                                              >
                                                {lesson.status}
                                              </span>
                                            </td>
                                            <td className="py-2 px-4">
                                              {lesson.remarks || "-"}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
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
            <CardTitle>Key Lesson Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold">Total Lessons</h3>
                <p className="text-3xl font-bold">{lessons.length}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="text-lg font-semibold">Attendance Rate</h3>
                <p className="text-3xl font-bold">
                  {(
                    ((lessonsByStatus["attended"] || 0) / lessons.length) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="text-lg font-semibold">Pending Lessons</h3>
                <p className="text-3xl font-bold">
                  {lessonsByStatus["pending"] || 0}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <h3 className="text-lg font-semibold">Cancellation Rate</h3>
                <p className="text-3xl font-bold">
                  {(
                    ((lessonsByStatus["cancelled"] || 0) / lessons.length) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LessonsAnalytics;
