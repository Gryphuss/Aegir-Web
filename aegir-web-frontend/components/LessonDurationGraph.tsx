import React, { useEffect, useState } from "react";
import { useToken } from "@/context/TokenContext";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

ChartJS.register(BarElement, Tooltip, Legend, CategoryScale, LinearScale);

const API_URL_LESSONS = "http://localhost:8055/items/lessons";

const LessonsDurationGraph: React.FC = () => {
  const { token } = useToken();
  const [lessonData, setLessonData] = useState<[string, number][]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!token) {
      console.error("No token found");
      return;
    }

    const fetchData = async () => {
      try {
        const lessonResponse = await fetch(API_URL_LESSONS, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!lessonResponse.ok) {
          throw new Error(`HTTP error! status: ${lessonResponse.status}`);
        }

        const lessonResult = await lessonResponse.json();
        const lessons = lessonResult.data;

        const durationCounts: { [key: string]: number } = {};

        lessons.forEach((lesson: { duration: number }) => {
          const duration = lesson.duration.toString();
          if (!durationCounts[duration]) {
            durationCounts[duration] = 0;
          }
          durationCounts[duration]++;
        });

        setLessonData(Object.entries(durationCounts));
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

  const labels = lessonData.map(([duration]) => duration);
  const counts = lessonData.map(([, count]) => count);

  const barData = {
    labels,
    datasets: [
      {
        label: "Number of Lessons by Duration",
        data: counts,
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Lessons Duration</CardTitle>
        </CardHeader>
        <CardContent>
          <Bar
            data={barData}
            options={{ responsive: true, maintainAspectRatio: true }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default LessonsDurationGraph;
