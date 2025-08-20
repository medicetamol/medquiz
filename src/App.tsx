import { NavLink, Outlet } from "react-router-dom";
import { motion } from "framer-motion";

export default function App() {
  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-purple-100">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <NavLink to="/" className="text-xl font-semibold text-brand">NEET/INICET Quiz</NavLink>
          <div className="flex gap-3 text-sm">
            <NavLink to="/" className={({isActive}) => `px-3 py-2 rounded-2xl ${isActive ? "bg-brand text-white" : "hover:bg-purple-50"}`}>Home</NavLink>
            <NavLink to="/review" className={({isActive}) => `px-3 py-2 rounded-2xl ${isActive ? "bg-brand text-white" : "hover:bg-purple-50"}`}>Review</NavLink>
            <NavLink to="/import" className={({isActive}) => `px-3 py-2 rounded-2xl ${isActive ? "bg-brand text-white" : "hover:bg-purple-50"}`}>Import JSON</NavLink>
          </div>
        </div>
      </nav>
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-5xl px-4 py-6"
      >
        <Outlet />
      </motion.main>
      <footer className="py-8 text-center text-xs text-purple-400">© {new Date().getFullYear()} NEET/INICET Quiz</footer>
    </div>
  );
}
