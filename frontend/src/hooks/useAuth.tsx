import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface AuthContextType {
  user: any | null;
  organization: any | null;
  token: string | null;
  login: (userData: any, orgData: any, token: string) => void;
  logout: () => void;
  switchOrg: (org: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider Initializing...");
    const savedUser = localStorage.getItem('cratr_user');
    const savedOrg = localStorage.getItem('cratr_org');
    const savedToken = localStorage.getItem('cratr_token');
    
    try {
      if (savedUser && savedUser !== "undefined") {
          setUser(JSON.parse(savedUser));
          console.log("Loaded user:", savedUser);
      }
      if (savedOrg && savedOrg !== "undefined") {
          setOrganization(JSON.parse(savedOrg));
          console.log("Loaded org:", savedOrg);
      }
      if (savedToken) setToken(savedToken);
    } catch (e) {
      console.error("Failed to parse auth data", e);
    }
    setLoading(false);
  }, []);

  // Configure axios interceptor
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        if (organization?.schema_name) {
            config.headers['X-Tenant-ID'] = organization.schema_name;
        }
        return config;
    });

    return () => axios.interceptors.request.eject(requestInterceptor);
  }, [token, organization]);

  const login = (userData: any, orgData: any, tokenData: string) => {
    setUser(userData);
    setOrganization(orgData);
    setToken(tokenData);
    localStorage.setItem('cratr_user', JSON.stringify(userData));
    localStorage.setItem('cratr_org', JSON.stringify(orgData));
    localStorage.setItem('cratr_token', tokenData);
  };

  const logout = () => {
    setUser(null);
    setOrganization(null);
    setToken(null);
    localStorage.removeItem('cratr_user');
    localStorage.removeItem('cratr_org');
    localStorage.removeItem('cratr_token');
  };

  const switchOrg = (orgData: any) => {
    setOrganization(orgData);
    localStorage.setItem('cratr_org', JSON.stringify(orgData));
  };

  return (
    <AuthContext.Provider value={{ user, organization, token, login, logout, switchOrg }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
