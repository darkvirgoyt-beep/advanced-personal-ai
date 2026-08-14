export const MAX_VOICE_RECORDING_BYTES = 16 * 1024 * 1024;

export function creatorPromptError(value: string): string | null {
  return value.trim().length >= 4 ? null : "Describe the image you want to create";
}

export function canCaptureVoice(mediaDevices: Pick<MediaDevices, "getUserMedia"> | undefined, recorder: unknown): boolean {
  return typeof mediaDevices?.getUserMedia === "function" && typeof recorder === "function";
}

export function voiceRecordingError(size: number): string | null {
  if (size === 0) return "No audio was recorded";
  if (size > MAX_VOICE_RECORDING_BYTES) return "Voice recording is larger than the 16 MB transcription limit";
  return null;
}

export function appendTranscript(current: string, transcript: string): string {
  const clean = transcript.trim();
  return clean ? `${current}${current.trim() ? " " : ""}${clean}` : current;
}

export function readAloudWithBrowser(text: string, synthesis: Pick<SpeechSynthesis, "cancel" | "speak"> | undefined, Utterance: typeof SpeechSynthesisUtterance | undefined): boolean {
  if (!synthesis || !Utterance) return false;
  synthesis.cancel();
  synthesis.speak(new Utterance(text));
  return true;
}
