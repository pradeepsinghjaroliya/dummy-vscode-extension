<script setup lang="ts">
import ChatInterface from './components/ChatInterface.vue';
</script>

<template>
  <div class="app">
    <ChatInterface />
  </div>
</template>

<style>
.app {
  height: 100vh;
  overflow: hidden;
}

/* Reset default styles for the chat interface */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
}

#app {
  height: 100vh;
  margin: 0;
  padding: 0;
}
</style>
