import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Gamepad2, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/integrations/supabase/client';
 import { useAlert } from '@/hooks/useAlert';
import { ShimmerLoading } from '@/components/ShimmerLoading';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

export default function InteractiveQuiz() {
  const navigate = useNavigate();
  const { user } = useAuth();
   const { alert } = useAlert();
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
       alert({ title: "Error", description: "Please enter a quiz topic", variant: "destructive" });
      return;
    }

    if (!user) {
       alert({ title: "Error", description: "Please sign in to use this feature", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages: [{ 
            role: 'user', 
            content: `Create 5 multiple choice quiz questions about: ${topic}. Format as JSON array with structure: [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0}]. Only return valid JSON, no other text.` 
          }],
          model: 'google/gemini-2.5-flash'
        }
      });

      if (error || data.error) throw new Error(data?.error || 'Failed to generate quiz');
      
      const jsonMatch = data.response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedQuestions = JSON.parse(jsonMatch[0]);
        setQuestions(parsedQuestions);
         alert({ title: "Success", description: "Quiz generated!", variant: "success" });
      } else {
        throw new Error('Invalid quiz format');
      }
    } catch (error: any) {
      console.error('Quiz generation error:', error);
       alert({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    
    setTimeout(() => {
      if (answerIndex === questions[currentQuestion].correctAnswer) {
        setScore(score + 1);
      }
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        setShowResult(true);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Interactive Quiz</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl p-8 text-center">
          <Gamepad2 className="w-16 h-16 mx-auto mb-4 text-orange-500" />
          <h2 className="text-2xl font-bold mb-2">Test Your Knowledge</h2>
          <p className="text-muted-foreground">AI-generated quizzes on any topic</p>
        </div>

        {questions.length === 0 && !isGenerating && (
          <div className="space-y-4">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter quiz topic... (e.g., 'World History')"
              className="text-center"
            />
            
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !topic.trim()}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Gamepad2 className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Quiz'}
            </Button>
          </div>
        )}

        {isGenerating && (
          <div className="bg-card rounded-2xl p-8">
            <ShimmerLoading />
          </div>
        )}

        {questions.length > 0 && !showResult && (
          <div className="bg-card rounded-2xl p-6 animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Question {currentQuestion + 1} of {questions.length}</span>
              <span className="text-sm font-semibold">Score: {score}</span>
            </div>
            
            <h3 className="text-xl font-bold">{questions[currentQuestion].question}</h3>
            
            <div className="space-y-3">
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                  className={`w-full p-4 rounded-lg text-left transition-all ${
                    selectedAnswer === null
                      ? 'bg-muted hover:bg-muted/80'
                      : selectedAnswer === index
                      ? index === questions[currentQuestion].correctAnswer
                        ? 'bg-green-500/20 border-2 border-green-500'
                        : 'bg-red-500/20 border-2 border-red-500'
                      : index === questions[currentQuestion].correctAnswer
                      ? 'bg-green-500/20 border-2 border-green-500'
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {selectedAnswer !== null && index === questions[currentQuestion].correctAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    {selectedAnswer === index && index !== questions[currentQuestion].correctAnswer && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {showResult && (
          <div className="bg-card rounded-2xl p-8 animate-fade-in text-center space-y-4">
            <h3 className="text-2xl font-bold">Quiz Complete!</h3>
            <p className="text-4xl font-bold text-primary">{score} / {questions.length}</p>
            <p className="text-muted-foreground">
              {score === questions.length ? 'Perfect score! 🎉' : score >= questions.length * 0.7 ? 'Great job! 👏' : 'Keep practicing! 📚'}
            </p>
            <Button onClick={() => {
              setQuestions([]);
              setCurrentQuestion(0);
              setScore(0);
              setShowResult(false);
              setTopic('');
            }}>
              Take Another Quiz
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
