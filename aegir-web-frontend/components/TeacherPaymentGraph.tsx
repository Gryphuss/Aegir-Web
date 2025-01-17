import React, { useEffect, useState } from "react";
import { useToken } from "@/context/TokenContext";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

ChartJS.register(ArcElement, Tooltip, Legend);

const API_URL_PAYMENTS = "http://localhost:8055/items/payments";
const API_URL_TEACHERS = "http://localhost:8055/items/directus_users";

const TeacherPaymentGraph: React.FC = () => {
  const { token } = useToken();
  const [paymentData, setPaymentData] = useState<[string, number][]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!token) {
      console.error("No token found");
      return;
    }

    const fetchData = async () => {
      try {
        const paymentResponse = await fetch(API_URL_PAYMENTS, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!paymentResponse.ok) {
          throw new Error(`HTTP error! status: ${paymentResponse.status}`);
        }

        const paymentResult = await paymentResponse.json();
        const payments = paymentResult.data;

        const teacherPayments: { [key: string]: number } = {};

        payments.forEach((payment: { package: number; payment_id: string }) => {
          // Need more complex joins to get the insights
          const teacher = payment.package.toString();
          if (!teacherPayments[teacher]) {
            teacherPayments[teacher] = 0;
          }
          teacherPayments[teacher]++;
        });

        setPaymentData(Object.entries(teacherPayments));
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
        <Skeleton className="w-full h-64" />
      </div>
    );
  }

  const labels = paymentData.map(([teacher]) => teacher);
  const counts = paymentData.map(([, count]) => count);

  const pieData = {
    labels,
    datasets: [
      {
        data: counts,
        backgroundColor: [
          "rgba(255, 99, 132, 0.5)",
          "rgba(54, 162, 235, 0.5)",
          "rgba(75, 192, 192, 0.5)",
          "rgba(153, 102, 255, 0.5)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Teacher Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Pie
            data={pieData}
            options={{ responsive: true, maintainAspectRatio: true }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherPaymentGraph;
