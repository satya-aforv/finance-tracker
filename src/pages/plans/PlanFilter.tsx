import React, { useEffect, useState } from "react";
const PLAN_FILTERS_STORAGE_KEY = "plansFilters";

export interface PlanFilterValues {
  planNameOrId: string;
  paymentStructure: string;
  minTerm: string;
  maxTerm: string;
  minInvestment: string;
  maxInvestment: string;
  riskLevel: string;
  status: string;
  validation: string;
}

interface PlanFilterProps {
  onFilterChange: (filters: PlanFilterValues) => void;
  onCancel?: () => void;
  onReset?: () => void;
}

const PlanFilter: React.FC<PlanFilterProps> = ({
  onFilterChange,
  onCancel,
  onReset,
}) => {
  const getInitialPlanFilters = (): PlanFilterValues => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(PLAN_FILTERS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    }
    return {
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
  };
  const [filters, setFilters] = useState<PlanFilterValues>(
    getInitialPlanFilters()
  );

  const handleChange = (field: keyof PlanFilterValues, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(PLAN_FILTERS_STORAGE_KEY, JSON.stringify(filters));
    }
  }, [filters]);

  const handleApply = () => {
    onFilterChange(filters);
    onCancel();
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
    localStorage.removeItem(PLAN_FILTERS_STORAGE_KEY);
    onCancel();
    onFilterChange(resetFilters);
    if (onReset) onReset();
  };

  return (
    <div className="bg-white p-4 border rounded-lg shadow-sm mb-4">
      <h2 className="text-lg font-medium mb-4">Filter Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plan Name or ID */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Plan Name / ID
          </label>
          <input
            type="text"
            value={filters.planNameOrId}
            onChange={(e) => handleChange("planNameOrId", e.target.value)}
            placeholder="Search plan..."
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm"
          />
        </div>

        {/* Payment Structure */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Payment Structure
          </label>
          <select
            value={filters.paymentStructure}
            onChange={(e) => handleChange("paymentStructure", e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm"
          >
            <option value="">All</option>
            <option value="interest-only">Interest Only</option>
            <option value="emi">EMI Based</option>
          </select>
        </div>

        {/* Term Range */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Duration (months)
          </label>
          <div className="flex gap-2 mt-1">
            <input
              type="number"
              placeholder="Min"
              value={filters.minTerm}
              onChange={(e) => handleChange("minTerm", e.target.value)}
              className="w-1/2 border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxTerm}
              onChange={(e) => handleChange("maxTerm", e.target.value)}
              className="w-1/2 border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm"
            />
          </div>
        </div>

        {/* Investment Range */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Investment (₹)
          </label>
          <div className="flex gap-2 mt-1">
            <input
              type="number"
              placeholder="Min"
              value={filters.minInvestment}
              onChange={(e) => handleChange("minInvestment", e.target.value)}
              className="w-1/2 border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxInvestment}
              onChange={(e) => handleChange("maxInvestment", e.target.value)}
              className="w-1/2 border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm"
            />
          </div>
        </div>

        {/* Risk Level */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Risk Level
          </label>
          <select
            value={filters.riskLevel}
            onChange={(e) => handleChange("riskLevel", e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm"
          >
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="text-sm font-medium text-gray-700">Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleChange("status", e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Validation */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Validation
          </label>
          <select
            value={filters.validation}
            onChange={(e) => handleChange("validation", e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm"
          >
            <option value="">All</option>
            <option value="valid">Valid</option>
            <option value="invalid">Invalid</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Reset
        </button>
        <button
          onClick={handleApply}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default PlanFilter;
