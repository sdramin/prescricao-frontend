"use client";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const [transcription, setTranscription] = useState("");
  const [prescription, setPrescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAudioRecording = async () => {
    setLoading(true);
    setTranscription("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transcribe`, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) throw new Error("Erro ao transcrever áudio");

          const data = await response.json();
          setTranscription(data.transcription);
        } catch (err) {
          alert("Erro ao enviar o áudio: " + err.message);
        } finally {
          setLoading(false);
        }
      };

      mediaRecorder.start();

      setTimeout(() => {
        mediaRecorder.stop();
      }, 5000);
    } catch (err) {
      alert("Erro ao iniciar gravação de áudio: " + err.message);
      setLoading(false);
    }
  };

  const handleGeneratePrescription = async () => {
    if (!transcription) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: transcription }),
      });

      if (!response.ok) throw new Error("Erro ao gerar prescrição");

      const data = await response.json();
      setPrescription(data.result);
    } catch (err) {
      alert("Erro ao gerar prescrição: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4">
      <h1 className="text-2xl font-bold mb-4">Prescrição Assistida por Voz</h1>

      <Button onClick={handleAudioRecording} disabled={loading}>
        🎤 Gravar Áudio (5s)
      </Button>

      <Card className="w-full max-w-xl mt-4">
        <CardContent>
          <Textarea
            placeholder="Transcrição do áudio"
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      <Button className="mt-4" onClick={handleGeneratePrescription} disabled={loading || !transcription}>
        📝 Gerar Prescrição
      </Button>

      {prescription && (
        <Card className="w-full max-w-xl mt-4">
          <CardContent>
            <Textarea value={prescription} rows={8} readOnly />
          </CardContent>
        </Card>
      )}
    </main>
  );
}
