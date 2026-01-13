import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface AthenaConfig {
  "access-token"?: string;
  "refresh-token"?: string;
  [key: string]: any; // Allow for other config properties
}

export class ConfigLoader {
  private static readonly CONFIG_DIR = ".athena-config";
  private static readonly CONFIG_FILE = "athena-config.json";

  private static getConfigPath(): string {
    return path.join(os.homedir(), this.CONFIG_DIR, this.CONFIG_FILE);
  }

  /**
   * Load the Athena configuration from the user's home directory
   * @returns AthenaConfig object or null if file doesn't exist or is invalid
   */
  public static loadConfig(): AthenaConfig | null {
    try {
      const configPath = this.getConfigPath();

      // Check if file exists
      if (!fs.existsSync(configPath)) {
        console.log(`Config file not found at: ${configPath}`);
        return null;
      }

      // Read and parse the JSON file
      const configContent = fs.readFileSync(configPath, "utf8");
      const config: AthenaConfig = JSON.parse(configContent);

      console.log(`Successfully loaded config from: ${configPath}`);
      return config;
    } catch (error) {
      console.error("Failed to load config file:", error);
      return null;
    }
  }

  /**
   * Get the access token from the config file
   * @returns The access token string or null if not found/invalid
   */
  public static getAccessToken(): string | null {
    const config = this.loadConfig();

    if (
      !config ||
      !config["access-token"] ||
      typeof config["access-token"] !== "string"
    ) {
      return null;
    }

    // Basic validation - check if token is not empty
    const token = config["access-token"].trim();
    if (token.length === 0) {
      console.warn("Access token found in config but is empty");
      return null;
    }

    console.log("Access token successfully loaded from config file");
    return token;
  }

  /**
   * Get the refresh token from the config file
   * @returns The refresh token string or null if not found/invalid
   */
  public static getRefreshToken(): string | null {
    const config = this.loadConfig();

    if (
      !config ||
      !config["refresh-token"] ||
      typeof config["refresh-token"] !== "string"
    ) {
      return null;
    }

    // Basic validation - check if token is not empty
    const token = config["refresh-token"].trim();
    if (token.length === 0) {
      console.warn("Refresh token found in config but is empty");
      return null;
    }

    console.log("Refresh token successfully loaded from config file");
    return token;
  }

  /**
   * Check if the config directory and file exist
   * @returns Object with existence status and path information
   */
  public static checkConfigStatus(): {
    configDirExists: boolean;
    configFileExists: boolean;
    configPath: string;
    configDir: string;
  } {
    const configPath = this.getConfigPath();
    const configDir = path.dirname(configPath);

    return {
      configDirExists: fs.existsSync(configDir),
      configFileExists: fs.existsSync(configPath),
      configPath,
      configDir,
    };
  }

  /**
   * Get instructions for setting up the config file
   * @returns Setup instructions as a string
   */
  public static getSetupInstructions(): string {
    const status = this.checkConfigStatus();

    const instructions = [
      "To set up automatic token loading, create the following:",
      "",
      `1. Create directory: ${status.configDir}`,
      `2. Create file: ${status.configPath}`,
      "3. Add the following content to the file:",
      "",
      "{",
      '  "access-token": "your_google_chat_api_token_here",',
      '  "refresh-token": "your_refresh_token_here"',
      "}",
      "",
      'Replace "your_google_chat_api_token_here" with your actual Google Chat API access token.',
      'Replace "your_refresh_token_here" with your actual refresh token.',
    ];

    return instructions.join("\n");
  }
}
