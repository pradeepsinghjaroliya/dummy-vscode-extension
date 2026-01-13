import { ChatSpace, ChatMessage } from './messages';

/**
 * Interface representing the extension's global state
 */
export interface ExtensionState {
  clickCount: number;
  accessToken: string | null;
  joinedSpaces: ChatSpace[];
  searchQuery: string;
  selectedSpace: ChatSpace | null;
  spaceMessages: ChatMessage[];
  currentView: 'main' | 'chat';
  isLoading: boolean;
  messagesLoading: boolean;
  error: string | null;
  messagesError: string | null;
}

/**
 * Default state values
 */
export const DEFAULT_STATE: ExtensionState = {
  clickCount: 0,
  accessToken: null,
  joinedSpaces: [],
  searchQuery: '',
  selectedSpace: null,
  spaceMessages: [],
  currentView: 'main',
  isLoading: false,
  messagesLoading: false,
  error: null,
  messagesError: null
};
