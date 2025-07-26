import { motion, AnimatePresence } from "framer-motion";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { investmentsService } from "../../services/investments";
import toast from "react-hot-toast";

const commentData = [
  {
    author: "Anjali Mehra",
    text: "Investment review completed. Proceed to next stage.",
    date: "2025-07-25T12:30:00Z",
    replies: [
      {
        author: "Anjali Mehra",
        text: "Acknowledged. Proceeding ahead.",
        date: "2025-07-24T14:30:00Z",
      },
    ],
  },
  {
    author: "Ravi Kumar",
    text: "Missing KYC document uploaded.",
    date: "2025-07-23T10:15:00Z",
  },
];

const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  onClick,
  className = "",
  type = "button",
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    outline:
      "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
      )}
      {children}
    </button>
  );
};

const CreateRemarksForm = ({
  investmentId,
  investment,
  paymentSchedule,
  onSubmit,
  onCancel,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState(commentData);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      remarks: "",
    },
  });
  console.log(paymentSchedule, "paymentSchedule");

  const [activeReply, setActiveReply] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const handleReplyToggle = (index: number) => {
    setActiveReply(index);
    setReplyText("");
  };

  const handleReplySubmit = (e: React.FormEvent, parentIndex: number) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const newReply = {
      author: "Current User", // dynamically from logged-in user
      text: replyText,
      date: new Date().toISOString(),
    };

    const updated = [...comments];
    updated[parentIndex].replies = [
      ...(updated[parentIndex].replies || []),
      newReply,
    ];
    setComments(updated);
    setActiveReply(null);
    setReplyText("");
  };

  const handleFormSubmit = async (data) => {
    try {
      setSubmitting(true);
      await investmentsService.addRemarks(investmentId, data.remarks);
      toast.success("Remarks added successfully");
      onSubmit();
    } catch (error) {
      console.error("Error adding remarks:", error);
      toast.error(error.response?.data?.message || "Failed to add remarks");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="space-y-6">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 p-4 rounded shadow-sm">
            <p className="text-sm text-white">
              Payment Due Date:{" "}
              {new Date(paymentSchedule?.dueDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }) || "N/A"}
            </p>
            <p className="text-sm text-white">
              Amount Due:{" "}
              {formatCurrency(paymentSchedule?.totalAmount) || "N/A"}
            </p>
          </div>
          <div>
            <ul className="space-y-6">
              {comments.map((comment, index) => (
                <li key={index} className="relative group">
                  {/* Main comment */}
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                        {comment.author?.[0]}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {comment.author}
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(comment.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700">
                        {comment.text}
                      </div>

                      {/* Reply button */}
                      <button
                        type="button"
                        onClick={() => handleReplyToggle(index)}
                        className="mt-1 text-xs text-blue-500 hover:underline"
                      >
                        Reply
                      </button>

                      {/* Reply form */}
                      {activeReply === index && (
                        <form
                          onSubmit={(e) => handleReplySubmit(e, index)}
                          className="mt-2 space-y-2"
                        >
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={2}
                            className="w-full p-2 border rounded text-sm"
                            placeholder="Write a reply..."
                          />
                          <div className="flex space-x-2 justify-end">
                            <button
                              type="button"
                              className="text-xs text-gray-500 hover:underline"
                              onClick={() => setActiveReply(null)}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="text-xs text-white bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
                            >
                              Post
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Replies */}
                      {comment.replies?.length > 0 && (
                        <ul className="mt-3 space-y-2 pl-6 border-l border-gray-300">
                          {comment.replies.map((reply, rIndex) => (
                            <li
                              key={rIndex}
                              className="flex items-start space-x-3"
                            >
                              <div className="flex-shrink-0">
                                <div className="h-6 w-6 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-semibold">
                                  {reply.author?.[0]}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-900">
                                  {reply.author}
                                  <span className="text-[10px] text-gray-500 ml-1">
                                    {new Date(reply.date).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-700">
                                  {reply.text}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Remarks *
            </label>
            <textarea
              {...register("remarks", { required: "Remarks are required" })}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter remarks"
            />
            {errors.remarks && (
              <p className="mt-1 text-sm text-red-600">
                {errors.remarks.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Remarks
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default CreateRemarksForm;
