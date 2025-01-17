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
}

interface Lesson {
  id: number;
  package: number;
  start_datetime: string;
  status: string;
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

const StudentAnalytics: React.FC = () => {
  const { token } = useToken();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [packages, setPackages] = useState<Package[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [instruments, setInstruments] = useState<{ [key: number]: string }>({});
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

        // users lookup object
        const usersMap: { [key: string]: User } = {};
        usersData.data.forEach((user: User) => {
          usersMap[user.id] = user;
        });
        setUsers(usersMap);

        setPackages(packagesData.data);
        setLessons(lessonsData.data);

        // instruments lookup object
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

  const packagesByStudent = packages.reduce(
    (acc: { [key: string]: number }, pkg) => {
      const student = users[pkg.student];
      if (student) {
        const studentName = `${student.first_name} ${student.last_name}`;
        acc[studentName] = (acc[studentName] || 0) + 1;
      }
      return acc;
    },
    {}
  );

  const lessonAttendanceData = lessons.reduce(
    (acc: { [key: string]: number }, lesson) => {
      acc[lesson.status] = (acc[lesson.status] || 0) + 1;
      return acc;
    },
    {}
  );

  // package completion rates
  const packageProgress = packages.map((pkg) => {
    const completedLessons = lessons.filter(
      (lesson) => lesson.package === pkg.id && lesson.status === "attended"
    ).length;
    const student = users[pkg.student];
    return {
      packageName: pkg.name,
      student: student
        ? `${student.first_name} ${student.last_name}`
        : "Unknown",
      instrument: instruments[pkg.instrument] || "Unknown",
      completionRate: (completedLessons / (pkg.lessons_quota || 1)) * 100,
      remainingLessons: pkg.lessons_quota - completedLessons,
    };
  });

  const toggleStudent = (studentId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId);
    } else {
      newExpanded.add(studentId);
    }
    setExpandedStudents(newExpanded);
  };

  // group package progress by student
  const studentPackages = packageProgress.reduce(
    (acc: { [key: string]: any[] }, pkg) => {
      if (!acc[pkg.student]) {
        acc[pkg.student] = [];
      }
      acc[pkg.student].push(pkg);
      return acc;
    },
    {}
  );

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* packages per Student */}
        <Card>
          <CardHeader>
            <CardTitle>Packages per Student</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(packagesByStudent).map(
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

        {/* lesson attendance distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Lesson Attendance Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(lessonAttendanceData).map(
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
                  {Object.entries(lessonAttendanceData).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Package Progress Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-3 px-4 text-left">Student</th>
                    <th className="py-3 px-4 text-right">Total Packages</th>
                    <th className="py-3 px-4 text-right">Active Packages</th>
                    <th className="py-3 px-4 text-right">Overall Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(studentPackages).map(
                    ([student, packages]) => {
                      const isExpanded = expandedStudents.has(student);
                      const activePackages = packages.filter(
                        (pkg) => pkg.completionRate < 100
                      );
                      const overallProgress =
                        packages.reduce(
                          (sum, pkg) => sum + pkg.completionRate,
                          0
                        ) / packages.length;

                      return (
                        <React.Fragment key={student}>
                          {/* Student Summary Row */}
                          <tr
                            className="border-b hover:bg-gray-50 cursor-pointer"
                            onClick={() => toggleStudent(student)}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-2">
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                                <span>{student}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              {packages.length}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {activePackages.length}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end">
                                <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                                  <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{ width: `${overallProgress}%` }}
                                  ></div>
                                </div>
                                {overallProgress.toFixed(1)}%
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Package Details */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={4} className="bg-gray-50 p-4">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-gray-200">
                                      <th className="py-2 px-4 text-left">
                                        Package Name
                                      </th>
                                      <th className="py-2 px-4 text-left">
                                        Instrument
                                      </th>
                                      <th className="py-2 px-4 text-right">
                                        Completion Rate
                                      </th>
                                      <th className="py-2 px-4 text-right">
                                        Remaining Lessons
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {packages
                                      .sort(
                                        (a, b) =>
                                          b.completionRate - a.completionRate
                                      )
                                      .map((pkg, index) => (
                                        <tr
                                          key={index}
                                          className="border-b border-gray-200"
                                        >
                                          <td className="py-2 px-4">
                                            {pkg.packageName}
                                          </td>
                                          <td className="py-2 px-4">
                                            {pkg.instrument}
                                          </td>
                                          <td className="py-2 px-4 text-right">
                                            <div className="flex items-center justify-end">
                                              <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                                                <div
                                                  className="bg-blue-600 h-2.5 rounded-full"
                                                  style={{
                                                    width: `${pkg.completionRate}%`,
                                                  }}
                                                ></div>
                                              </div>
                                              {pkg.completionRate.toFixed(1)}%
                                            </div>
                                          </td>
                                          <td className="py-2 px-4 text-right">
                                            {pkg.remainingLessons}
                                          </td>
                                        </tr>
                                      ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold">Total Packages</h3>
                <p className="text-3xl font-bold">{packages.length}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="text-lg font-semibold">Total Lessons</h3>
                <p className="text-3xl font-bold">{lessons.length}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="text-lg font-semibold">Attendance Rate</h3>
                <p className="text-3xl font-bold">
                  {(
                    (lessons.filter((l) => l.status === "attended").length /
                      lessons.length) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="text-lg font-semibold">Active Students</h3>
                <p className="text-3xl font-bold">
                  {
                    new Set(
                      packages
                        .filter((p) => p.status === "active")
                        .map((p) => p.student)
                    ).size
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentAnalytics;
