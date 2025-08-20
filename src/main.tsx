import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./index.css";
import App from "./App";
import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import Review from "./pages/Review";
import Import from "./pages/Import";

// Define routes
const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      children: [
        { index: true, element: <Home /> },
        { path: "quiz", element: <Quiz /> },
        { path: "review", element: <Review /> },
        { path: "import", element: <Import /> },
      ],
    },
  ],
  {
    basename: "/medquiz", // 👈 IMPORTANT for GitHub Pages
  }
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
