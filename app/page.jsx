"use client";
import { useState } from "react";

export default function Home() {
  const [transcription, setTranscription] = useState("");
  const [result, setResult] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const handleStartRecording = async () => {
    setIsRecording(true);
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
      formData.append("audio", audioBlob, "audio.webm");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/transcribe`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setTranscription(data.transcription);
      setIsRecording(false);
    };

    mediaRecorder.start();

    setTimeout(() => {
      mediaRecorder.stop();
    }, 5000);
  };

  const handleGenerate = async () => {
    setResult("Processando...");
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: transcription }),
    });

    const data = await response.json();
    setResult(data.result);
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem" }}>
      <h1>Assistente de Prescrição Médica</h1>

      <button onClick={handleStartRecording} disabled={isRecording}>
        {isRecording ? "Gravando..." : "Gravar Áudio"}
      </button>

      <br />
      <br />

      <textarea
        rows={6}
        style={{ width: "100%", padding: "10px" }}
        placeholder="Ou a transcrição aparecerá aqui..."
        value={transcription}
        onChange={(e) => setTranscription(e.target.value)}
      />

      <br />

      <button onClick={handleGenerate} style={{ marginTop: "1rem" }}>
        Gerar Prescrição
      </button>

      <div style={{ whiteSpace: "pre-wrap", marginTop: "2rem", borderTop: "1px solid #ccc", paddingTop: "1rem" }}>
        {result}
      </div>
    </div>
  );
}
