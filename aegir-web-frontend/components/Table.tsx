import React from "react";

// Table row data type
type TableRow = {
  id: number;
  name: string;
};

// Props for Table component
type TableProps = {
  data: TableRow[]; // Rows
  columns: (keyof TableRow)[]; // Columns to display
};

const Table: React.FC<TableProps> = ({ data, columns }) => {
  return (
    <table className="min-w-full table-auto">
      <thead>
        <tr>
          {columns.map((col, idx) => (
            <th key={idx} className="px-4 py-2">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} className="border-b">
            {columns.map((col, i) => (
              <td key={i} className="px-4 py-2">
                {row[col]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;
