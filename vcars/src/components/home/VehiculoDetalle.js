import React from 'react'
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image, Animated, Easing } from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import {
  VCARS_STEP_TITLES,
  getVisibleSteps,
  normalizeStepTitle,
  stepIndexFromTitle,
} from '../../lib/vcarsProcess'

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

const PROFILE_KEY = '@vcars_profile'

const ENTRIES_KEY = '@vcars_entries'

const VehiculoDetalle = ({ navigation, route }) => {
  const vehicle = route?.params?.vehicle || {}
  const normalizedPaso = normalizeStepTitle(vehicle.paso)
  const [currentStepIndex, setCurrentStepIndex] = React.useState(stepIndexFromTitle(normalizedPaso))
  const [currentStepLabel, setCurrentStepLabel] = React.useState(normalizedPaso || '')
  const [profile, setProfile] = React.useState('administrativo')
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

  React.useEffect(() => {
    let mounted = true
    const loadProcess = async () => {
      const savedProfile = await AsyncStorage.getItem(PROFILE_KEY)
      if (mounted && savedProfile) setProfile(savedProfile)
      const entriesRaw = await AsyncStorage.getItem(ENTRIES_KEY)
      const entries = entriesRaw ? JSON.parse(entriesRaw) : []
      const entryId = vehicle?.id || vehicle?.placa
      const match = Array.isArray(entries)
        ? entries.find((item) => item.id === entryId || item.placa === entryId)
        : null
      if (!mounted) return
      if (match) {
        const stepIndex =
          typeof match.stepIndex === 'number'
            ? match.stepIndex
            : Math.max(0, VCARS_STEP_TITLES.findIndex((step) => step === match.paso))
        if (stepIndex >= 0 && stepIndex < VCARS_STEP_TITLES.length) {
          setCurrentStepIndex(stepIndex)
          setCurrentStepLabel(VCARS_STEP_TITLES[stepIndex])
          return
        }
      }
      const fallbackIndex = Math.max(
        0,
        VCARS_STEP_TITLES.findIndex((step) => step === vehicle.paso),
      )
      setCurrentStepIndex(fallbackIndex)
      setCurrentStepLabel(vehicle.paso || '')
    }
    loadProcess()
    const unsub = navigation.addListener('focus', loadProcess)
    return () => {
      mounted = false
      if (unsub) unsub()
    }
  }, [navigation, vehicle.paso])

  useFocusEffect(
    React.useCallback(() => {
      const ensureLogin = async () => {
        const savedProfile = await AsyncStorage.getItem(PROFILE_KEY)
        if (!savedProfile) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        }
      }
      ensureLogin()
    }, [navigation]),
  )

  const visibleSteps = getVisibleSteps(profile)
  const visibleStepIndices = visibleSteps.map((item) => item.index)
  const displayCurrentIndex = (() => {
    if (visibleStepIndices.includes(currentStepIndex)) {
      return visibleStepIndices.indexOf(currentStepIndex)
    }
    const prior = visibleStepIndices.filter((idx) => idx <= currentStepIndex).pop()
    return prior !== undefined ? visibleStepIndices.indexOf(prior) : 0
  })()

  return (
    <View style={styles.container}>
      <View style={styles.bgOrbLeft} />
      <View style={styles.bgOrbRight} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={20} color={COLORS.surface} />
        </TouchableOpacity>
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
          <Text style={styles.tagline}>Detalle del vehiculo</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Placa</Text>
            <Text style={styles.infoValue}>{vehicle.placa || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cliente</Text>
            <Text style={styles.infoValue}>{vehicle.cliente || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vehiculo</Text>
            <Text style={styles.infoValue}>{vehicle.vehiculo || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Telefono</Text>
            <Text style={styles.infoValue}>{vehicle.telefono || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Paso actual</Text>
            <Text style={styles.infoValue}>{currentStepLabel || '-'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Linea de tiempo</Text>
          {visibleSteps.map((step, index) => {
            const done = index <= displayCurrentIndex
            return (
              <View key={step.key} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, done && styles.timelineDotDone]} />
                  {index < visibleSteps.length - 1 && (
                    <View style={[styles.timelineLine, done && styles.timelineLineDone]} />
                  )}
                </View>
                <Text style={[styles.timelineText, done && styles.timelineTextDone]}>
                  {step.title}
                </Text>
              </View>
            )
          })}
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.9}
            onPress={() => {
              if (profile === 'cliente') {
                navigation.navigate('MisVehiculos')
                return
              }
              navigation.navigate('OrdenServicio', {
                startStep: visibleSteps[displayCurrentIndex]?.index ?? currentStepIndex,
                entryId: vehicle?.id || vehicle?.placa || null,
              })
            }}
          >
            <Text style={styles.primaryBtnText}>Continuar</Text>
            <Icon name="arrow-forward" size={16} color={COLORS.surfaceAlt} />
          </TouchableOpacity>
        </View>

        {profile !== 'cliente' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Formularios</Text>
            {visibleSteps.map((step, index) => (
              <TouchableOpacity
                key={step.key}
                style={styles.formRow}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate('OrdenServicio', {
                    startStep: step.index,
                    entryId: vehicle?.id || vehicle?.placa || null,
                  })
                }
              >
                <View style={styles.formDotWrap}>
                  <View
                    style={[
                      styles.formDot,
                      index <= displayCurrentIndex && styles.formDotDone,
                    ]}
                  />
                </View>
                <Text style={styles.formText}>{step.title}</Text>
                <Icon name="create-outline" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Vista cliente</Text>
            <View style={styles.clientBlock}>
              <Text style={styles.clientTitle}>Recepcion</Text>
              <Text style={styles.clientText}>Placa: {vehicle.placa || '-'}</Text>
              <Text style={styles.clientText}>Vehiculo: {vehicle.vehiculo || '-'}</Text>
              <Text style={styles.clientText}>Cliente: {vehicle.cliente || '-'}</Text>
              <Text style={styles.clientText}>Telefono: {vehicle.telefono || '-'}</Text>
            </View>
            <View style={styles.clientBlock}>
              <Text style={styles.clientTitle}>Aprobacion del cliente</Text>
              <Text style={styles.clientText}>
                Estado: {currentStepIndex >= 3 ? 'En proceso' : 'Pendiente'}
              </Text>
            </View>
            <View style={styles.clientBlock}>
              <Text style={styles.clientTitle}>Ejecucion en taller</Text>
              <Text style={styles.clientText}>
                Estado: {currentStepIndex >= 4 ? 'En taller' : 'Pendiente'}
              </Text>
            </View>
            <View style={styles.clientBlock}>
              <Text style={styles.clientTitle}>Entrega del vehiculo</Text>
              <Text style={styles.clientText}>
                Estado: {currentStepIndex >= 5 ? 'Entregado' : 'Pendiente'}
              </Text>
              <Text style={styles.clientText}>
                Resumen: {currentStepIndex >= 5 ? 'Vehiculo entregado.' : 'Aun en proceso.'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <View style={styles.activeIconWrapMuted}>
            <Icon name="home" size={18} color={COLORS.textMuted} />
          </View>
          <Text style={styles.navText}>INICIO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('IngresoActivo')}>
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

export default VehiculoDetalle

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
    gap: 12,
    alignItems: 'center',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.blueLight,
    justifyContent: 'center',
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
  scrollContent: {
    paddingBottom: 110,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  infoValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineLeft: {
    width: 18,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  timelineDotDone: {
    backgroundColor: COLORS.blueLight,
    borderColor: COLORS.blueLight,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
    backgroundColor: COLORS.border,
  },
  timelineLineDone: {
    backgroundColor: COLORS.blueLight,
  },
  timelineText: {
    color: COLORS.textMuted,
    fontSize: 12,
    paddingBottom: 12,
    flex: 1,
  },
  timelineTextDone: {
    color: COLORS.text,
    fontWeight: '700',
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: COLORS.text,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnText: {
    color: COLORS.surfaceAlt,
    fontSize: 14,
    fontWeight: '800',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  formDotWrap: {
    width: 18,
    alignItems: 'center',
  },
  formDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formDotDone: {
    backgroundColor: COLORS.blueLight,
    borderColor: COLORS.blueLight,
  },
  formText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  clientBlock: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  clientTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  clientText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 4,
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
