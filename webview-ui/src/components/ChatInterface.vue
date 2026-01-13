<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type {
    FromWebviewMessage,
    ToWebviewMessage,
    ChatSpace,
    ChatMessage,
} from "../../../src/interfaces/messages";

import SearchBar from "./SearchBar.vue";
import SupportGroupsList from "./SupportGroupsList.vue";
import JoinedSpacesList from "./JoinedSpacesList.vue";
import ChatView from "./ChatView.vue";

const vscode = acquireVsCodeApi();

// Reactive state
const accessToken = ref<string>("");
const joinedSpaces = ref<ChatSpace[]>([]);
const spaceMessages = ref<ChatMessage[]>([]);
const currentView = ref<"main" | "chat">("main");
const currentSpace = ref<ChatSpace | null>(null);
const searchQuery = ref<string>("");
const isLoading = ref<boolean>(false);
const messagesLoading = ref<boolean>(false);
const error = ref<string>("");
const messagesError = ref<string>("");
const activeTab = ref<"available" | "joined">("available");
const configStatus = ref<
    | {
          hasConfigFile: boolean;
          tokenSource: "config" | "manual" | "none";
          configPath?: string;
          setupInstructions?: string;
      }
    | undefined
>(undefined);
const isSignedIn = computed(() => !!accessToken.value);

// Handle messages from extension
window.addEventListener("message", (event: MessageEvent<ToWebviewMessage>) => {
    if (event.data.accessToken !== undefined) {
        accessToken.value = event.data.accessToken || "";
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
        error.value = event.data.error || "";
    }
    if (event.data.messagesError !== undefined) {
        messagesError.value = event.data.messagesError || "";
    }
    if (event.data.configStatus !== undefined) {
        configStatus.value = event.data.configStatus;
    }
});

// Handle search
function handleSearch(query: string) {
    searchQuery.value = query;
    const message: FromWebviewMessage = {
        type: "searchSpaces",
        query: query,
    };
    vscode.postMessage(message);
}

// Handle space selection
function handleSpaceSelect(spaceId: string) {
    const message: FromWebviewMessage = {
        type: "selectSpace",
        spaceId: spaceId,
    };
    vscode.postMessage(message);
}

// Chat view handlers
function handleBackToMain() {
    const message: FromWebviewMessage = {
        type: "backToMainView",
    };
    vscode.postMessage(message);
}

function handleRefreshMessages() {
    const message: FromWebviewMessage = {
        type: "refreshSpaceMessages",
    };
    vscode.postMessage(message);
}

function handleSendMessage(text: string) {
    if (currentSpace.value) {
        const message: FromWebviewMessage = {
            type: "sendMessage",
            spaceId: currentSpace.value.id,
            text: text,
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
                    <h1 class="title">Asterix Support Groups</h1>
                    <button class="settings-button" title="Settings">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                        >
                            <path
                                d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34ZM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858Z"
                            />
                        </svg>
                    </button>
                </div>
                <div class="header-controls">
                    <SearchBar
                        :search-query="searchQuery"
                        @search="handleSearch"
                    />
                    <div class="toggle-container">
                        <span
                            class="toggle-label"
                            :class="{ active: activeTab === 'available' }"
                            >Available</span
                        >
                        <label class="ios-toggle">
                            <input
                                type="checkbox"
                                :checked="activeTab === 'joined'"
                                @change="
                                    activeTab = (
                                        $event.target as HTMLInputElement
                                    )?.checked
                                        ? 'joined'
                                        : 'available'
                                "
                            />
                            <span class="toggle-slider"></span>
                        </label>
                        <span
                            class="toggle-label"
                            :class="{ active: activeTab === 'joined' }"
                            >Joined</span
                        >
                    </div>
                </div>
            </header>

            <!-- Main Content -->
            <main class="main-content">
                <!-- Available Spaces (Support Groups) -->
                <section
                    v-if="activeTab === 'available'"
                    class="spaces-section"
                >
                    <SupportGroupsList
                        :search-query="searchQuery"
                        @select-group="handleSpaceSelect"
                    />
                </section>

                <!-- Joined Spaces -->
                <section
                    v-else-if="activeTab === 'joined'"
                    class="spaces-section"
                >
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

.header-controls {
    display: flex;
    gap: 12px;
    align-items: center;
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

.settings-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    /*background-color: var(--vscode-button-secondaryBackground);*/
    color: var(--vscode-foreground);
    border: 1px solid var(--vscode-button-border);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
}

.settings-button:hover {
    background-color: var(--vscode-button-secondaryHoverBackground);
    border-color: var(--vscode-button-hoverBorder);
}

.header-controls {
    display: flex;
    gap: 16px;
    align-items: center;
}

.toggle-container {
    display: flex;
    align-items: center;
    gap: 12px;
}

.toggle-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--vscode-tab-inactiveForeground);
    transition: color 0.3s ease;
    white-space: nowrap;
}

.toggle-label.active {
    color: var(--vscode-tab-activeForeground);
    font-weight: 600;
}

.ios-toggle {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
}

.ios-toggle input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--vscode-button-secondaryBackground);
    transition: 0.3s ease;
    border-radius: 24px;
    border: 1px solid var(--vscode-button-border);
}

.toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 2px;
    top: 2px;
    background-color: var(--vscode-button-foreground);
    transition: 0.3s ease;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.ios-toggle input:checked + .toggle-slider {
    background-color: var(--vscode-textLink-foreground);
    border-color: var(--vscode-textLink-foreground);
}

.ios-toggle input:checked + .toggle-slider:before {
    transform: translateX(18px);
    background-color: white;
}

.ios-toggle:hover .toggle-slider {
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
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
        flex-direction: row;
        align-items: stretch;
        gap: 12px;
    }
}
</style>
