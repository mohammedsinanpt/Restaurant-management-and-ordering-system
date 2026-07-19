import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, updateProfile } from '../api';

const UserContext = createContext();

const persistSession = (token, user) => {
  localStorage.setItem('userToken', token);
  localStorage.setItem('currentUser', JSON.stringify(user));
};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('userToken');
    if (savedUser && token) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userToken');
      }
    }
    setLoading(false);
  }, []);

  const login = async (identifier, password) => {
    const { data } = await loginUser({ username: identifier, password });
    persistSession(data.token, data.user);
    setCurrentUser(data.user);
    return data.user;
  };

  const register = async ({ name, email, password }) => {
    const { data } = await registerUser({ name, email, password });
    persistSession(data.token, data.user);
    setCurrentUser(data.user);
    return data.user;
  };

  const updateUser = async (partialData) => {
    const { data } = await updateProfile(partialData);
    localStorage.setItem('currentUser', JSON.stringify(data));
    setCurrentUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userToken');
    setCurrentUser(null);
  };

  return (
    <UserContext.Provider value={{ currentUser, login, register, updateUser, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
