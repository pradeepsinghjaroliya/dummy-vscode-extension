// Token response interface
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

// Auth credentials interface
export interface AuthResponse {
  client_id: string;
  client_secret: string;
}

// Message from webview to extension
export type FromWebviewMessage =
  | { type: "letsGo" }
  | { type: "clear" }
  | { type: "setAccessToken"; token: string; refreshToken?: string }
  | { type: "searchSpaces"; query: string }
  | { type: "fetchJoinedSpaces" }
  | { type: "selectSpace"; spaceId: string }
  | { type: "fetchSpaceMessages"; spaceId: string }
  | { type: "backToMainView" }
  | { type: "refreshSpaceMessages" }
  | { type: "sendMessage"; spaceId: string; text: string }
  | { type: "refreshAccessToken" };

// Google Chat Space interface
export interface ChatSpace {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  type: "support" | "joined";
  memberCount?: number;
  lastActivity?: Date | string; // Allow both Date objects and date strings
  avatarUrl?: string;
}

// Google Chat Message interface
export interface ChatMessage {
  name: string; // Message resource name
  sender: {
    name: string;
    displayName: string;
    avatarUrl?: string;
    type?: "HUMAN" | "BOT";
  };
  text?: string;
  createTime: string | Date;
  attachments?: any[];
  space: {
    name: string;
    displayName?: string;
  };
}

// Message from extension to webview
export interface ToWebviewMessage {
  text: string;
  clickCount?: number;
  joinedSpaces?: ChatSpace[];
  spaceMessages?: ChatMessage[];
  currentView?: "main" | "chat";
  currentSpace?: ChatSpace | null;
  isLoading?: boolean;
  messagesLoading?: boolean;
  error?: string;
  messagesError?: string;
  accessToken?: string;
  configStatus?: {
    hasConfigFile: boolean;
    tokenSource: "config" | "manual" | "none";
    configPath?: string;
    setupInstructions?: string;
  };
}
