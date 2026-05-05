export type ErrorType =
  | "bad_request"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limit"
  | "offline";

export type Surface =
  | "chat"
  | "auth"
  | "api"
  | "stream"
  | "database"
  | "history"
  | "vote"
  | "document"
  | "suggestions"
  | "activate_gateway"
  | "rag";

export type ErrorCode = `${ErrorType}:${Surface}`;

export type ErrorVisibility = "response" | "log" | "none";

export const visibilityBySurface: Record<Surface, ErrorVisibility> = {
  database: "log",
  chat: "response",
  auth: "response",
  stream: "response",
  api: "response",
  history: "response",
  vote: "response",
  document: "response",
  suggestions: "response",
  activate_gateway: "response",
  rag: "response",
};

const isDev = process.env.NODE_ENV === "development";

function formatCause(cause: unknown): string | undefined {
  if (cause === undefined || cause === null) {
    return undefined;
  }
  if (typeof cause === "string") {
    return cause;
  }
  if (cause instanceof Error) {
    return cause.message;
  }
  return String(cause);
}

export class ChatbotError extends Error {
  type: ErrorType;
  surface: Surface;
  statusCode: number;

  constructor(errorCode: ErrorCode, cause?: unknown) {
    const [type, surface] = errorCode.split(":");

    const userMessage = getMessageByErrorCode(errorCode);
    super(userMessage);

    this.type = type as ErrorType;
    this.surface = surface as Surface;
    this.statusCode = getStatusCodeByType(this.type);
    this.cause = cause;
  }

  toResponse() {
    const code: ErrorCode = `${this.type}:${this.surface}`;
    const visibility = visibilityBySurface[this.surface];
    const causeMessage = formatCause(this.cause);

    if (visibility === "log") {
      console.error({
        code,
        message: this.message,
        cause:
          this.cause instanceof Error
            ? {
                name: this.cause.name,
                message: this.cause.message,
                stack: this.cause.stack,
              }
            : this.cause,
      });

      if (isDev) {
        return Response.json(
          { code, message: this.message, cause: causeMessage },
          { status: this.statusCode }
        );
      }

      return Response.json(
        { code: "", message: "Something went wrong. Please try again later." },
        { status: this.statusCode }
      );
    }

    const payload: Record<string, unknown> = {
      code,
      message: this.message,
      cause: causeMessage,
    };

    if (isDev && this.cause instanceof Error) {
      payload.stack = this.cause.stack;
    }

    return Response.json(payload, { status: this.statusCode });
  }
}

export function getMessageByErrorCode(errorCode: ErrorCode): string {
  if (errorCode === "not_found:database") {
    return "The requested record was not found in the database.";
  }
  if (errorCode.includes("database")) {
    return "An error occurred while executing a database query.";
  }

  switch (errorCode) {
    case "bad_request:api":
      return "The request couldn't be processed. Please check your input and try again.";

    case "bad_request:activate_gateway":
      return "AI Gateway requires a valid credit card on file to service requests. Please visit https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card to add a card and unlock your free credits.";

    case "unauthorized:auth":
      return "You need to sign in before continuing.";
    case "forbidden:auth":
      return "Your account does not have access to this feature.";

    case "rate_limit:chat":
      return "You have exceeded your maximum number of messages for the day. Please try again later.";
    case "not_found:chat":
      return "The requested chat was not found. Please check the chat ID and try again.";
    case "forbidden:chat":
      return "This chat belongs to another user. Please check the chat ID and try again.";
    case "unauthorized:chat":
      return "You need to sign in to view this chat. Please sign in and try again.";
    case "offline:chat":
      return "We're having trouble sending your message. Please check your internet connection and try again.";

    case "not_found:document":
      return "The requested document was not found. Please check the document ID and try again.";
    case "forbidden:document":
      return "This document belongs to another user. Please check the document ID and try again.";
    case "unauthorized:document":
      return "You need to sign in to view this document. Please sign in and try again.";
    case "bad_request:document":
      return "The request to create or update the document was invalid. Please check your input and try again.";

    case "bad_request:rag":
      return "Failed to ingest document. Please check the document and try again.";

    default:
      return "Something went wrong. Please try again later.";
  }
}

function getStatusCodeByType(type: ErrorType) {
  switch (type) {
    case "bad_request":
      return 400;
    case "unauthorized":
      return 401;
    case "forbidden":
      return 403;
    case "not_found":
      return 404;
    case "rate_limit":
      return 429;
    case "offline":
      return 503;
    default:
      return 500;
  }
}
