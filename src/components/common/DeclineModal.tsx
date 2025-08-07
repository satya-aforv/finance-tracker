import { useState } from "react";

const DeclineModal = ({
  isOpen,
  onClose,
  onDecline,
  title = "Decline Action",
  message = "Please provide a reason for declining:",
  declineText = "Decline",
  cancelText = "Cancel",
}) => {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        {/* 
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md mb-6"
          rows={3}
          placeholder="Enter reason..."
        /> */}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onDecline(reason);
              onClose();
            }}
            className={`px-4 py-2 rounded-md transition bg-red-500 text-white hover:bg-red-700`}
          >
            {declineText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeclineModal;
