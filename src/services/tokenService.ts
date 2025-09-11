import { TokenResponse, AuthResponse } from "../interfaces/messages";
import { ConfigLoader } from "../utilities/configLoader";

export class TokenService {
  private static refreshToken: string | null = null;
  private static accessToken: string | null = null;
  private static tokenExpiryTime: number | null = null;

  /**
   * Set the current tokens
   */
  static setTokens(
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number,
  ) {
    this.accessToken = accessToken;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
    if (expiresIn) {
      this.tokenExpiryTime = Date.now() + expiresIn * 1000;
    }
  }

  /**
   * Get the current access token
   */
  static getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Get the current refresh token
   */
  static getRefreshToken(): string | null {
    return this.refreshToken;
  }

  /**
   * Check if the current token is expired or about to expire (within 5 minutes)
   */
  static isTokenExpired(): boolean {
    if (!this.tokenExpiryTime) {
      return false; // No expiry time set, assume token is valid
    }
    const fiveMinutesInMs = 5 * 60 * 1000;
    return Date.now() >= this.tokenExpiryTime - fiveMinutesInMs;
  }

  /**
   * Get new auth credentials from the API
   */
  static async getNewAuthCredentials(): Promise<AuthResponse> {
    const https = require("https");
    const url = require("url");

    try {
      const apiUrl =
        "https://athena.webmdhelios.com/tools/asterix/auth?input=athena-cline";
      const urlParts = url.parse(apiUrl);

      const requestOptions = {
        hostname: urlParts.hostname,
        port: urlParts.port || 443,
        path: urlParts.path,
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "VSCode-Extension/1.0",
        },
      };

      return new Promise<AuthResponse>((resolve, reject) => {
        const req = https.request(requestOptions, (res: any) => {
          let responseData = "";

          res.on("data", (chunk: any) => {
            responseData += chunk;
          });

          res.on("end", () => {
            try {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                const jsonData = JSON.parse(responseData) as AuthResponse;
                resolve(jsonData);
              } else {
                reject(
                  new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`),
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

        req.end();
      });
    } catch (error) {
      throw new Error(
        `Failed to get auth credentials: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  static async refreshAccessToken(): Promise<TokenResponse> {
    // Try to get refresh token from memory or config file
    let refreshToken = this.refreshToken;
    if (!refreshToken) {
      refreshToken = ConfigLoader.getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token available in memory or config file");
      }
      this.refreshToken = refreshToken;
    }

    try {
      // First get client credentials from Athena API
      const { client_id, client_secret } = await this.getNewAuthCredentials();
      console.log(
        "Got client credentials from Athena API - client_id:",
        client_id,
      );

      const https = require("https");
      const querystring = require("querystring");

      console.log("Refreshing access token with refresh token:", refreshToken);

      const postData = querystring.stringify({
        client_id: client_id,
        client_secret: client_secret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      });

      const requestOptions = {
        hostname: "www.googleapis.com",
        port: 443,
        path: "/oauth2/v4/token",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(postData),
          "User-Agent": "VSCode-Extension/1.0",
        },
      };

      const tokenResponse = await new Promise<TokenResponse>(
        (resolve, reject) => {
          const req = https.request(requestOptions, (res: any) => {
            let responseData = "";

            res.on("data", (chunk: any) => {
              responseData += chunk;
            });

            res.on("end", () => {
              try {
                console.log("OAuth2 response status:", res.statusCode);
                // console.log("OAuth2 response data:", responseData);

                if (res.statusCode >= 200 && res.statusCode < 300) {
                  const jsonData = JSON.parse(responseData) as TokenResponse;
                  console.log("Token refresh successful:", jsonData);
                  resolve(jsonData);
                } else {
                  console.error("OAuth2 error response:", responseData);
                  reject(
                    new Error(
                      `HTTP ${res.statusCode}: ${res.statusMessage} - ${responseData}`,
                    ),
                  );
                }
              } catch (parseError) {
                console.error(
                  "Failed to parse OAuth2 response:",
                  parseError,
                  "Raw data:",
                  responseData,
                );
                reject(new Error(`Failed to parse response: ${parseError}`));
              }
            });
          });

          req.on("error", (error: any) => {
            reject(error);
          });

          req.write(postData);
          req.end();
        },
      );

      // Update stored tokens
      this.setTokens(
        tokenResponse.access_token,
        tokenResponse.refresh_token || this.refreshToken || undefined, // Keep existing refresh token if none provided
        tokenResponse.expires_in,
      );

      return tokenResponse;
    } catch (error) {
      throw new Error(
        `Failed to refresh token: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  static async getValidAccessToken(): Promise<string> {
    if (!this.accessToken) {
      throw new Error("No access token available");
    }

    if (this.isTokenExpired() && this.refreshToken) {
      try {
        await this.refreshAccessToken();
        return this.accessToken!;
      } catch (error) {
        throw new Error(
          `Token refresh failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    return this.accessToken;
  }

  /**
   * Clear all stored tokens
   */
  static clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiryTime = null;
  }
}
