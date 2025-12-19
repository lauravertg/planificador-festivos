import { defineStore } from 'pinia'
import { ref } from 'vue'
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

  // Initialize auth immediately when store is created
  initAuth()

  return {
    user,
    loading
  }
})