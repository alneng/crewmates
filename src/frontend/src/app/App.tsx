import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router";

import AuthPage from "@/pages/AuthPage";
import NotFound from "@/pages/NotFound";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
