import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Clock, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { mockQuestions } from "@/data/mockQuestions";

const Test = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes in seconds
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion]: answer });
  };

  const handleNext = () => {
    if (currentQuestion < mockQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const toggleFlag = () => {
    const newFlagged = new Set(flagged);
    if (newFlagged.has(currentQuestion)) {
      newFlagged.delete(currentQuestion);
    } else {
      newFlagged.add(currentQuestion);
    }
    setFlagged(newFlagged);
  };

  const handleSubmit = () => {
    const score = mockQuestions.reduce((acc, q, idx) => {
      return acc + (answers[idx] === q.correctAnswer ? 1 : 0);
    }, 0);
    const percentage = (score / mockQuestions.length) * 100;
    
    localStorage.setItem(
      "testResults",
      JSON.stringify({
        score,
        total: mockQuestions.length,
        percentage: percentage.toFixed(1),
        passed: percentage >= 80,
      })
    );
    navigate("/results");
  };

  const question = mockQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / mockQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background p-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with timer and progress */}
        <Card className="p-4 mb-4 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-semibold text-lg">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Question {currentQuestion + 1} of {mockQuestions.length}
              </div>
            </div>
            <div className="flex-1 min-w-[200px] max-w-xs">
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </Card>

        {/* Question Card */}
        <Card className="p-8 mb-4 shadow-lg">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-semibold">
              Question {currentQuestion + 1}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFlag}
              className={flagged.has(currentQuestion) ? "text-destructive" : ""}
            >
              <Flag className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-lg mb-8 leading-relaxed">{question.question}</p>

          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(option.id)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  answers[currentQuestion] === option.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 bg-card"
                }`}
              >
                <span className="font-semibold mr-3">{option.id}.</span>
                <span>{option.text}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex gap-4 justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentQuestion === mockQuestions.length - 1 ? (
            <Button onClick={handleSubmit} size="lg">
              Submit Test
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Question Navigator */}
        <Card className="p-6 mt-6 shadow-lg">
          <h3 className="font-semibold mb-4">Question Navigator</h3>
          <div className="grid grid-cols-10 gap-2">
            {mockQuestions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`aspect-square rounded-md text-sm font-medium transition-colors ${
                  currentQuestion === idx
                    ? "bg-primary text-primary-foreground"
                    : answers[idx]
                    ? "bg-success/20 text-success-foreground hover:bg-success/30"
                    : "bg-muted hover:bg-muted/80"
                } ${flagged.has(idx) ? "ring-2 ring-destructive" : ""}`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="flex gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success/20"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted"></div>
              <span>Not Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary"></div>
              <span>Current</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Test;
