import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import { AppearanceProvider } from "./roles/shared/AppearanceContext";
import { LanguageProvider } from "./roles/shared/LanguageContext";
import "./styles/figma.css";
import "./styles/variables.css";
import "./styles/global.css";
import "./styles/owner.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <AppearanceProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppearanceProvider>
    </LanguageProvider>
  </React.StrictMode>
);
