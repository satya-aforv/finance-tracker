import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { investmentsService } from "../../services/investments";
import toast from "react-hot-toast";

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
  const [comments, setComments] = useState([]);
  const MAX_CHARS = 1000;
  const [remainingChars, setRemainingChars] = useState(MAX_CHARS);
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    trigger,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      content: "",
      type: "note_added",
    },
  });

  const [activeReply, setActiveReply] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState("");

  const content = watch("content");
  useEffect(() => {
    setRemainingChars(MAX_CHARS - (content?.length || 0));
    trigger("content"); // Manually trigger validation
  }, [content, trigger]);

  useEffect(() => {
    if (paymentSchedule) {
      setComments(paymentSchedule.comments);
      console.log(paymentSchedule?.comments, "paymentSchedule");
    }
  }, [investment]);

  // Custom validation functions
  const validateContent = (value: string) => {
    if (!value.trim()) return "Remarks are required";
    if (value.length > MAX_CHARS)
      return `Maximum ${MAX_CHARS} characters allowed`;

    // Check for valid sentence structure
    const wordCount = value.trim().split(/\s+/).length;
    const avgWordLength = value.replace(/\s+/g, "").length / wordCount;

    // 1. Gibberish detection (repeating characters/patterns)
    if (/(\w)\1{3,}/i.test(value))
      return "Please use meaningful text without repeated characters";

    // 2. Special character flood
    if (/[^\w\s]{3,}/.test(value)) return "Too many special characters";

    // 3. Suspicious patterns (mixed chars/numbers)
    if (/\w*\d+\w*[^\w\s]+\w*\d+\w*/i.test(value))
      return "Invalid text pattern detected";

    // 4. Minimum word requirements
    if (wordCount < 3 || avgWordLength < 2)
      return "Please write complete sentences, at least 3 words, and average word length of 2+ characters";

    // 5. Code/HTML detection
    if (/<[^>]+>|function\(|var\s+\w+=|console\./.test(value))
      return "Code snippets are not allowed";

    // 6. URL detection
    if (/https?:\/\/|www\.|\.[a-z]{2,}\//i.test(value))
      return "Links are not allowed";

    // 7. Spam phrases
    if (/(free|money|win|offer|click here|limited time)/gi.test(value))
      return "Spam-like content detected";

    return true;
  };

  const handleReplyToggle = (index) => {
    setActiveReply(activeReply === index ? null : index);
    setReplyText("");
  };

  const handleReplySubmit = async (e, parentIndex) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const newReply = {
      content: replyText,
      date: new Date().toISOString(),
    };

    const updatedComments = [...comments];
    updatedComments[parentIndex].replies = [
      ...(updatedComments[parentIndex].replies || []),
      newReply,
    ];

    const formData = new FormData();
    formData.append("content", newReply.content);

    // if (data.attachments) {
    //   Array.from(data.attachments).forEach((file) => {
    //     formData.append("attachments", file);
    //   });
    // }

    await investmentsService.replyComments(
      investmentId,
      paymentSchedule?._id,
      activeReplyId,
      formData
    );

    setActiveReplyId(null);

    setComments(updatedComments);
    setActiveReply(null);
    setReplyText("");
  };

  const handleFormSubmit = async (data) => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("content", data.content);
      formData.append("type", data.type);

      if (data.attachments) {
        Array.from(data.attachments).forEach((file) => {
          formData.append("attachments", file);
        });
      }
      await investmentsService.addRemark(
        investmentId,
        paymentSchedule?._id,
        formData
      );

      toast.success("Remarks added successfully");
      setSubmitting(false);
      onSubmit();
    } catch (error) {
      console.error("Error adding remarks:", error);
      toast.error(
        error.response?.data?.message ||
          error?.message ||
          "Failed to add remarks"
      );
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
              {paymentSchedule?.dueDate
                ? formatDate(paymentSchedule.dueDate)
                : "N/A"}
            </p>
            <p className="text-sm text-white">
              Amount Due: {formatCurrency(paymentSchedule?.totalAmount)}
            </p>
          </div>
          <div>
            <ul className="space-y-6 px-8 py-8">
              {comments &&
                comments?.length > 0 &&
                comments.map((comment, index) => (
                  <li key={comment.remarkId} className="relative group">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                          {comment.userName?.[0]}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {comment.userName}
                          <span className="text-xs text-gray-500 ml-2">
                            {formatDate(comment.date)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700">
                          {comment.content}
                        </div>

                        {/* Attachments */}
                        {comment.attachments?.length > 0 && (
                          <div className="mt-2">
                            {comment.attachments.map((attachment, aIndex) => (
                              <a
                                key={aIndex}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center"
                              >
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                  />
                                </svg>
                                {attachment.name}
                              </a>
                            ))}
                          </div>
                        )}

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
                              onChange={(e) => {
                                setReplyText(e.target.value);
                                setActiveReplyId(comment?.remarkId);
                              }}
                              rows={2}
                              className="w-full p-2 border rounded text-sm"
                              placeholder="Write a reply..."
                              required
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
                          <ul className="mt-3 space-y-3 pl-6 border-l border-gray-200">
                            {comment.replies.map((reply) => (
                              <li
                                key={reply.replyId}
                                className="flex items-start space-x-3"
                              >
                                <div className="flex-shrink-0">
                                  <div className="h-6 w-6 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-semibold">
                                    {reply.userName?.[0]}
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="text-xs font-medium text-gray-900">
                                    {reply.userName}
                                    <span className="text-[10px] text-gray-500 ml-1">
                                      {formatDate(reply.date)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-700">
                                    {reply.content}
                                  </div>
                                  {/* Reply attachments */}
                                  {reply.attachments?.length > 0 && (
                                    <div className="mt-1">
                                      {reply.attachments.map(
                                        (attachment, aIndex) => (
                                          <a
                                            key={aIndex}
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] text-blue-600 hover:underline flex items-center"
                                          >
                                            <svg
                                              className="w-3 h-3 mr-1"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                              xmlns="http://www.w3.org/2000/svg"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                              />
                                            </svg>
                                            {attachment.name}
                                          </a>
                                        )
                                      )}
                                    </div>
                                  )}
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
            <label>Remark Type</label>
            <select
              {...register("type")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="note_added">Note</option>
              <option value="communication">Communication</option>
              <option value="status_changed">Status Update</option>
              <option value="other">Other</option>
            </select>
            {errors.type && <span>{errors.type.message}</span>}
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">
              Remarks *
            </label>
            <textarea
              {...register("content", {
                required: "Remarks are required",
                maxLength: {
                  value: 1000,
                  message: "Remarks cannot exceed 1000 characters",
                },
                validate: validateContent,
              })}
              rows={3}
              className={`mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500${
                errors.content ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter remarks (no code, links, or spam)"
              maxLength={MAX_CHARS}
              // onChange={(e) => {
              //   // Update character count
              //   const remaining = 1000 - e.target.value.length;
              //   setRemainingChars(remaining);
              //   // Trigger react-hook-form's onChange if needed
              //   if (register("content").onChange) {
              //     register("content").onChange(e);
              //   }
              // }}
            />
            {/* <div className="flex justify-between items-center mt-1">
              {errors.content && (
                <p className="text-sm text-red-600">{errors.content.message}</p>
              )}
              <span
                className={`text-xs ml-auto ${
                  remainingChars < 50
                    ? "text-red-600"
                    : remainingChars < 100
                    ? "text-yellow-600"
                    : "text-gray-500"
                }`}
              >
                {remainingChars} characters remaining
              </span>
            </div> */}

            <div className="flex justify-between items-center mt-1">
              <span
                className={`text-xs ml-auto ${
                  remainingChars < 50
                    ? "text-red-600"
                    : remainingChars < 100
                    ? "text-yellow-600"
                    : "text-gray-500"
                }`}
              >
                {remainingChars}/1000
              </span>
            </div>
            {remainingChars !== MAX_CHARS && (
              <div className="flex justify-between items-center mt-1">
                <ul>
                  {errors.content && (
                    <li className="mt-1 text-sm text-red-600">
                      {errors.content.message}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              disabled={!isValid}
              variant="primary"
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
