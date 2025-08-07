import React, { useState } from "react";

export function PaginatedSchedule({
  schedule,
  rowsPerPage = 6,
  renderRow,
  tableHead,
  emptyMessage = "No data found",
}) {
  const [page, setPage] = useState(1);

  const total = schedule?.length || 0;
  const totalPages = Math.max(Math.ceil(total / rowsPerPage), 1);

  const startIdx = (page - 1) * rowsPerPage;
  const current = schedule.slice(startIdx, startIdx + rowsPerPage);

  return (
    <div>
      <table className="min-w-full divide-y divide-gray-200">
        {tableHead}
        <tbody className="bg-white divide-y divide-gray-200">
          {total != 0 ? (
            current.map(renderRow)
          ) : (
            <tr className="min-w-full">
              <td colSpan={9}>
                <div className="min-w-full px-4 py-10 whitespace-nowrap text-xs text-gray-900 text-center">
                  <p className="text-md text-[16px] text-gray-500">
                    {emptyMessage || "No data found"}
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {/* Pagination controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 bg-gray-200 text-gray-600 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-700">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1 bg-gray-200 text-gray-600 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
