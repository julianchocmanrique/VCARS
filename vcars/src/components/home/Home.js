import React from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  BackHandler,
  Animated,
  Easing,
  Image,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'

const CURRENT_ENTRY_KEY = '@vcars_current_entry'
const PROFILE_KEY = '@vcars_profile'
const ENTRIES_KEY = '@vcars_entries'

const COLORS = {
  bg: '#05070B',
  surface: '#0E1117',
  surfaceAlt: '#121826',
  border: '#1D2433',
  text: '#F5F7FA',
  textMuted: '#9AA4B2',
  blue: '#1F4D7A',
  blueLight: '#86B9E6',
  red: '#D43A3A',
  gray: '#8F8F8F',
}

const Home = ({ navigation, route }) => {
  const [entry, setEntry] = React.useState(route?.params?.entry || null)
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

    let mounted = true
    const loadCurrentEntry = async () => {
      const fromRoute = route?.params?.entry
      if (fromRoute) {
        await AsyncStorage.setItem(CURRENT_ENTRY_KEY, JSON.stringify(fromRoute))
      }
      const savedList = await AsyncStorage.getItem(ENTRIES_KEY)
      if (savedList) {
        try {
          const list = JSON.parse(savedList)
          if (Array.isArray(list) && list.length > 0) {
            const sorted = [...list].sort((a, b) => {
              const da = a?.fecha ? new Date(a.fecha).getTime() : 0
              const db = b?.fecha ? new Date(b.fecha).getTime() : 0
              return db - da
            })
            if (mounted) setEntry(sorted[0])
            return
          }
        } catch (err) {
          // fall back to current entry
        }
      }
      const saved = await AsyncStorage.getItem(CURRENT_ENTRY_KEY)
      if (mounted && saved) setEntry(JSON.parse(saved))
    }
    loadCurrentEntry()
    return () => {
      glowAnim.stop()
      scanAnim.stop()
      mounted = false
    }
  }, [route?.params?.entry])

  useFocusEffect(
    React.useCallback(() => {
      const ensureLogin = async () => {
        const profile = await AsyncStorage.getItem(PROFILE_KEY)
        if (!profile) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        }
      }
      ensureLogin()

      const onBackPress = () => {
        AsyncStorage.removeItem(CURRENT_ENTRY_KEY)
        navigation.reset({
          index: 0,
          routes: [{ name: 'NuevoIngreso' }],
        })
        return true
      }
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress)
      return () => sub.remove()
    }, [navigation]),
  )

  return (
    <View style={styles.container}>
      <View style={styles.bgOrbLeft} />
      <View style={styles.bgOrbRight} />

      <View style={styles.header}>
        <View>
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
          <Text style={styles.tagline}>Panel general</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn}>
          <Icon name="notifications" size={18} color={COLORS.surface} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.topCta}
          onPress={() => navigation.navigate('NuevoIngreso', { mode: 'new', entry: null })}
          activeOpacity={0.9}
        >
          <View>
            <Text style={styles.topCtaTitle}>Nuevo ingreso</Text>
            <Text style={styles.topCtaSubtitle}>Registra un vehiculo rapido</Text>
          </View>
          <View style={styles.topCtaIcon}>
            <Icon name="add" size={18} color={COLORS.surface} />
          </View>
        </TouchableOpacity>
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroTitle}>Ingreso reciente</Text>
              <Text style={styles.heroSubtitle}>
                {entry
                  ? `${entry.vehiculo || 'Vehiculo'} - ${entry.placa}`
                  : 'Listo para registrar un nuevo vehiculo'}
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <Icon name="car-sport" size={18} color={COLORS.surface} />
            </View>
          </View>

          <View style={styles.heroInfo}>
            <View style={styles.heroInfoItem}>
              <Text style={styles.heroInfoLabel}>Cliente</Text>
              <Text style={styles.heroInfoValue}>{entry?.cliente || '-'}</Text>
            </View>
            <View style={styles.heroInfoItem}>
              <Text style={styles.heroInfoLabel}>Telefono</Text>
              <Text style={styles.heroInfoValue}>{entry?.telefono || '-'}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() =>
              entry
                ? navigation.navigate('NuevoIngreso', { mode: 'edit', entry })
                : navigation.navigate('NuevoIngreso', { mode: 'new', entry: null })
            }
            activeOpacity={0.9}
          >
            <Text style={styles.primaryBtnText}>Editar reciente</Text>
            <Icon name="arrow-forward" size={16} color={COLORS.surface} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.activeIconWrap}>
            <Icon name="home" size={18} color={COLORS.surface} />
          </View>
          <Text style={[styles.navText, styles.navTextActive]}>INICIO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('IngresoActivo')}>
          <Icon name="document-text-outline" size={22} color={COLORS.textMuted} />
          <Text style={styles.navText}>PROCESO</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Login', { forceSelect: true })}
        >
          <Icon name="log-in-outline" size={22} color={COLORS.textMuted} />
          <Text style={styles.navText}>LOGIN</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  bgOrbLeft: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: COLORS.blue,
    top: -80,
    left: -120,
    opacity: 0.45,
  },
  bgOrbRight: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: COLORS.blueLight,
    top: 40,
    right: -120,
    opacity: 0.25,
  },
  header: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  brand: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
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
  tagline: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.blueLight,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: COLORS.textMuted,
    marginTop: 6,
    fontSize: 12,
  },
  heroBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: COLORS.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },  heroInfoLabel: {
    color: COLORS.gray,
    fontSize: 11,
  },
  heroInfoValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: COLORS.blueLight,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  vehiclesCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vehiclesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  vehiclesTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  vehiclesCount: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleText: {
    flex: 1,
  },
  vehicleName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  vehicleDetail: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  topCta: {
    marginHorizontal: 16,
    marginTop: 6,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topCtaTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  topCtaSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  topCtaIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehiclesEmpty: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  bottomNav: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    height: 72,
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  activeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: COLORS.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  navTextActive: {
    color: COLORS.text,
  },
})
