import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './routes/Landing';
import SessionSetup from './routes/SessionSetup';
import ExamSession from './routes/ExamSession';
import GeneratorPage from './routes/GeneratorPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/session/:sessionId/setup" element={<SessionSetup />} />
        <Route path="/session/:sessionId" element={<ExamSession />} />
        <Route path="/generator" element={<GeneratorPage />} />
      </Routes>
    </BrowserRouter>
  );
}
