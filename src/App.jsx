import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Landing from './routes/Landing';
import GeneratorPage from './routes/GeneratorPage';
import CandidateLogin from './routes/CandidateLogin';
import ExamSession from './routes/ExamSession';
import { initGA, trackPageView } from './utils/analytics';

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AnalyticsTracker />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/session/:sessionId/generate" element={<GeneratorPage />} />
        <Route path="/session/:sessionId/login" element={<CandidateLogin />} />
        <Route path="/session/:sessionId" element={<ExamSession />} />
      </Routes>
    </BrowserRouter>
  );
}
