import * as vscode from "vscode";
import { FromWebviewMessage, ToWebviewMessage } from "../interfaces/messages";
import { ExtensionState } from "../interfaces/state";
import { StateManager } from "./stateManager";
import { ConfigLoader } from "../utilities/configLoader";
import { TokenService } from "./tokenService";

export class MessageHandler {
  private state: ExtensionState;
  private stateManager: StateManager;

  constructor(
    private readonly webview: vscode.Webview,
    private readonly context: vscode.ExtensionContext,
  ) {
    this.stateManager = new StateManager(context);
    this.state = this.stateManager.loadState();

    // Initialize TokenService with existing tokens if available
    if (this.state.accessToken) {
      const refreshToken = ConfigLoader.getRefreshToken(); // Load refresh token from config
      TokenService.setTokens(this.state.accessToken, refreshToken || undefined);
    }

    this.sendToWebview({
      text: "",
      clickCount: this.state.clickCount,
      accessToken: this.state.accessToken || undefined,
      joinedSpaces: this.state.joinedSpaces,
      spaceMessages: this.state.spaceMessages,
      currentView: this.state.currentView,
      currentSpace: this.state.selectedSpace,
      isLoading: this.state.isLoading,
      messagesLoading: this.state.messagesLoading,
      error: this.state.error || undefined,
      messagesError: this.state.messagesError || undefined,
      configStatus: this.getConfigStatus(),
    });
  }

  async handleMessage(message: FromWebviewMessage): Promise<void> {
    switch (message.type) {
      case "letsGo":
        this.state.clickCount++;
        await this.stateManager.saveState(this.state);
        this.sendToWebview({
          text: "Yes sir!",
          clickCount: this.state.clickCount,
        });
        break;

      case "clear":
        await this.stateManager.resetState();
        this.state = this.stateManager.loadState();
        this.sendToWebview({
          text: "",
          clickCount: this.state.clickCount,
        });
        break;

      case "setAccessToken":
        this.state.accessToken = message.token;
        this.state.error = null;

        // Initialize TokenService with the new token
        TokenService.setTokens(message.token, message.refreshToken);

        await this.stateManager.saveState(this.state);
        this.sendToWebview({
          text: "Access token saved successfully!",
          accessToken: this.state.accessToken,
        });
        break;

      case "refreshAccessToken":
        try {
          console.log("Manual token refresh requested...");
          this.sendToWebview({
            text: "Refreshing access token...",
            isLoading: true,
          });

          const tokenResponse = await TokenService.refreshAccessToken();
          this.state.accessToken = tokenResponse.access_token;
          this.state.error = null;

          await this.stateManager.saveState(this.state);
          console.log("Manual token refresh successful");

          this.sendToWebview({
            text: "Access token refreshed successfully! You can now use the app normally.",
            accessToken: this.state.accessToken,
            isLoading: false,
          });
        } catch (error) {
          console.error("Manual token refresh failed:", error);
          this.state.error = `Failed to refresh token: ${error instanceof Error ? error.message : "Unknown error"}. Please check that your refresh token is valid in ~/.athena-config/.athena-config.json`;
          this.sendToWebview({
            text: "",
            error: this.state.error,
            isLoading: false,
          });
        }
        break;

      case "fetchJoinedSpaces":
        if (!this.state.accessToken) {
          this.state.error = "Access token required to fetch spaces";
          this.sendToWebview({
            text: "",
            error: this.state.error,
          });
          return;
        }

        this.state.isLoading = true;
        this.sendToWebview({
          text: "",
          isLoading: true,
        });

        try {
          // Use Node.js https module for API calls in VSCode extension
          // Initialize TokenService if not already done
          if (this.state.accessToken && !TokenService.getAccessToken()) {
            const refreshToken = ConfigLoader.getRefreshToken();
            TokenService.setTokens(
              this.state.accessToken,
              refreshToken || undefined,
            );
          }

          const spaceId = "AAAACtu6B6Q"; // Replace with actual space ID or parameterize as needed
          const apiUrl = `https://chat.googleapis.com/v1/spaces/${spaceId}`;

          const data = await this.makeAuthenticatedApiCall(apiUrl);
          console.log("data", data);
          // Transform Google Chat API response for single space to our ChatSpace format
          const singleSpace = {
            id: data.name, // Google Chat uses resource names as IDs (e.g., 'spaces/AJSDKSHDS')
            name:
              data.displayName || data.name?.split("/")[1] || "Unnamed Space",
            displayName: data.displayName,
            description:
              data.spaceDetails?.description ||
              `${data.spaceType?.toLowerCase().replace("_", " ")} - ${data.spaceThreadingState?.toLowerCase().replace("_", " ")}`,
            type: "joined" as const,
            memberCount: data.memberCount || undefined,
            lastActivity: data.lastActiveTime
              ? new Date(data.lastActiveTime)
              : undefined,
          };

          const fetchedSpaces = [singleSpace]; // Wrap single space in array for consistency

          this.state.joinedSpaces = fetchedSpaces;
          this.state.isLoading = false;
          this.state.error = null;

          console.log(
            "About to send spaces to webview:",
            this.state.joinedSpaces,
          );

          await this.stateManager.saveState(this.state);
          this.sendToWebview({
            text: `Successfully loaded ${this.state.joinedSpaces.length} space(s)`,
            joinedSpaces: this.state.joinedSpaces,
            isLoading: false,
            error: undefined,
          });
        } catch (error) {
          this.state.isLoading = false;
          this.state.error = `Failed to fetch spaces: ${error instanceof Error ? error.message : String(error)}`;
          this.sendToWebview({
            text: "",
            isLoading: false,
            error: this.state.error,
          });
        }
        break;

      case "searchSpaces":
        this.state.searchQuery = message.query;
        await this.stateManager.saveState(this.state);
        // Search functionality will be handled in the UI
        break;

      case "selectSpace":
        const selectedSpace = this.state.joinedSpaces.find(
          (space) => space.id === message.spaceId,
        );
        if (selectedSpace) {
          this.state.selectedSpace = selectedSpace;
          this.state.currentView = "chat";
          await this.stateManager.saveState(this.state);

          // Send view change and trigger message fetch
          this.sendToWebview({
            text: `Opened space: ${selectedSpace.name}`,
            currentView: "chat",
            currentSpace: selectedSpace,
          });

          // Automatically fetch messages for the selected space
          await this.fetchSpaceMessages(selectedSpace.id);
        }
        break;

      case "fetchSpaceMessages":
        await this.fetchSpaceMessages(message.spaceId);
        break;

      case "backToMainView":
        this.state.currentView = "main";
        this.state.spaceMessages = [];
        this.state.messagesError = null;
        this.sendToWebview({
          text: "Returned to main view",
          currentView: "main",
          spaceMessages: [],
          messagesError: undefined,
        });
        break;

      case "refreshSpaceMessages":
        if (this.state.selectedSpace) {
          await this.fetchSpaceMessages(this.state.selectedSpace.id);
        }
        break;

      case "sendMessage":
        await this.sendMessage(message.spaceId, message.text);
        break;
    }
  }

  private async fetchSpaceMessages(spaceId: string): Promise<void> {
    if (!this.state.accessToken) {
      this.state.messagesError = "Access token required to fetch messages";
      this.sendToWebview({
        text: "",
        messagesError: this.state.messagesError,
      });
      return;
    }

    this.state.messagesLoading = true;
    this.state.messagesError = null;
    this.sendToWebview({
      text: "",
      messagesLoading: true,
      messagesError: undefined,
    });

    try {
      // Initialize TokenService if not already done
      if (this.state.accessToken && !TokenService.getAccessToken()) {
        const refreshToken = ConfigLoader.getRefreshToken();
        TokenService.setTokens(
          this.state.accessToken,
          refreshToken || undefined,
        );
      }

      // Google Chat Messages API endpoint
      const apiUrl = `https://chat.googleapis.com/v1/${spaceId}/messages?pageSize=15&orderBy=createTime desc`;

      const data = await this.makeAuthenticatedApiCall(apiUrl);

      // Transform Google Chat API messages to our ChatMessage format
      const messages = (data.messages || [])
        .map((msg: any) => ({
          name: msg.name,
          sender: {
            name: msg.sender?.name || "unknown",
            displayName:
              msg.sender?.displayName || msg.sender?.name || "Unknown User",
            avatarUrl: msg.sender?.avatarUrl,
            type: msg.sender?.type || "HUMAN",
          },
          text: msg.text,
          createTime: msg.createTime,
          attachments: msg.attachments || [],
          space: {
            name: msg.space?.name || spaceId,
            displayName: msg.space?.displayName,
          },
        }))
        .reverse(); // Reverse to show oldest first (chat order)

      this.state.spaceMessages = messages;
      this.state.messagesLoading = false;
      this.state.messagesError = null;

      await this.stateManager.saveState(this.state);
      this.sendToWebview({
        text: `Loaded ${messages.length} messages`,
        spaceMessages: this.state.spaceMessages,
        messagesLoading: false,
        messagesError: undefined,
      });
    } catch (error) {
      this.state.messagesLoading = false;
      this.state.messagesError = `Failed to fetch messages: ${error instanceof Error ? error.message : String(error)}`;
      this.sendToWebview({
        text: "",
        messagesLoading: false,
        messagesError: this.state.messagesError,
      });
    }
  }

  private async sendMessage(spaceId: string, text: string): Promise<void> {
    if (!this.state.accessToken) {
      this.state.messagesError = "Access token required to send messages";
      this.sendToWebview({
        text: "",
        messagesError: this.state.messagesError,
      });
      return;
    }

    try {
      // Initialize TokenService if not already done
      if (this.state.accessToken && !TokenService.getAccessToken()) {
        const refreshToken = ConfigLoader.getRefreshToken();
        TokenService.setTokens(
          this.state.accessToken,
          refreshToken || undefined,
        );
      }

      // Google Chat Create Message API endpoint
      const apiUrl = `https://chat.googleapis.com/v1/${spaceId}/messages`;

      const messageData = JSON.stringify({
        text: text,
      });

      const data = await this.makeAuthenticatedApiCall(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(messageData),
        },
        body: messageData,
      });

      // Message sent successfully, refresh the messages to show the new message
      this.sendToWebview({
        text: "Message sent successfully!",
      });

      // Refresh messages to show the newly sent message
      if (this.state.selectedSpace) {
        await this.fetchSpaceMessages(this.state.selectedSpace.id);
      }
    } catch (error) {
      this.state.messagesError = `Failed to send message: ${error instanceof Error ? error.message : String(error)}`;
      this.sendToWebview({
        text: "",
        messagesError: this.state.messagesError,
      });
    }
  }

  private getConfigStatus() {
    const configStatus = ConfigLoader.checkConfigStatus();
    const hasConfigFile = configStatus.configFileExists;
    const configToken = ConfigLoader.getAccessToken();
    const storedToken = this.state.accessToken;

    let tokenSource: "config" | "manual" | "none";
    if (configToken) {
      tokenSource = "config";
    } else if (storedToken) {
      tokenSource = "manual";
    } else {
      tokenSource = "none";
    }

    return {
      hasConfigFile,
      tokenSource,
      configPath: hasConfigFile ? configStatus.configPath : undefined,
      setupInstructions: hasConfigFile
        ? undefined
        : ConfigLoader.getSetupInstructions(),
    };
  }

  /**
   * Make an authenticated API call with automatic token refresh
   */
  private async makeAuthenticatedApiCall(
    url: string,
    options: any = {},
  ): Promise<any> {
    const https = require("https");
    const urlModule = require("url");

    try {
      // Try to get a valid access token (will refresh if needed)
      const accessToken = await TokenService.getValidAccessToken();

      const urlParts = urlModule.parse(url);
      const requestOptions = {
        hostname: urlParts.hostname,
        port: urlParts.port || 443,
        path: urlParts.path,
        method: options.method || "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "User-Agent": "VSCode-Extension/1.0",
          ...options.headers,
        },
      };

      const apiResponse = await new Promise<any>((resolve, reject) => {
        const req = https.request(requestOptions, (res: any) => {
          let responseData = "";

          res.on("data", (chunk: any) => {
            responseData += chunk;
          });

          res.on("end", () => {
            try {
              if (res.statusCode === 401) {
                // Token expired, try to refresh
                reject(new Error("TOKEN_EXPIRED"));
              } else if (res.statusCode >= 200 && res.statusCode < 300) {
                const jsonData = responseData ? JSON.parse(responseData) : {};
                resolve(jsonData);
              } else {
                reject(
                  new Error(
                    `HTTP ${res.statusCode}: ${res.statusMessage} - ${responseData}`,
                  ),
                );
              }
            } catch (parseError) {
              reject(new Error(`Failed to parse response: ${parseError}`));
            }
          });
        });

        req.on("error", (error: any) => {
          reject(error);
        });

        if (options.body) {
          req.write(options.body);
        }
        req.end();
      });

      return apiResponse;
    } catch (error) {
      if (error instanceof Error && error.message === "TOKEN_EXPIRED") {
        console.log("Token expired, attempting to refresh...");
        try {
          // Try to refresh the token and retry the request
          const tokenResponse = await TokenService.refreshAccessToken();
          this.state.accessToken = TokenService.getAccessToken();
          await this.stateManager.saveState(this.state);
          console.log("Token refreshed successfully, retrying API call...");

          // Retry the request with the new token
          return this.makeAuthenticatedApiCall(url, options);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          throw new Error(
            `Token refresh failed: ${refreshError instanceof Error ? refreshError.message : "Unknown error"}. Please try manually refreshing your token or check your refresh token in the config file.`,
          );
        }
      }
      throw error;
    }
  }

  private sendToWebview(message: ToWebviewMessage): void {
    this.webview.postMessage(message);
  }
}
