import React, { useState } from "react";
import { motion } from "framer-motion";

export interface InvestorFilterValues {
  nameOrId: string;
  contact: string;
  minInvestment: string;
  maxInvestment: string;
  userAccount: string;
  status: string;
}

interface InvestorFilterProps {
  onFilterChange: (filters: InvestorFilterValues) => void;
  onCancel?: () => void;
  onReset?: () => void;
}

const InvestorFilter: React.FC<InvestorFilterProps> = ({
  onFilterChange,
  onCancel,
  onReset,
}) => {
  const [filters, setFilters] = useState<InvestorFilterValues>({
    nameOrId: "",
    contact: "",
    minInvestment: "",
    maxInvestment: "",
    userAccount: "",
    status: "",
  });

  const handleApplyFilters = () => {
    onFilterChange(filters);
    setTimeout(() => {
      onCancel();
    }, 500);
  };

  const handleChange = (field: keyof InvestorFilterValues, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      nameOrId: "",
      contact: "",
      minInvestment: "",
      maxInvestment: "",
      userAccount: "",
      status: "",
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
    if (onReset) onReset();
    setTimeout(() => {
      onCancel();
    }, 500);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="bg-white p-4 border rounded-lg shadow-sm mb-4">
        <h2 className="text-lg font-medium mb-4">Filter Investors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {/* Name or ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Investor
            </label>
            <input
              type="text"
              placeholder="Search name or ID"
              value={filters.nameOrId}
              onChange={(e) => handleChange("nameOrId", e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm"
            />
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contact
            </label>
            <input
              type="text"
              placeholder="Email or Phone"
              value={filters.contact}
              onChange={(e) => handleChange("contact", e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm"
            />
          </div>

          {/* Investment Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Investment Range
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

          {/* User Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              User Account
            </label>
            <select
              value={filters.userAccount}
              onChange={(e) => handleChange("userAccount", e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm"
            >
              <option value="">All</option>
              <option value="active">Active Account</option>
              <option value="inactive">Inactive Account</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm text-sm"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Reset
          </button>
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default InvestorFilter;
