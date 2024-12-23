
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Table from "./components/Table/Table"; 

const App: React.FC = () => {
  return (
    <>
     <h1>Тестовое задание</h1>
    <Router>
      <Routes>
        <Route path="/" element={<Table />} />
      </Routes>
    </Router>
    </>
   
  );
};

export default App;
