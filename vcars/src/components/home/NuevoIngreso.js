import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Image,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Icon from 'react-native-vector-icons/Ionicons'
import { useFocusEffect } from '@react-navigation/native'
import { BackHandler } from 'react-native'

import { createIngreso } from '../../lib/vcarsApi'

const CURRENT_ENTRY_KEY = '@vcars_current_entry'
const ENTRIES_KEY = '@vcars_entries'
const STORAGE_KEY = '@vcars_orden_servicio'

const COLORS = {
  bg: '#05070B',
  surface: '#0E1117',
  border: '#1D2433',
  text: '#F5F7FA',
  textMuted: '#9AA4B2',
  blue: '#1F4D7A',
  blueLight: '#86B9E6',
  red: '#D43A3A',
}

const NuevoIngreso = ({ navigation, route }) => {
  const [placa, setPlaca] = useState('')
  const [cliente, setCliente] = useState('')
  const [telefono, setTelefono] = useState('')
  const [vehiculo, setVehiculo] = useState('')
  const [recibio, setRecibio] = useState('')
  const [errors, setErrors] = useState({})

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

  const isEdit = route?.params?.mode === 'edit' && Boolean(route?.params?.entry)
  const isNew = route?.params?.mode === 'new'

  useFocusEffect(
    React.useCallback(() => {
      const loadForEdit = async () => {
        if (isNew) {
          setPlaca('')
          setCliente('')
          setTelefono('')
          setVehiculo('')
          setRecibio('')
          return
        }
        if (isEdit) {
          const fromParams = route?.params?.entry
          const fromStorage = await AsyncStorage.getItem(CURRENT_ENTRY_KEY)
          const last = fromParams || (fromStorage ? JSON.parse(fromStorage) : {})
          setPlaca(last.placa || '')
          setCliente(last.cliente || '')
        setTelefono(last.telefono || '')
          setVehiculo(last.vehiculo || '')
          setRecibio(last.recibio || '')
          return
        }
        setPlaca('')
        setCliente('')
        setTelefono('')
        setVehiculo('')
        setRecibio('')
      }
      loadForEdit()
    }, [isEdit, isNew, route?.params?.entry]),
  )

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('Home')
        return true
      }
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress)
      return () => sub.remove()
    }, [navigation]),
  )

  const onNext = async () => {
    const nextErrors = {}
    if (!placa.trim()) nextErrors.placa = 'Obligatorio'
    if (!cliente.trim()) nextErrors.cliente = 'Obligatorio'
    if (!telefono.trim()) nextErrors.telefono = 'Obligatorio'
    if (!vehiculo.trim()) nextErrors.vehiculo = 'Obligatorio'
    if (!recibio.trim()) nextErrors.recibio = 'Obligatorio'
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    // MVP: conectamos este flujo al backend (vcars-api)
    // Nota: la app todavía maneja proceso/roles en local, pero el ingreso queda creado en BD.
    let backend = null
    try {
      backend = await createIngreso({
        plate: placa.trim(),
        customerName: cliente.trim(),
        customerPhone: telefono.trim(),
        vehicleModel: vehiculo.trim(),
        receivedBy: recibio.trim(),
      })
    } catch (e) {
      // Si falla el backend, dejamos el flujo local para no bloquear al usuario.
      console.warn('No se pudo crear ingreso en backend:', e?.message || e)
    }

    const id = isEdit && route?.params?.entry?.id ? route.params.entry.id : `entry-${Date.now()}`
    const payload = {
      id,
      // Campos legacy usados por pantallas actuales
      placa: placa.trim() || 'SIN PLACA',
      cliente: cliente.trim() || 'Cliente',
      telefono: telefono.trim(),
      vehiculo: vehiculo.trim(),
      recibio: recibio.trim(),
      paso: 'Recepcion y orden de servicio',
      fecha: new Date().toISOString(),

      // Datos reales desde el backend
      backend: backend
        ? {
            vehicleId: backend.vehicle?.id,
            entryId: backend.entry?.id,
            apiBaseUrl: 'vcars-api',
          }
        : null,
    }

    if (!isEdit) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ form: {}, step: 0, completed: [] }))
    }

    await AsyncStorage.setItem(CURRENT_ENTRY_KEY, JSON.stringify(payload))
    const saved = await AsyncStorage.getItem(ENTRIES_KEY)
    const list = saved ? JSON.parse(saved) : []
    let nextList = Array.isArray(list) ? list : []
    if (isEdit) {
      nextList = nextList.map((item) => (item.id === id ? { ...item, ...payload } : item))
    } else {
      nextList = [payload, ...nextList]
    }
    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(nextList))
    navigation.navigate('IngresoActivo', { entry: payload })
  }

  return (
    <View style={styles.container}>
      <View style={styles.bgOrb} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
          <Text style={styles.title}>{isEdit ? 'Editar ingreso' : 'Nuevo ingreso'}</Text>
          <Text style={styles.subtitle}>Registra los datos del vehiculo</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.inputWrap}>
              <Text style={styles.label}>Placa</Text>
            <TextInput
              style={styles.input}
              placeholder="ABC123"
              placeholderTextColor="#6E7A8A"
              value={placa}
              onChangeText={(v) => {
                setPlaca(v)
                if (errors.placa) setErrors((prev) => ({ ...prev, placa: null }))
              }}
              autoCapitalize="characters"
            />
            {errors.placa ? <Text style={styles.errorText}>{errors.placa}</Text> : null}
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>Telefono</Text>
            <TextInput
              style={styles.input}
                placeholder="3000000000"
                placeholderTextColor="#6E7A8A"
                value={telefono}
              onChangeText={(v) => {
                setTelefono(v)
                if (errors.telefono) setErrors((prev) => ({ ...prev, telefono: null }))
              }}
              keyboardType="phone-pad"
            />
            {errors.telefono ? <Text style={styles.errorText}>{errors.telefono}</Text> : null}
          </View>
        </View>

          <View style={styles.inputWrapFull}>
            <Text style={styles.label}>Cliente</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre del cliente"
            placeholderTextColor="#6E7A8A"
            value={cliente}
            onChangeText={(v) => {
              setCliente(v)
              if (errors.cliente) setErrors((prev) => ({ ...prev, cliente: null }))
            }}
          />
          {errors.cliente ? <Text style={styles.errorText}>{errors.cliente}</Text> : null}
        </View>

          <View style={styles.inputWrapFull}>
            <Text style={styles.label}>Marca / Modelo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Mazda 3 Touring"
              placeholderTextColor="#6E7A8A"
              value={vehiculo}
              onChangeText={(v) => {
                setVehiculo(v)
                if (errors.vehiculo) setErrors((prev) => ({ ...prev, vehiculo: null }))
              }}
              returnKeyType="done"
              onSubmitEditing={onNext}
            />
            {errors.vehiculo ? <Text style={styles.errorText}>{errors.vehiculo}</Text> : null}
          </View>

          <View style={styles.inputWrapFull}>
            <Text style={styles.label}>Recibio el vehiculo</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del recepcionista"
              placeholderTextColor="#6E7A8A"
              value={recibio}
              onChangeText={(v) => {
                setRecibio(v)
                if (errors.recibio) setErrors((prev) => ({ ...prev, recibio: null }))
              }}
              returnKeyType="done"
            />
            {errors.recibio ? <Text style={styles.errorText}>{errors.recibio}</Text> : null}
          </View>

          <TouchableOpacity style={styles.button} onPress={onNext} activeOpacity={0.9}>
            <Text style={styles.buttonText}>Guardar ingreso</Text>
            <Icon name="arrow-forward" size={16} color={COLORS.surface} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

export default NuevoIngreso

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  bgOrb: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: COLORS.blue,
    top: -120,
    right: -120,
    opacity: 0.45,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 18,
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

  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 14,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 6,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrap: {
    flex: 1,
  },
  inputWrapFull: {
    marginTop: 14,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#0F141E',
    color: COLORS.text,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.red,
    fontSize: 10,
    marginTop: 6,
  },
  button: {
    marginTop: 18,
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonText: {
    color: COLORS.surface,
    fontSize: 15,
    fontWeight: '800',
  },
})





