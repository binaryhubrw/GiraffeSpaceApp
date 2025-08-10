"use client"

import { type ReactNode, createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation";
import { getUserByEmail, getUserByUsername, type User, users, UserApiResponse } from "@/data/users"
import ApiService from "@/api/apiConfig"
import Cookies from 'js-cookie'
import { toast } from "sonner"

type AuthContextType = {
  isLoggedIn: boolean
  user: User | null
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateUser: (updatedData: Partial<User>) => Promise<{ success: boolean; error?: string }>
}

// Create the context with undefined initially
const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter();


  // Check if user is logged in from localStorage on initial load
  useEffect(() => {
    const storedLoginState = localStorage.getItem("isLoggedIn")
    const storedUser = localStorage.getItem("currentUser")

    if (storedLoginState === "true" && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setIsLoggedIn(true)
        setUser(parsedUser)
      } catch (error) {
        // If parsing fails, clear the stored data
        localStorage.removeItem("isLoggedIn")
        localStorage.removeItem("currentUser")
      }
    }
    setMounted(true)
  }, [])



  const logout = () => {
    setIsLoggedIn(false)
    setUser(null)
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("currentUser")
    localStorage.removeItem("token")
    // Remove auth-token cookie on logout
    Cookies.remove('auth-token')
    router.push("/");
  }

  // Check for token expiration flags from middleware
  useEffect(() => {
    if (mounted && isLoggedIn) {
      const tokenExpired = Cookies.get('token-expired')
      const tokenExpired24h = Cookies.get('token-expired-24h')
      
      if (tokenExpired === 'true' || tokenExpired24h === 'true') {
        // Clear the expiration flags
        Cookies.remove('token-expired')
        Cookies.remove('token-expired-24h')
        
        // Auto logout
        logout()
        
        // Show a toast notification about the automatic logout
        if (tokenExpired24h === 'true') {
          toast.error("Your session has expired after 24 hours. Please login again.")
        } else {
          toast.error("Your session has expired. Please login again.")
        }
      }
    }
  }, [mounted, isLoggedIn])

  // Periodic check for token expiration (every 5 minutes)
  useEffect(() => {
    if (mounted && isLoggedIn) {
      const checkTokenExpiration = () => {
        const token = localStorage.getItem('token')
        if (token) {
          try {
            const payload = token.split('.')[1]
            const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'))
            
            // Check if token is expired
            if (decoded.exp && Date.now() >= decoded.exp * 1000) {
              logout()
              toast.error("Your session has expired. Please login again.")
              return
            }
            
            // Check if 24 hours have passed since token was issued
            if (decoded.iat) {
              const tokenIssuedAt = decoded.iat * 1000
              const twentyFourHoursInMs = 24 * 60 * 60 * 1000
              if (Date.now() >= tokenIssuedAt + twentyFourHoursInMs) {
                logout()
                toast.error("Your session has expired after 24 hours. Please login again.")
                return
              }
            }
          } catch (error) {
            // If token is malformed, logout
            logout()
            toast.error("There was an issue with your session. Please login again.")
          }
        }
      }

      // Check immediately
      checkTokenExpiration()
      
      // Set up periodic check every 5 minutes
      const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000)
      
      return () => clearInterval(interval)
    }
  }, [mounted, isLoggedIn])

const login = async (
  identifier: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  const formData = { identifier, password };

  try {
    const response: UserApiResponse = await ApiService.loginUser(formData);
    console.log("response", response);
    //const response = {success: true, user: users[0], token: "dfghjkhgfghjjhgfd" ,message: "nice"}
    if (response.success && response.user && response.token) {
      setIsLoggedIn(true);
      setUser(response.user);
      localStorage.setItem("token", response.token);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("currentUser", JSON.stringify(response.user));
      // Set auth-token cookie for middleware protection
      Cookies.set('auth-token', response.token, { path: '/', sameSite: 'lax' });
      return { success: true };
    } else {
      return { success: false, error: response?.message || "Login failed." };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.response?.data?.message || "Login failed. Try again.",
    };
  }
};

const updateUser = async (
  updatedData: Partial<User>
): Promise<{ success: boolean; error?: string }> => {
  if (!user) {
    return { success: false, error: "No user logged in." };
  }
  try {
     console.log("form data", updatedData)
    const response: UserApiResponse = await ApiService.updateUserById(user.userId, updatedData);
   
    const updatedUser = response.success && response.user;
    if (updatedUser) {
      setUser(updatedUser);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      return { success: true };
    } else {
      return { success: false, error: response?.message || "Update failed." };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error?.response?.data?.message || "Update failed. Try again.",
    };
  }
};



  // Provide the context value
  const contextValue: AuthContextType = {
    isLoggedIn,
    user,
    login,
    logout,
    updateUser,
  }

  // Only render children after mounting on the client
  if (!mounted) {
    return <div>Loading...</div>
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}