// tests/lib/email.test.ts
import { describe, it, vi, expect, beforeEach } from "vitest";

// Stub environment variables
vi.stubEnv("PUBLIC_POSTMARK_API_KEY", "dummy_api_key");
vi.stubEnv("POSTMARK_SENDER_EMAIL", "noreply@example.com");

// Mock Postmark before importing your module
vi.mock("postmark", () => {
  return {
    ServerClient: vi.fn().mockImplementation(() => ({
      sendEmail: vi.fn(),
    })),
  };
});

// Import after mocking
import * as emailModule from "$lib/email";
import * as postmark from "postmark";

describe("sendEmail", () => {
  let sendEmailMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Grab the mocked sendEmail from the mocked ServerClient
    const clientInstance = new (postmark as any).ServerClient("dummy_api_key");
    sendEmailMock = clientInstance.sendEmail;
  });

  it("calls Postmark client with correct parameters", async () => {
    sendEmailMock.mockResolvedValue({ MessageID: "123" });

    const emailData = {
      to: "test@example.com",
      subject: "Test Subject",
      html: "<p>Hello world</p>",
    };

    await emailModule.sendEmail(emailData);

    // ServerClient was called with correct API key
    expect((postmark as any).ServerClient).toHaveBeenCalledWith("dummy_api_key");

    // sendEmail was called with correct payload
    expect(sendEmailMock).toHaveBeenCalledWith({
      From: "noreply@example.com",
      To: emailData.to,
      Subject: emailData.subject,
      HtmlBody: emailData.html,
    });
  });

  it("throws an error if Postmark fails", async () => {
    sendEmailMock.mockRejectedValueOnce(new Error("Postmark error"));

    await expect(
      emailModule.sendEmail({
        to: "fail@example.com",
        subject: "Fail",
        html: "<p>Fail</p>",
      })
    ).rejects.toThrow("Postmark error");
  });
});
