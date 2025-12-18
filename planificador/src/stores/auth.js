import { defineStore } from 'pinia'
import { ref, onMounted } from 'vue'
import { auth } from '@/lib/firebase'
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)

  const initAuth = async () => {
    // Mock authentication for development - replace with actual Firebase config
    user.value = { uid: 'mock-user-id', isAnonymous: true }
    loading.value = false
  }

  onMounted(() => {
    initAuth()
  })

  return {
    user,
    loading
  }
})