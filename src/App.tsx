import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react"; // icons for hamburger menu

export default function App() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-neutral-900/90 backdrop-blur border-b border-neutral-800">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          {/* Logo + App name */}
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="mediCetamol" className="w-8 h-8" />
            <span className="text-xl font-bold">mediCetamol</span>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex gap-3 text-sm">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-2 rounded-2xl transition ${
                  isActive ? "bg-blue-600 text-white" : "hover:bg-neutral-800"
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/review"
              className={({ isActive }) =>
                `px-3 py-2 rounded-2xl transition ${
                  isActive ? "bg-blue-600 text-white" : "hover:bg-neutral-800"
                }`
              }
            >
              Review
            </NavLink>
            <NavLink
              to="/import"
              className={({ isActive }) =>
                `px-3 py-2 rounded-2xl transition ${
                  isActive ? "bg-blue-600 text-white" : "hover:bg-neutral-800"
                }`
              }
            >
              Import JSON
            </NavLink>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {open && (
          <div className="md:hidden bg-neutral-900 border-t border-neutral-800 px-4 py-3 space-y-2">
            <NavLink
              to="/"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-xl ${
                  isActive ? "bg-blue-600 text-white" : "hover:bg-neutral-800"
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/review"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-xl ${
                  isActive ? "bg-blue-600 text-white" : "hover:bg-neutral-800"
                }`
              }
            >
              Review
            </NavLink>
            <NavLink
              to="/import"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-xl ${
                  isActive ? "bg-blue-600 text-white" : "hover:bg-neutral-800"
                }`
              }
            >
              Import JSON
            </NavLink>
          </div>
        )}
      </nav>

      {/* Page content */}
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-5xl px-4 py-6 flex-1 w-full"
      >
        <Outlet />
      </motion.main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-neutral-500 border-t border-neutral-800">
        © {new Date().getFullYear()} mediCetamol
      </footer>
    </div>
  );
}
