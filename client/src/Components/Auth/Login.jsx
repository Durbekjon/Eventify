import React, { useContext, useState } from "react";
import { AuthContext } from "../../Auth/AuthContext";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import AuthCard from "./AuthCard";
import AuthInput from "./AuthInput";

const Login = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const { login, loading } = useContext(AuthContext);
  const [show, setShow] = useState(false);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    login(credentials);
  };

  return (
    <AuthLayout>
      <AuthCard>
        <h1 className="text-3xl font-bold text-textGray mb-6 text-center">
          Log In
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="email"
              className="text-textGray text-lg font-semibold mb-2 block"
            >
              Email address
            </label>
            <AuthInput
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={credentials.email}
              onChange={handleChange}
              placeholder="Email"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="text-textGray text-lg font-semibold"
              >
                Password
              </label>
              <Link
                to="/reset-password"
                className="text-pink2 text-sm font-medium hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <AuthInput
              id="password"
              name="password"
              type={show ? "text" : "password"}
              required
              autoComplete="current-password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Password"
              right={
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? (
                    <IoMdEyeOff className="text-xl text-textGray" />
                  ) : (
                    <IoMdEye className="text-xl text-textGray" />
                  )}
                </button>
              }
            />
          </div>
          <button
            type="submit"
            className="h-14 w-full bg-yellow rounded-lg text-lg font-bold text-[#C4E1FE] hover:bg-yellow/90 transition"
            disabled={loading}
          >
            {loading ? "Loading..." : "Log In"}
          </button>
        </form>
        <div className="mt-6 text-center text-textGray text-sm">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="text-pink2 font-semibold hover:underline"
          >
            Register
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
};

export default Login;
