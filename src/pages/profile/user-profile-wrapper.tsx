"use client";

import { useState, useEffect } from "react";
import ProfilePage from "./ProfilePage";
import { useAuth } from "../../contexts/AuthContext";

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
    present: {
      country: string;
      state?: string;
      city?: string;
    };
    permanent: {
      country: string;
      state?: string;
      city?: string;
    };
  };
  bio?: string;
  title?: string;
}

export default function ProfilePageWrapper() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Simulate API call
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Simulate different scenarios - you can change this for testing
        const scenario = "success"; // "success" | "error" | "no-data"

        switch (scenario) {
          case "success":
            setUserData({
              ...user,
              bio: "Experienced investor with focus on technology startups and sustainable businesses.",
              title: "Senior Investment Analyst",
            });
            break;
          case "error":
            throw new Error(
              "Failed to load user profile. Please try again later."
            );
          case "no-data":
            setUserData(null);
            break;
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return <ProfilePage userData={userData} loading={loading} error={error} />;
}
