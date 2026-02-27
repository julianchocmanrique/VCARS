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
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Icon from 'react-native-vector-icons/Ionicons'

const PROFILE_KEY = '@vcars_profile'

const PROFILES = [
  { id: 'administrativo', label: 'Administrativo', icon: 'briefcase' },
  { id: 'tecnico', label: 'Tecnico', icon: 'build' },
  { id: 'cliente', label: 'Cliente', icon: 'person' },
]

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

const Login = ({ navigation, route }) => {
  const [selected, setSelected] = React.useState('')
  const glow = React.useRef(new Animated.Value(0)).current
  const scan = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    const loadProfile = async () => {
      const saved = await AsyncStorage.getItem(PROFILE_KEY)
      if (saved) {
        setSelected(saved)
      }
    }
    loadProfile()
  }, [])

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
    if (!selected) return
    await AsyncStorage.setItem(PROFILE_KEY, selected)
    navigation.replace('Home')
  }

  return (
    <View style={styles.container}>
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
        <Text style={styles.subtitle}>Selecciona tu perfil</Text>
      </View>

      <View style={styles.list}>
        {PROFILES.map((profile) => {
          const active = selected === profile.id
          return (
            <TouchableOpacity
              key={profile.id}
              style={[styles.card, active && styles.cardActive]}
              activeOpacity={0.85}
              onPress={() => setSelected(profile.id)}
            >
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                <Icon name={profile.icon} size={18} color={active ? COLORS.surface : COLORS.text} />
              </View>
              <Text style={styles.cardText}>{profile.label}</Text>
              {active ? (
                <Icon name="checkmark-circle" size={18} color={COLORS.blueLight} />
              ) : (
                <View style={styles.cardDot} />
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.loginBtn, !selected && styles.loginBtnDisabled]}
          onPress={onLogin}
          activeOpacity={0.9}
          disabled={!selected}
        >
          <Text style={styles.loginText}>Ingresar</Text>
          <Icon name="arrow-forward" size={16} color={COLORS.surface} />
        </TouchableOpacity>
      </View>
    </View>
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
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardActive: {
    borderColor: COLORS.blueLight,
    shadowColor: COLORS.blueLight,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: COLORS.blueLight,
    borderColor: COLORS.blueLight,
  },
  cardText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  cardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
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
