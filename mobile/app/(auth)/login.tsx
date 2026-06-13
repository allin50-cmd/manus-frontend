import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { C } from '@/constants/Colors'
import { login, ApiError } from '@/lib/api'

export default function LoginScreen() {
  const router = useRouter()
  const [passcode, setPasscode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!passcode.trim()) {
      Alert.alert('Required', 'Please enter your passcode.')
      return
    }
    setLoading(true)
    try {
      await login(passcode.trim())
      router.replace('/(tabs)')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Login failed. Check your passcode.'
      Alert.alert('Sign In Failed', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.inner}>
        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logoIcon}>
            <Text style={s.logoEmoji}>🛡️</Text>
          </View>
          <Text style={s.logoText}>FineGuard</Text>
        </View>
        <Text style={s.tagline}>Centralise. Prioritise. Comply.</Text>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Sign in to your account</Text>

          <View style={s.field}>
            <Text style={s.label}>EMAIL</Text>
            <View style={s.inputDisabled}>
              <Text style={s.inputDisabledText}>george@firm.co.uk</Text>
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>PASSCODE</Text>
            <TextInput
              style={s.input}
              value={passcode}
              onChangeText={setPasscode}
              placeholder="Enter passcode"
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              placeholderTextColor={C.muted}
            />
          </View>

          <TouchableOpacity
            style={[s.button, loading && s.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.buttonText}>Sign in</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.navy,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 24,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 32,
    marginLeft: 60,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    marginBottom: 20,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: C.text,
    backgroundColor: '#fff',
  },
  inputDisabled: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: C.bg,
  },
  inputDisabledText: {
    fontSize: 16,
    color: C.muted,
  },
  button: {
    backgroundColor: C.blue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
