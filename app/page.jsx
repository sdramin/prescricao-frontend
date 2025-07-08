"use client";
import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [prescription, setPrescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);

  const generatePrescription = async () => {
    setLoading(true);
    const response = await fetch(process.env.NEXT_PUBLIC_API_URL + "/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    });

    const data = await response.json();
    setPrescription(data.result);
    setLoading(false);
  };

  const startRecording = async () => {
    try {
      setRecording(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      return new Promise((resolve, reject) => {
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append("audio", audioBlob, "audio.webm");

          try {
            const response = await fetch(process.env.NEXT_PUBLIC_API_URL + "/transcribe", {
              method: "POST",
              body: formData,
            });

            const data = await response.json();
            setInput(data.transcription);
          } catch (err) {
            console.error("Erro ao transcrever:", err);
          }

          setRecording(false);
          resolve();
        };

        mediaRecorder.start();

        // Parar após 5 segundos
        setTimeout(() => {
          mediaRecorder.stop();
          stream.getTracks().forEach(track => track.stop());
        }, 5000);
      });
    } catch (error) {
      console.error("Erro ao acessar microfone:", error);
      setRecording(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-blue-900">Assistente de Prescrição por IA</h1>

      <div className="bg-white border rounded-lg shadow p-4 mb-6">
        <textarea
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Descreva o caso clínico aqui..."
          className="w-full border p-2 rounded mb-4"
        />
        <div className="flex gap-2">
          <button
            onClick={generatePrescription}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Processando..." : "Gerar Prescrição"}
          </button>
          <button
            onClick={startRecording}
            disabled={recording}
            className="bg-gray-300 text-black px-4 py-2 rounded disabled:opacity-50"
          >
            {recording ? "Gravando..." : "Gravar Áudio"}
          </button>
        </div>
      </div>

      {prescription && (
        <div className="bg-white border rounded-lg shadow p-4">
          <h2 className="font-semibold text-lg mb-2">Prescrição Gerada:</h2>
          <pre className="whitespace-pre-wrap text-gray-800">{prescription}</pre>
        </div>
      )}
    </main>
  );
}
