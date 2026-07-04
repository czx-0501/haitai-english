import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodayData, getDayNumber } from '../utils/scheduler';
import { ArrowLeft } from 'lucide-react';
import { useProgress } from '../hooks/useProgress';
import { speak, preloadVoices } from '../utils/speech';

const COMPANION_TYPES = ['鼓励型', '严格型', '竞赛型'];

const COMPANION_RESPONSES: Record<string, Record<string, string[]>> = {
  '鼓励型': {
    done: ['🎉 很棒！今天又完成了{count}词，离目标更近了！', '✨ 状态不错，今天学到了{count}个新词', '🌟 不错，今日{count}词已达标'],
    streak3: ['🔥 连续 3 天了，状态保持得很好', '👏 三天连胜，稳定的步伐是最好的进步'],
    streak7: ['🌟 一周不间断！这份坚持已经超过了大部分人', '🎯 连续 7 天，你已经养成了学习习惯'],
    highAccuracy: ['💯 正确率 {rate}%？今天状态很棒！', '🎯 高质量的一天，继续保持这个水准'],
    lessThanYesterday: ['📉 今天比昨天少了{diff}词，明天补回来就好', '🌊 偶尔休息也很正常，明天加油'],
    missDay: ['🌱 休息一天也没关系，明天继续就行', '💪 归零也是新的开始，随时可以继续'],
    firstTime: ['👋 欢迎！今天开始养成学习的好习惯吧', '🌟 第一步最难，你已经迈出来了'],
    greeting: ['👋 准备好了吗？今天的目标是多少词？', '✨ 新的一天，新的成长'],
  },
  '严格型': {
    done: ['✓ 今日目标达成。明天继续保持', '📊 {count}词完成，效率还行，可以更快'],
    streak3: ['连续3天。这只是一个开始', '坚持3天，基础已建立，继续'],
    streak7: ['7天不间断。下一个目标：14天', '7天养成期已过，现在是巩固阶段'],
    highAccuracy: ['正确率{rate}%，可以接受，向100%努力'],
    lessThanYesterday: ['比昨天少了{diff}词。原因是什么？', '下滑了。明天的任务量需要补回来'],
    missDay: ['断了一天。连续记录已重置。', '休息可以，但别超过一天'],
    firstTime: ['开始学习了。坚持下去就是胜利', '第一天。先看看自己能坚持几天'],
    greeting: ['今天的学习计划准备好了吗？', '按计划执行是最好的策略'],
  },
  '竞赛型': {
    done: ['⚡ 又一天！目前连续{streak}天', '💪 今日{count}词已击败昨日记录？'],
    streak3: ['已超过 60% 的用户', '排名正在上升，保持节奏'],
    streak7: ['你已超过 85% 的学习者', '7天连胜，进入前列梯队'],
    highAccuracy: ['正确率{rate}%，接近满分', '这个正确率在排行榜上很有竞争力'],
    lessThanYesterday: ['比昨天少了{diff}词。明天能追回来吗？', '退步了。明天的目标应该更高'],
    missDay: ['💢 断了一天，连胜记录已破', '重新开始，挑战能撑多久'],
    firstTime: ['🏁 计时开始。第一天的纪录等你打破', '出发！目标是连续学习 7 天'],
    greeting: ['📊 今天要比昨天多学一点', '昨天的纪录，今天能打破吗？'],
  }
};

function pick(type: string, key: string, params: Record<string, any>) {
  const responses = COMPANION_RESPONSES[type]?.[key];
  if (!responses || responses.length === 0) return '';
  const idx = Math.floor(Math.random() * responses.length);
  let text = responses[idx];
  Object.entries(params).forEach(([k, v]) => { text = text.replace(`{${k}}`, v); });
  return text;
}

function getMessage(type: string, todayCount: number, streak: number, accuracy: number, yesterdayCount: number) {
  if (todayCount === 0 && streak === 0) return pick(type, 'firstTime', {});
  if (todayCount === 0) return pick(type, 'missDay', {});
  const p = { count: todayCount, streak, rate: accuracy, diff: Math.abs(todayCount - yesterdayCount) };
  if (streak >= 7) return pick(type, 'streak7', p);
  if (streak >= 3) return pick(type, 'streak3', p);
  if (accuracy >= 90) return pick(type, 'highAccuracy', p);
  if (yesterdayCount > 0 && todayCount < yesterdayCount) return pick(type, 'lessThanYesterday', p);
  return pick(type, 'done', p);
}

export default function AIPage() {
  const navigate = useNavigate();
  const { progress } = useProgress();
  const day = getDayNumber();
  const [typeIdx, setTypeIdx] = useState(() => parseInt(localStorage.getItem('companionType') || '0'));
  const [words, setWords] = useState<any[]>([]);
  const [selectedWord, setSelectedWord] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordStatus, setRecordStatus] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const type = COMPANION_TYPES[typeIdx];
  const todayCount = words.length;
  const streak = progress.streak.current || 0;
  const companionMessage = getMessage(type, todayCount, streak, 0, 0);

  useEffect(() => {
    const dayData = getTodayData();
    setWords(dayData?.words || []);
    preloadVoices();
  }, []);

  const onTypeChange = (idx: number) => {
    setTypeIdx(idx);
    localStorage.setItem('companionType', String(idx));
  };

  const selectWord = (word: any) => {
    setSelectedWord(word);
    setRecordStatus('');
    setAnalysisResult(null);
  };

  const playCorrect = () => {
    if (!selectedWord) return;
    speak(selectedWord.w);
    setRecordStatus('正在播放标准发音...');
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordStatus('当前设备不支持录音');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!window.MediaRecorder) {
        stream.getTracks().forEach(t => t.stop());
        setRecordStatus('当前浏览器不支持录音');
        return;
      }
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setHasRecording(true);
        setRecordStatus('录音完成');
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordStatus('录音中...');
    } catch {
      setRecordStatus('麦克风权限被拒绝，请在系统设置中允许');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const playRecording = () => {
    if (!audioBlob) return;
    const url = URL.createObjectURL(audioBlob);
    const audio = new Audio(url);
    audio.play();
    setRecordStatus('播放你的录音...');
  };

  const analyzePronunciation = async () => {
    if (!selectedWord || !audioBlob) return;
    setRecordStatus('正在分析发音...');
    const expected = selectedWord.w.toLowerCase();
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        const transcript = await new Promise<string>((resolve, reject) => {
          recognition.onresult = (e: any) => resolve(e.results[0][0].transcript.trim().toLowerCase());
          recognition.onerror = () => reject();
          recognition.start();
          setTimeout(() => { try { recognition.stop(); } catch {} reject(); }, 5000);
        });
        let score = 0;
        if (transcript === expected) score = 100;
        else if (transcript.includes(expected) || expected.includes(transcript)) score = 85;
        else {
          let common = 0;
          for (let i = 0; i < Math.min(transcript.length, expected.length); i++) {
            if (transcript[i] === expected[i]) common++;
          }
          score = Math.min(99, Math.round(common / expected.length * 90));
        }
        setAnalysisResult({ score, transcribed: transcript, expected, feedback: score >= 90 ? '发音很棒！继续保持！' : score >= 70 ? '发音不错，个别音素需要调整' : score >= 50 ? '发音需要多加练习' : '建议先仔细听示范发音再跟读' });
        setRecordStatus('分析完成');
        return;
      }
    } catch {}
    // Try Azure STT as secondary fallback
    try {
      var azureKey = import.meta.env.VITE_AZURE_TTS_KEY || '';
      if (azureKey && audioBlob && audioBlob.size > 0) {
        setRecordStatus('正在云端识别...');
        var azureRes = await fetch('https://' + 'eastasia' + '.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US', {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': azureKey,
            'Content-Type': audioBlob.type || 'audio/webm',
          },
          body: audioBlob,
        });
        if (azureRes.ok) {
          var azureData = await azureRes.json();
          var transcript = (azureData.DisplayText || '').toLowerCase().trim().replace(/[.,!?]/g, '');
          if (transcript) {
            var score = 0;
            if (transcript === expected) score = 100;
            else if (transcript.indexOf(expected) >= 0 || expected.indexOf(transcript) >= 0) score = 85;
            else {
              var common = 0;
              for (var i = 0; i < Math.min(transcript.length, expected.length); i++) {
                if (transcript[i] === expected[i]) common++;
              }
              score = Math.min(99, Math.round(common / expected.length * 90));
            }
            var fb = '';
            if (score >= 90) fb = '发音很棒！继续保持！';
            else if (score >= 70) fb = '发音不错，个别音素需要调整';
            else if (score >= 50) fb = '发音需要多加练习';
            else fb = '建议先仔细听示范发音再跟读';
            setAnalysisResult({ score: score, transcribed: transcript, expected: expected, feedback: fb });
            setRecordStatus('分析完成');
            return;
          }
        }
      }
    } catch {}
    setRecordStatus('设备不支持语音识别，请点击喇叭听标准发音后跟读');
    setAnalysisResult({ score: 0, transcribed: '--', expected: expected, feedback: '请先录音后点击分析' });
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI 学伴</h1>
          <p className="text-sm text-gray-400">智能发音陪练</p>
        </div>
      </div>

      {/* Companion Card */}
      <div className="bg-gradient-to-r from-[#4f6ef7] to-[#7c5cfc] rounded-2xl p-5 text-white mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">🤖</div>
          <div className="flex-1">
            <p className="font-semibold text-base">AI 学伴·小海</p>
            <select
              className="text-xs bg-white/20 rounded-full px-3 py-1 mt-1 text-white outline-none w-auto"
              value={typeIdx}
              onChange={e => onTypeChange(Number(e.target.value))}
            >
              {COMPANION_TYPES.map((t, i) => (
                <option key={i} value={i} className="text-gray-800">{t}</option>
              ))}
            </select>
          </div>
          <div className="text-right text-xs opacity-70">Day {day}</div>
        </div>
        <p className="text-sm leading-relaxed border-t border-white/20 pt-3">{companionMessage}</p>
      </div>

      {/* Today's Words */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
        <h3 className="font-semibold text-sm mb-3">📖 今日词汇</h3>
        {words.length === 0 ? (
          <p className="text-center text-gray-400 py-4 text-sm">暂无学习数据</p>
        ) : (
          <div className="max-h-48 overflow-y-auto -mx-1">
            {words.map((w: any) => (
              <div
                key={w.w}
                onClick={() => selectWord(w)}
                className={`flex items-center p-2.5 border-b border-gray-50 last:border-b-0 cursor-pointer rounded-lg ${
                  selectedWord?.w === w.w ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <span className="flex-1 font-semibold text-sm text-gray-800">{w.w}</span>
                <span className="text-xs text-gray-400 mr-2">{w.p}</span>
                <button onClick={(e) => { e.stopPropagation(); speak(w.w); }} className="text-sm hover:scale-110 transition-transform">🔊</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Word Detail */}
      {selectedWord && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-800">{selectedWord.w}</h3>
              <span className="text-sm font-normal text-gray-400">{selectedWord.p}</span>
            </div>
            <button onClick={() => speak(selectedWord.w)} className="text-lg hover:scale-110 transition-transform">🔊</button>
          </div>
          <p className="text-sm text-[var(--primary)] mb-3">{selectedWord.m}</p>
          {selectedWord.ex?.map((ex: any, i: number) => (
            <div key={i} className="mb-2 p-2.5 bg-gray-50 rounded-lg group">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-gray-700">{ex.e}</p>
                <button onClick={() => speak(ex.e)} className="text-sm hover:scale-110 transition-transform opacity-60 hover:opacity-100 flex-shrink-0 mt-0.5">🔊</button>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{ex.c}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pronunciation */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
        <h3 className="font-semibold text-sm mb-3">🎤 发音练习</h3>
        {!selectedWord ? (
          <p className="text-center text-gray-400 py-3 text-sm">请选择一个单词开始练习</p>
        ) : (
          <div className="flex justify-around gap-2">
            <button onClick={playCorrect} className="flex flex-col items-center p-3 bg-gray-50 rounded-xl flex-1 hover:bg-gray-100 transition-colors">
              <span className="text-2xl mb-1">🔊</span>
              <span className="text-xs text-gray-500">听示范</span>
            </button>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex flex-col items-center p-3 rounded-xl flex-1 transition-colors ${isRecording ? 'bg-red-50' : 'bg-gray-50 hover:bg-gray-100'}`}
            >
              <span className="text-2xl mb-1">{isRecording ? '⏹' : '🎙️'}</span>
              <span className="text-xs text-gray-500">{isRecording ? '停止' : '录音'}</span>
            </button>
            <button onClick={playRecording} className={`flex flex-col items-center p-3 rounded-xl flex-1 transition-colors ${hasRecording ? 'bg-gray-50 hover:bg-gray-100' : 'opacity-40'}`} disabled={!hasRecording}>
              <span className="text-2xl mb-1">▶️</span>
              <span className="text-xs text-gray-500">听自己</span>
            </button>
            <button onClick={analyzePronunciation} className={`flex flex-col items-center p-3 rounded-xl flex-1 transition-colors ${hasRecording ? 'bg-gray-50 hover:bg-gray-100' : 'opacity-40'}`} disabled={!hasRecording}>
              <span className="text-2xl mb-1">📊</span>
              <span className="text-xs text-gray-500">分析</span>
            </button>
          </div>
        )}
        {recordStatus && <p className="text-xs text-gray-500 text-center mt-3">{recordStatus}</p>}
      </div>

      {/* Analysis Result */}
      {analysisResult && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-semibold text-sm mb-3">📊 发音分析</h3>
          <div className="flex items-baseline justify-center my-4">
            <span className="text-5xl font-bold text-[var(--primary)]">{analysisResult.score}</span>
            <span className="text-lg text-gray-400 ml-1">分</span>
          </div>
          <div className="flex py-1.5 text-sm">
            <span className="text-gray-500 w-14 flex-shrink-0">你说：</span>
            <span className="text-gray-800">{analysisResult.transcribed}</span>
          </div>
          <div className="flex py-1.5 text-sm">
            <span className="text-gray-500 w-14 flex-shrink-0">原文：</span>
            <span className="text-gray-800">{analysisResult.expected}</span>
          </div>
          <p className="text-sm text-[var(--primary)] mt-3 p-2.5 bg-blue-50 rounded-lg text-center">{analysisResult.feedback}</p>
        </div>
      )}
    </div>
  );
}
