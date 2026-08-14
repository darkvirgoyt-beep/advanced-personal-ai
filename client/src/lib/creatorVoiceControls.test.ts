import { describe, expect, it, vi } from "vitest";
import { appendTranscript, canCaptureVoice, creatorPromptError, readAloudWithBrowser, voiceRecordingError } from "./creatorVoiceControls";

describe("NovaAI creator and voice controls", () => {
  it("validates a useful creator prompt", () => {
    expect(creatorPromptError("  ")).toBe("Describe the image you want to create");
    expect(creatorPromptError("A glass nebula icon")).toBeNull();
  });

  it("handles unavailable capture and audio-size guardrails", () => {
    expect(canCaptureVoice(undefined, undefined)).toBe(false);
    expect(canCaptureVoice({ getUserMedia: vi.fn() } as any, function Recorder() {})).toBe(true);
    expect(voiceRecordingError(0)).toBe("No audio was recorded");
    expect(voiceRecordingError(16 * 1024 * 1024 + 1)).toContain("16 MB");
    expect(voiceRecordingError(512)).toBeNull();
  });

  it("appends transcripts and sends assistant text to browser speech when supported", () => {
    expect(appendTranscript("Draft", " spoken text ")).toBe("Draft spoken text");
    const cancel = vi.fn();
    const speak = vi.fn();
    class FakeUtterance { constructor(public text: string) {} }
    expect(readAloudWithBrowser("Nova answer", { cancel, speak }, FakeUtterance as any)).toBe(true);
    expect(cancel).toHaveBeenCalledOnce();
    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: "Nova answer" }));
    expect(readAloudWithBrowser("Nova answer", undefined, undefined)).toBe(false);
  });
});
