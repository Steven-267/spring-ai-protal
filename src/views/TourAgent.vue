<template>
  <div class="tour-agent" :class="{ 'dark': isDark }">
    <div class="chat-container">
      <div class="sidebar">
        <div class="history-header">
          <div class="title-wrap">
            <MapIcon class="title-icon" />
            <div>
              <h2>旅游向导 Agent</h2>
              <p class="subtitle">高德 MCP 快速版</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="pill new-chat" @click="startNewChat" title="新建对话"><PlusIcon class="icon" />新对话</button>
            <button class="pill clear-btn" @click="clearAllChats" title="清空全部"><TrashIcon class="icon" />清空</button>
          </div>
        </div>
        <div class="history-list">
          <div 
            v-for="(chat, idx) in chatHistory" :key="chat.id"
            class="history-item" :class="{ 'active': currentChatId === chat.id }"
            @click="loadChat(chat.id)"
          >
            <span class="title">{{ chat.title || '新对话' }}</span>
            <button class="delete-btn" title="删除此对话" @click.stop="deleteOneChat(chat.id, idx)">
              <TrashIcon class="icon" />
            </button>
          </div>

          <div v-if="!chatHistory.length" class="placeholder">
            <p class="muted">暂无对话</p>
            <button class="pill new-chat" @click="startNewChat"><PlusIcon class="icon" />新建对话</button>
          </div>
        </div>
      </div>

      <div class="chat-main">
        <div class="messages" ref="messagesRef">
          <div class="chatgpt-empty" v-if="!currentMessages.length">
            <h1 class="brand">旅游向导 Agent</h1>
            <div class="tips">
              <div class="tip">北京故宫一日游（含入园时间与路线）</div>
              <div class="tip">从颐和园到天安门的最佳路线（避开高峰）</div>
              <div class="tip">生成专属旅行地图链接</div>
            </div>
          </div>
          <ChatMessage
            v-for="(message, index) in currentMessages"
            :key="index"
            :message="message"
            :is-stream="isStreaming && index === currentMessages.length - 1"
          />
        </div>

        <div class="input-area">
          <div class="input-row">
            <textarea v-model="userInput" @keydown.enter.prevent="sendMessage" placeholder="例如：帮我规划北京故宫一日游，并生成专属地图链接" rows="1" ref="inputRef"></textarea>
            <button class="send-button" @click="sendMessage" :disabled="isStreaming || !userInput.trim()">
              <PaperAirplaneIcon class="icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useDark } from '@vueuse/core'
import { 
  PaperAirplaneIcon,
  PlusIcon,
  TrashIcon,
  MapIcon
} from '@heroicons/vue/24/outline'
import ChatMessage from '../components/ChatMessage.vue'
import { chatAPI } from '../services/api'

const isDark = useDark()
const messagesRef = ref(null)
const inputRef = ref(null)
const userInput = ref('')
const isStreaming = ref(false)
const currentChatId = ref(null)
const currentMessages = ref([])
const chatHistory = ref([])

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const sendMessage = async () => {
  if (isStreaming.value) return
  if (!userInput.value.trim()) return

  const messageContent = userInput.value.trim()

  // 用户消息
  currentMessages.value.push({ role: 'user', content: messageContent, timestamp: new Date() })
  userInput.value = ''
  await scrollToBottom()

  // 助手占位
  const assistantMessage = { role: 'assistant', content: '', timestamp: new Date() }
  currentMessages.value.push(assistantMessage)
  isStreaming.value = true

  try {
    // 若没有 chatId，则新建一个
    if (!currentChatId.value) startNewChat()
    const reader = await chatAPI.sendTravelMessage(messageContent, currentChatId.value)
    const decoder = new TextDecoder('utf-8')
    let accumulated = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      accumulated += decoder.decode(value)
      const lastIndex = currentMessages.value.length - 1
      currentMessages.value.splice(lastIndex, 1, { ...assistantMessage, content: accumulated })
      await scrollToBottom()
    }
  } catch (e) {
    console.error(e)
  } finally {
    isStreaming.value = false
    await scrollToBottom()
  }
}

const loadChat = async (chatId) => {
  currentChatId.value = chatId
  const messages = await chatAPI.getChatMessages(chatId, 'travel')
  currentMessages.value = messages
}

const loadChatHistory = async () => {
  const history = await chatAPI.getChatHistory('travel')
  chatHistory.value = history || []
  // 初次进入不自动打开历史会话，避免误以为自动发送；保持右侧为空
  if (!history || history.length === 0) {
    startNewChat()
  }
}

const startNewChat = () => {
  const newChatId = Date.now().toString()
  currentChatId.value = newChatId
  currentMessages.value = []
  chatHistory.value = [{ id: newChatId, title: `对话 ${newChatId.slice(-6)}` }, ...chatHistory.value]
}

const deleteOneChat = async (chatId, index) => {
  if (!confirm('确认删除该对话吗？')) return
  try {
    await chatAPI.deleteChat('travel', chatId)
    chatHistory.value.splice(index, 1)
    if (currentChatId.value === chatId) startNewChat()
  } catch (e) {
    console.error(e)
  }
}

const clearAllChats = async () => {
  if (!confirm('确认清空所有对话吗？')) return
  try {
    await chatAPI.clearChats('travel')
    chatHistory.value = []
    startNewChat()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadChatHistory()
})
</script>

<style scoped lang="scss">
.tour-agent { position: fixed; top: 64px; left: 0; right: 0; bottom: 0; display: flex; background: var(--bg-color); }
.chat-container { flex: 1; display: flex; max-width: 1600px; width: 100%; margin: 0 auto; padding: 1rem 1.5rem; gap: 1rem; height: 100%; }
.sidebar { width: 320px; display: flex; flex-direction: column; background: linear-gradient(180deg, rgba(255,255,255,.95), rgba(255,255,255,.9)); border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,.08); border: 1px solid rgba(0,0,0,.05); overflow: hidden; }
.history-header { padding: 1rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,.06); }
.title-wrap { display: flex; align-items: center; gap: .75rem; }
.title-wrap .title-icon { width: 28px; height: 28px; color: #007CF0; }
.history-header h2 { font-size: 1.1rem; margin: 0; }
.history-header .subtitle { font-size: .8rem; color: #888; margin-top: .15rem; }
.history-header .header-actions { display: flex; gap: .5rem; }
.pill { display: inline-flex; align-items: center; gap: .4rem; padding: .45rem .8rem; border-radius: 999px; border: 1px solid transparent; cursor: pointer; font-size: .9rem; }
.new-chat { background: #0ea5e9; color: #fff; }
.new-chat:hover { background: #0284c7; }
.clear-btn { background: #ef4444; color: #fff; }
.clear-btn:hover { background: #dc2626; }
.history-list { flex: 1; overflow-y: auto; padding: .75rem; }
.history-item { display: flex; align-items: center; gap: .6rem; padding: .6rem .6rem; border-radius: 10px; cursor: pointer; transition: background .2s ease; }
.history-item:hover { background: rgba(2,132,199,.08); }
.history-item.active { background: rgba(14,165,233,.15); }
.history-item .icon { color: #0ea5e9; }
.history-item .title { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.history-item .delete-btn { margin-left: auto; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: 1px solid rgba(0,0,0,.08); background: rgba(0,0,0,.03); color: #666; border-radius: 6px; cursor: pointer; transition: all .15s ease; }
.history-item .delete-btn .icon { width: 16px; height: 16px; }
.history-item .delete-btn:hover { background: rgba(239,68,68,.12); border-color: rgba(239,68,68,.35); color: #b91c1c; }
.history-item .delete-btn:focus { outline: 2px solid rgba(239,68,68,.45); outline-offset: 2px; }
.placeholder { padding:.5rem .75rem; display:flex; flex-direction:column; align-items:flex-start; gap:.5rem; }
.placeholder .muted { color:#8a8a8a; font-size:.9rem; }

.chat-main { flex: 1; display: flex; flex-direction: column; background: linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.92)); border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,.08); border: 1px solid rgba(0,0,0,.05); overflow: hidden; }
.messages { flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem; }
.messages .chatgpt-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1rem; height:100%; color:#6b7280; }
.messages .chatgpt-empty .brand { font-size:1.5rem; font-weight:700; color:#0ea5e9; }
.messages .chatgpt-empty .tips { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:.75rem; width:100%; max-width:900px; }
.messages .chatgpt-empty .tip { padding:.75rem 1rem; border-radius:12px; background:rgba(2,132,199,.06); text-align:center; color:#0369a1; font-size:.95rem; }
.messages .chatgpt-empty .tip:hover { background:rgba(2,132,199,.1); }
.messages .notice { margin: .25rem 0 1rem; padding: .6rem .8rem; border-radius: 10px; background: rgba(2,132,199,.08); color: #0369a1; font-size: .9rem; }
.input-area { padding: 1rem 1.5rem; border-top: 1px solid rgba(0,0,0,.06); background: rgba(255,255,255,.7); backdrop-filter: blur(6px); }
.input-row { display: flex; gap: .8rem; align-items: flex-end; background: #fff; padding: .6rem; border-radius: 12px; border: 1px solid rgba(0,0,0,.08); box-shadow: 0 2px 8px rgba(0,0,0,.04); }
.input-row textarea { flex: 1; resize: none; border: none; background: transparent; padding: .6rem; font-size: 1rem; line-height: 1.5; max-height: 160px; }
.send-button { width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; border: none; border-radius: 10px; background: #0ea5e9; color: #fff; cursor: pointer; box-shadow: 0 2px 8px rgba(14,165,233,.35); }
.send-button:hover { background: #0284c7; }
.dark .sidebar, .dark .chat-main { background: rgba(32,32,32,.9); box-shadow: 0 8px 24px rgba(0,0,0,.4); border-color: rgba(255,255,255,.06); }
.dark .messages .notice { background: rgba(14,165,233,.12); color: #7dd3fc; }
</style>


