import Loading from "../components/Loading";
import { auth } from "../services/Firebase";
import { Button, Input, Spinner } from "@nextui-org/react";
import axios from "axios";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import React, { useEffect, useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { createToast } from "vercel-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [backdrop, setBackdrop] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isEmail = /\S+@\S+\.\S+/.test(email);

    try {
      if (!email || !password) {
        return createToast("Please fill in all the fields", {
          cancel: "Cancel",
          timeout: 3000,
          type: "error",
        });
      } else {
        if (!isEmail) {
          return createToast("Please enter a valid email", {
            cancel: "Cancel",
            timeout: 3000,
            type: "error",
          });
        } else {
          setLoggedIn(true);
          await signInWithEmailAndPassword(auth, email, password);
        }
      }
    } catch (error) {
      setLoggedIn(false);
      if (error.message.includes("not-found")) {
        return createToast("The user is not found", {
          action: {
            text: "Sign UP",
            callback(toast) {
              navigate("/signup");
              toast.destroy();
            },
          },
          timeout: 3000,
          cancel: "Cancel",
          type: "dark",
        });
      } else if (error.message.includes("wrong-password")) {
        return createToast("The password is incorrect", {
          cancel: "Cancel",
          timeout: 3000,
          type: "error",
        });
      } else {
        return createToast(error.message, {
          cancel: "Cancel",
          timeout: 3000,
          type: "error",
        });
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/");
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [backdropResponse] = await Promise.all([
          axios.get(
            `https://api.themoviedb.org/3/movie/27205/images?api_key=bb2818a2abb39fbdf6da79343e5e376b`
          ),
        ]);
        setBackdrop(
          "https://image.tmdb.org/t/p/original" +
            backdropResponse.data.backdrops[5].file_path
        );

        const params = new URLSearchParams(location.search);
        const email = params.get("email");
        if (email) {
          setEmail(email);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, [location.search]);

  const resetPassword = () => {
    if (email) {
      sendPasswordResetEmail(auth, email, {
        url: `${import.meta.env.VITE_WEBSITE_URL}/login?email=${email}`,
      })
        .then(() => {
          return createToast("We have sent you an email", {
            cancel: "Cancel",
            type: "info",
          });
        })
        .catch((error) => {
          return createToast(error.message, {
            cancel: "Cancel",
            type: "error",
          });
        });
    } else {
      return createToast("Please enter your email", {
        cancel: "Cancel",
        timeout: 3000,
        type: "error",
      });
    }
  };

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <div
          style={{
            position: "relative",
            backgroundImage: `url(${backdrop})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          className="p-4 flex flex-col items-center justify-center min-h-screen bg-gray-900 bg-opacity-60"
        >
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="relative z-10 w-full max-w-md flex flex-col items-center bg-gray-800 bg-opacity-80 p-8 rounded-lg shadow-lg">
            <h1 className="text-white text-4xl font-bold mb-6 mt-2">Login</h1>
            <form className="w-full" onSubmit={handleSubmit}>
              <div className="mb-4">
                <Input
                  isRequired
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <Input
                  isRequired
                  type={isVisible ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  endContent={
                    <button
                      className="focus:outline-none"
                      type="button"
                      onClick={toggleVisibility}
                    >
                      {isVisible ? (
                        <FaRegEye className="text-2xl text-default-400 pointer-events-none" />
                      ) : (
                        <FaRegEyeSlash className="text-2xl text-default-400 pointer-events-none" />
                      )}
                    </button>
                  }
                />
              </div>
              {loggedIn ? (
                <Button
                  disabled
                  color="primary"
                  className="w-full flex justify-center items-center gap-2"
                >
                  <Spinner color="default" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="w-full py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600"
                  color="primary"
                >
                  Login
                </Button>
              )}
            </form>
            <div className="relative z-10 text-white mt-4 text-center">
              <p>
                Don't Have An Account?{" "}
                <Link to="/signup" className="text-blue-500 underline">
                  Sign Up
                </Link>
              </p>
              <p>
                <Button
                  onClick={resetPassword}
                  className="bg-transparent text-blue-500 underline mt-2"
                >
                  Forgot Password
                </Button>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;

