import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Square, RotateCcw, Check, X, SwitchCamera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface VideoRecorderProps {
  onRecorded: (file: File, previewUrl: string) => void;
  maxSeconds?: number;
}

const VideoRecorder = ({ onRecorded, maxSeconds = 30 }: VideoRecorderProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');

  const startCamera = async (mode: 'user' | 'environment' = facing) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast.error('Camera/mic access denied');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!recording) return;
    setSeconds(0);
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  useEffect(() => {
    if (recording && seconds >= maxSeconds) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, recording, maxSeconds]);

  const switchCamera = async () => {
    const next = facing === 'user' ? 'environment' : 'user';
    setFacing(next);
    stopCamera();
    await startCamera(next);
  };

  const start = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';
    const mr = new MediaRecorder(streamRef.current, { mimeType: mime });
    mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `scene-${Date.now()}.webm`, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setRecordedFile(file);
      setRecording(false);
    };
    recorderRef.current = mr;
    mr.start();
    setRecording(true);
  };

  const stop = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setRecordedFile(null);
    setSeconds(0);
  };

  const confirm = () => {
    if (recordedFile && previewUrl) onRecorded(recordedFile, previewUrl);
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-border/50">
        {previewUrl ? (
          <video src={previewUrl} controls className="w-full h-full object-cover" />
        ) : (
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        )}
        {recording && (
          <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-destructive/90 text-white text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            REC {seconds}s / {maxSeconds}s
          </div>
        )}
        {!previewUrl && !recording && (
          <button onClick={switchCamera} className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80" title="Flip camera">
            <SwitchCamera className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        {previewUrl ? (
          <>
            <Button variant="outline" onClick={reset} className="gap-1.5"><RotateCcw className="w-4 h-4" /> Retake</Button>
            <Button onClick={confirm} className="gradient-primary text-primary-foreground gap-1.5"><Check className="w-4 h-4" /> Use this</Button>
          </>
        ) : recording ? (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={stop}
            className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center shadow-lg ring-4 ring-destructive/30"
          >
            <Square className="w-6 h-6 text-white fill-current" />
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={start}
            className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg ring-4 ring-primary/30"
          >
            <Camera className="w-6 h-6 text-primary-foreground" />
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default VideoRecorder;