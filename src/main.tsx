import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";

import "./index.css";
import App from "./App";
import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import Review from "./pages/Review";
import Import from "./pages/Import";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <App />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/review" element={<Review />} />
        <Route path="/import" element={<Import />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
