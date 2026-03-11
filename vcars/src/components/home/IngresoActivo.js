import React from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  Animated,
  Easing,
  Image,
} from 'react-native'
import { VCARS_STEP_TITLES, normalizeStepTitle, stepIndexFromTitle } from '../../lib/vcarsProcess'
import Icon from 'react-native-vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import { CLIENT_IDENTITY_KEY, isPlateAllowed } from '../../lib/vcarsClientIdentity'

const CURRENT_ENTRY_KEY = '@vcars_current_entry'
const PROFILE_KEY = '@vcars_profile'
const ENTRIES_KEY = '@vcars_entries'
const STORAGE_MAP_KEY = '@vcars_orden_servicio_map'


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

const IngresoActivo = ({ navigation }) => {
  const [entry, setEntry] = React.useState(null)
  const [entries, setEntries] = React.useState([])
  const [profile, setProfile] = React.useState('administrativo')
  const [clientIdentity, setClientIdentity] = React.useState(null)
  const [viewMode, setViewMode] = React.useState('active') // active | history
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
  }, [])

  const loadEntry = React.useCallback(async () => {
    const saved = await AsyncStorage.getItem(CURRENT_ENTRY_KEY)
    if (saved) {
      setEntry(JSON.parse(saved))
    } else {
      setEntry(null)
    }
  }, [])

  const loadEntries = React.useCallback(async () => {
    const saved = await AsyncStorage.getItem(ENTRIES_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        setEntries(parsed)
        return
      }
    }
    setEntries([])
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      const ensureLogin = async () => {
        const savedProfile = await AsyncStorage.getItem(PROFILE_KEY)
        if (!savedProfile) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
          return
        }
        setProfile(savedProfile)

        // client identity for scoping (if profile is cliente)
        try {
          const raw = await AsyncStorage.getItem(CLIENT_IDENTITY_KEY)
          setClientIdentity(raw ? JSON.parse(raw) : null)
        } catch {
          setClientIdentity(null)
        }

        loadEntry()
        loadEntries()
      }
      ensureLogin()
    }, [loadEntry, loadEntries, navigation]),
  )

  const autos = React.useMemo(() => {
    // Merge current entry into entries list
    const base = Array.isArray(entries) ? entries : []
    const merged = (() => {
      if (!entry) return base
      const defaultStep = VCARS_STEP_TITLES[0] || 'Pendiente'
      const normalizedEntry = {
        ...entry,
        paso: normalizeStepTitle(entry.paso || defaultStep),
        stepIndex:
          typeof entry.stepIndex === 'number'
            ? entry.stepIndex
            : stepIndexFromTitle(entry.paso || defaultStep),
        status: entry.status || 'active',
        updatedAt: entry.updatedAt || entry.fecha || new Date().toISOString(),
      }

      const updated = base.map((item) => {
        if (item.id === normalizedEntry.id) {
          const paso = normalizeStepTitle(item.paso || normalizedEntry.paso || defaultStep)
          const stepIndex =
            typeof item.stepIndex === 'number'
              ? item.stepIndex
              : stepIndexFromTitle(paso)
          return {
            ...item,
            ...normalizedEntry,
            paso,
            stepIndex,
            isCurrent: true,
          }
        }
        return item
      })

      if (!updated.find((item) => item.id === normalizedEntry.id)) {
        updated.unshift({ ...normalizedEntry, isCurrent: true })
      }
      return updated
    })()

    // Normalize legacy items
    const normalized = merged.map((item) => {
      const paso = normalizeStepTitle(item.paso || VCARS_STEP_TITLES[0])
      const stepIndex =
        typeof item.stepIndex === 'number'
          ? item.stepIndex
          : stepIndexFromTitle(paso)
      const status = item.status || (stepIndex >= VCARS_STEP_TITLES.length - 1 ? 'done' : 'active')
      return {
        ...item,
        paso,
        stepIndex,
        status,
        updatedAt: item.updatedAt || item.fecha || new Date().toISOString(),
      }
    })

    // View mode filtering
    const onlyActive = normalized.filter((it) => it.status !== 'done' && it.status !== 'cancelled')
    const onlyHistory = normalized.filter((it) => it.status === 'done' || it.status === 'cancelled')

    const scoped = viewMode === 'history' ? onlyHistory : onlyActive

    // Per-role scoping
    if (profile === 'tecnico') return onlyActive

    if (profile === 'cliente') {
      const identity = clientIdentity
      // Only show plates allowed for this client
      return scoped.filter((it) => isPlateAllowed(identity, it.placa || it.plate))
    }

    return scoped
  }, [entries, entry, profile, viewMode, clientIdentity])

  const saveEntries = async (next) => {
    setEntries(next)
    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(next))
  }

  const removeVehicle = async (id) => {
    const next = entries.filter((item) => item.id !== id)
    await saveEntries(next)
    if (entry?.id === id) {
      await AsyncStorage.removeItem(CURRENT_ENTRY_KEY)
      setEntry(null)
    }
  }

  const openVehicle = (item) => {
    navigation.navigate('VehiculoDetalle', { vehicle: item })
  }

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
          <Text style={styles.tagline}>Formato del ingreso</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <View>
              <Text style={styles.listTitle}>{profile === 'administrativo' && viewMode === 'history' ? 'Historial de vehículos' : 'Vehículos en proceso'}</Text>
              <Text style={styles.listSubtitle}>Placa - Cliente - Paso actual</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {profile === 'administrativo' ? (
                <TouchableOpacity
                  onPress={() => setViewMode((m) => (m === 'active' ? 'history' : 'active'))}
                  activeOpacity={0.85}
                  style={[styles.listCountPill, { paddingHorizontal: 10 }]}
                >
                  <Text style={styles.listCountText}>{viewMode === 'active' ? 'ACTIVOS' : 'HISTORIAL'}</Text>
                </TouchableOpacity>
              ) : null}
              <View style={styles.listCountPill}>
                <Text style={styles.listCountText}>{autos.length}</Text>
              </View>
            </View>
          </View>
          {autos.length ? (
            autos.map((item, index) => (
              <View
                key={item.id || `${item.placa}-${index}`}
                style={[styles.vehicleCard, index > 0 && styles.vehicleRowSpacing]}
              >
                <TouchableOpacity
                  style={styles.vehicleMain}
                  activeOpacity={0.85}
                  onPress={() => openVehicle(item)}
                >
                  <View style={styles.vehicleBadge}>
                    <Icon name="car" size={16} color={COLORS.surface} />
                  </View>
                  <View style={styles.vehicleText}>
                    <Text style={styles.vehicleName} numberOfLines={1}>
                      {item.placa}
                    </Text>
                    <Text style={styles.vehicleDetail} numberOfLines={1}>
                      {item.cliente}
                    </Text>
                  </View>
                  <View style={styles.stepPill}>
                    <Text style={styles.stepText} numberOfLines={2}>
                      {item.paso || VCARS_STEP_TITLES[item.stepIndex] || 'Pendiente'}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => removeVehicle(item.id)}
                  activeOpacity={0.8}
                >
                  <Icon name="close" size={14} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Sin autos inscritos por ahora.</Text>
          )}
        </View>

      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <View style={styles.activeIconWrapMuted}>
            <Icon name="home" size={18} color={COLORS.textMuted} />
          </View>
          <Text style={styles.navText}>INICIO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.activeIconWrap}>
            <Icon name="document-text" size={18} color={COLORS.surface} />
          </View>
          <Text style={[styles.navText, styles.navTextActive]}>PROCESO</Text>
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

export default IngresoActivo

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
  scrollContent: {
    paddingBottom: 110,
  },
  listCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  listSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  listCountPill: {
    minWidth: 34,
    paddingHorizontal: 8,
    height: 26,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listCountText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  vehicleRowSpacing: {
    marginTop: 12,
  },
  vehicleMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    flexShrink: 1,
    alignItems: 'flex-start',
  },
  vehicleName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  vehicleDetail: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  stepPill: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 160,
  },
  stepText: {
    color: COLORS.blueLight,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 9,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
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
  activeIconWrapMuted: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceAlt,
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


