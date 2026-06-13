import { useEffect, useState } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { isLoggedIn } from '@/lib/auth'
import { View, ActivityIndicator } from 'react-native'
import { C } from '@/constants/Colors'

export default function RootLayout() {
  const router = useRouter()
  const segments = useSegments()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    isLoggedIn().then((loggedIn) => {
      setChecking(false)
      const inAuth = segments[0] === '(auth)'
      if (!loggedIn && !inAuth) {
        router.replace('/(auth)/login')
      } else if (loggedIn && inAuth) {
        router.replace('/(tabs)')
      }
    })
  }, [])

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.navy }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    )
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}
