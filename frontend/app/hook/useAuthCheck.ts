"use client";

import { useEffect, useState } from "react";
import { checkCookie } from "../utils/checkCookie";
import { useUserStore } from "../types/userStore";

type AuthState = {
  isChecking: boolean;
  isLogin: boolean;
  userID: number | null;
  userName: string | null;
  userEmail: string | null;
};

export function useAuthCheck(): AuthState {
  const [isChecking, setIsChecking] = useState(true);
  const [isLogin, setIsLogin] = useState(false);
  const [userID, setUserID] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const verifyLogin = async () => {
      setIsChecking(true);
      const result = await checkCookie();
      if (result.loggedIn) {
        setIsLogin(true);
        setUserID(result.id);
        setUserName(result.name);
        setUserEmail(result.email);
        useUserStore.getState().setUser({
          id: result.id,
          name: result.name,
          email: result.email,
        });
      } else {
        setIsLogin(false);
      }
      setIsChecking(false);
    };
    verifyLogin();
  }, []);

  return { isChecking, isLogin, userID, userName, userEmail };
}


