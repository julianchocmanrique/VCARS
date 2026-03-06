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
  StatusBar,
  Platform,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
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

const PROFILE_LABEL = {
  administrativo: 'Administrativo',
  tecnico: 'Técnico',
  cliente: 'Cliente',
}

const Home = ({ navigation, route }) => {
  const insets = useSafeAreaInsets()

  const [entry, setEntry] = React.useState(route?.params?.entry || null)
  const [profile, setProfile] = React.useState(null)
  const [entriesCount, setEntriesCount] = React.useState(0)

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

    const load = async () => {
      const p = await AsyncStorage.getItem(PROFILE_KEY)
      if (mounted) setProfile(p)

      const fromRoute = route?.params?.entry
      if (fromRoute) {
        await AsyncStorage.setItem(CURRENT_ENTRY_KEY, JSON.stringify(fromRoute))
      }

      const savedList = await AsyncStorage.getItem(ENTRIES_KEY)
      if (savedList) {
        try {
          const list = JSON.parse(savedList)
          if (Array.isArray(list)) {
            if (mounted) setEntriesCount(list.length)
            if (list.length > 0) {
              const sorted = [...list].sort((a, b) => {
                const da = a?.fecha ? new Date(a.fecha).getTime() : 0
                const db = b?.fecha ? new Date(b.fecha).getTime() : 0
                return db - da
              })
              if (mounted) setEntry(sorted[0])
              return
            }
          }
        } catch (err) {
          // fall back
        }
      }

      const saved = await AsyncStorage.getItem(CURRENT_ENTRY_KEY)
      if (mounted && saved) setEntry(JSON.parse(saved))
    }

    load()

    return () => {
      glowAnim.stop()
      scanAnim.stop()
      mounted = false
    }
  }, [route?.params?.entry, glow, scan])

  useFocusEffect(
    React.useCallback(() => {
      const ensureLogin = async () => {
        const p = await AsyncStorage.getItem(PROFILE_KEY)
        if (!p) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        } else {
          setProfile(p)
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

  const goNuevoIngreso = () => navigation.navigate('NuevoIngreso', { mode: 'new', entry: null })
  const goOrdenServicio = () => navigation.navigate('OrdenServicio', { entry })
  const goProceso = () => navigation.navigate('IngresoActivo')
  const goPerfil = () => navigation.navigate('Login', { forceSelect: true })
  const goVehiculoDetalle = () => entry && navigation.navigate('VehiculoDetalle', { vehicle: entry })

  const createDemoEntry = async () => {
    const demo = {
      id: `demo-${Date.now()}`,
      placa: 'ABC123',
      cliente: 'Juan Pérez',
      telefono: '3001234567',
      vehiculo: 'Mazda 3 · 2018',
      fecha: new Date().toISOString(),
      paso: 'Recepcion y orden de servicio',
      stepIndex: 0,
    }

    try {
      const savedList = await AsyncStorage.getItem(ENTRIES_KEY)
      const list = savedList ? JSON.parse(savedList) : []
      const next = Array.isArray(list) ? [demo, ...list] : [demo]
      await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(next))
      await AsyncStorage.setItem(CURRENT_ENTRY_KEY, JSON.stringify(demo))
      setEntriesCount(next.length)
      setEntry(demo)
    } catch (err) {
      // ignore
    }
  }

  const recentTitle = entry
    ? `${entry.vehiculo || 'Vehículo'} · ${entry.placa || '-'}`
    : 'Sin ingresos registrados'

  const recentSub = entry
    ? `${entry?.cliente ? `Cliente: ${entry.cliente}` : 'Cliente: -'}  •  ${entry?.telefono ? `Tel: ${entry.telefono}` : 'Tel: -'}`
    : 'Crea tu primer ingreso para empezar'

  const topInset = insets?.top || 0
  const androidStatusBar = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0
  const safeTop = Math.max(topInset, androidStatusBar)

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} translucent={false} />

      <View style={styles.bgOrbLeft} />
      <View style={styles.bgOrbRight} />

      <View style={[styles.header, { paddingTop: safeTop + 12 }]}>
        <View style={{ flex: 1 }}>
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

          <View style={styles.headerRow2}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pageTitle}>Panel general</Text>
              <Text style={styles.pageSubtitle}>
                {PROFILE_LABEL[profile] ? PROFILE_LABEL[profile] : 'Sin perfil'}
                {entriesCount ? `  •  ${entriesCount} ingresos` : ''}
              </Text>
            </View>

            <TouchableOpacity style={styles.profileChip} onPress={goPerfil} activeOpacity={0.85}>
              <Icon name="person" size={16} color={COLORS.surface} />
              <Text style={styles.profileChipText}>Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones rápidas</Text>
          <View style={styles.grid}>
            {(() => {
              const role = profile || 'administrativo'

              const cards =
                role === 'cliente'
                  ? [
                      {
                        title: 'Mi vehículo',
                        subtitle: entry ? 'Ver estado' : 'Sin registros',
                        icon: 'car-sport',
                        tone: 'primary',
                        onPress: goVehiculoDetalle,
                        disabled: !entry,
                      },
                      {
                        title: 'Contacto',
                        subtitle: 'WhatsApp / soporte',
                        icon: 'chatbubbles',
                        tone: 'secondary',
                        onPress: () => {},
                        disabled: true,
                      },
                      {
                        title: 'Historial',
                        subtitle: 'Últimos 5',
                        icon: 'time',
                        tone: 'muted',
                        onPress: goProceso,
                      },
                      {
                        title: 'Cambiar perfil',
                        subtitle: 'Salir',
                        icon: 'swap-horizontal',
                        tone: 'danger',
                        onPress: goPerfil,
                      },
                    ]
                  : role === 'tecnico'
                    ? [
                        {
                          title: 'Proceso activo',
                          subtitle: entry ? 'Continuar' : 'Sin activo',
                          icon: 'pulse',
                          tone: 'primary',
                          onPress: goVehiculoDetalle,
                          disabled: !entry,
                        },
                        {
                          title: 'Ingresos',
                          subtitle: 'Ver activos',
                          icon: 'document-text',
                          tone: 'secondary',
                          onPress: goProceso,
                        },
                        {
                          title: 'Historial',
                          subtitle: 'Últimos 5',
                          icon: 'time',
                          tone: 'muted',
                          onPress: goProceso,
                        },
                        {
                          title: 'Cambiar perfil',
                          subtitle: 'Admin / Cliente',
                          icon: 'swap-horizontal',
                          tone: 'danger',
                          onPress: goPerfil,
                        },
                      ]
                    : [
                        {
                          title: 'Nuevo ingreso',
                          subtitle: 'Registrar vehículo',
                          icon: 'add',
                          tone: 'primary',
                          onPress: goNuevoIngreso,
                        },
                        {
                          title: 'Proceso',
                          subtitle: 'Ingreso activo',
                          icon: 'pulse',
                          tone: 'secondary',
                          onPress: goProceso,
                        },
                        {
                          title: 'Historial',
                          subtitle: 'Últimos 5',
                          icon: 'time',
                          tone: 'muted',
                          onPress: goProceso,
                        },
                        {
                          title: 'Cambiar perfil',
                          subtitle: 'Admin / Técnico',
                          icon: 'swap-horizontal',
                          tone: 'danger',
                          onPress: goPerfil,
                        },
                      ]

              const withDev = __DEV__
                ? [
                    {
                      title: 'Ingreso demo',
                      subtitle: 'Crear ABC123',
                      icon: 'sparkles',
                      tone: 'secondary',
                      onPress: createDemoEntry,
                    },
                    ...cards,
                  ]
                : cards

              return withDev.map((c) => (
                <QuickCard
                  key={c.title}
                  title={c.title}
                  subtitle={c.subtitle}
                  icon={c.icon}
                  tone={c.tone}
                  onPress={c.onPress}
                  disabled={c.disabled}
                />
              ))
            })()}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reciente</Text>
          <View style={styles.recentCard}>
            <View style={styles.recentTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentTitle}>{recentTitle}</Text>
                <Text style={styles.recentSubtitle}>{recentSub}</Text>
              </View>
              <View style={styles.recentBadge}>
                <Icon name="car-sport" size={18} color={COLORS.surface} />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, !entry && styles.primaryBtnDisabled]}
              onPress={() => {
                const role = profile || 'administrativo'
                if (!entry) {
                  if (role === 'cliente') return
                  return navigation.navigate('NuevoIngreso', { mode: 'new', entry: null })
                }

                if (role === 'cliente') {
                  return navigation.navigate('VehiculoDetalle', { vehicle: entry })
                }

                return navigation.navigate('NuevoIngreso', { mode: 'edit', entry })
              }}
              activeOpacity={0.9}
              disabled={!entry && (profile || 'administrativo') === 'cliente'}
            >
              <Text style={styles.primaryBtnText}>
                {(() => {
                  const role = profile || 'administrativo'
                  if (!entry) return 'Crear ingreso'
                  if (role === 'cliente') return 'Ver estado'
                  return 'Editar reciente'
                })()}
              </Text>
              <Icon name="arrow-forward" size={16} color={COLORS.surface} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 88 }} />
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
          <View style={styles.activeIconWrap}>
            <Icon name="home" size={18} color={COLORS.surface} />
          </View>
          <Text style={[styles.navText, styles.navTextActive]}>INICIO</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={goNuevoIngreso} activeOpacity={0.8}>
          <Icon name="add-circle-outline" size={22} color={COLORS.textMuted} />
          <Text style={styles.navText}>NUEVO</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={goProceso} activeOpacity={0.8}>
          <Icon name="document-text-outline" size={22} color={COLORS.textMuted} />
          <Text style={styles.navText}>PROCESO</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const QuickCard = ({ title, subtitle, icon, tone, onPress, disabled }) => {
  const toneStyles =
    tone === 'primary'
      ? {
          bg: COLORS.blueLight,
          text: COLORS.surface,
          sub: 'rgba(14,17,23,0.75)',
          iconBg: 'rgba(14,17,23,0.16)',
          iconColor: COLORS.surface,
        }
      : tone === 'secondary'
        ? {
            bg: COLORS.surface,
            text: COLORS.text,
            sub: COLORS.textMuted,
            iconBg: COLORS.surfaceAlt,
            iconColor: COLORS.blueLight,
          }
        : tone === 'danger'
          ? {
              bg: COLORS.surface,
              text: COLORS.text,
              sub: COLORS.textMuted,
              iconBg: 'rgba(212,58,58,0.12)',
              iconColor: COLORS.red,
            }
          : {
              bg: COLORS.surfaceAlt,
              text: COLORS.text,
              sub: COLORS.textMuted,
              iconBg: COLORS.surface,
              iconColor: COLORS.blueLight,
            }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: toneStyles.bg }, disabled && { opacity: 0.5 }]}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={!!disabled}
    >
      <View style={[styles.cardIcon, { backgroundColor: toneStyles.iconBg }]}>
        <Icon name={icon} size={18} color={toneStyles.iconColor} />
      </View>
      <Text style={[styles.cardTitle, { color: toneStyles.text }]}>{title}</Text>
      <Text style={[styles.cardSubtitle, { color: toneStyles.sub }]}>{subtitle}</Text>
    </TouchableOpacity>
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
    // paddingTop is injected dynamically using safe area insets
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerRow2: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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

  pageTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '900',
  },
  pageSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },

  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.blueLight,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: COLORS.blueLight,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  profileChipText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  scrollContent: {
    paddingBottom: 120,
  },

  section: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginBottom: 10,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },

  card: {
    width: '48%',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '900',
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
  },

  recentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recentTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  recentBadge: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: COLORS.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },
  recentSubtitle: {
    marginTop: 6,
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },

  primaryBtn: {
    marginTop: 14,
    backgroundColor: COLORS.blueLight,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnDisabled: {
    opacity: 0.95,
  },
  primaryBtnText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: '900',
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
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  navTextActive: {
    color: COLORS.text,
  },
})
