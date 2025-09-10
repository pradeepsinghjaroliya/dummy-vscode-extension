<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  isSignedIn: boolean;
}

interface Emits {
  (e: 'submit-token', token: string): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const tokenInput = ref<string>('');
const showTokenInput = ref<boolean>(false);

function handleSubmit() {
  if (tokenInput.value.trim()) {
    emit('submit-token', tokenInput.value.trim());
    tokenInput.value = '';
    showTokenInput.value = false;
  }
}

function toggleTokenInput() {
  showTokenInput.value = !showTokenInput.value;
  if (showTokenInput.value) {
    // Focus the input after it becomes visible
    setTimeout(() => {
      const input = document.querySelector('.token-input') as HTMLInputElement;
      if (input) input.focus();
    }, 100);
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    handleSubmit();
  } else if (event.key === 'Escape') {
    showTokenInput.value = false;
    tokenInput.value = '';
  }
}
</script>

<template>
  <div class="token-section">
    <div v-if="!isSignedIn" class="sign-in-area">
      <button 
        v-if="!showTokenInput"
        @click="toggleTokenInput"
        class="sign-in-button"
      >
        Sign In
      </button>
      
      <div v-if="showTokenInput" class="token-input-area">
        <input
          v-model="tokenInput"
          @keydown="handleKeydown"
          class="token-input"
          type="password"
          placeholder="Enter your access token..."
          autocomplete="off"
        />
        <div class="token-actions">
          <button @click="handleSubmit" class="submit-button" :disabled="!tokenInput.trim()">
            Submit
          </button>
          <button @click="toggleTokenInput" class="cancel-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
    
    <div v-else class="signed-in-area">
      <span class="signed-in-text">✓ Signed In</span>
      <button @click="toggleTokenInput" class="change-token-button">
        Change Token
      </button>
      
      <div v-if="showTokenInput" class="token-input-area">
        <input
          v-model="tokenInput"
          @keydown="handleKeydown"
          class="token-input"
          type="password"
          placeholder="Enter new access token..."
          autocomplete="off"
        />
        <div class="token-actions">
          <button @click="handleSubmit" class="submit-button" :disabled="!tokenInput.trim()">
            Update
          </button>
          <button @click="toggleTokenInput" class="cancel-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.token-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.sign-in-area,
.signed-in-area {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.sign-in-button {
  padding: 8px 16px;
  background-color: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.sign-in-button:hover {
  background-color: var(--vscode-button-hoverBackground);
}

.signed-in-area {
  align-items: flex-end;
}

.signed-in-text {
  color: var(--vscode-testing-iconPassed);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.change-token-button {
  padding: 4px 8px;
  background-color: transparent;
  color: var(--vscode-textLink-foreground);
  border: 1px solid var(--vscode-button-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.change-token-button:hover {
  background-color: var(--vscode-button-secondaryHoverBackground);
}

.token-input-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 250px;
}

.token-input {
  padding: 8px 12px;
  background-color: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  font-size: 14px;
  font-family: var(--vscode-font-family);
  outline: none;
}

.token-input:focus {
  border-color: var(--vscode-focusBorder);
  box-shadow: 0 0 0 1px var(--vscode-focusBorder);
}

.token-input::placeholder {
  color: var(--vscode-input-placeholderForeground);
}

.token-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.submit-button {
  padding: 6px 12px;
  background-color: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.submit-button:hover:not(:disabled) {
  background-color: var(--vscode-button-hoverBackground);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-button {
  padding: 6px 12px;
  background-color: transparent;
  color: var(--vscode-button-secondaryForeground);
  border: 1px solid var(--vscode-button-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.cancel-button:hover {
  background-color: var(--vscode-button-secondaryHoverBackground);
}
</style>
