import React, { useEffect, useState } from "react";
import { useToken } from "@/context/TokenContext";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const API_URL_STUDENT_INSTRUMENTS =
  "http://localhost:8055/items/junction_students_instruments";
const API_URL_INSTRUMENTS = "http://localhost:8055/items/instruments";

const StudentInstrumentGraph: React.FC = () => {
  const { token } = useToken();
  const [instrumentData, setInstrumentData] = useState<[string, number][]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!token) {
      console.error("No token found");
      return;
    }

    const fetchData = async () => {
      try {
        console.log("Fetching instruments data");

        const instrumentResponse = await fetch(API_URL_INSTRUMENTS, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!instrumentResponse.ok) {
          throw new Error(`HTTP error! status: ${instrumentResponse.status}`);
        }

        const instrumentsResult = await instrumentResponse.json();
        const instruments = instrumentsResult.data;

        const studentInstrumentsResponse = await fetch(
          API_URL_STUDENT_INSTRUMENTS,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!studentInstrumentsResponse.ok) {
          throw new Error(
            `HTTP error! status: ${studentInstrumentsResponse.status}`
          );
        }

        const studentInstrumentsResult =
          await studentInstrumentsResponse.json();
        const studentInstruments = studentInstrumentsResult.data;

        const instrumentCounts: { [key: string]: number } = {};
        instruments.forEach((instrument: { id: number; name: string }) => {
          instrumentCounts[instrument.name] = 0;
        });

        studentInstruments.forEach((item: { instruments_id: number }) => {
          const instrument = instruments.find(
            (instr: { id: number }) => instr.id === item.instruments_id
          );
          if (instrument) {
            instrumentCounts[instrument.name]++;
          }
        });

        setInstrumentData(Object.entries(instrumentCounts));
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
          {/* Skeleton loaders for Bar and Pie chart areas */}
          <Skeleton className="w-full h-64" />
          <Skeleton className="w-full h-64" />
        </div>
      </div>
    );
  }

  const labels = instrumentData.map(([name]) => name);
  const counts = instrumentData.map(([, count]) => count);

  const barData = {
    labels,
    datasets: [
      {
        label: "Number of Students",
        data: counts,
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const pieData = {
    labels,
    datasets: [
      {
        data: counts,
        backgroundColor: [
          "rgba(255, 99, 132, 0.5)",
          "rgba(54, 162, 235, 0.5)",
          "rgba(255, 206, 86, 0.5)",
          "rgba(75, 192, 192, 0.5)",
          "rgba(153, 102, 255, 0.5)",
          "rgba(255, 159, 64, 0.5)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Instrument Popularity (Bar Chart)</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar
              data={barData}
              options={{ responsive: true, maintainAspectRatio: true }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proportion of Students (Pie Chart)</CardTitle>
          </CardHeader>
          <CardContent>
            <Pie
              data={pieData}
              options={{ responsive: true, maintainAspectRatio: true }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentInstrumentGraph;
