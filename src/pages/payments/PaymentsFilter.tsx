import React, { useState } from "react";

const paymentMethods = ["UPI", "CHEQUE", "BANK TRANSFER"];
const paymentStatuses = ["Completed", "Pending", "Failed"];
export interface PaymentsFilterValues {
  paymentId: string;
  investor: string;
  investmentId: string;
  amountMin: string;
  amountMax: string;
  method: string;
  status: string;
}

interface PaymentsFilterProps {
  onFilterChange: (filters: PaymentsFilterValues) => void;
  onCancel?: () => void;
  onReset?: () => void;
}

const PaymentsFilter: React.FC<PaymentsFilterProps> = ({
  onFilterChange,
  onCancel,
  onReset,
}) => {
  const [filters, setFilters] = useState<PaymentsFilterValues>({
    paymentId: "",
    investor: "",
    investmentId: "",
    amountMin: "",
    amountMax: "",
    method: "",
    status: "",
  });

  const handleChange = (field: keyof PaymentsFilterValues, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    onFilterChange(filters);
    setTimeout(() => {
      onCancel();
    }, 500);
  };

  const handleReset = () => {
    const resetFilters = {
      planNameOrId: "",
      paymentStructure: "",
      minTerm: "",
      maxTerm: "",
      minInvestment: "",
      maxInvestment: "",
      riskLevel: "",
      status: "",
      validation: "",
    };
    setFilters(resetFilters);
    setTimeout(() => {
      onCancel();
    }, 500);
    onFilterChange(resetFilters);
    if (onReset) onReset();
  };

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {/* Payment ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Payment ID
          </label>
          <input
            type="text"
            name="paymentId"
            value={filters.paymentId}
            onChange={handleChange}
            placeholder="PAY00000005"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm"
          />
        </div>

        {/* Investment ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Investment ID
          </label>
          <input
            type="text"
            name="investmentId"
            value={filters.investmentId}
            onChange={handleChange}
            placeholder="INVST000004"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm"
          />
        </div>

        {/* Investor */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Investor Name
          </label>
          <input
            type="text"
            name="investor"
            value={filters.investor}
            onChange={handleChange}
            placeholder="Sunita Reddy"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm"
          />
        </div>

        {/* Amount Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Amount Range (₹)
          </label>
          <div className="flex gap-2 mt-1">
            <input
              type="number"
              name="amountMin"
              value={filters.amountMin}
              onChange={handleChange}
              placeholder="Min"
              className="w-1/2 border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm"
            />
            <input
              type="number"
              name="amountMax"
              value={filters.amountMax}
              onChange={handleChange}
              placeholder="Max"
              className="w-1/2 border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm"
            />
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Payment Method
          </label>
          <select
            name="method"
            value={filters.method}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm"
          >
            <option value="">All</option>
            {paymentMethods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            name="status"
            value={filters.status}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm"
          >
            <option value="">All</option>
            {paymentStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
        >
          Reset
        </button>
        <button
          onClick={handleApply}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default PaymentsFilter;
