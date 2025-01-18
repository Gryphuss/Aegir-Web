import User from "@/interfaces/User";

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

export default TeacherStats;
