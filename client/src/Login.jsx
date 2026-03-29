import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginWithGoogle } from "./apis/loginWithGoogle.js";
import { GoogleLogin } from "@react-oauth/google";
import "./Auth.css";

const Login = () => {
  const BASE_URL = "http://localhost:4000";

  const [formData, setFormData] = useState({
    email: "pandya.naman.23031@iitgoa.ac.in",
    password: "abcd",
  });

  // serverError will hold the error message from the server
  const [serverError, setServerError] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear the server error as soon as the user starts typing in either field
    if (serverError) {
      setServerError("");
    }

    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${BASE_URL}/user/login`, {
        method: "POST",
        body: JSON.stringify(formData),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (data.error) {
        setServerError(data.error);
      } else {
        // ✅ OTP sent
        setOtpSent(true);
        setServerError("");
      }
    } catch (error) {
      console.error(error);
      setServerError("Something went wrong.");
    }
  };
  const handleVerifyOtp = async () => {
    try {
      setIsVerifying(true);

      const res = await fetch(`${BASE_URL}/user/login-verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          otp,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        setOtpVerified(true);
        navigate("/"); // ✅ login success
      } else {
        setOtpError(data.error || "Invalid OTP");
      }
    } catch (err) {
      setOtpError("Something went wrong");
    } finally {
      setIsVerifying(false);
    }
  };
  // If there's an error, we'll add "input-error" class to both fields
  const hasError = Boolean(serverError);

  return (
    <div className="container">
      <h2 className="heading">Login</h2>
      <form className="form" onSubmit={handleSubmit}>
        {/* Email */}
        <div className="form-group">
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            className={`input ${hasError ? "input-error" : ""}`}
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />
        </div>

        {/* Password */}
        <div className="form-group">
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            className={`input ${hasError ? "input-error" : ""}`}
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />
          {/* Absolutely-positioned error message below password field */}
          {serverError && <span className="error-msg">{serverError}</span>}
        </div>
        {otpSent && (
          <div className="form-group">
            <label className="label">Enter OTP</label>
            <div className="otp-wrapper">
              <input
                className="input"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                maxLength={4}
              />
              <button
                type="button"
                className="otp-button"
                onClick={handleVerifyOtp}
                disabled={isVerifying}
              >
                {isVerifying ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
            {otpError && <span className="error-msg">{otpError}</span>}
          </div>
        )}
        {!otpSent && (
          <button type="submit" className="submit-button">
            Send OTP
          </button>
)}
      </form>

      {/* Link to the register page */}
      <p className="link-text">
        Don't have an account? <Link to="/register">Register</Link>
      </p>
      <div className="or">
        Or
      </div>
      <div className="google-login">
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            const data = await loginWithGoogle(credentialResponse.credential);
            if (data.error) {
              console.log(data);
              return;
            }
            navigate("/");
          }}
          theme="filled_blue"
          text="continue_with"
          onError={() => {
            console.log("Login Failed");
          }}
          useOneTap
        />
      </div>
    </div>
  );
};

export default Login;
