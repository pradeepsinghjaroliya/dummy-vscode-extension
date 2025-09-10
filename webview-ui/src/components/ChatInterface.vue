<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { FromWebviewMessage, ToWebviewMessage, ChatSpace, ChatMessage } from '../../../src/interfaces/messages';
import TokenInput from './TokenInput.vue';
import SearchBar from './SearchBar.vue';
import SupportGroupsList from './SupportGroupsList.vue';
import JoinedSpacesList from './JoinedSpacesList.vue';
import ChatView from './ChatView.vue';

const vscode = acquireVsCodeApi();

// Reactive state
const accessToken = ref<string>('');
const joinedSpaces = ref<ChatSpace[]>([]);
const spaceMessages = ref<ChatMessage[]>([]);
const currentView = ref<'main' | 'chat'>('main');
const currentSpace = ref<ChatSpace | null>(null);
const searchQuery = ref<string>('');
const isLoading = ref<boolean>(false);
const messagesLoading = ref<boolean>(false);
const error = ref<string>('');
const messagesError = ref<string>('');
const activeTab = ref<'available' | 'joined'>('available');
const isSignedIn = computed(() => !!accessToken.value);

// Handle messages from extension
window.addEventListener('message', (event: MessageEvent<ToWebviewMessage>) => {
  if (event.data.accessToken !== undefined) {
    accessToken.value = event.data.accessToken || '';
  }
  if (event.data.joinedSpaces !== undefined) {
    joinedSpaces.value = [...event.data.joinedSpaces]; // Force reactivity with spread operator
  }
  if (event.data.spaceMessages !== undefined) {
    spaceMessages.value = [...event.data.spaceMessages];
  }
  if (event.data.currentView !== undefined) {
    currentView.value = event.data.currentView;
  }
  if (event.data.currentSpace !== undefined) {
    currentSpace.value = event.data.currentSpace;
  }
  if (event.data.isLoading !== undefined) {
    isLoading.value = event.data.isLoading;
  }
  if (event.data.messagesLoading !== undefined) {
    messagesLoading.value = event.data.messagesLoading;
  }
  if (event.data.error !== undefined) {
    error.value = event.data.error || '';
  }
  if (event.data.messagesError !== undefined) {
    messagesError.value = event.data.messagesError || '';
  }
});

// Handle token submission
function handleTokenSubmit(token: string) {
  const message: FromWebviewMessage = {
    type: 'setAccessToken',
    token: token
  };
  vscode.postMessage(message);
  
  // Fetch spaces after setting token
  if (token) {
    fetchJoinedSpaces();
  }
}

// Handle search
function handleSearch(query: string) {
  searchQuery.value = query;
  const message: FromWebviewMessage = {
    type: 'searchSpaces',
    query: query
  };
  vscode.postMessage(message);
}

// Fetch joined spaces
function fetchJoinedSpaces() {
  const message: FromWebviewMessage = {
    type: 'fetchJoinedSpaces'
  };
  vscode.postMessage(message);
}

// Handle space selection
function handleSpaceSelect(spaceId: string) {
  const message: FromWebviewMessage = {
    type: 'selectSpace',
    spaceId: spaceId
  };
  vscode.postMessage(message);
}

// Refresh joined spaces
function refreshSpaces() {
  if (isSignedIn.value) {
    fetchJoinedSpaces();
  }
}

// Chat view handlers
function handleBackToMain() {
  const message: FromWebviewMessage = {
    type: 'backToMainView'
  };
  vscode.postMessage(message);
}

function handleRefreshMessages() {
  const message: FromWebviewMessage = {
    type: 'refreshSpaceMessages'
  };
  vscode.postMessage(message);
}

function handleSendMessage(text: string) {
  if (currentSpace.value) {
    const message: FromWebviewMessage = {
      type: 'sendMessage',
      spaceId: currentSpace.value.id,
      text: text
    };
    vscode.postMessage(message);
  }
}

onMounted(() => {
  // Component mounted, initial state should be loaded from extension
});
</script>

<template>
  <div class="chat-interface">
    <!-- Main Interface View -->
    <div v-if="currentView === 'main'" class="main-view">
      <!-- Header Section -->
      <header class="header">
        <div class="header-top">
          <h1 class="title">Developer Support Chat</h1>
          <TokenInput 
            :is-signed-in="isSignedIn"
            @submit-token="handleTokenSubmit"
          />
        </div>
        <SearchBar 
          :search-query="searchQuery"
          @search="handleSearch"
        />
      </header>

      <!-- Tab Navigation -->
      <nav class="tab-navigation">
        <button 
          @click="activeTab = 'available'"
          :class="['tab-button', { active: activeTab === 'available' }]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0L10.24 2.24L13.76 2.24L13.76 5.76L16 8L13.76 10.24L13.76 13.76L10.24 13.76L8 16L5.76 13.76L2.24 13.76L2.24 10.24L0 8L2.24 5.76L2.24 2.24L5.76 2.24L8 0Z"/>
          </svg>
          Available Spaces
          <span class="tab-count">5</span>
        </button>
        <button 
          @click="activeTab = 'joined'"
          :class="['tab-button', { active: activeTab === 'joined' }]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1ZM8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/>
          </svg>
          Joined Spaces
          <span class="tab-count">{{ joinedSpaces.length }}</span>
        </button>
        
        <!-- Refresh button for joined spaces -->
        <button 
          v-if="activeTab === 'joined' && isSignedIn" 
          @click="refreshSpaces"
          class="refresh-button"
          :disabled="isLoading"
          title="Refresh joined spaces"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"/>
          </svg>
          {{ isLoading ? 'Loading...' : 'Refresh' }}
        </button>
      </nav>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Available Spaces (Support Groups) -->
        <section v-if="activeTab === 'available'" class="spaces-section">
          <div class="section-header">
            <h2 class="section-title">Programming Support Groups</h2>
            <p class="section-description">Connect with developer communities for different programming languages and technologies.</p>
          </div>
          <SupportGroupsList 
            :search-query="searchQuery"
            @select-group="handleSpaceSelect"
          />
        </section>

        <!-- Joined Spaces -->
        <section v-else-if="activeTab === 'joined'" class="spaces-section">
          <div class="section-header">
            <h2 class="section-title">Your Joined Spaces</h2>
            <p class="section-description">Google Chat spaces you have access to. Sign in with your access token to view and interact with your spaces.</p>
          </div>
          <JoinedSpacesList 
            :spaces="joinedSpaces"
            :is-loading="isLoading"
            :error="error"
            :is-signed-in="isSignedIn"
            @select-space="handleSpaceSelect"
          />
        </section>
      </main>
    </div>

    <!-- Chat View -->
    <ChatView
      v-else-if="currentView === 'chat'"
      :space="currentSpace"
      :messages="spaceMessages"
      :is-loading="messagesLoading"
      :error="messagesError"
      @back-to-main="handleBackToMain"
      @refresh-messages="handleRefreshMessages"
      @send-message="handleSendMessage"
    />
  </div>
</template>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100vh;
  color: var(--vscode-foreground);
  font-family: var(--vscode-font-family);
  background-color: var(--vscode-editor-background);
}

.main-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--vscode-panel-border);
  background-color: var(--vscode-sideBar-background);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--vscode-foreground);
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 20px;
  background-color: var(--vscode-sideBar-background);
  border-bottom: 1px solid var(--vscode-panel-border);
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: transparent;
  color: var(--vscode-tab-inactiveForeground);
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  position: relative;
}

.tab-button:hover {
  color: var(--vscode-tab-activeForeground);
  background-color: var(--vscode-tab-hoverBackground);
}

.tab-button.active {
  color: var(--vscode-tab-activeForeground);
  border-bottom-color: var(--vscode-textLink-foreground);
  background-color: var(--vscode-tab-activeBackground);
}

.tab-count {
  background-color: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  min-width: 16px;
  text-align: center;
}

.tab-button.active .tab-count {
  background-color: var(--vscode-textLink-foreground);
  color: var(--vscode-tab-activeBackground);
}

.refresh-button {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.refresh-button:hover:not(:disabled) {
  background-color: var(--vscode-button-hoverBackground);
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Main Content */
.main-content {
  flex: 1;
  overflow: hidden;
  background-color: var(--vscode-editor-background);
}

.spaces-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.section-header {
  margin-bottom: 20px;
  flex-shrink: 0;
}

.spaces-section :deep(.support-groups-list),
.spaces-section :deep(.joined-spaces-list) {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.section-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--vscode-foreground);
}

.section-description {
  margin: 0;
  color: var(--vscode-descriptionForeground);
  font-size: 14px;
  line-height: 1.4;
}

/* Responsive design */
@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .header-top {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
}
</style>
