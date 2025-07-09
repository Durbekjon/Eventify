import { createContext, useContext, useState } from "react";
import axiosInstance from "../AxiosInctance/AxiosInctance";
import swal from "sweetalert";
import { useNavigate, useParams } from "react-router-dom";
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { sheetId } = useParams();
  const register = async (credentials) => {
    console.log(credentials);
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        "/auth/registration",
        credentials
      );
      console.log(response);
      localStorage.setItem("token", response.data.token);
      setLoading(false);
      navigate("/verification");
    } catch (error) {
      console.log(error);
      setLoading(false);
      swal({
        title: "Error !",
        text: `${error.response.data.message}`,
        icon: "error",
        button: "close",
      });
    }
  };
  const login = async (credentials) => {
    console.log(credentials);
    setLoading(true);
    try {
      const response = await axiosInstance.post("/auth/login", credentials);
      console.log(response);
      localStorage.setItem("token", response.data.token.access);
      setLoading(false);
      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      setLoading(false);
      swal({
        title: "Error !",
        text: `${error.response.data.message}`,
        icon: "error",
        button: "close",
      });
    }
  };

  const verification = async (credentials) => {
    console.log(credentials);
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        "/auth/registration/verify",
        credentials
      );
      console.log(response);
      localStorage.setItem("token", response.data.token.access);
      setLoading(false);
      swal({
        title: "Success !",
        text: "Your account created successfully",
        icon: "success",
        button: "close",
      });
      navigate("/createcompany");
    } catch (error) {
      console.log(error);
      setLoading(false);
      swal({
        title: "Error !",
        text: `You entered incorrect otp`,
        icon: "error",
        button: "ok",
      });
    }
  };

  const createCompany = async (credentials) => {
    const token = localStorage.getItem("token");
    console.log(credentials);
    setLoading(true);
    try {
      const response = await axiosInstance.post("/company", credentials, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      setLoading(false);
      swal({
        title: "Success !",
        text: "You created company successfully",
        icon: "success",
        button: "close",
      });
      navigate("/subscriptions");
    } catch (error) {
      console.log(error);
      setLoading(false);
      swal({
        title: "Error !",
        text: `${error.response.data.message}`,
        icon: "error",
        button: "ok",
      });
    }
  };

  const restoreAccount = async (credentials) => {
    console.log(credentials);
    setLoading(true);
    try {
      const response = await axiosInstance.post("/auth/restore", credentials);
      localStorage.setItem("email", credentials.email);
      console.log(response);
      setLoading(false);
      swal({
        title: "Success !",
        text: "We sent verification code to your account",
        icon: "success",
        button: "close",
      });
      navigate("/reset-password");
    } catch (error) {
      console.log(error);
      setLoading(false);
      swal({
        title: "Error !",
        text: `Please check email field`,
        icon: "error",
        button: "ok",
      });
    }
  };

  const accountRestoreVerification = async (credentials) => {
    console.log(credentials);
    setLoading(true);
    try {
      const response = await axiosInstance.post(
        "/auth/restore/verify",
        credentials
      );
      console.log(response);
      localStorage.setItem("token", response.data.token.access);
      setLoading(false);
      swal({
        title: "Success !",
        text: "Your signed in successfully",
        icon: "success",
        button: "close",
      });
      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      setLoading(false);
      swal({
        title: "Error !",
        text: `${error.message}`,
        icon: "error",
        button: "ok",
      });
    }
  };

  const createWorkspace = async (credentials) => {
    console.log(credentials);
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axiosInstance.post("/workspace", credentials, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      swal({
        title: "Error !",
        text: `${error.response.data.message}`,
        icon: "error",
        button: "close",
      });
    }
  };

  const dndOrders = async (credentials) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axiosInstance.put("/workspace", credentials, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      swal({
        title: "Error !",
        text: `${error.response.data.message}`,
        icon: "error",
        button: "close",
      });
    }
  };

  const dndOrdersSheets = async (credentials) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axiosInstance.put("/sheet", credentials, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      swal({
        title: "Error !",
        text: `${error.response.data.message}`,
        icon: "error",
        button: "close",
      });
    }
  };

  const dndOrdersTasks = async (credentials) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axiosInstance.put("/task/reorder", credentials, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      swal({
        title: "Error !",
        text: `${error.response.data.message}`,
        icon: "error",
        button: "close",
      });
    }
  };

  const createSheet = async (credentials) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    // Validation
    if (
      !credentials.name ||
      !credentials.workspaceId ||
      !credentials.columns ||
      !credentials.columns.length
    ) {
      setLoading(false);
      swal({
        title: "Error !",
        text: `Please fill all required fields (name, workspace, columns)`,
        icon: "error",
        button: "close",
      });
      return null;
    }
    try {
      const response = await axiosInstance.post("/sheet", credentials, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      setLoading(false);
      return response.data;
    } catch (error) {
      console.log(error);
      setLoading(false);
      swal({
        title: "Error !",
        text: `${error.response.data.message}`,
        icon: "error",
        button: "close",
      });
      return null;
    }
  };

  const updateSheet = async (credentials) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axiosInstance.put(
        `/sheet/${sheetId}`,
        credentials,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      swal({
        title: "Error !",
        text: `${error.response.data.message}`,
        icon: "error",
        button: "close",
      });
    }
  };

  const createColumn = async (credentials) => {
    credentials.type = credentials.type.toUpperCase();
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axiosInstance.post("/column", credentials, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      swal({
        title: "Error !",
        text: `${error.response.data.message}`,
        icon: "error",
        button: "close",
      });
    }
  };

  const createTask = async (credentials) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axiosInstance.post("/task", credentials, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
      swal({
        title: "Error !",
        text: `${error.response.data.message}`,
        icon: "error",
        button: "close",
      });
    }
  };

  const getMembers = async () => {
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const response = await axiosInstance.get("/member", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLoading(false);
      return response;
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };
  return (
    <AuthContext.Provider
      value={{
        register,
        verification,
        loading,
        login,
        createCompany,
        restoreAccount,
        accountRestoreVerification,
        createWorkspace,
        dndOrders,
        createSheet,
        createColumn,
        updateSheet,
        createTask,
        dndOrdersSheets,
        dndOrdersTasks,
        getMembers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export { AuthContext, AuthProvider };
