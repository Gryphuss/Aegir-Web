import React, { useEffect, useState } from "react";
import { useToken } from "@/context/TokenContext";
import Table from "../components/Table";

// API Endpoint
const API_URL = "http://localhost:8055/items/instruments";

const InstrumentsTable: React.FC = () => {
  const { token } = useToken(); // Retrieve the token from context
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!token) {
      console.error("No token found");
      return;
    }

    const fetchData = async () => {
      try {
        console.log("Fetching instruments data...");
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`, // Attach the token as a Bearer token
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setData(result.data); // Save fetched data to state
        setLoading(false); // Set loading to false after data is fetched
      } catch (error) {
        console.error("Error fetching instruments:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Instruments</h2>
      <Table data={data} columns={["id", "name"]} />
    </div>
  );
};

export default InstrumentsTable;
