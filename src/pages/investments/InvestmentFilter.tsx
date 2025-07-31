import React, { useState, useEffect } from "react";

const INVESTMENT_FILTERS_STORAGE_KEY = "investmentFilters";
export interface InvestmentFilterValues {
  investmentId: string;
  createdDate: string;
  maturityDate: string;
  investorName: string;
  planName: string;
  rateType: string;
  investmentMin: string;
  investmentMax: string;
  expectedReturnMin: string;
  expectedReturnMax: string;
  progressMin: string;
  progressMax: string;
  durationMin: string;
  durationMax: string;
  status: string;
}

interface InvestmentFilterProps {
  onFilterChange: (filters: InvestmentFilterValues) => void;
  onCancel?: () => void;
  onReset?: () => void;
}

const InvestmentAdvancedFilter: React.FC<InvestmentFilterProps> = ({
  onFilterChange,
  onCancel,
  onReset,
}) => {
  const getInitialFilters = (): InvestmentFilterValues => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(INVESTMENT_FILTERS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    }
    return {
      investmentId: "",
      createdDate: "",
      maturityDate: "",
      investorName: "",
      planName: "",
      rateType: "",
      investmentMin: "",
      investmentMax: "",
      expectedReturnMin: "",
      expectedReturnMax: "",
      progressMin: "",
      progressMax: "",
      durationMin: "",
      durationMax: "",
      status: "",
    };
  };

  const [filters, setFilters] =
    useState<InvestmentFilterValues>(getInitialFilters);

  useEffect(() => {
    localStorage.setItem(
      INVESTMENT_FILTERS_STORAGE_KEY,
      JSON.stringify(filters)
    );
  }, [filters]);

  const handleChange = (field: keyof InvestmentFilterValues, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    onFilterChange(filters);
    onCancel();
  };

  const handleReset = () => {
    const resetFilters = {
      investmentId: "",
      createdDate: "",
      maturityDate: "",
      investorName: "",
      planName: "",
      rateType: "",
      investmentMin: "",
      investmentMax: "",
      expectedReturnMin: "",
      expectedReturnMax: "",
      progressMin: "",
      progressMax: "",
      durationMin: "",
      durationMax: "",
      status: "",
    };
    setFilters(resetFilters);
    localStorage.removeItem(INVESTMENT_FILTERS_STORAGE_KEY);
    onCancel();
    onReset();
  };

  return (
    <div className="bg-white border rounded-xl shadow-sm p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Filter Investments
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Investment Details */}
        <input
          type="text"
          placeholder="Investment ID"
          value={filters.investmentId}
          onChange={(e) => handleChange("investmentId", e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
        <input
          type="date"
          value={filters.createdDate}
          onChange={(e) => handleChange("createdDate", e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
        <input
          type="date"
          value={filters.maturityDate}
          onChange={(e) => handleChange("maturityDate", e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />

        {/* Investor & Plan */}
        <input
          type="text"
          placeholder="Investor Name"
          value={filters.investorName}
          onChange={(e) => handleChange("investorName", e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
        <input
          type="text"
          placeholder="Plan Name"
          value={filters.planName}
          onChange={(e) => handleChange("planName", e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />
        <select
          value={filters.rateType}
          onChange={(e) => handleChange("rateType", e.target.value)}
          className="border rounded px-3 py-2 w-full"
        >
          <option value="">Rate Type</option>
          <option value="flat">Flat</option>
          <option value="reducing">Reducing</option>
        </select>

        {/* Financial Details */}
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min ₹ Invest"
            value={filters.investmentMin}
            onChange={(e) => handleChange("investmentMin", e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
          <input
            type="number"
            placeholder="Max ₹ Invest"
            value={filters.investmentMax}
            onChange={(e) => handleChange("investmentMax", e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min ₹ Return"
            value={filters.expectedReturnMin}
            onChange={(e) => handleChange("expectedReturnMin", e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
          <input
            type="number"
            placeholder="Max ₹ Return"
            value={filters.expectedReturnMax}
            onChange={(e) => handleChange("expectedReturnMax", e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        {/* Progress & Timeline */}
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min %"
            value={filters.progressMin}
            onChange={(e) => handleChange("progressMin", e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
          <input
            type="number"
            placeholder="Max %"
            value={filters.progressMax}
            onChange={(e) => handleChange("progressMax", e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min Months"
            value={filters.durationMin}
            onChange={(e) => handleChange("durationMin", e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
          <input
            type="number"
            placeholder="Max Months"
            value={filters.durationMax}
            onChange={(e) => handleChange("durationMax", e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) => handleChange("status", e.target.value)}
          className="border rounded px-3 py-2 w-full"
        >
          <option value="">Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={handleReset}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
        >
          Reset
        </button>
        <button
          onClick={handleApply}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default InvestmentAdvancedFilter;
