// src/components/UserMenu.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // assuming this provides user + logout()

export default function UserMenu() {
  const { user, logout } = useAuth(); // user should have username + avatar_url
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  // close menu if clicked outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-800 focus:outline-none"
      >
        <img
          src={user?.avatar_url || "/default-avatar.png"}
          alt="avatar"
          className="w-8 h-8 rounded-full"
        />
        <span className="text-sm font-medium">{user?.username || "User"}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50">
          <Link
            to="/profile"
            className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <Link
            to="/settings"
            className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-800"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <button
            onClick={() => {
              logout();
              setOpen(false);
            }}
            className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-gray-800"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
