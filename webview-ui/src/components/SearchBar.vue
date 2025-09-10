<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  searchQuery: string;
}

interface Emits {
  (e: 'search', query: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localQuery = ref<string>(props.searchQuery);

// Watch for external changes to searchQuery prop
watch(() => props.searchQuery, (newQuery) => {
  localQuery.value = newQuery;
});

// Emit search events with debouncing
let searchTimeout: number;

function handleInput() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    emit('search', localQuery.value);
  }, 300); // 300ms debounce
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    clearTimeout(searchTimeout);
    emit('search', localQuery.value);
  } else if (event.key === 'Escape') {
    localQuery.value = '';
    emit('search', '');
  }
}

function clearSearch() {
  localQuery.value = '';
  emit('search', '');
}
</script>

<template>
  <div class="search-bar">
    <div class="search-input-container">
      <div class="search-icon">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"/>
        </svg>
      </div>
      
      <input
        v-model="localQuery"
        @input="handleInput"
        @keydown="handleKeydown"
        class="search-input"
        type="text"
        placeholder="Search support groups and spaces..."
        autocomplete="off"
      />
      
      <button
        v-if="localQuery"
        @click="clearSearch"
        class="clear-button"
        title="Clear search"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2.343 13.657A8 8 0 1 1 13.657 2.343 8 8 0 0 1 2.343 13.657ZM6.03 4.97a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042L6.94 8 4.97 9.97a.749.749 0 0 0 .326 1.275.749.749 0 0 0 .734-.215L8 9.06l1.97 1.97a.749.749 0 0 0 1.275-.326.749.749 0 0 0-.215-.734L9.06 8l1.97-1.97a.749.749 0 0 0-.326-1.275.749.749 0 0 0-.734.215L8 6.94Z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  width: 100%;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
  background-color: var(--vscode-input-background);
  border: 1px solid var(--vscode-input-border);
  border-radius: 6px;
  transition: border-color 0.2s;
}

.search-input-container:focus-within {
  border-color: var(--vscode-focusBorder);
  box-shadow: 0 0 0 1px var(--vscode-focusBorder);
}

.search-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 12px;
  color: var(--vscode-input-placeholderForeground);
  pointer-events: none;
}

.search-input {
  flex: 1;
  padding: 10px 12px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--vscode-input-foreground);
  font-size: 14px;
  font-family: var(--vscode-font-family);
}

.search-input::placeholder {
  color: var(--vscode-input-placeholderForeground);
}

.clear-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  margin-right: 4px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--vscode-input-placeholderForeground);
  cursor: pointer;
  transition: all 0.2s;
}

.clear-button:hover {
  background-color: var(--vscode-toolbar-hoverBackground);
  color: var(--vscode-foreground);
}

.clear-button:active {
  transform: scale(0.95);
}

/* Focus styles for keyboard navigation */
.clear-button:focus {
  outline: 1px solid var(--vscode-focusBorder);
  outline-offset: 1px;
}

/* Animation for clear button appearance */
.clear-button {
  opacity: 0.7;
  transform: scale(0.9);
  animation: fadeInScale 0.2s ease-out forwards;
}

@keyframes fadeInScale {
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
