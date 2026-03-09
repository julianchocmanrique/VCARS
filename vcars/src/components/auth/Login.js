import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import { DEMO_USERS, signIn } from '../../lib/vcarsAuth'

const COLORS = {
  bg: '#05070B',
  surface: '#0E1117',
  surfaceAlt: '#121826',
  border: '#1D2433',
  text: '#F5F7FA',
  textMuted: '#9AA4B2',
  blue: '#1F4D7A',
  blueLight: '#86B9E6',
}

const Login = ({ navigation }) => {
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const glow = React.useRef(new Animated.Value(0)).current
  const scan = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    const glowAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    )
    const scanAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scan, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    )

    glowAnim.start()
    scanAnim.start()
    return () => {
      glowAnim.stop()
      scanAnim.stop()
    }
  }, [glow, scan])

  const onLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await signIn({ username, password })
      if (!res.ok) {
        setError(res.error || 'No se pudo iniciar sesión')
        return
      }
      navigation.replace('Home')
    } finally {
      setLoading(false)
    }
  }

  const quickFill = (u) => {
    setUsername(u.username)
    setPassword(u.password)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <View style={styles.brandWrap}>
          <Animated.View
            style={[
              styles.brandGlow,
              {
                opacity: glow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.35, 0.95],
                }),
                transform: [
                  {
                    scale: glow.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.98, 1.02],
                    }),
                  },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.brandScan,
              {
                transform: [
                  {
                    translateX: scan.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 125],
                    }),
                  },
                ],
              },
            ]}
          />
          <View style={styles.brandRow}>
            <Image source={require('../../assets/vcars-v.png')} style={styles.vImage} />
            <Text style={styles.brand}>-CARS</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Inicia sesión</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Usuario</Text>
        <View style={styles.inputWrap}>
          <Icon name="person" size={18} color={COLORS.textMuted} />
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="admin / tecnico / cliente"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </View>

        <Text style={[styles.label, { marginTop: 12 }]}>Contraseña</Text>
        <View style={styles.inputWrap}>
          <Icon name="lock-closed" size={18} color={COLORS.textMuted} />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            style={styles.input}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={onLogin}
          activeOpacity={0.9}
          disabled={loading}
        >
          <Text style={styles.loginText}>{loading ? 'Validando…' : 'Ingresar'}</Text>
          <Icon name="arrow-forward" size={16} color={COLORS.surface} />
        </TouchableOpacity>

        {__DEV__ ? (
          <View style={styles.quickRow}>
            {DEMO_USERS.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={styles.quickPill}
                onPress={() => quickFill(u)}
                activeOpacity={0.85}
              >
                <Text style={styles.quickText}>{u.username}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <Text style={styles.hint}>En esta fase (MVP) las credenciales son locales para probar roles.</Text>
      </View>
    </KeyboardAvoidingView>
  )
}

export default Login

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  brandWrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  brandGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.blue,
  },
  brandScan: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    width: 26,
    borderRadius: 999,
    backgroundColor: COLORS.blueLight,
    opacity: 0.8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vImage: {
    width: 18,
    height: 18,
    marginRight: 4,
  },
  brand: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 10,
  },
  formCard: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  inputWrap: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    padding: 0,
  },
  error: {
    marginTop: 10,
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },
  quickRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(134,185,230,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(134,185,230,0.35)',
  },
  quickText: {
    color: COLORS.blueLight,
    fontSize: 12,
    fontWeight: '800',
  },
  hint: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontSize: 11,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  loginBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loginBtnDisabled: {
    opacity: 0.5,
  },
  loginText: {
    color: COLORS.surface,
    fontWeight: '800',
    fontSize: 14,
  },
})
