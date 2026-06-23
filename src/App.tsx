import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AuthGate from './components/AuthGate';
import Home from './pages/Home';
import Learn from './pages/Learn';
import Review from './pages/Review';
import Stats from './pages/Stats';
import QuizPage from './pages/QuizPage';
import Circle from './social/Circle';
import Practice from './pages/Practice';
import Grammar from './pages/Grammar';
import Reading from './pages/Reading';
import Listening from './pages/Listening';
import { preloadVoices, prewarmTTS } from './utils/speech';

function App() {
  useEffect(() => {
    preloadVoices();
    prewarmTTS();
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
          <Route path="/practice" element={<Practice />} />
          <Route path="/practice/grammar" element={<Grammar />} />
          <Route path="/practice/reading" element={<Reading />} />
          <Route path="/practice/listening" element={<Listening />} />
        </Routes>
      </Layout>
      </AuthGate>
    </BrowserRouter>
  );
}

export default App;
