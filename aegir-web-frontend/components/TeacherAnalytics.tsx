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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronRight } from "lucide-react";

// Constants
const TEACHER_ROLE_ID = "83c708d8-90c4-4835-b066-2d36ec66ac50";
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

// API Endpoints
const API_URL_USERS = "http://localhost:8055/users";
const API_URL_LESSONS = "http://localhost:8055/items/lessons";
const API_URL_STUDENT_TEACHER =
  "http://localhost:8055/items/student_teacher_relations";
const API_URL_INSTRUMENTS = "http://localhost:8055/items/instruments";

// Interfaces
interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface Lesson {
  id: number;
  teacher: string;
  start_datetime: string;
  status: string;
  package: number;
}

interface TeacherStudent {
  id: number;
  teacher: string;
  student: string;
  instrument: number;
}

interface TeacherStats {
  id: string;
  name: string;
  totalStudents: number;
  totalLessons: number;
  completedLessons: number;
  cancelledLessons: number;
  pendingLessons: number;
  instruments: string[];
  students: {
    student: User | null;
    instrument: string;
  }[];
  averageCompletionRate: number;
}

const TeacherAnalytics: React.FC = () => {
  // State
  const { token } = useToken();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [teacherRelations, setTeacherRelations] = useState<TeacherStudent[]>(
    []
  );
  const [instruments, setInstruments] = useState<{ [key: number]: string }>({});
  const [expandedTeachers, setExpandedTeachers] = useState<Set<string>>(
    new Set()
  );

  // Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("Authentication token not found");
        setLoading(false);
        return;
      }

      try {
        const [
          usersResponse,
          lessonsResponse,
          relationsResponse,
          instrumentsResponse,
        ] = await Promise.all([
          fetch(API_URL_USERS, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(API_URL_LESSONS, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(API_URL_STUDENT_TEACHER, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(API_URL_INSTRUMENTS, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // const [usersData, lessonsData, relationsData, instrumentsData] =
        //   await Promise.all([
        //     usersResponse.json(),
        //     lessonsResponse.json(),
        //     relationsResponse.json(),
        //     instrumentsResponse.json(),
        //   ]);

        const usersData = await usersResponse.json();
        const lessonsData = await lessonsResponse.json();
        const instrumentsData = await instrumentsResponse.json();
        const relationsData = await relationsResponse.json();

        // Process users
        const usersMap: { [key: string]: User } = {};
        usersData.data.forEach((user: User) => {
          usersMap[user.id] = user;
        });

        // Process instruments
        const instrumentsMap: { [key: number]: string } = {};
        instrumentsData.data.forEach((instrument: any) => {
          instrumentsMap[instrument.id] = instrument.name;
        });

        setUsers(usersMap);
        setLessons(lessonsData.data || []);
        setTeacherRelations(relationsData.data || []);
        setInstruments(instrumentsMap);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data. Please try again later.");
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Event Handlers
  const toggleTeacher = (teacherId: string) => {
    const newExpanded = new Set(expandedTeachers);
    if (newExpanded.has(teacherId)) {
      newExpanded.delete(teacherId);
    } else {
      newExpanded.add(teacherId);
    }
    setExpandedTeachers(newExpanded);
  };

  // Process Teacher Statistics
  const teachers = Object.values(users).filter(
    (user) => user.role === TEACHER_ROLE_ID
  );

  const teacherStats = teachers.map((teacher) => {
    const teacherLessons = lessons.filter(
      (lesson) => lesson.teacher === teacher.id
    );
    const teacherStudents = teacherRelations.filter(
      (relation) => relation.teacher === teacher.id
    );

    const lessonsByStatus = teacherLessons.reduce(
      (acc: { [key: string]: number }, lesson) => {
        acc[lesson.status] = (acc[lesson.status] || 0) + 1;
        return acc;
      },
      {}
    );

    const uniqueInstruments = [
      ...new Set(teacherStudents.map((relation) => relation.instrument)),
    ];

    return {
      id: teacher.id,
      name: `${teacher.first_name} ${teacher.last_name}`,
      totalStudents: teacherStudents.length,
      totalLessons: teacherLessons.length,
      completedLessons: lessonsByStatus["attended"] || 0,
      cancelledLessons: lessonsByStatus["cancelled"] || 0,
      pendingLessons: lessonsByStatus["pending"] || 0,
      instruments: uniqueInstruments.map((id) => instruments[id] || "Unknown"),
      students: teacherStudents.map((relation) => ({
        student: users[relation.student] || null,
        instrument: instruments[relation.instrument] || "Unknown",
      })),
      averageCompletionRate:
        teacherLessons.length > 0
          ? ((lessonsByStatus["attended"] || 0) / teacherLessons.length) * 100
          : 0,
    };
  });

  // Loading State
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="w-full h-96" />
          <Skeleton className="w-full h-96" />
          <Skeleton className="w-full h-96 lg:col-span-2" />
          <Skeleton className="w-full h-48 lg:col-span-2" />
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500 text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workload Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Teacher Workload Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={teacherStats.map((teacher) => ({
                  name: teacher.name,
                  students: teacher.totalStudents,
                  lessons: teacher.totalLessons,
                }))}
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
                <Legend />
                <Bar dataKey="students" fill="#0088FE" name="Students" />
                <Bar dataKey="lessons" fill="#00C49F" name="Lessons" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Overall Lesson Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Lesson Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    {
                      name: "Completed",
                      value: teacherStats.reduce(
                        (sum, t) => sum + t.completedLessons,
                        0
                      ),
                    },
                    {
                      name: "Cancelled",
                      value: teacherStats.reduce(
                        (sum, t) => sum + t.cancelledLessons,
                        0
                      ),
                    },
                    {
                      name: "Pending",
                      value: teacherStats.reduce(
                        (sum, t) => sum + t.pendingLessons,
                        0
                      ),
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={130}
                  dataKey="value"
                >
                  {[0, 1, 2].map((entry, index) => (
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

        {/* Detailed Teacher Performance Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Teacher Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-3 px-4 text-left">Teacher</th>
                    <th className="py-3 px-4 text-center">Students</th>
                    <th className="py-3 px-4 text-center">Total Lessons</th>
                    <th className="py-3 px-4 text-center">Completion Rate</th>
                    <th className="py-3 px-4 text-center">Instruments</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherStats.map((teacher) => {
                    const isExpanded = expandedTeachers.has(teacher.id);

                    return (
                      <React.Fragment key={teacher.id}>
                        <tr
                          className="border-b hover:bg-gray-50 cursor-pointer"
                          onClick={() => toggleTeacher(teacher.id)}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                              <span>{teacher.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {teacher.totalStudents}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {teacher.totalLessons}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                                <div
                                  className="bg-blue-600 h-2.5 rounded-full"
                                  style={{
                                    width: `${teacher.averageCompletionRate}%`,
                                  }}
                                />
                              </div>
                              <span>
                                {teacher.averageCompletionRate.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {teacher.instruments.join(", ")}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="bg-gray-50 p-4">
                              <div className="space-y-4">
                                {/* Lesson Status Summary */}
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="bg-green-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500">
                                      Completed Lessons
                                    </p>
                                    <p className="text-2xl font-bold">
                                      {teacher.completedLessons}
                                    </p>
                                  </div>
                                  <div className="bg-red-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500">
                                      Cancelled Lessons
                                    </p>
                                    <p className="text-2xl font-bold">
                                      {teacher.cancelledLessons}
                                    </p>
                                  </div>
                                  <div className="bg-yellow-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-500">
                                      Pending Lessons
                                    </p>
                                    <p className="text-2xl font-bold">
                                      {teacher.pendingLessons}
                                    </p>
                                  </div>
                                </div>

                                {/* Student List */}
                                <div>
                                  <h4 className="font-medium mb-2">
                                    Students & Instruments
                                  </h4>
                                  <div className="bg-white rounded-lg shadow-sm">
                                    <table className="w-full">
                                      <thead>
                                        <tr className="border-b">
                                          <th className="py-2 px-4 text-left">
                                            Student
                                          </th>
                                          <th className="py-2 px-4 text-left">
                                            Instrument
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {teacher.students.map(
                                          (studentInfo, index) => (
                                            <tr
                                              key={index}
                                              className="border-b"
                                            >
                                              <td className="py-2 px-4">
                                                {studentInfo.student
                                                  ? `${studentInfo.student.first_name} ${studentInfo.student.last_name}`
                                                  : "Unknown Student"}
                                              </td>
                                              <td className="py-2 px-4">
                                                {studentInfo.instrument}
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
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
      </div>
    </div>
  );
};

export default TeacherAnalytics;
