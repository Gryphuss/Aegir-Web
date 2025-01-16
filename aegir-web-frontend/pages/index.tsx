import React, { useEffect } from "react";
import { TokenProvider, useToken } from "@/context/TokenContext";
import InstrumentsTable from "@/components/InstrumentsTable";

// API Endpoints
const LOGIN_URL = "http://localhost:8055/auth/login";

// Hardcoded credentials (for now)
const EMAIL = "test@test.com";
const PASSWORD = "interview";

const App: React.FC = () => {
  return (
    <TokenProvider>
      <HomePage />
    </TokenProvider>
  );
};

const HomePage: React.FC = () => {
  const { token, setToken } = useToken();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        console.log("Attempting to log in...");

        const response = await fetch(LOGIN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: EMAIL,
            password: PASSWORD,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Response received:", data);

        if (data.data?.access_token) {
          const accessToken = data.data.access_token;
          setToken(accessToken); // Save token in context
          localStorage.setItem("token", accessToken);
        } else {
          console.error("Token not found in response data");
        }
      } catch (error) {
        console.error("Failed to log in:", error);
      }
    };

    if (!token) {
      fetchToken(); // Fetch token
    }
  }, [token, setToken]);

  if (!token) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome to the SPA</h1>
      <InstrumentsTable />
    </div>
  );
};

export default App;
