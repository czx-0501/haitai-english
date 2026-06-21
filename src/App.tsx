import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AuthGate from './components/AuthGate';
import Home from './pages/Home';
import Learn from './pages/Learn';
import QuizPage from './pages/QuizPage';
import Review from './pages/Review';
import Stats from './pages/Stats';
import Circle from './social/Circle';
import { preloadVoices } from './utils/speech';

function App() {
  useEffect(() => {
    preloadVoices();
  }, []);

  return (
    <BrowserRouter>
      <AuthGate>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/review" element={<Review />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/circle" element={<Circle />} />
        </Routes>
      </Layout>
      </AuthGate>
    </BrowserRouter>
  );
}

export default App;
