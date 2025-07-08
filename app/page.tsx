"use client";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Microphone } from "lucide-react";

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
    setRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    const audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + "/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setInput(data.transcription);
      setRecording(false);
    };

    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 5000);
  };

  return (
    <main className="min-h-screen bg-white p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-blue-900">Assistente de Prescrição por IA</h1>
      <Card className="mb-6">
        <CardContent className="p-4">
          <Textarea
            rows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: Paciente com infecção urinária, preferência por via EV. Prescrever ciprofloxacina 400mg de 12/12h por 7 dias."
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={generatePrescription} disabled={loading}>
              {loading ? "Processando..." : "Gerar Prescrição"}
            </Button>
            <Button onClick={startRecording} variant="outline" disabled={recording}>
              <Microphone className="w-4 h-4 mr-1" /> {recording ? "Gravando..." : "Gravar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {prescription && (
        <Card>
          <CardContent className="p-4 bg-gray-50">
            <h2 className="font-semibold text-lg mb-2">Prescrição Gerada:</h2>
            <pre className="whitespace-pre-wrap text-gray-800">{prescription}</pre>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
