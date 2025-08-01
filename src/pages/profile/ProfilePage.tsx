"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
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
  MapPin,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface Address {
  country: string;
  state?: string;
  city?: string;
  street?: string;
  zipCode?: string;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  avatar: string | null;
  isActive: boolean;
  lastLogin: string;
  passwordChangedAt: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  address: {
    present: Address;
    permanent: Address;
  };
  bio?: string;
  title?: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  title?: string;
  presentCountry?: string;
  permanentCountry?: string;
  presentState?: string;
  permanentState?: string;
  presentCity?: string;
  permanentCity?: string;
}

const countries = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "Singapore",
  "UAE",
];

const roles = ["investor", "admin", "user", "manager", "analyst", "consultant"];

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("personal-info");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const { user } = useAuth();

  // Sample user data based on your payload
  const [userData, setUserData] = useState<UserData>(null);

  const [editData, setEditData] = useState<UserData>(userData);

  useEffect(() => {
    setUserData({
      ...user,
      bio: "Experienced investor with focus on technology startups and sustainable businesses. Passionate about supporting innovative entrepreneurs.",
      title: "Senior Investment Analyst",
    });
  }, [user, userData]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[+]?[1-9][\d\s\-()]{8,15}$/;
    return phoneRegex.test(phone.trim());
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!editData.name.trim()) {
      newErrors.name = "Name is required";
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

    if (editData.bio && editData.bio.length < 10) {
      newErrors.bio = "Bio must be at least 10 characters long";
    }

    if (!editData.address.present.country) {
      newErrors.presentCountry = "Present country is required";
    }

    if (!editData.address.permanent.country) {
      newErrors.permanentCountry = "Permanent country is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({ ...userData });
    setErrors({});
  };

  const handleSave = () => {
    if (validateForm()) {
      setUserData({ ...editData, updatedAt: new Date().toISOString() });
      setIsEditing(false);
      setErrors({});
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({ ...userData });
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setEditData((prev) => {
      const keys = field.split(".");
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else if (keys.length === 3 && keys[0] === "address") {
        return {
          ...prev,
          address: {
            ...prev.address,
            [keys[1]]: {
              ...prev.address[keys[1] as "present" | "permanent"],
              [keys[2]]: value,
            },
          },
        };
      }
      return prev;
    });

    // Clear error when user starts typing
    const errorKey = field.replace(".", "") as keyof ValidationErrors;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: undefined }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleColor = (role: string) => {
    const colors = {
      investor: "bg-green-100 text-green-800",
      admin: "bg-red-100 text-red-800",
      user: "bg-blue-100 text-blue-800",
      manager: "bg-purple-100 text-purple-800",
      analyst: "bg-orange-100 text-orange-800",
      consultant: "bg-indigo-100 text-indigo-800",
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
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
        className="relative h-48 bg-gradient-to-r from-purple-500 to-pink-500"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute top-4 right-4">
          <Button
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
              {userData.avatar ? (
                <img
                  src={userData.avatar || "/placeholder.svg"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                  {userData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute bottom-2 right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
              {userData.emailVerified ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <X className="w-4 h-4 text-white" />
              )}
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {userData.name}
          </h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge className={getRoleColor(userData.role)}>
              {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
            </Badge>
            <Badge variant={userData.isActive ? "default" : "secondary"}>
              {userData.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          {userData.title && (
            <p className="text-gray-600 mb-4">{userData.title}</p>
          )}

          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-6">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Joined {formatDate(userData.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-4 h-4" />
              <span>Last seen {formatDate(userData.lastLogin)}</span>
            </div>
          </div>

          {/* <div className="flex justify-center gap-4">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <MessageCircle className="w-4 h-4 mr-2" />
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

                <motion.div className="space-y-8" layout>
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <AnimatePresence mode="wait">
                          {isEditing ? (
                            <motion.div
                              key="name-input"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Input
                                value={editData.name}
                                onChange={(e) =>
                                  handleInputChange("name", e.target.value)
                                }
                                className={errors.name ? "border-red-500" : ""}
                                placeholder="Enter full name"
                              />
                              {errors.name && (
                                <motion.p
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-red-500 text-sm mt-1"
                                >
                                  {errors.name}
                                </motion.p>
                              )}
                            </motion.div>
                          ) : (
                            <motion.p
                              key="name-display"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="text-gray-900 py-2"
                            >
                              {userData.name}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Role */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role
                        </label>
                        <AnimatePresence mode="wait">
                          {isEditing ? (
                            <motion.div
                              key="role-input"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Select
                                value={editData.role}
                                onValueChange={(value) =>
                                  handleInputChange("role", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map((role) => (
                                    <SelectItem key={role} value={role}>
                                      {role.charAt(0).toUpperCase() +
                                        role.slice(1)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="role-display"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="py-2"
                            >
                              <Badge className={getRoleColor(userData.role)}>
                                {userData.role.charAt(0).toUpperCase() +
                                  userData.role.slice(1)}
                              </Badge>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Mail className="w-4 h-4 inline mr-1" />
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
                            <motion.div
                              key="email-display"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="text-gray-900 py-2 flex items-center"
                            >
                              {userData.email}
                              {userData.emailVerified && (
                                <Check className="w-4 h-4 ml-2 text-green-500" />
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Phone className="w-4 h-4 inline mr-1" />
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

                      {/* Title */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Job Title
                        </label>
                        <AnimatePresence mode="wait">
                          {isEditing ? (
                            <motion.div
                              key="title-input"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Input
                                value={editData.title || ""}
                                onChange={(e) =>
                                  handleInputChange("title", e.target.value)
                                }
                                placeholder="Enter job title"
                              />
                            </motion.div>
                          ) : (
                            <motion.p
                              key="title-display"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="text-gray-900 py-2"
                            >
                              {userData.title || "Not specified"}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      Address Information
                    </h3>

                    {/* Present Address */}
                    <div className="mb-6">
                      <h4 className="text-md font-medium text-gray-800 mb-3">
                        Present Address
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country
                          </label>
                          <AnimatePresence mode="wait">
                            {isEditing ? (
                              <motion.div
                                key="present-country-input"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Select
                                  value={editData.address.present.country}
                                  onValueChange={(value) =>
                                    handleInputChange(
                                      "address.present.country",
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    className={
                                      errors.presentCountry
                                        ? "border-red-500"
                                        : ""
                                    }
                                  >
                                    <SelectValue placeholder="Select country" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {countries.map((country) => (
                                      <SelectItem key={country} value={country}>
                                        {country}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {errors.presentCountry && (
                                  <motion.p
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-500 text-sm mt-1"
                                  >
                                    {errors.presentCountry}
                                  </motion.p>
                                )}
                              </motion.div>
                            ) : (
                              <motion.p
                                key="present-country-display"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="text-gray-900 py-2"
                              >
                                {userData.address.present.country}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State
                          </label>
                          <AnimatePresence mode="wait">
                            {isEditing ? (
                              <motion.div
                                key="present-state-input"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Input
                                  value={editData.address.present.state || ""}
                                  onChange={(e) =>
                                    handleInputChange(
                                      "address.present.state",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter state"
                                />
                              </motion.div>
                            ) : (
                              <motion.p
                                key="present-state-display"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="text-gray-900 py-2"
                              >
                                {userData.address.present.state ||
                                  "Not specified"}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                          </label>
                          <AnimatePresence mode="wait">
                            {isEditing ? (
                              <motion.div
                                key="present-city-input"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Input
                                  value={editData.address.present.city || ""}
                                  onChange={(e) =>
                                    handleInputChange(
                                      "address.present.city",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter city"
                                />
                              </motion.div>
                            ) : (
                              <motion.p
                                key="present-city-display"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="text-gray-900 py-2"
                              >
                                {userData.address.present.city ||
                                  "Not specified"}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    {/* Permanent Address */}
                    <div>
                      <h4 className="text-md font-medium text-gray-800 mb-3">
                        Permanent Address
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country
                          </label>
                          <AnimatePresence mode="wait">
                            {isEditing ? (
                              <motion.div
                                key="permanent-country-input"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Select
                                  value={editData.address.permanent.country}
                                  onValueChange={(value) =>
                                    handleInputChange(
                                      "address.permanent.country",
                                      value
                                    )
                                  }
                                >
                                  <SelectTrigger
                                    className={
                                      errors.permanentCountry
                                        ? "border-red-500"
                                        : ""
                                    }
                                  >
                                    <SelectValue placeholder="Select country" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {countries.map((country) => (
                                      <SelectItem key={country} value={country}>
                                        {country}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {errors.permanentCountry && (
                                  <motion.p
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-500 text-sm mt-1"
                                  >
                                    {errors.permanentCountry}
                                  </motion.p>
                                )}
                              </motion.div>
                            ) : (
                              <motion.p
                                key="permanent-country-display"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="text-gray-900 py-2"
                              >
                                {userData.address.permanent.country}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State
                          </label>
                          <AnimatePresence mode="wait">
                            {isEditing ? (
                              <motion.div
                                key="permanent-state-input"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Input
                                  value={editData.address.permanent.state || ""}
                                  onChange={(e) =>
                                    handleInputChange(
                                      "address.permanent.state",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter state"
                                />
                              </motion.div>
                            ) : (
                              <motion.p
                                key="permanent-state-display"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="text-gray-900 py-2"
                              >
                                {userData.address.permanent.state ||
                                  "Not specified"}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                          </label>
                          <AnimatePresence mode="wait">
                            {isEditing ? (
                              <motion.div
                                key="permanent-city-input"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Input
                                  value={editData.address.permanent.city || ""}
                                  onChange={(e) =>
                                    handleInputChange(
                                      "address.permanent.city",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter city"
                                />
                              </motion.div>
                            ) : (
                              <motion.p
                                key="permanent-city-display"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="text-gray-900 py-2"
                              >
                                {userData.address.permanent.city ||
                                  "Not specified"}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      About
                    </h3>
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
                            value={editData.bio || ""}
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
                          {userData.bio || "No bio available"}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Account Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      Account Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          User ID:
                        </span>
                        <p className="text-gray-900 font-mono">
                          {userData._id}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Account Status:
                        </span>
                        <p className="text-gray-900">
                          <Badge
                            variant={
                              userData.isActive ? "default" : "secondary"
                            }
                          >
                            {userData.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Email Verified:
                        </span>
                        <p className="text-gray-900">
                          <Badge
                            variant={
                              userData.emailVerified ? "default" : "destructive"
                            }
                          >
                            {userData.emailVerified
                              ? "Verified"
                              : "Not Verified"}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Last Login:
                        </span>
                        <p className="text-gray-900">
                          {formatDate(userData.lastLogin)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Password Changed:
                        </span>
                        <p className="text-gray-900">
                          {formatDate(userData.passwordChangedAt)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Member Since:
                        </span>
                        <p className="text-gray-900">
                          {formatDate(userData.createdAt)}
                        </p>
                      </div>
                    </div>
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
