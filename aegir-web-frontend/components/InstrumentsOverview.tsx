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
import InstrumentData from "@/interfaces/InstrumentData";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

const API_URL_INSTRUMENTS = "http://localhost:8055/items/instruments";
const API_URL_STUDENT_INSTRUMENTS =
  "http://localhost:8055/items/junction_students_instruments";
const API_URL_TEACHER_INSTRUMENTS =
  "http://localhost:8055/items/junction_teachers_instruments";

const InstrumentsOverview: React.FC = () => {
  const { token } = useToken();
  const [instrumentData, setInstrumentData] = useState<InstrumentData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!token) {
      console.error("No token found");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch instruments
        const instrumentResponse = await fetch(API_URL_INSTRUMENTS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!instrumentResponse.ok)
          throw new Error(`HTTP error! status: ${instrumentResponse.status}`);
        const instrumentsResult = await instrumentResponse.json();
        const instruments = instrumentsResult.data;

        // Fetch student-instrument relations
        const studentInstrumentsResponse = await fetch(
          API_URL_STUDENT_INSTRUMENTS,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!studentInstrumentsResponse.ok)
          throw new Error(
            `HTTP error! status: ${studentInstrumentsResponse.status}`
          );
        const studentInstrumentsResult =
          await studentInstrumentsResponse.json();
        const studentInstruments = studentInstrumentsResult.data;

        // Fetch teacher-instrument relations
        const teacherInstrumentsResponse = await fetch(
          API_URL_TEACHER_INSTRUMENTS,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!teacherInstrumentsResponse.ok)
          throw new Error(
            `HTTP error! status: ${teacherInstrumentsResponse.status}`
          );
        const teacherInstrumentsResult =
          await teacherInstrumentsResponse.json();
        const teacherInstruments = teacherInstrumentsResult.data;

        const processedData: InstrumentData[] = instruments.map(
          (instrument: { id: number; name: string }) => ({
            name: instrument.name,
            students: studentInstruments.filter(
              (item: { instruments_id: number }) =>
                item.instruments_id === instrument.id
            ).length,
            teachers: teacherInstruments.filter(
              (item: { instruments_id: number }) =>
                item.instruments_id === instrument.id
            ).length,
          })
        );

        setInstrumentData(processedData);
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

  // Percentage claculations
  const totalStudents = instrumentData.reduce(
    (sum, item) => sum + item.students,
    0
  );
  const totalTeachers = instrumentData.reduce(
    (sum, item) => sum + item.teachers,
    0
  );

  // student pie chart distribution
  const pieChartData = instrumentData.map((item) => ({
    name: item.name,
    value: item.students,
  }));

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Students vs Teachers Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={instrumentData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" fill="#0088FE" name="Students" />
                <Bar dataKey="teachers" fill="#00C49F" name="Teachers" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Student Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Student Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({
                    cx,
                    cy,
                    midAngle,
                    innerRadius,
                    outerRadius,
                    percent,
                    name,
                  }) => {
                    const radius =
                      innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x =
                      cx + radius * Math.cos((-midAngle * Math.PI) / 180);
                    const y =
                      cy + radius * Math.sin((-midAngle * Math.PI) / 180);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="black"
                        textAnchor={x > cx ? "start" : "end"}
                        dominantBaseline="central"
                      >
                        {`${name} ${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                  outerRadius={130}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
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

        {/* Summary Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Instruments Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">Instrument</th>
                    <th className="py-2 px-4 text-right">Students</th>
                    <th className="py-2 px-4 text-right">Teachers</th>
                    <th className="py-2 px-4 text-right">Student %</th>
                    <th className="py-2 px-4 text-right">Teacher %</th>
                    <th className="py-2 px-4 text-right">
                      Student/Teacher Ratio
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {instrumentData.map((instrument, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-4">{instrument.name}</td>
                      <td className="py-2 px-4 text-right">
                        {instrument.students}
                      </td>
                      <td className="py-2 px-4 text-right">
                        {instrument.teachers}
                      </td>
                      <td className="py-2 px-4 text-right">
                        {((instrument.students / totalStudents) * 100).toFixed(
                          1
                        )}
                        %
                      </td>
                      <td className="py-2 px-4 text-right">
                        {((instrument.teachers / totalTeachers) * 100).toFixed(
                          1
                        )}
                        %
                      </td>
                      <td className="py-2 px-4 text-right">
                        {instrument.teachers
                          ? (instrument.students / instrument.teachers).toFixed(
                              1
                            )
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstrumentsOverview;
