import React from "react";
import InstrumentsTable from "@/components/InstrumentsTable";

const HomePage: React.FC = () => {
  return (
    <div>
      <h1>Welcome to the SPA</h1>
      <InstrumentsTable></InstrumentsTable>
    </div>
  );
};

export default HomePage;
