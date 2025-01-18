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

import User from "@/interfaces/User";
import Payment from "@/interfaces/Payment";
import Package from "@/interfaces/Package";

interface Instrument {
  id: number;
  name: string;
}

const API_URL_USERS = "http://localhost:8055/users";
const API_URL_PAYMENTS = "http://localhost:8055/items/payments";
const API_URL_PACKAGES = "http://localhost:8055/items/packages";
const API_URL_INSTRUMENTS = "http://localhost:8055/items/instruments";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

const FinancialOverview: React.FC = () => {
  const { token } = useToken();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<{ [key: string]: User }>({});
  const [payments, setPayments] = useState<Payment[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [instruments, setInstruments] = useState<{ [key: number]: string }>({});
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;

      try {
        const [
          usersResponse,
          paymentsResponse,
          packagesResponse,
          instrumentsResponse,
        ] = await Promise.all([
          fetch(API_URL_USERS, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(API_URL_PAYMENTS, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(API_URL_PACKAGES, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(API_URL_INSTRUMENTS, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const usersData = await usersResponse.json();
        const paymentsData = await paymentsResponse.json();
        const packagesData = await packagesResponse.json();
        const instrumentsData = await instrumentsResponse.json();

        // Process users
        const usersMap: { [key: string]: User } = {};
        usersData.data.forEach((user: User) => {
          usersMap[user.id] = user;
        });
        setUsers(usersMap);

        setPayments(paymentsData.data || []);
        setPackages(packagesData.data || []);

        // Process instruments
        const instrumentsMap: { [key: number]: string } = {};
        instrumentsData.data.forEach((instrument: Instrument) => {
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

  const toggleMonth = (month: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(month)) {
      newExpanded.delete(month);
    } else {
      newExpanded.add(month);
    }
    setExpandedMonths(newExpanded);
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

  // Process financial data
  const paymentsByMonth = payments.reduce(
    (acc: { [key: string]: Payment[] }, payment) => {
      const date = new Date(payment.payment_date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(payment);
      return acc;
    },
    {}
  );

  // monthly revenue trends
  const monthlyRevenue = Object.entries(paymentsByMonth).map(
    ([month, monthPayments]) => ({
      month,
      revenue: monthPayments.reduce((sum, payment) => sum + payment.rate, 0),
      transactions: monthPayments.length,
    })
  );

  // instrument revenue distribution
  const instrumentRevenue = payments.reduce(
    (acc: { [key: string]: number }, payment) => {
      const pkg = packages.find((p) => p.id === payment.package);
      if (pkg && pkg.instrument) {
        const instrumentName = instruments[pkg.instrument] || "Unknown";
        acc[instrumentName] = (acc[instrumentName] || 0) + payment.rate;
      }
      return acc;
    },
    {}
  );

  // month reformat for display
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

  // total revenue and average transaction value calculation
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.rate, 0);
  const avgTransactionValue = totalRevenue / payments.length;

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyRevenue.sort((a, b) =>
                  a.month.localeCompare(b.month)
                )}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [
                    `$${value.toFixed(2)}`,
                    "Revenue",
                  ]}
                  labelFormatter={formatMonth}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0088FE"
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Instrument */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Distribution by Instrument</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(instrumentRevenue).map(
                    ([name, value]) => ({
                      name,
                      value,
                    })
                  )}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(1)}%)`
                  }
                  outerRadius={130}
                  dataKey="value"
                >
                  {Object.entries(instrumentRevenue).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    `$${value.toFixed(2)}`,
                    "Revenue",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Payment Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="py-3 px-4 text-left">Month</th>
                    <th className="py-3 px-4 text-right">Total Revenue</th>
                    <th className="py-3 px-4 text-right">Transactions</th>
                    <th className="py-3 px-4 text-right">
                      Avg. Transaction Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(paymentsByMonth)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([month, monthPayments]) => {
                      const isExpanded = expandedMonths.has(month);
                      const monthlyTotal = monthPayments.reduce(
                        (sum, payment) => sum + payment.rate,
                        0
                      );
                      const monthlyAvg = monthlyTotal / monthPayments.length;

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
                              ${monthlyTotal.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {monthPayments.length}
                            </td>
                            <td className="py-3 px-4 text-right">
                              ${monthlyAvg.toFixed(2)}
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr>
                              <td colSpan={4} className="bg-gray-50 p-4">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-gray-200">
                                      <th className="py-2 px-4 text-left">
                                        Date
                                      </th>
                                      <th className="py-2 px-4 text-left">
                                        Payment ID
                                      </th>
                                      <th className="py-2 px-4 text-left">
                                        Package
                                      </th>
                                      <th className="py-2 px-4 text-left">
                                        Student
                                      </th>
                                      <th className="py-2 px-4 text-right">
                                        Amount
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {monthPayments
                                      .sort(
                                        (a, b) =>
                                          new Date(b.payment_date).getTime() -
                                          new Date(a.payment_date).getTime()
                                      )
                                      .map((payment) => {
                                        const pkg = packages.find(
                                          (p) => p.id === payment.package
                                        );
                                        const student = pkg
                                          ? users[pkg.student]
                                          : null;

                                        return (
                                          <tr
                                            key={payment.id}
                                            className="border-b border-gray-200"
                                          >
                                            <td className="py-2 px-4">
                                              {new Date(
                                                payment.payment_date
                                              ).toLocaleDateString()}
                                            </td>
                                            <td className="py-2 px-4">
                                              {payment.payment_id}
                                            </td>
                                            <td className="py-2 px-4">
                                              {pkg ? pkg.name : "-"}
                                            </td>
                                            <td className="py-2 px-4">
                                              {student
                                                ? `${student.first_name} ${student.last_name}`
                                                : "Unknown Student"}
                                            </td>
                                            <td className="py-2 px-4 text-right">
                                              ${payment.rate.toFixed(2)}
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

        {/* Key Financial Metrics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Key Financial Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold">Total Revenue</h3>
                <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="text-lg font-semibold">Total Transactions</h3>
                <p className="text-3xl font-bold">{payments.length}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <h3 className="text-lg font-semibold">Avg Transaction Value</h3>
                <p className="text-3xl font-bold">
                  ${avgTransactionValue.toFixed(2) || 0}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="text-lg font-semibold">Active Packages</h3>
                <p className="text-3xl font-bold">
                  {packages.filter((p) => p.status === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialOverview;
