import React, { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  startNativeSpeechRecognition,
  keepAwake,
  allowSleep,
  hapticFeedback,
} from "@/lib/native-plugins";

interface VoiceRecordButtonProps {
  onTranscript: (text: string) => void;
  isProcessing?: boolean;
  className?: string;
}

export function VoiceRecordButton({ onTranscript, isProcessing = false, className }: VoiceRecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [finalText, setFinalText] = useState("");
  const stopRef = useRef<(() => Promise<string>) | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    import("@capacitor/core").then(({ Capacitor }) => {
      if (!SpeechRecognition && !Capacitor.isNativePlatform()) {
        setSupported(false);
      }
    });
  }, []);

  const startRecording = useCallback(async () => {
    hapticFeedback();
    await keepAwake();

    setIsRecording(true);
    setDisplayText("");
    setFinalText("");

    const session = await startNativeSpeechRecognition({
      language: "sv-SE",
      onPartialResult: (text) => {
        setDisplayText(text);
      },
      onResult: (text) => {
        setFinalText(text);
        setDisplayText(text);
      },
      onError: (error) => {
        console.error("Speech recognition error:", error);
        if (error !== "no-speech") {
          setIsRecording(false);
          allowSleep();
        }
      },
    });

    stopRef.current = session.stop;
  }, []);

  const stopRecording = useCallback(async () => {
    hapticFeedback();
    if (stopRef.current) {
      const result = await stopRef.current();
      stopRef.current = null;
      setFinalText(result);
      setDisplayText(result);
    }
    setIsRecording(false);
    await allowSleep();
  }, []);

  const handleSend = useCallback(() => {
    const text = finalText.trim();
    if (text) {
      onTranscript(text);
      setFinalText("");
      setDisplayText("");
    }
  }, [finalText, onTranscript]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

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
          <p className="text-sm whitespace-pre-wrap">{displayText}</p>
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

      {/* Send button */}
      {finalText.trim() && !isRecording && (
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
