import React, { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceRecordButtonProps {
  onTranscript: (text: string) => void;
  isProcessing?: boolean;
  className?: string;
}

export function VoiceRecordButton({ onTranscript, isProcessing = false, className }: VoiceRecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
    }
  }, []);

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "sv-SE"; // Swedish default, could be made configurable

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(finalTranscript.trim());
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still in recording mode (handles timeout restarts)
      if (recognitionRef.current === recognition) {
        try {
          recognition.start();
        } catch {
          setIsRecording(false);
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setTranscript("");
    setInterimTranscript("");
  }, []);

  const stopRecording = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onend = null;
      recognition.stop();
    }
    setIsRecording(false);
    setInterimTranscript("");
  }, []);

  const handleSend = useCallback(() => {
    if (transcript.trim()) {
      onTranscript(transcript.trim());
      setTranscript("");
      setInterimTranscript("");
    }
  }, [transcript, onTranscript]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const displayText = transcript + (interimTranscript ? ` ${interimTranscript}` : "");

  if (!supported) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-4 p-8", className)}>
        <MicOff className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground text-center">
          Röstinspelning stöds inte i den här webbläsaren. Prova Chrome eller Safari.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-6 p-6", className)}>
      {/* Transcript display */}
      {displayText && (
        <div className="w-full max-w-md bg-muted/50 rounded-2xl p-4 min-h-[80px] max-h-[200px] overflow-y-auto">
          <p className="text-sm whitespace-pre-wrap">
            {transcript}
            {interimTranscript && (
              <span className="text-muted-foreground">{interimTranscript}</span>
            )}
          </p>
        </div>
      )}

      {/* Mic button */}
      <div className="relative">
        {isRecording && (
          <div className="absolute inset-0 rounded-full animate-ping bg-destructive/20" />
        )}
        <Button
          size="icon"
          variant={isRecording ? "destructive" : "default"}
          className={cn(
            "h-24 w-24 rounded-full transition-all duration-300",
            isRecording && "scale-110"
          )}
          onClick={toggleRecording}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : isRecording ? (
            <MicOff className="h-10 w-10" />
          ) : (
            <Mic className="h-10 w-10" />
          )}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {isProcessing
          ? "Bearbetar..."
          : isRecording
          ? "Lyssnar... Tryck för att stoppa"
          : "Tryck för att prata"}
      </p>

      {/* Send button - visible when there's a transcript and not recording */}
      {transcript.trim() && !isRecording && (
        <Button
          onClick={handleSend}
          disabled={isProcessing}
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          Skicka till AI
        </Button>
      )}
    </div>
  );
}
