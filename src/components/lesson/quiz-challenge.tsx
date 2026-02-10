import { useState } from "react"
import { CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { QuizQuestion } from "@/lib/content/types"

interface QuizChallengeProps {
  questions: QuizQuestion[]
  onComplete: () => void
}

export function QuizChallenge({ questions, onComplete }: QuizChallengeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  const question = questions[currentIndex]
  if (!question) return null

  const isCorrect = selectedAnswer === question.correctIndex

  const handleSelect = (index: number) => {
    if (showResult) return
    setSelectedAnswer(index)
  }

  const handleSubmit = () => {
    if (selectedAnswer === null) return
    setShowResult(true)
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      onComplete()
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className="text-sm text-muted-foreground">
          {correctCount} correct
        </span>
      </div>

      <h3 className="text-lg font-semibold">{question.question}</h3>

      <div className="space-y-2">
        {question.options.map((option, i) => (
          <Card
            key={i}
            className={cn(
              "cursor-pointer transition-colors",
              selectedAnswer === i && !showResult && "border-primary",
              showResult && i === question.correctIndex && "border-green-500 bg-green-500/10",
              showResult && selectedAnswer === i && !isCorrect && "border-destructive bg-destructive/10"
            )}
            onClick={() => handleSelect(i)}
          >
            <CardContent className="p-3 flex items-center gap-3">
              <span className="font-mono text-sm text-muted-foreground">{String.fromCharCode(65 + i)}</span>
              <span>{option}</span>
              {showResult && i === question.correctIndex && (
                <CheckCircle2 className="size-4 text-green-500 ml-auto" />
              )}
              {showResult && selectedAnswer === i && !isCorrect && (
                <XCircle className="size-4 text-destructive ml-auto" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {showResult && question.explanation && (
        <div className="bg-muted rounded-lg p-4 text-sm">
          <p className="font-medium mb-1">Explanation</p>
          <p className="text-muted-foreground">{question.explanation}</p>
        </div>
      )}

      <div className="flex justify-end">
        {!showResult ? (
          <Button onClick={handleSubmit} disabled={selectedAnswer === null}>
            Check Answer
          </Button>
        ) : (
          <Button onClick={handleNext}>
            {currentIndex < questions.length - 1 ? "Next Question" : "Complete"}
          </Button>
        )}
      </div>
    </div>
  )
}
