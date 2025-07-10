import React, { createContext, useContext, useReducer, useEffect } from "react";
import ApiService from "../services/api";

const AuthContext = createContext();

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_START":
    case "REGISTER_START":
    case "LOAD_USER_START":
      return {
        ...state,
        loading: true,
        error: null,
      };
    case "LOGIN_SUCCESS":
    case "REGISTER_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case "LOAD_USER_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case "LOGIN_FAILURE":
    case "REGISTER_FAILURE":
    case "LOAD_USER_FAILURE":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        error: null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      ApiService.setAuthToken(token);
      try {
        dispatch({ type: "LOAD_USER_START" });
        const user = await ApiService.getCurrentUser();
        dispatch({ type: "LOAD_USER_SUCCESS", payload: user });
      } catch (error) {
        dispatch({ type: "LOAD_USER_FAILURE", payload: error.message });
        localStorage.removeItem("token");
        ApiService.setAuthToken(null);
      }
    } else {
      dispatch({ type: "LOAD_USER_FAILURE", payload: "No token found" });
    }
  };

  const login = async (credentials) => {
    try {
      dispatch({ type: "LOGIN_START" });
      const response = await ApiService.login(credentials);
      ApiService.setAuthToken(response.token);
      dispatch({ type: "LOGIN_SUCCESS", payload: response });
      return response;
    } catch (error) {
      dispatch({ type: "LOGIN_FAILURE", payload: error.message });
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: "REGISTER_START" });
      const response = await ApiService.register(userData);
      ApiService.setAuthToken(response.token);
      dispatch({ type: "REGISTER_SUCCESS", payload: response });
      return response;
    } catch (error) {
      dispatch({ type: "REGISTER_FAILURE", payload: error.message });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    ApiService.setAuthToken(null);
    dispatch({ type: "LOGOUT" });
  };

  const updateUser = async (userData) => {
    try {
      const updatedUser = await ApiService.updateUserProfile(userData);
      dispatch({ type: "UPDATE_USER", payload: updatedUser });
      return updatedUser;
    } catch (error) {
      dispatch({ type: "LOGIN_FAILURE", payload: error.message });
      throw error;
    }
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const value = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// useAuth hook moved to a separate file (useAuth.js)
