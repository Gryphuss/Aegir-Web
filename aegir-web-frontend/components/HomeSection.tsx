import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Users, BookOpen } from "lucide-react";
import { useToken } from "@/context/TokenContext";
import { Skeleton } from "@/components/ui/skeleton";

interface Role {
  id: string;
  name: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface Stats {
  teacherCount: number;
  studentCount: number;
  instrumentCount: number;
  monthlyLessons: number;
  totalPackages: number;
  totalRevenue: number;
}

const API_URL_USERS = "http://localhost:8055/users";
const API_URL_ROLES = "http://localhost:8055/roles";
const API_URL_LESSONS = "http://localhost:8055/items/lessons";
const API_URL_INSTRUMENTS = "http://localhost:8055/items/instruments";
const API_URL_PACKAGES = "http://localhost:8055/items/packages";
const API_URL_PAYMENTS = "http://localhost:8055/items/payments";

// known role IDs from the database
const TEACHER_ROLE_ID = "83c708d8-90c4-4835-b066-2d36ec66ac50";
const STUDENT_ROLE_ID = "4dbda2fc-909b-4767-849b-1ab4a0d5d374";

const HomeSection: React.FC = () => {
  const { token } = useToken();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    teacherCount: 0,
    studentCount: 0,
    instrumentCount: 0,
    monthlyLessons: 0,
    totalPackages: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("No authentication token available");
        setLoading(false);
        return;
      }

      try {
        const [
          usersResponse,
          lessonsResponse,
          instrumentsResponse,
          packagesResponse,
          paymentsResponse,
        ] = await Promise.all([
          fetch(API_URL_USERS, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(API_URL_LESSONS, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(API_URL_INSTRUMENTS, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(API_URL_PACKAGES, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(API_URL_PAYMENTS, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const usersData = await usersResponse.json();
        const lessonsData = await lessonsResponse.json();
        const instrumentsData = await instrumentsResponse.json();
        const packagesData = await packagesResponse.json();
        const paymentsData = await paymentsResponse.json();

        // count teachers and students based on role ID (after the updated User interface)
        const teachers = usersData.data.filter(
          (user: User) => user.role === TEACHER_ROLE_ID
        );
        const students = usersData.data.filter(
          (user: User) => user.role === STUDENT_ROLE_ID
        );

        // Get monthly lessons
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const monthlyLessons = lessonsData.data.filter(
          (lesson: any) => new Date(lesson.start_datetime) >= thirtyDaysAgo
        );

        //  total revenue
        const totalRevenue = paymentsData.data.reduce(
          (sum: number, payment: any) => sum + (payment.rate || 0),
          0
        );

        setStats({
          teacherCount: teachers.length,
          studentCount: students.length,
          instrumentCount: instrumentsData.data.length,
          monthlyLessons: monthlyLessons.length,
          totalPackages: packagesData.data.length,
          totalRevenue,
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data");
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

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

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-24 w-full mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Music School Management System
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Streamlining music school comprehensive analytics and management tools
        </p>
      </div>

      {/* Main Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="mb-6 mt-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-blue-200 transition-all duration-300">
                <Music className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              {stats.instrumentCount} Instruments
            </h2>
            <p className="text-gray-600">
              Managing {stats.instrumentCount} different instruments across{" "}
              {stats.studentCount} students and {stats.teacherCount} teachers.
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="mb-6 mt-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-green-200 transition-all duration-300">
                <Users className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              {stats.studentCount} Active Students
            </h2>
            <p className="text-gray-600">
              {stats.teacherCount} dedicated teachers providing quality music
              education to {stats.studentCount} students.
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="mb-6 mt-4">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto group-hover:bg-purple-200 transition-all duration-300">
                <BookOpen className="w-10 h-10 text-purple-600" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              {stats.monthlyLessons} Monthly Lessons
            </h2>
            <p className="text-gray-600">
              Managing {stats.totalPackages} active packages with{" "}
              {stats.monthlyLessons} lessons conducted monthly.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Section */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Current Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-4xl font-bold text-blue-600 mb-2">
              {stats.teacherCount}
            </p>
            <p className="text-gray-600 font-medium">Active Teachers</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-4xl font-bold text-green-600 mb-2">
              {stats.studentCount}
            </p>
            <p className="text-gray-600 font-medium">Enrolled Students</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-4xl font-bold text-yellow-600 mb-2">
              {stats.monthlyLessons}
            </p>
            <p className="text-gray-600 font-medium">Monthly Lessons</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-4xl font-bold text-purple-600 mb-2">
              ${stats.totalRevenue.toLocaleString()}
            </p>
            <p className="text-gray-600 font-medium">Total Revenue</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeSection;
