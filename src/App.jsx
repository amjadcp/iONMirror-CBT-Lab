import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './routes/Landing';
import GeneratorPage from './routes/GeneratorPage';
import CandidateLogin from './routes/CandidateLogin';
import ExamSession from './routes/ExamSession';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/session/:sessionId/generate" element={<GeneratorPage />} />
        <Route path="/session/:sessionId/login" element={<CandidateLogin />} />
        <Route path="/session/:sessionId" element={<ExamSession />} />
      </Routes>
    </BrowserRouter>
  );
}
