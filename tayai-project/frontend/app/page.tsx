'use client'

import ChatWidget from '@/components/ChatWidget'
import { AuthProvider } from '@/contexts/AuthContext'

export default function Home() {
  return (
    <AuthProvider>
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">
            Welcome to TayAI
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Your AI assistant for hair education and business mentorship
          </p>
          <ChatWidget />
        </div>
      </main>
    </AuthProvider>
  )
}
