"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent } from "../../components/ui/card";
import {
  User,
  Shield,
  Bell,
  CreditCard,
  Activity,
  Edit3,
  Check,
  X,
  MessageCircle,
  UserPlus,
  Camera,
} from "lucide-react";

import manImg from "../../assets/img/man.png";
import { useAuth } from "../../contexts/AuthContext";

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  title: string;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  bio?: string;
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("personal-info");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const { user } = useAuth();

  const [userData, setUserData] = useState<UserData>(user);

  // {
  //   firstName: "Alex",
  //   lastName: "Johnson",
  //   email: "alex.johnson@example.com",
  //   phone: "+1 (555) 123-4567",
  //   bio: "Product designer with 5+ years of experience in creating user-centered digital solutions. Passionate about design systems and user experience.",
  //   title: "Senior Product Designer",
  // }

  const [editData, setEditData] = useState<UserData>(userData);

  useEffect(() => {
    console.log(user, "user");
  }, [user]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-()]/g, "");
    return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!editData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!editData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!editData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(editData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!editData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(editData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!editData.bio.trim()) {
      newErrors.bio = "Bio is required";
    } else if (editData.bio.length < 10) {
      newErrors.bio = "Bio must be at least 10 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(userData);
    setErrors({});
  };

  const handleSave = () => {
    if (validateForm()) {
      setUserData(editData);
      setIsEditing(false);
      setErrors({});
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(userData);
    setErrors({});
  };

  const handleInputChange = (field: keyof UserData, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const sidebarItems = [
    { id: "personal-info", label: "Personal Info", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "activity", label: "Activity", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with gradient background */}
      <motion.div
        className="relative h-44 bg-gradient-to-r from-purple-500 to-pink-500"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute top-4 right-4">
          <Button
            title="Coming soon in the future"
            variant="secondary"
            size="sm"
            className="bg-white/90 hover:bg-white"
          >
            <Camera className="w-4 h-4 mr-2" />
            Edit Cover
          </Button>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 -mt-24 relative z-10">
        {/* Profile Section */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative inline-block mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
              <img
                src={manImg}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-2 right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
              <Check className="w-4 h-4 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {userData.firstName} {userData.lastName}
          </h1>
          <p className="text-gray-600 mb-6">{userData.title}</p>

          {/* <div className="flex justify-center gap-4">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <MessageCircle className="w-4 h-4 mr-2 text-white" />
              Message
            </Button>
            <Button variant="outline">
              <UserPlus className="w-4 h-4 mr-2" />
              Connect
            </Button>
          </div> */}
        </motion.div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Sidebar */}
          <motion.div
            className="w-64 flex-shrink-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                          activeTab === item.id
                            ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {item.label}
                      </motion.button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </motion.div>

          {/* Content Area */}
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Personal Information
                  </h2>
                  <AnimatePresence mode="wait">
                    {!isEditing ? (
                      <motion.div
                        key="edit-button"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button
                          onClick={handleEdit}
                          variant="outline"
                          size="sm"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="action-buttons"
                        className="flex gap-2"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Button onClick={handleSave} size="sm">
                          <Check className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          onClick={handleCancel}
                          variant="outline"
                          size="sm"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  layout
                >
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <AnimatePresence mode="wait">
                      {isEditing ? (
                        <motion.div
                          key="first-name-input"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Input
                            value={editData.firstName}
                            onChange={(e) =>
                              handleInputChange("firstName", e.target.value)
                            }
                            className={errors.firstName ? "border-red-500" : ""}
                            placeholder="Enter first name"
                          />
                          {errors.firstName && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-red-500 text-sm mt-1"
                            >
                              {errors.firstName}
                            </motion.p>
                          )}
                        </motion.div>
                      ) : (
                        <motion.p
                          key="first-name-display"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="text-gray-900 py-2"
                        >
                          {userData.firstName}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <AnimatePresence mode="wait">
                      {isEditing ? (
                        <motion.div
                          key="last-name-input"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Input
                            value={editData.lastName}
                            onChange={(e) =>
                              handleInputChange("lastName", e.target.value)
                            }
                            className={errors.lastName ? "border-red-500" : ""}
                            placeholder="Enter last name"
                          />
                          {errors.lastName && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-red-500 text-sm mt-1"
                            >
                              {errors.lastName}
                            </motion.p>
                          )}
                        </motion.div>
                      ) : (
                        <motion.p
                          key="last-name-display"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="text-gray-900 py-2"
                        >
                          {userData.lastName}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <AnimatePresence mode="wait">
                      {isEditing ? (
                        <motion.div
                          key="email-input"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Input
                            type="email"
                            value={editData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            className={errors.email ? "border-red-500" : ""}
                            placeholder="Enter email address"
                          />
                          {errors.email && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-red-500 text-sm mt-1"
                            >
                              {errors.email}
                            </motion.p>
                          )}
                        </motion.div>
                      ) : (
                        <motion.p
                          key="email-display"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="text-gray-900 py-2"
                        >
                          {userData.email}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <AnimatePresence mode="wait">
                      {isEditing ? (
                        <motion.div
                          key="phone-input"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Input
                            type="tel"
                            value={editData.phone}
                            onChange={(e) =>
                              handleInputChange("phone", e.target.value)
                            }
                            className={errors.phone ? "border-red-500" : ""}
                            placeholder="Enter phone number"
                          />
                          {errors.phone && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-red-500 text-sm mt-1"
                            >
                              {errors.phone}
                            </motion.p>
                          )}
                        </motion.div>
                      ) : (
                        <motion.p
                          key="phone-display"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="text-gray-900 py-2"
                        >
                          {userData.phone}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Bio */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <AnimatePresence mode="wait">
                      {isEditing ? (
                        <motion.div
                          key="bio-input"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Textarea
                            value={editData.bio}
                            onChange={(e) =>
                              handleInputChange("bio", e.target.value)
                            }
                            className={`min-h-[100px] ${
                              errors.bio ? "border-red-500" : ""
                            }`}
                            placeholder="Tell us about yourself"
                          />
                          {errors.bio && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-red-500 text-sm mt-1"
                            >
                              {errors.bio}
                            </motion.p>
                          )}
                        </motion.div>
                      ) : (
                        <motion.p
                          key="bio-display"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="text-gray-900 py-2 leading-relaxed"
                        >
                          {userData.bio}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
