import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  PermissionsAndroid,
  Platform,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Icon from 'react-native-vector-icons/Ionicons'
import { launchCamera, launchImageLibrary } from 'react-native-image-picker'
import DateTimePicker from '@react-native-community/datetimepicker'
import { VCARS_STEPS, allowedStepIndices, normalizeStepTitle } from '../../lib/vcarsProcess'

const STORAGE_KEY = '@vcars_orden_servicio'
const STORAGE_MAP_KEY = '@vcars_orden_servicio_map'
const CURRENT_ENTRY_KEY = '@vcars_current_entry'
const ENTRIES_KEY = '@vcars_entries'
const PROFILE_KEY = '@vcars_profile'
const ORDER_COUNTER_KEY = '@vcars_order_counter'

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

const COMPANY_INFO = {
  nombre: 'V-CARS',
  direccion: 'Carrera 51 # 70-39',
  nit: '901561193',
  telefono: '601 4674619 - 3025729529',
  email: 'v-carssas@outlook.com',
}

const INVENTARIO = [
  'Radio',
  'CDs',
  'Encendedor',
  'Ceniceros',
  'Reloj',
  'Cinturon seguridad',
  'Tapetes',
  'Parasoles',
  'Forros',
  'Luces techo',
  'Espejos',
  'Chapas',
  'Kit carretera',
  'Llanta repuesto',
  'Herramienta',
  'Gato / Palanca',
  'Llaveros pernos',
  'Senales',
  'Antena',
  'Plumillas',
  'Exploradoras',
  'Tercer stop',
  'Tapa gasolina',
  'Copas ruedas',
  'Manijas',
  'Emblemas',
  'Llaves',
  'Control',
  'Llavero',
  'Tarjeta propiedad',
]

const STATUS_CYCLE = ['S', 'N', 'C', 'I']
const PAY_OPTIONS = ['Efectivo', 'Tarjeta', 'Transferencia', 'Credito', 'Otro']
const BANK_OPTIONS = ['Nequi', 'Daviplata']
const FUEL_OPTIONS = ['0%', '25%', '50%', '75%', '100%']
// Permisos por rol (MVP sin backend)
// - tecnico: recepcion + diagnostico interno + ejecucion
// - administrativo: recepcion + cotizacion al cliente + entrega/cierre (puede ver todo)
// - cliente: ver recepcion + autorizacion + entrega/estado
// See src/lib/vcarsProcess.js for the canonical process + permissions

const FIELD_LABELS = {
  ordenNo: 'Orden No.',
  fechaEntrada: 'Fecha entrada',
  fechaEntrega: 'Fecha prevista entrega',
  propietario: 'Propietario',
  nit: 'NIT / C.C',
  telefono: 'Telefono',
  email: 'E-mail',
  facturaNombre: 'Factura a nombre de',
  formaPago: 'Forma de pago',
  formaPagoOtro: 'Especificar otro',
  bancoTransferencia: 'Banco',
  pagoDias: 'Dias credito',
  placa: 'Placa',
  marca: 'Marca',
  modelo: 'Modelo',
  color: 'Color',
  empresa: 'Empresa / Entidad',
  direccion: 'Direccion',
  soatFV: 'SOAT (FV)',
  rtmFV: 'Rev. Tec. Mecanica (FV)',
  kilometraje: 'Kilometraje (km)',
  combustible: 'Nivel de combustible',
  fallaCliente: 'Falla reportada por el cliente',
  condicionFisica: 'Condicion fisica del auto',
  diagnosticoTecnico: 'Diagnostico del mecanico',
  trabajosSugeridos: 'Trabajos sugeridos',
  repuestosNecesarios: 'Repuestos necesarios',
  cotizacionSubtotal: 'Subtotal',
  cotizacionIva: 'IVA',
  cotizacionTotal: 'Total',
  cotizacionNumero: 'No. cotizacion',
  cotizacionFecha: 'Fecha de envio',
  aprobadoCliente: 'Aprobado',
  medioAprobacion: 'Medio de aprobacion',
  firmaAutoriza: 'Firma autorizacion',
  fechaAutoriza: 'Fecha autorizacion',
  tecnico: 'Tecnico asignado',
  trabajoRealizado: 'Trabajo realizado',
  piezasCambiadas: 'Piezas cambiadas',
  conservarPiezas: 'Conservar piezas',
  fechaEntregaReal: 'Fecha entrega real',
  firmaRecibe: 'Firma recibido',
  fechaRecibe: 'Fecha recibido',
}

const emptyForm = {
  ordenNo: '',
  fechaEntrada: '',
  fechaEntrega: '',
  propietario: '',
  nit: '',
  telefono: '',
  email: '',
  facturaNombre: '',
  formaPago: '',
  formaPagoOtro: '',
  bancoTransferencia: '',
  pagoDias: '',
  placa: '',
  marca: '',
  modelo: '',
  color: '',
  empresa: '',
  direccion: '',
  soatFV: '',
  rtmFV: '',
  kilometraje: '',
  combustible: '',
  fallaCliente: '',
  observaciones: '',
  inventario: {},
  inventarioNotas: '',
  condicionFisica: '',
  fotosVehiculo: [],
  cotizacionNumero: '',
  cotizacionCondiciones: '',
  cotizacionItems: [
    {
      sistema: '',
      trabajo: '',
      precio: '',
      cantidad: '',
      total: '',
    },
  ],
  cotizacionSubtotal: '',
  cotizacionIva: '',
  cotizacionTotal: '',
  cotizacionFecha: '',
  cotizacionObservaciones: '',
  tecnico: '',
  conservarPiezas: '',
  firmaAutoriza: '',
  fechaAutoriza: '',
  firmaRecibe: '',
  fechaRecibe: '',
  aprobadoCliente: '',
  medioAprobacion: '',
  trabajoRealizado: '',
  piezasCambiadas: '',
  observacionesEntrega: '',
  fechaEntregaReal: '',
}

const OrdenServicioWizard = ({ navigation, route }) => {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [completed, setCompleted] = useState([])
  const [errors, setErrors] = useState({})
  const [datePicker, setDatePicker] = useState({ show: false, key: null })
  const [showPayMenu, setShowPayMenu] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [entryId, setEntryId] = useState(null)
  const [profile, setProfile] = useState('administrativo')
  const saveTimer = useRef(null)
  const scrollRef = useRef(null)

  const steps = useMemo(() => VCARS_STEPS, [])

  useEffect(() => {
    const loadDraft = async () => {
      const savedProfile = await AsyncStorage.getItem(PROFILE_KEY)
      if (savedProfile) {
        setProfile(savedProfile)
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
        return
      }
      const entryId = route?.params?.entryId || null
      const saved = await AsyncStorage.getItem(STORAGE_KEY)
      const savedMapRaw = await AsyncStorage.getItem(STORAGE_MAP_KEY)
      const savedMap = savedMapRaw ? JSON.parse(savedMapRaw) : null
      const currentEntryRaw = await AsyncStorage.getItem(CURRENT_ENTRY_KEY)
      const currentEntry = currentEntryRaw ? JSON.parse(currentEntryRaw) : null
      const resolvedEntryId =
        entryId || currentEntry?.id || currentEntry?.placa || null
      setEntryId(resolvedEntryId)
      const applyEntry = (target) => {
        if (!currentEntry) return target
        const next = { ...target }
        // Normalize legacy step title if needed
        if (next.paso) next.paso = normalizeStepTitle(next.paso)
        if (!next.placa) next.placa = currentEntry.placa || next.placa
        if (!next.propietario) next.propietario = currentEntry.cliente || next.propietario
        if (!next.facturaNombre) next.facturaNombre = currentEntry.cliente || next.facturaNombre
        if (!next.telefono) next.telefono = currentEntry.telefono || next.telefono
        if (!next.marca && currentEntry.vehiculo) next.marca = currentEntry.vehiculo
        if (!next.modelo && currentEntry.vehiculo) next.modelo = currentEntry.vehiculo
        return next
      }
      const ensureOrderNo = async (draft) => {
        if (draft.ordenNo && String(draft.ordenNo).trim()) return draft
        const raw = await AsyncStorage.getItem(ORDER_COUNTER_KEY)
        let counter = parseInt(raw || '', 10)
        if (!counter || Number.isNaN(counter)) counter = 1001
        const ordenNo = `OS-${counter}`
        await AsyncStorage.setItem(ORDER_COUNTER_KEY, String(counter + 1))
        return { ...draft, ordenNo }
      }
      const routeStepRaw = route?.params?.startStep
      const routeStep =
        typeof routeStepRaw === 'number'
          ? routeStepRaw
          : typeof routeStepRaw === 'string' && routeStepRaw.trim() !== '' && !Number.isNaN(Number(routeStepRaw))
            ? Number(routeStepRaw)
            : null
      if (savedMap && resolvedEntryId && savedMap[resolvedEntryId]) {
        try {
          const parsed = savedMap[resolvedEntryId]
          const savedForm = parsed?.form || parsed
          const savedStep = typeof parsed?.step === 'number' ? parsed.step : 0
          const savedCompleted = Array.isArray(parsed?.completed) ? parsed.completed : []
          const mergedForm = {
            ...emptyForm,
            ...savedForm,
            inventario: savedForm?.inventario || {},
            fotosVehiculo: Array.isArray(savedForm?.fotosVehiculo)
              ? savedForm.fotosVehiculo
              : [],
            cotizacionItems: Array.isArray(savedForm?.cotizacionItems)
              ? savedForm.cotizacionItems
              : emptyForm.cotizacionItems,
          }
          const withOrder = await ensureOrderNo(applyEntry(mergedForm))
          setForm(withOrder)
          setCompleted(savedCompleted)
          const nextStep = routeStep !== null ? routeStep : savedStep
          if (nextStep >= 0 && nextStep < steps.length) setStep(nextStep)
        } catch (err) {
          setForm(emptyForm)
        }
      } else if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const savedEntryId = parsed?.entryId || null
          const sameEntry =
            resolvedEntryId && savedEntryId && resolvedEntryId === savedEntryId
          const savedForm = parsed?.form || parsed
          const savedStep = typeof parsed?.step === 'number' ? parsed.step : 0
          const savedCompleted = Array.isArray(parsed?.completed) ? parsed.completed : []
          if (sameEntry) {
            const mergedForm = {
              ...emptyForm,
              ...savedForm,
              inventario: savedForm?.inventario || {},
              fotosVehiculo: Array.isArray(savedForm?.fotosVehiculo)
                ? savedForm.fotosVehiculo
                : [],
            }
            const withOrder = await ensureOrderNo(applyEntry(mergedForm))
            setForm(withOrder)
            setCompleted(savedCompleted)
            const nextStep = routeStep !== null ? routeStep : savedStep
            if (nextStep >= 0 && nextStep < steps.length) setStep(nextStep)
          } else {
            const withOrder = await ensureOrderNo(applyEntry({ ...emptyForm }))
            setForm(withOrder)
            setCompleted([])
            if (routeStep !== null && routeStep >= 0 && routeStep < steps.length) {
              setStep(routeStep)
            }
          }
        } catch (err) {
          setForm(emptyForm)
        }
      } else {
        const withOrder = await ensureOrderNo(applyEntry({ ...emptyForm }))
        setForm(withOrder)
        if (routeStep !== null && routeStep >= 0 && routeStep < steps.length) {
          setStep(routeStep)
        }
      }
      setHydrated(true)
    }
    loadDraft()
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ form, step, completed, entryId }),
      )
      if (entryId) {
        const mapRaw = await AsyncStorage.getItem(STORAGE_MAP_KEY)
        const map = mapRaw ? JSON.parse(mapRaw) : {}
        const nextMap = { ...(map || {}) }
        nextMap[entryId] = { form, step, completed }
        await AsyncStorage.setItem(STORAGE_MAP_KEY, JSON.stringify(nextMap))
      }
    }, 500)
  }, [form, step, completed, entryId])

  const formatNumber = (raw) => {
    const digits = String(raw || '').replace(/\D/g, '')
    if (!digits) return ''
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  const parseNumber = (raw) => {
    const digits = String(raw || '').replace(/\D/g, '')
    return digits ? parseInt(digits, 10) : 0
  }

  const formatPhone = (raw) => String(raw || '').replace(/\D/g, '')

  const setField = (key, value) => {
    setForm((prev) => {
      let nextValue = value
      if (key === 'nit') {
        nextValue = String(value || '').replace(/\D/g, '')
      }
      if (key === 'cotizacionSubtotal' || key === 'cotizacionIva') {
        nextValue = formatNumber(value)
      }
      if (key === 'kilometraje') {
        nextValue = formatNumber(value)
      }
      if (key === 'pagoDias') {
        nextValue = formatPhone(value)
      }
      if (key === 'telefono') {
        nextValue = formatPhone(value)
      }
      const next = { ...prev, [key]: nextValue }
      if (key === 'cotizacionSubtotal' || key === 'cotizacionIva') {
        const sub = parseNumber(next.cotizacionSubtotal)
        const iva = parseNumber(next.cotizacionIva)
        next.cotizacionTotal = formatNumber(sub + iva)
      }
      return next
    })
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    if (Number.isNaN(d.getTime())) return ''
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const openDate = (key) => {
    setDatePicker({ show: true, key })
  }

  const onDateChange = (_, selectedDate) => {
    if (Platform.OS === 'android') {
      setDatePicker({ show: false, key: null })
    }
    if (selectedDate && datePicker.key) {
      setField(datePicker.key, formatDate(selectedDate))
    }
  }

  const toggleInventario = (item) => {
    setForm((prev) => {
      const current = prev.inventario[item] || 'S'
      const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length]
      return { ...prev, inventario: { ...prev.inventario, [item]: next } }
    })
  }

  const addFromCamera = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Permiso de camara',
          message: 'Necesitamos la camara para registrar el estado del vehiculo.',
          buttonPositive: 'Permitir',
          buttonNegative: 'Cancelar',
        },
      )
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        return
      }
    }

    const res = await launchCamera({
      mediaType: 'photo',
      quality: 0.7,
      saveToPhotos: true,
    })
    if (res?.assets?.length) {
      setForm((prev) => ({
        ...prev,
        fotosVehiculo: [...prev.fotosVehiculo, ...res.assets],
      }))
    }
  }

  const addFromGallery = async () => {
    const res = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 0,
      quality: 0.7,
    })
    if (res?.assets?.length) {
      setForm((prev) => ({
        ...prev,
        fotosVehiculo: [...prev.fotosVehiculo, ...res.assets],
      }))
    }
  }

  const removePhoto = (index) => {
    setForm((prev) => ({
      ...prev,
      fotosVehiculo: prev.fotosVehiculo.filter((_, i) => i !== index),
    }))
  }

  const updateCotizacionItem = (index, key, value) => {
    setForm((prev) => {
      const items = Array.isArray(prev.cotizacionItems) ? [...prev.cotizacionItems] : []
      const current = items[index] || { sistema: '', trabajo: '', precio: '', cantidad: '', total: '' }
      let nextValue = value
      if (key === 'precio' || key === 'cantidad') {
        nextValue = formatNumber(value)
      }
      const nextItem = { ...current, [key]: nextValue }
      const precio = parseNumber(nextItem.precio)
      const cantidad = parseNumber(nextItem.cantidad)
      nextItem.total = precio && cantidad ? formatNumber(precio * cantidad) : ''
      items[index] = nextItem
      const subtotal = items.reduce((sum, item) => sum + parseNumber(item.total), 0)
      const iva = Math.round(subtotal * 0.19)
      const total = subtotal + iva
      return {
        ...prev,
        cotizacionItems: items,
        cotizacionSubtotal: formatNumber(subtotal),
        cotizacionIva: formatNumber(iva),
        cotizacionTotal: formatNumber(total),
      }
    })
    setErrors((prev) => {
      if (!prev.cotizacionItems) return prev
      const next = { ...prev }
      delete next.cotizacionItems
      return next
    })
  }

  const addCotizacionItem = () => {
    setForm((prev) => {
      const items = Array.isArray(prev.cotizacionItems) ? [...prev.cotizacionItems] : []
      items.push({ sistema: '', trabajo: '', precio: '', cantidad: '', total: '' })
      return { ...prev, cotizacionItems: items }
    })
  }

  const removeCotizacionItem = (index) => {
    setForm((prev) => {
      const items = Array.isArray(prev.cotizacionItems) ? [...prev.cotizacionItems] : []
      if (items.length <= 1) return prev
      items.splice(index, 1)
      const subtotal = items.reduce((sum, item) => sum + parseNumber(item.total), 0)
      const iva = Math.round(subtotal * 0.19)
      const total = subtotal + iva
      return {
        ...prev,
        cotizacionItems: items,
        cotizacionSubtotal: formatNumber(subtotal),
        cotizacionIva: formatNumber(iva),
        cotizacionTotal: formatNumber(total),
      }
    })
  }

  const onSave = async () => {
    if (profile === 'cliente' && step !== 3) {
      navigation.goBack()
      return
    }
    const nextErrors = {}
    const isValidEmail = (value) => {
      const v = String(value || '').trim()
      if (!v) return false
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    }
    const requiredByStep = [
      [
        'ordenNo',
        'fechaEntrada',
        'fechaEntrega',
        'propietario',
        'nit',
        'telefono',
        'email',
        'facturaNombre',
        'formaPago',
        'placa',
        'marca',
        'modelo',
        'color',
        'empresa',
        'direccion',
        'soatFV',
        'rtmFV',
        'kilometraje',
        'combustible',
        'fallaCliente',
        'condicionFisica',
      ],
      ['cotizacionNumero', 'cotizacionFecha'],
      ['cotizacionSubtotal', 'cotizacionIva', 'cotizacionTotal', 'cotizacionFecha'],
      ['aprobadoCliente', 'medioAprobacion', 'firmaAutoriza', 'fechaAutoriza'],
      ['tecnico', 'trabajoRealizado', 'piezasCambiadas', 'conservarPiezas'],
      ['fechaEntregaReal', 'firmaRecibe', 'fechaRecibe'],
    ]

    requiredByStep[step].forEach((key) => {
      const value = form[key]
      if (value === undefined || value === null || String(value).trim() === '') {
        nextErrors[key] = 'Este campo es obligatorio'
      }
    })

    if (form.formaPago === 'Credito' && String(form.pagoDias || '').trim() === '') {
      nextErrors.pagoDias = 'Este campo es obligatorio'
    }
    if (form.formaPago === 'Otro' && String(form.formaPagoOtro || '').trim() === '') {
      nextErrors.formaPagoOtro = 'Este campo es obligatorio'
    }
    if (form.formaPago === 'Transferencia' && String(form.bancoTransferencia || '').trim() === '') {
      nextErrors.bancoTransferencia = 'Este campo es obligatorio'
    }

    if (!nextErrors.email && !isValidEmail(form.email)) {
      nextErrors.email = 'Correo invalido'
    }

    if (step === 1) {
      const items = Array.isArray(form.cotizacionItems) ? form.cotizacionItems : []
      const hasValidItem = items.some(
        (item) =>
          String(item.sistema || '').trim() &&
          String(item.trabajo || '').trim() &&
          parseNumber(item.precio) > 0 &&
          parseNumber(item.cantidad) > 0,
      )
      if (!hasValidItem) {
        nextErrors.cotizacionItems = 'Agrega al menos un item valido'
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      const missingKeys = Object.keys(nextErrors).filter((k) => nextErrors[k] === 'Este campo es obligatorio')
      const missingLabels = missingKeys.map((k) => FIELD_LABELS[k] || k)
      const missingPreview = missingLabels.slice(0, 4).join(', ')
      const toastMessage = missingLabels.length > 0
        ? `Completa: ${missingPreview}${missingLabels.length > 4 ? '...' : ''}`
        : 'Completa los campos obligatorios'
      setErrors(nextErrors)
      if (scrollRef.current?.scrollTo) {
        scrollRef.current.scrollTo({ y: 0, animated: true })
      }
      if (Platform.OS === 'android') {
        // eslint-disable-next-line global-require
        const ToastAndroid = require('react-native').ToastAndroid
        ToastAndroid.show(toastMessage, ToastAndroid.SHORT)
      } else {
        // eslint-disable-next-line no-alert
        alert(toastMessage)
      }
      return
    }

    const nextCompleted = Array.from(new Set([...(completed || []), step]))
    const nextStep = step < steps.length - 1 ? step + 1 : step

    // Keep entry state in sync
    const nextPasoTitle = steps[nextStep]?.title || steps[0]?.title
    const nextPaso = normalizeStepTitle(nextPasoTitle)
    const nextStatus = nextStep >= steps.length - 1 ? 'done' : 'active'
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        form,
        step: nextStep,
        completed: nextCompleted,
        entryId,
      }),
    )
    if (entryId) {
      const mapRaw = await AsyncStorage.getItem(STORAGE_MAP_KEY)
      const map = mapRaw ? JSON.parse(mapRaw) : {}
      const nextMap = { ...(map || {}) }
      nextMap[entryId] = { form, step: nextStep, completed: nextCompleted }
      await AsyncStorage.setItem(STORAGE_MAP_KEY, JSON.stringify(nextMap))
    }
    const targetEntryId =
      entryId ||
      form?.id ||
      form?.placa ||
      (form?.placa ? String(form.placa) : null)
    if (targetEntryId) {
      const entriesRaw = await AsyncStorage.getItem(ENTRIES_KEY)
      const entries = entriesRaw ? JSON.parse(entriesRaw) : []
      if (Array.isArray(entries)) {
        let matched = false
        const nextEntries = entries.map((item) => {
          if (item.id === targetEntryId || item.placa === targetEntryId) {
            matched = true
            return {
              ...item,
              paso: nextPaso,
              stepIndex: nextStep,
              status: nextStatus,
              updatedAt: new Date().toISOString(),
            }
          }
          return item
        })
        if (!matched) {
          const currentEntryRaw = await AsyncStorage.getItem(CURRENT_ENTRY_KEY)
          const currentEntry = currentEntryRaw ? JSON.parse(currentEntryRaw) : {}
          const paso = nextPaso
          const status = nextStatus
          nextEntries.unshift({
            id: currentEntry?.id || targetEntryId,
            placa: currentEntry?.placa || form.placa || String(targetEntryId),
            cliente: currentEntry?.cliente || form.propietario || 'Cliente',
            telefono: currentEntry?.telefono || form.telefono || '',
            vehiculo: currentEntry?.vehiculo || form.marca || '',
            paso: normalizeStepTitle(paso),
            stepIndex: nextStep,
            status,
            updatedAt: new Date().toISOString(),
          })
        }
        await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(nextEntries))
      }
    }
    setCompleted(nextCompleted)
    setStep(nextStep)
    if (step === 2 && profile === 'administrativo') {
      // Cotización al cliente (ADMIN)
      setTimeout(() => {
        if (Platform.OS === 'android') {
          // eslint-disable-next-line global-require
          const ToastAndroid = require('react-native').ToastAndroid
          ToastAndroid.show('Cotización enviada al cliente', ToastAndroid.SHORT)
        } else {
          // eslint-disable-next-line no-alert
          alert('Cotización enviada al cliente')
        }
      }, 100)
    }
    navigation.goBack()
  }

  const allowedIndices = allowedStepIndices(profile)

  const resolveAllowedStep = (target) => {
    if (allowedIndices.includes(target)) return target
    const prior = allowedIndices.filter((idx) => idx <= target).pop()
    return prior !== undefined ? prior : allowedIndices[0] ?? 0
  }

  useEffect(() => {
    if (!hydrated) return
    const next = resolveAllowedStep(step)
    if (next !== step) setStep(next)
  }, [hydrated, profile])

  const renderStep = () => {
    switch (step) {
      case 0:
        if (profile === 'cliente') {
          return (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Recepcion</Text>
              <View style={styles.infoCard}>
                <InfoRow label="Placa" value={form.placa || '-'} />
                <InfoRow label="Vehiculo" value={form.marca || '-'} />
                <InfoRow label="Cliente" value={form.propietario || '-'} />
                <InfoRow label="Telefono" value={form.telefono || '-'} />
                <InfoRow label="Fecha entrada" value={form.fechaEntrada || '-'} />
                <InfoRow label="Fecha prevista entrega" value={form.fechaEntrega || '-'} />
              </View>
            </View>
          )
        }
        return (
          <View style={styles.stack}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Orden de servicio</Text>
              <Field
                label="Orden No."
                value={form.ordenNo}
                onChange={() => {}}
                error={errors.ordenNo}
                editable={false}
                fixed
              />
              <DateField label="Fecha entrada" value={form.fechaEntrada} onPress={() => openDate('fechaEntrada')} error={errors.fechaEntrada} />
              <DateField label="Fecha prevista entrega" value={form.fechaEntrega} onPress={() => openDate('fechaEntrega')} error={errors.fechaEntrega} />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Cliente</Text>
              <Field label="Propietario" value={form.propietario} onChange={(v) => setField('propietario', v)} error={errors.propietario} />
              <Field label="NIT / C.C" value={form.nit} onChange={(v) => setField('nit', v)} keyboard="numeric" error={errors.nit} />
              <Field label="Telefono" value={form.telefono} onChange={(v) => setField('telefono', v)} keyboard="phone-pad" error={errors.telefono} />
              <Field label="E-mail" value={form.email} onChange={(v) => setField('email', v)} error={errors.email} />
              <Field label="Factura a nombre de" value={form.facturaNombre} onChange={(v) => setField('facturaNombre', v)} error={errors.facturaNombre} />
              <PaymentField
                label="Forma de pago"
                value={form.formaPago}
                error={errors.formaPago}
                open={showPayMenu}
                onToggle={() => setShowPayMenu((prev) => !prev)}
                onSelect={(v) => {
                  setField('formaPago', v)
                  setShowPayMenu(false)
                }}
              />
              {form.formaPago === 'Transferencia' ? (
                <SelectField
                  label="Banco"
                  value={form.bancoTransferencia}
                  error={errors.bancoTransferencia}
                  options={BANK_OPTIONS}
                  onSelect={(v) => setField('bancoTransferencia', v)}
                />
              ) : null}
              {form.formaPago === 'Otro' ? (
                <Field
                  label="Especificar otro"
                  value={form.formaPagoOtro}
                  onChange={(v) => setField('formaPagoOtro', v)}
                  error={errors.formaPagoOtro}
                />
              ) : null}
              {form.formaPago === 'Credito' ? (
                <Field
                  label="Dias credito (dias)"
                  value={form.pagoDias}
                  onChange={(v) => setField('pagoDias', v)}
                  keyboard="numeric"
                  error={errors.pagoDias}
                />
              ) : null}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Vehiculo</Text>
              <Field label="Placa" value={form.placa} onChange={(v) => setField('placa', v)} error={errors.placa} />
              <Field label="Marca" value={form.marca} onChange={(v) => setField('marca', v)} error={errors.marca} />
              <Field label="Modelo" value={form.modelo} onChange={(v) => setField('modelo', v)} error={errors.modelo} />
              <Field label="Color" value={form.color} onChange={(v) => setField('color', v)} error={errors.color} />
              <Field label="Empresa / Entidad" value={form.empresa} onChange={(v) => setField('empresa', v)} error={errors.empresa} />
              <Field label="Direccion" value={form.direccion} onChange={(v) => setField('direccion', v)} error={errors.direccion} />
              <DateField label="SOAT (FV)" value={form.soatFV} onPress={() => openDate('soatFV')} error={errors.soatFV} />
              <DateField label="Rev. Tec. Mecanica (FV)" value={form.rtmFV} onPress={() => openDate('rtmFV')} error={errors.rtmFV} />
              <Field label="Kilometraje (km)" value={form.kilometraje} onChange={(v) => setField('kilometraje', v)} keyboard="numeric" error={errors.kilometraje} />
              <SelectField
                label="Nivel de combustible"
                value={form.combustible}
                error={errors.combustible}
                options={FUEL_OPTIONS}
                onSelect={(v) => setField('combustible', v)}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Falla y observaciones</Text>
              <Field label="Falla reportada por el cliente" value={form.fallaCliente} onChange={(v) => setField('fallaCliente', v)} multiline error={errors.fallaCliente} />
              <Field label="Observaciones / Accesorios adicionales" value={form.observaciones} onChange={(v) => setField('observaciones', v)} multiline />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Inventario</Text>
              <Text style={styles.legend}>S: Si  N: No  C: Completo  I: Incompleto</Text>
              <View style={styles.inventoryGrid}>
                {INVENTARIO.map((item) => (
                  <TouchableOpacity key={item} style={styles.inventoryItem} onPress={() => toggleInventario(item)}>
                    <Text style={styles.inventoryName}>{item}</Text>
                    <View style={styles.inventoryBadge}>
                      <Text style={styles.inventoryBadgeText}>{form.inventario[item] || 'S'}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <Field label="Notas de inventario" value={form.inventarioNotas} onChange={(v) => setField('inventarioNotas', v)} multiline />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Condicion fisica y fotos</Text>
              <Field label="Condicion fisica del auto" value={form.condicionFisica} onChange={(v) => setField('condicionFisica', v)} multiline error={errors.condicionFisica} />
              <Text style={styles.sectionLabel}>Fotos del vehiculo</Text>
              <View style={styles.photoActions}>
                <TouchableOpacity style={styles.photoBtn} onPress={addFromCamera}>
                  <Icon name="camera" size={16} color={COLORS.surface} />
                  <Text style={styles.photoBtnText}>Camara</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoBtnOutline} onPress={addFromGallery}>
                  <Icon name="images" size={16} color={COLORS.text} />
                  <Text style={styles.photoBtnOutlineText}>Galeria</Text>
                </TouchableOpacity>
              </View>
              {(form.fotosVehiculo || []).length > 0 && (
                <View style={styles.photoGrid}>
                  {(form.fotosVehiculo || []).map((img, index) => (
                    <View key={`${img.uri}-${index}`} style={styles.photoCard}>
                      <Image source={{ uri: img.uri }} style={styles.photo} />
                      <TouchableOpacity style={styles.photoRemove} onPress={() => removePhoto(index)}>
                        <Icon name="close" size={14} color={COLORS.surface} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )
      case 1:
        if (profile === 'cliente') return null
        return (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Cotizacion detallada</Text>

            <Text style={styles.sectionLabel}>Datos empresa</Text>
            <View style={styles.infoCard}>
              <InfoRow label="Empresa" value={COMPANY_INFO.nombre} />
              <InfoRow label="Direccion" value={COMPANY_INFO.direccion} />
              <InfoRow label="NIT" value={COMPANY_INFO.nit} />
              <InfoRow label="Telefono" value={COMPANY_INFO.telefono} />
              <InfoRow label="Email" value={COMPANY_INFO.email} />
            </View>

            <Text style={styles.sectionLabel}>Datos cliente</Text>
            <View style={styles.infoCard}>
              <InfoRow label="Cliente" value={form.propietario || '-'} />
              <InfoRow label="NIT / C.C" value={form.nit || '-'} />
              <InfoRow label="Telefono" value={form.telefono || '-'} />
              <InfoRow label="Email" value={form.email || '-'} />
            </View>

            <View style={styles.rowSplit}>
              <View style={styles.rowCol}>
                <Field
                  label="No. cotizacion"
                  value={form.cotizacionNumero}
                  onChange={(v) => setField('cotizacionNumero', v)}
                  error={errors.cotizacionNumero}
                />
              </View>
              <View style={styles.rowCol}>
                <DateField
                  label="Fecha"
                  value={form.cotizacionFecha}
                  onPress={() => openDate('cotizacionFecha')}
                  error={errors.cotizacionFecha}
                />
              </View>
            </View>

            <Field label="Placa" value={form.placa} onChange={() => {}} editable={false} />

            <Text style={styles.sectionLabel}>Items de cotizacion</Text>
            {(form.cotizacionItems || []).map((item, index) => (
              <View key={`item-${index}`} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>Item {index + 1}</Text>
                  {form.cotizacionItems.length > 1 ? (
                    <TouchableOpacity
                      style={styles.itemRemove}
                      onPress={() => removeCotizacionItem(index)}
                    >
                      <Icon name="trash" size={14} color={COLORS.surface} />
                    </TouchableOpacity>
                  ) : null}
                </View>
                <Field
                  label="Actividad"
                  value={item.sistema}
                  onChange={(v) => updateCotizacionItem(index, 'sistema', v)}
                />
                <Field
                  label="Trabajo o repuesto"
                  value={item.trabajo}
                  onChange={(v) => updateCotizacionItem(index, 'trabajo', v)}
                />
                <View style={styles.rowSplit}>
                  <View style={styles.rowCol}>
                    <Field
                      label="Precio unitario (COP)"
                      value={item.precio}
                      onChange={(v) => updateCotizacionItem(index, 'precio', v)}
                      keyboard="numeric"
                    />
                  </View>
                  <View style={styles.rowCol}>
                    <Field
                      label="Cantidad"
                      value={item.cantidad}
                      onChange={(v) => updateCotizacionItem(index, 'cantidad', v)}
                      keyboard="numeric"
                    />
                  </View>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total item</Text>
                  <Text style={styles.totalValue}>
                    {item.total ? `$ ${item.total}` : '$ 0'}
                  </Text>
                </View>
              </View>
            ))}
            {errors.cotizacionItems ? (
              <Text style={styles.errorText}>{errors.cotizacionItems}</Text>
            ) : null}
            <TouchableOpacity style={styles.addItemBtn} onPress={addCotizacionItem}>
              <Icon name="add" size={16} color={COLORS.surface} />
              <Text style={styles.addItemText}>Agregar item</Text>
            </TouchableOpacity>

            <View style={styles.totalsCard}>
              <InfoRow label="Subtotal" value={form.cotizacionSubtotal ? `$ ${form.cotizacionSubtotal}` : '$ 0'} />
              <InfoRow label="IVA 19%" value={form.cotizacionIva ? `$ ${form.cotizacionIva}` : '$ 0'} />
              <InfoRow label="Total" value={form.cotizacionTotal ? `$ ${form.cotizacionTotal}` : '$ 0'} />
            </View>

            <Field
              label="Condiciones de pago"
              value={form.cotizacionCondiciones}
              onChange={(v) => setField('cotizacionCondiciones', v)}
              multiline
            />
          </View>
        )
      case 2:
        if (profile !== 'administrativo') return null
        return (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Cotizacion</Text>
            <Field label="Subtotal (COP)" value={form.cotizacionSubtotal} onChange={(v) => setField('cotizacionSubtotal', v)} keyboard="numeric" error={errors.cotizacionSubtotal} />
            <Field label="IVA (COP)" value={form.cotizacionIva} onChange={(v) => setField('cotizacionIva', v)} keyboard="numeric" error={errors.cotizacionIva} />
            <Field label="Total (COP)" value={form.cotizacionTotal} onChange={() => {}} keyboard="numeric" error={errors.cotizacionTotal} editable={false} />
            <DateField label="Fecha de envio" value={form.cotizacionFecha} onPress={() => openDate('cotizacionFecha')} error={errors.cotizacionFecha} />
            <Field label="Observaciones" value={form.cotizacionObservaciones} onChange={(v) => setField('cotizacionObservaciones', v)} multiline />
          </View>
        )
      case 3:
        if (profile === 'tecnico') return null
        return (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Aprobacion del cliente</Text>
            <Field label="Aprobado (Si/No)" value={form.aprobadoCliente} onChange={(v) => setField('aprobadoCliente', v)} error={errors.aprobadoCliente} />
            <Field label="Medio de aprobacion" value={form.medioAprobacion} onChange={(v) => setField('medioAprobacion', v)} error={errors.medioAprobacion} />
            <Field label="Firma autorizacion (cliente)" value={form.firmaAutoriza} onChange={(v) => setField('firmaAutoriza', v)} error={errors.firmaAutoriza} />
            <DateField label="Fecha autorizacion" value={form.fechaAutoriza} onPress={() => openDate('fechaAutoriza')} error={errors.fechaAutoriza} />
          </View>
        )
      case 4:
        if (profile === 'cliente') {
          return (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Ejecucion en taller</Text>
              <Text style={styles.helper}>Tu vehiculo esta siendo atendido en nuestro taller.</Text>
            </View>
          )
        }
        return (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ejecucion en taller</Text>
            <Field label="Tecnico asignado" value={form.tecnico} onChange={(v) => setField('tecnico', v)} error={errors.tecnico} />
            <Field label="Trabajo realizado" value={form.trabajoRealizado} onChange={(v) => setField('trabajoRealizado', v)} multiline error={errors.trabajoRealizado} />
            <Field label="Piezas cambiadas" value={form.piezasCambiadas} onChange={(v) => setField('piezasCambiadas', v)} multiline error={errors.piezasCambiadas} />
            <Field label="Cliente desea conservar piezas (Si/No)" value={form.conservarPiezas} onChange={(v) => setField('conservarPiezas', v)} error={errors.conservarPiezas} />
          </View>
        )
      case 5:
        if (profile === 'cliente') {
          return (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Entrega del vehiculo</Text>
              <InfoRow label="Fecha entrega" value={form.fechaEntregaReal || '-'} />
              <InfoRow label="Recibido por" value={form.firmaRecibe || '-'} />
              <Text style={styles.helper}>
                Resumen: {form.observacionesEntrega || 'Tu vehiculo sera entregado segun el proceso.'}
              </Text>
            </View>
          )
        }
        return (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Entrega del vehiculo</Text>
            <DateField label="Fecha entrega real" value={form.fechaEntregaReal} onPress={() => openDate('fechaEntregaReal')} error={errors.fechaEntregaReal} />
            <Field label="Firma recibido" value={form.firmaRecibe} onChange={(v) => setField('firmaRecibe', v)} error={errors.firmaRecibe} />
            <DateField label="Fecha recibido" value={form.fechaRecibe} onPress={() => openDate('fechaRecibe')} error={errors.fechaRecibe} />
            <Field label="Observaciones de entrega" value={form.observacionesEntrega} onChange={(v) => setField('observacionesEntrega', v)} multiline />
          </View>
        )
      default:
        return null
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Orden de servicio</Text>
          <Text style={styles.subtitle}>{steps[step].title}</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        key={step}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.navBtnPrimary} onPress={onSave}>
          <Text style={styles.navBtnPrimaryText}>Guardar y volver</Text>
          <Icon name="checkmark" size={16} color={COLORS.surface} />
        </TouchableOpacity>
      </View>

      {datePicker.show && (
        <DateTimePicker
          value={form[datePicker.key] ? new Date(form[datePicker.key]) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}
    </View>
  )
}

const Field = ({ label, value, onChange, multiline, keyboard, error, editable = true, fixed = false }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        multiline && styles.inputMultiline,
        error && styles.inputError,
        !editable && styles.inputDisabled,
        fixed && styles.inputFixed,
      ]}
      value={value}
      onChangeText={onChange}
      multiline={multiline}
      keyboardType={keyboard}
      placeholderTextColor="#6E7A8A"
      editable={editable}
    />
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
)

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
)

const DateField = ({ label, value, onPress, error }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={[styles.input, styles.dateInput, error && styles.inputError]} onPress={onPress}>
      <Text style={styles.dateText}>{value || 'Seleccionar fecha'}</Text>
      <Icon name="calendar" size={16} color="#6E7A8A" />
    </TouchableOpacity>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
)

const PaymentField = ({ label, value, error, open, onToggle, onSelect }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity
      style={[styles.input, styles.selectInput, error && styles.inputError]}
      onPress={onToggle}
      activeOpacity={0.85}
    >
      <Text style={styles.selectText}>{value || 'Seleccionar'}</Text>
      <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#6E7A8A" />
    </TouchableOpacity>
    {open && (
      <View style={styles.selectMenu}>
        {PAY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={styles.selectOption}
            onPress={() => onSelect(option)}
          >
            <Text style={styles.selectOptionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
)

const SelectField = ({ label, value, error, options, onSelect }) => {
  const [open, setOpen] = useState(false)
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, styles.selectInput, error && styles.inputError]}
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.85}
      >
        <Text style={styles.selectText}>{value || 'Seleccionar'}</Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#6E7A8A" />
      </TouchableOpacity>
      {open && (
        <View style={styles.selectMenu}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.selectOption}
              onPress={() => {
                onSelect(option)
                setOpen(false)
              }}
            >
              <Text style={styles.selectOptionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  )
}

export default OrdenServicioWizard

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingTop: 44,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  stepBadge: {
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  stepper: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 6,
  },
  stepDot: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceAlt,
  },
  stepDotActive: {
    backgroundColor: COLORS.blueLight,
  },
  content: {
    padding: 20,
    paddingBottom: 140,
  },
  stack: {
    gap: 14,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#0F141E',
    color: COLORS.text,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  inputError: {
    borderColor: COLORS.red,
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  inputDisabled: {
    opacity: 0.7,
  },
  inputFixed: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  dateInput: {
    height: 46,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  dateText: {
    color: COLORS.text,
    fontSize: 14,
  },
  selectInput: {
    height: 46,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  selectText: {
    color: COLORS.text,
    fontSize: 14,
  },
  selectMenu: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
    overflow: 'hidden',
  },
  selectOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectOptionText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: COLORS.red,
    fontSize: 10,
    marginTop: 6,
  },
  legend: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 10,
  },
  inventoryGrid: {
    gap: 8,
    marginBottom: 12,
  },
  inventoryItem: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inventoryName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  inventoryBadge: {
    backgroundColor: COLORS.blueLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  inventoryBadgeText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '800',
  },
  sectionLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  photoBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  photoBtnText: {
    color: COLORS.surface,
    fontWeight: '800',
  },
  photoBtnOutline: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  photoBtnOutlineText: {
    color: COLORS.text,
    fontWeight: '700',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photo: {
    width: '100%',
    height: 120,
  },
  photoRemove: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helper: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 6,
  },
  infoCard: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  infoValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  rowSplit: {
    flexDirection: 'row',
    gap: 10,
  },
  rowCol: {
    flex: 1,
  },
  itemCard: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemTitle: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 12,
  },
  itemRemove: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  totalLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  totalValue: {
    color: COLORS.text,
    fontWeight: '800',
    fontSize: 12,
  },
  addItemBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  addItemText: {
    color: COLORS.surface,
    fontWeight: '800',
    fontSize: 12,
  },
  totalsCard: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.bg,
  },
  navBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  navBtnText: {
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 13,
  },
  navBtnPrimary: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.blueLight,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  navBtnPrimaryText: {
    color: COLORS.surface,
    fontWeight: '800',
    fontSize: 13,
  },
})
