import React, { useContext, useState } from "react";
import { AuthContext } from "../../Auth/AuthContext";
import { Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import AuthCard from "./AuthCard";
import AuthInput from "./AuthInput";

const Register = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const { register, loading } = useContext(AuthContext);
  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    register(credentials);
  };

  return (
    <AuthLayout>
      <AuthCard>
        <h1 className="text-3xl font-bold text-textGray mb-6 text-center">
          Register
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
            <label
              htmlFor="password"
              className="text-textGray text-lg font-semibold mb-2 block"
            >
              Password
            </label>
            <AuthInput
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Password"
            />
          </div>
          <button
            type="submit"
            className="h-14 w-full bg-yellow rounded-lg text-lg font-bold text-[#C4E1FE] hover:bg-yellow/90 transition"
            disabled={loading}
          >
            {loading ? "Loading..." : "Register"}
          </button>
        </form>
        <div className="mt-6 text-center text-textGray text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-pink2 font-semibold hover:underline"
          >
            Login
          </Link>
        </div>
      </AuthCard>
    </AuthLayout>
  );
};

export default Register;
