import * as vscode from 'vscode';
import { FromWebviewMessage, ToWebviewMessage } from '../interfaces/messages';
import { ExtensionState } from '../interfaces/state';
import { StateManager } from './stateManager';
import { ConfigLoader } from '../utilities/configLoader';

export class MessageHandler {
  private state: ExtensionState;
  private stateManager: StateManager;

  constructor(
    private readonly webview: vscode.Webview,
    private readonly context: vscode.ExtensionContext
  ) {
    this.stateManager = new StateManager(context);
    this.state = this.stateManager.loadState();
    this.sendToWebview({ 
      text: '', 
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
      configStatus: this.getConfigStatus()
    });
  }

  async handleMessage(message: FromWebviewMessage): Promise<void> {
    switch (message.type) {
      case 'letsGo':
        this.state.clickCount++;
        await this.stateManager.saveState(this.state);
        this.sendToWebview({
          text: 'Yes sir!',
          clickCount: this.state.clickCount
        });
        break;

      case 'clear':
        await this.stateManager.resetState();
        this.state = this.stateManager.loadState();
        this.sendToWebview({
          text: '',
          clickCount: this.state.clickCount
        });
        break;

      case 'setAccessToken':
        this.state.accessToken = message.token;
        this.state.error = null;
        await this.stateManager.saveState(this.state);
        this.sendToWebview({
          text: 'Access token saved successfully!',
          accessToken: this.state.accessToken
        });
        break;

      case 'fetchJoinedSpaces':
        if (!this.state.accessToken) {
          this.state.error = 'Access token required to fetch spaces';
          this.sendToWebview({
            text: '',
            error: this.state.error
          });
          return;
        }

        this.state.isLoading = true;
        this.sendToWebview({
          text: '',
          isLoading: true
        });

        try {
          // Use Node.js https module for API calls in VSCode extension
          const https = require('https');
          const url = require('url');
          const spaceId = 'AAAACtu6B6Q'; // Replace with actual space ID or parameterize as needed
          const apiUrl = `https://chat.googleapis.com/v1/spaces/${spaceId}`;
          const urlParts = url.parse(apiUrl);
          
          const requestOptions = {
            hostname: urlParts.hostname,
            port: urlParts.port || 443,
            path: urlParts.path,
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.state.accessToken}`,
              'Accept': 'application/json',
              'User-Agent': 'VSCode-Extension/1.0'
            }
          };

          const data = await new Promise<any>((resolve, reject) => {
            const req = https.request(requestOptions, (res: any) => {
              let responseData = '';
              
              res.on('data', (chunk: any) => {
                responseData += chunk;
              });
              
              res.on('end', () => {
                try {
                  if (res.statusCode >= 200 && res.statusCode < 300) {
                    const jsonData = JSON.parse(responseData);
                    console.log("jsondata", jsonData);
                    resolve(jsonData);
                  } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                  }
                } catch (parseError) {
                  reject(new Error(`Failed to parse response: ${parseError}`));
                }
              });
            });

            req.on('error', (error: any) => {
              reject(error);
            });

            req.end();
          });
          console.log("data", data);
          // Transform Google Chat API response for single space to our ChatSpace format
          const singleSpace = {
            id: data.name, // Google Chat uses resource names as IDs (e.g., 'spaces/AJSDKSHDS')
            name: data.displayName || data.name?.split('/')[1] || 'Unnamed Space',
            displayName: data.displayName,
            description: data.spaceDetails?.description || `${data.spaceType?.toLowerCase().replace('_', ' ')} - ${data.spaceThreadingState?.toLowerCase().replace('_', ' ')}`,
            type: 'joined' as const,
            memberCount: data.memberCount || undefined,
            lastActivity: data.lastActiveTime ? new Date(data.lastActiveTime) : undefined
          };
          
          const fetchedSpaces = [singleSpace]; // Wrap single space in array for consistency

          this.state.joinedSpaces = fetchedSpaces;
          this.state.isLoading = false;
          this.state.error = null;
          
          console.log("About to send spaces to webview:", this.state.joinedSpaces);
          
          await this.stateManager.saveState(this.state);
          this.sendToWebview({
            text: `Successfully loaded ${this.state.joinedSpaces.length} space(s)`,
            joinedSpaces: this.state.joinedSpaces,
            isLoading: false,
            error: undefined
          });
        } catch (error) {
          this.state.isLoading = false;
          this.state.error = `Failed to fetch spaces: ${error instanceof Error ? error.message : String(error)}`;
          this.sendToWebview({
            text: '',
            isLoading: false,
            error: this.state.error
          });
        }
        break;

      case 'searchSpaces':
        this.state.searchQuery = message.query;
        await this.stateManager.saveState(this.state);
        // Search functionality will be handled in the UI
        break;

      case 'selectSpace':
        const selectedSpace = this.state.joinedSpaces.find(space => space.id === message.spaceId);
        if (selectedSpace) {
          this.state.selectedSpace = selectedSpace;
          this.state.currentView = 'chat';
          await this.stateManager.saveState(this.state);
          
          // Send view change and trigger message fetch
          this.sendToWebview({
            text: `Opened space: ${selectedSpace.name}`,
            currentView: 'chat',
            currentSpace: selectedSpace
          });
          
          // Automatically fetch messages for the selected space
          await this.fetchSpaceMessages(selectedSpace.id);
        }
        break;

      case 'fetchSpaceMessages':
        await this.fetchSpaceMessages(message.spaceId);
        break;

      case 'backToMainView':
        this.state.currentView = 'main';
        this.state.spaceMessages = [];
        this.state.messagesError = null;
        this.sendToWebview({
          text: 'Returned to main view',
          currentView: 'main',
          spaceMessages: [],
          messagesError: undefined
        });
        break;

      case 'refreshSpaceMessages':
        if (this.state.selectedSpace) {
          await this.fetchSpaceMessages(this.state.selectedSpace.id);
        }
        break;

      case 'sendMessage':
        await this.sendMessage(message.spaceId, message.text);
        break;
    }
  }

  private async fetchSpaceMessages(spaceId: string): Promise<void> {
    if (!this.state.accessToken) {
      this.state.messagesError = 'Access token required to fetch messages';
      this.sendToWebview({
        text: '',
        messagesError: this.state.messagesError
      });
      return;
    }

    this.state.messagesLoading = true;
    this.state.messagesError = null;
    this.sendToWebview({
      text: '',
      messagesLoading: true,
      messagesError: undefined
    });

    try {
      const https = require('https');
      const url = require('url');
      
      // Google Chat Messages API endpoint
      const apiUrl = `https://chat.googleapis.com/v1/${spaceId}/messages?pageSize=15&orderBy=createTime desc`;
      const urlParts = url.parse(apiUrl);
      
      const requestOptions = {
        hostname: urlParts.hostname,
        port: urlParts.port || 443,
        path: urlParts.path,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.state.accessToken}`,
          'Accept': 'application/json',
          'User-Agent': 'VSCode-Extension/1.0'
        }
      };

      const data = await new Promise<any>((resolve, reject) => {
        const req = https.request(requestOptions, (res: any) => {
          let responseData = '';
          
          res.on('data', (chunk: any) => {
            responseData += chunk;
          });
          
          res.on('end', () => {
            try {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                const jsonData = JSON.parse(responseData);
                resolve(jsonData);
              } else {
                reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
              }
            } catch (parseError) {
              reject(new Error(`Failed to parse response: ${parseError}`));
            }
          });
        });

        req.on('error', (error: any) => {
          reject(error);
        });

        req.end();
      });

      // Transform Google Chat API messages to our ChatMessage format
      const messages = (data.messages || []).map((msg: any) => ({
        name: msg.name,
        sender: {
          name: msg.sender?.name || 'unknown',
          displayName: msg.sender?.displayName || msg.sender?.name || 'Unknown User',
          avatarUrl: msg.sender?.avatarUrl,
          type: msg.sender?.type || 'HUMAN'
        },
        text: msg.text,
        createTime: msg.createTime,
        attachments: msg.attachments || [],
        space: {
          name: msg.space?.name || spaceId,
          displayName: msg.space?.displayName
        }
      })).reverse(); // Reverse to show oldest first (chat order)

      this.state.spaceMessages = messages;
      this.state.messagesLoading = false;
      this.state.messagesError = null;
      
      await this.stateManager.saveState(this.state);
      this.sendToWebview({
        text: `Loaded ${messages.length} messages`,
        spaceMessages: this.state.spaceMessages,
        messagesLoading: false,
        messagesError: undefined
      });
    } catch (error) {
      this.state.messagesLoading = false;
      this.state.messagesError = `Failed to fetch messages: ${error instanceof Error ? error.message : String(error)}`;
      this.sendToWebview({
        text: '',
        messagesLoading: false,
        messagesError: this.state.messagesError
      });
    }
  }

  private async sendMessage(spaceId: string, text: string): Promise<void> {
    if (!this.state.accessToken) {
      this.state.messagesError = 'Access token required to send messages';
      this.sendToWebview({
        text: '',
        messagesError: this.state.messagesError
      });
      return;
    }

    try {
      const https = require('https');
      const url = require('url');
      
      // Google Chat Create Message API endpoint
      const apiUrl = `https://chat.googleapis.com/v1/${spaceId}/messages`;
      const urlParts = url.parse(apiUrl);
      
      const messageData = JSON.stringify({
        text: text
      });
      
      const requestOptions = {
        hostname: urlParts.hostname,
        port: urlParts.port || 443,
        path: urlParts.path,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.state.accessToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(messageData),
          'User-Agent': 'VSCode-Extension/1.0'
        }
      };

      const data = await new Promise<any>((resolve, reject) => {
        const req = https.request(requestOptions, (res: any) => {
          let responseData = '';
          
          res.on('data', (chunk: any) => {
            responseData += chunk;
          });
          
          res.on('end', () => {
            try {
              if (res.statusCode >= 200 && res.statusCode < 300) {
                const jsonData = JSON.parse(responseData);
                resolve(jsonData);
              } else {
                reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage} - ${responseData}`));
              }
            } catch (parseError) {
              reject(new Error(`Failed to parse response: ${parseError}`));
            }
          });
        });

        req.on('error', (error: any) => {
          reject(error);
        });

        // Write the message data to the request
        req.write(messageData);
        req.end();
      });

      // Message sent successfully, refresh the messages to show the new message
      this.sendToWebview({
        text: 'Message sent successfully!'
      });
      
      // Refresh messages to show the newly sent message
      if (this.state.selectedSpace) {
        await this.fetchSpaceMessages(this.state.selectedSpace.id);
      }
      
    } catch (error) {
      this.state.messagesError = `Failed to send message: ${error instanceof Error ? error.message : String(error)}`;
      this.sendToWebview({
        text: '',
        messagesError: this.state.messagesError
      });
    }
  }

  private getConfigStatus() {
    const configStatus = ConfigLoader.checkConfigStatus();
    const hasConfigFile = configStatus.configFileExists;
    const configToken = ConfigLoader.getAccessToken();
    const storedToken = this.state.accessToken;
    
    let tokenSource: 'config' | 'manual' | 'none';
    if (configToken) {
      tokenSource = 'config';
    } else if (storedToken) {
      tokenSource = 'manual';
    } else {
      tokenSource = 'none';
    }

    return {
      hasConfigFile,
      tokenSource,
      configPath: hasConfigFile ? configStatus.configPath : undefined,
      setupInstructions: hasConfigFile ? undefined : ConfigLoader.getSetupInstructions()
    };
  }

  private sendToWebview(message: ToWebviewMessage): void {
    this.webview.postMessage(message);
  }
}
