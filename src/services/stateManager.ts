import * as vscode from 'vscode';
import { ExtensionState, DEFAULT_STATE } from '../interfaces/state';

export class StateManager {
  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * Load state from storage
   */
  loadState(): ExtensionState {
    return {
      clickCount: this.context.globalState.get<number>('clickCount', DEFAULT_STATE.clickCount),
      accessToken: this.context.globalState.get<string | null>('accessToken', DEFAULT_STATE.accessToken),
      joinedSpaces: this.context.globalState.get('joinedSpaces', DEFAULT_STATE.joinedSpaces),
      searchQuery: this.context.globalState.get<string>('searchQuery', DEFAULT_STATE.searchQuery),
      selectedSpace: this.context.globalState.get('selectedSpace', DEFAULT_STATE.selectedSpace),
      spaceMessages: DEFAULT_STATE.spaceMessages, // Runtime state, not persisted
      currentView: DEFAULT_STATE.currentView, // Runtime state, not persisted
      isLoading: DEFAULT_STATE.isLoading, // Runtime state, not persisted
      messagesLoading: DEFAULT_STATE.messagesLoading, // Runtime state, not persisted
      error: DEFAULT_STATE.error, // Runtime state, not persisted
      messagesError: DEFAULT_STATE.messagesError // Runtime state, not persisted
    };
  }

  /**
   * Save state to storage
   */
  async saveState(state: ExtensionState): Promise<void> {
    await Promise.all([
      this.context.globalState.update('clickCount', state.clickCount),
      this.context.globalState.update('accessToken', state.accessToken),
      this.context.globalState.update('joinedSpaces', state.joinedSpaces),
      this.context.globalState.update('searchQuery', state.searchQuery),
      this.context.globalState.update('selectedSpace', state.selectedSpace)
    ]);
  }

  /**
   * Reset state to defaults
   */
  async resetState(): Promise<void> {
    await this.saveState(DEFAULT_STATE);
  }
}
