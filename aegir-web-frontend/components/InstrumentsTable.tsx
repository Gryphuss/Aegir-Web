import React, { useState, useEffect } from "react";
import axios from "axios";
import Table from "../components/Table";

// API URL
const API_URL = "http://localhost:8055/items/instruments";

const InstrumentsTable: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state for any request issues

  // Fetch token from localStorage (not yet implemented)
  const getAuthToken = () => {
    return localStorage.getItem("directus_token");
  };

  //  Fetch instruments Data
  const fetchData = async () => {
    const token = getAuthToken();

    if (!token) {
      setError("No valid token found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setData(response.data.data); // Set the data
      setLoading(false); // Set loading to false
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(
          "Error fetching data: " +
            (error.response?.data?.message || error.message)
        );
      } else {
        setError("An unknown error occurred.");
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Instruments</h2>
      <Table data={data} columns={["id", "name"]} />
    </div>
  );
};

export default InstrumentsTable;
