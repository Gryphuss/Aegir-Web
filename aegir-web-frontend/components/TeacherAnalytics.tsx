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

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  role: {
    name: string;
  };
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

const API_URL_USERS = "http://localhost:8055/users";
const API_URL_LESSONS = "http://localhost:8055/items/lessons";
const API_URL_STUDENT_TEACHER =
  "http://localhost:8055/items/student_teacher_relations";
const API_URL_INSTRUMENTS = "http://localhost:8055/items/instruments";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

const TeacherAnalytics: React.FC = () => {
  const { token } = useToken();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [teacherRelations, setTeacherRelations] = useState<TeacherStudent[]>(
    []
  );
  const [instruments, setInstruments] = useState<{ [key: number]: string }>({});
  const [expandedTeachers, setExpandedTeachers] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

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

        const usersData = await usersResponse.json();
        const lessonsData = await lessonsResponse.json();
        const relationsData = await relationsResponse.json();
        const instrumentsData = await instrumentsResponse.json();

        // Process users
        const usersMap: { [key: string]: User } = {};
        usersData.data.forEach((user: User) => {
          usersMap[user.id] = user;
        });
        setUsers(usersMap);

        setLessons(lessonsData.data);
        setTeacherRelations(relationsData.data);

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

  const toggleTeacher = (teacherId: string) => {
    const newExpanded = new Set(expandedTeachers);
    if (newExpanded.has(teacherId)) {
      newExpanded.delete(teacherId);
    } else {
      newExpanded.add(teacherId);
    }
    setExpandedTeachers(newExpanded);
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

  // Prep the data
  const teacherStats = Object.values(users)
    .filter((user) => user.role?.name?.toLowerCase().includes("teacher"))
    .map((teacher) => {
      const teacherLessons = lessons.filter(
        (lesson) => lesson.teacher === teacher.id
      );
      const teacherStudents = teacherRelations.filter(
        (relation) => relation.teacher === teacher.id
      );
      const instrumentsTeaching = [
        ...new Set(
          teacherStudents.map((relation) => instruments[relation.instrument])
        ),
      ];

      const lessonStatusCount = teacherLessons.reduce(
        (acc: { [key: string]: number }, lesson) => {
          acc[lesson.status] = (acc[lesson.status] || 0) + 1;
          return acc;
        },
        {}
      );

      const completionRate =
        teacherLessons.length > 0
          ? ((lessonStatusCount["attended"] || 0) / teacherLessons.length) * 100
          : 0;

      return {
        id: teacher.id,
        name: `${teacher.first_name} ${teacher.last_name}`,
        totalLessons: teacherLessons.length,
        totalStudents: teacherStudents.length,
        instrumentsTaught: instrumentsTeaching,
        completionRate,
        lessonStatusCount,
        students: teacherStudents.map((relation) => ({
          name: users[relation.student]
            ? `${users[relation.student].first_name} ${
                users[relation.student].last_name
              }`
            : "Unknown Student",
          instrument: instruments[relation.instrument] || "Unknown Instrument",
        })),
      };
    });

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teacher Workload Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Teacher Workload Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={teacherStats.map((teacher) => ({
                  name: teacher.name,
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
                <Bar dataKey="lessons" fill="#0088FE" name="Total Lessons" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Teacher Instruments Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Students per Teacher</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={teacherStats.map((teacher) => ({
                    name: teacher.name,
                    value: teacher.totalStudents,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={130}
                  dataKey="value"
                >
                  {teacherStats.map((entry, index) => (
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

        {/* Teacher Details Table */}
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
                    <th className="py-3 px-4 text-right">Total Students</th>
                    <th className="py-3 px-4 text-right">Total Lessons</th>
                    <th className="py-3 px-4 text-left">Instruments</th>
                    <th className="py-3 px-4 text-right">Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherStats.map((teacher) => {
                    const isExpanded = expandedTeachers.has(teacher.id);

                    return (
                      <React.Fragment key={teacher.id}>
                        {/* Teacher Summary Row */}
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
                          <td className="py-3 px-4 text-right">
                            {teacher.totalStudents}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {teacher.totalLessons}
                          </td>
                          <td className="py-3 px-4">
                            {teacher.instrumentsTaught.join(", ")}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end">
                              <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                                <div
                                  className="bg-blue-600 h-2.5 rounded-full"
                                  style={{
                                    width: `${teacher.completionRate}%`,
                                  }}
                                ></div>
                              </div>
                              {teacher.completionRate.toFixed(1)}%
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Student Details */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="bg-gray-50 p-4">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="py-2 px-4 text-left">
                                      Student
                                    </th>
                                    <th className="py-2 px-4 text-left">
                                      Instrument
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {teacher.students.map((student, index) => (
                                    <tr
                                      key={index}
                                      className="border-b border-gray-200"
                                    >
                                      <td className="py-2 px-4">
                                        {student.name}
                                      </td>
                                      <td className="py-2 px-4">
                                        {student.instrument}
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
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Key Teaching Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold">Total Teachers</h3>
                <p className="text-3xl font-bold">{teacherStats.length}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="text-lg font-semibold">Total Lessons</h3>
                <p className="text-3xl font-bold">
                  {teacherStats.reduce(
                    (sum, teacher) => sum + teacher.totalLessons,
                    0
                  )}
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="text-lg font-semibold">Avg Students/Teacher</h3>
                <p className="text-3xl font-bold">
                  {(
                    teacherStats.reduce(
                      (sum, teacher) => sum + teacher.totalStudents,
                      0
                    ) / teacherStats.length
                  ).toFixed(1)}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="text-lg font-semibold">Avg Completion Rate</h3>
                <p className="text-3xl font-bold">
                  {(
                    teacherStats.reduce(
                      (sum, teacher) => sum + teacher.completionRate,
                      0
                    ) / teacherStats.length
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

export default TeacherAnalytics;
