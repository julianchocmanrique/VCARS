import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Icon from 'react-native-vector-icons/Ionicons'

import { CLIENT_IDENTITY_KEY } from '../../lib/vcarsClientIdentity'

const PROFILE_KEY = '@vcars_profile'
const ENTRIES_KEY = '@vcars_entries'

const COLORS = {
  bg: '#0B0F17',
  surface: '#0F1624',
  surfaceAlt: 'rgba(255,255,255,0.06)',
  text: '#EAF0FF',
  muted: 'rgba(234,240,255,0.65)',
  border: 'rgba(255,255,255,0.10)',
  accent: '#86B9E6',
}

function normalizePlate(p) {
  return String(p || '').trim().toUpperCase()
}

export default function MisVehiculos({ navigation }) {
  const [plates, setPlates] = React.useState([])
  const [entries, setEntries] = React.useState([])

  const load = React.useCallback(async () => {
    const profile = await AsyncStorage.getItem(PROFILE_KEY)
    if (profile !== 'cliente') {
      navigation.replace('Home')
      return
    }

    let identity = null
    try {
      const raw = await AsyncStorage.getItem(CLIENT_IDENTITY_KEY)
      identity = raw ? JSON.parse(raw) : null
    } catch {
      identity = null
    }

    const pls = Array.isArray(identity?.plates)
      ? identity.plates.map(normalizePlate).filter(Boolean)
      : []
    setPlates(pls)

    let list = []
    try {
      const rawEntries = await AsyncStorage.getItem(ENTRIES_KEY)
      const parsed = rawEntries ? JSON.parse(rawEntries) : []
      list = Array.isArray(parsed) ? parsed : []
    } catch {
      list = []
    }

    const filtered = pls.length
      ? list.filter((e) => pls.includes(normalizePlate(e?.placa)))
      : []

    // order by updatedAt/fecha desc
    filtered.sort((a, b) => {
      const aa = String(a?.updatedAt || a?.fecha || a?.createdAt || '')
      const bb = String(b?.updatedAt || b?.fecha || b?.createdAt || '')
      return bb.localeCompare(aa)
    })

    setEntries(filtered)
  }, [navigation])

  React.useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      load()
    })
    load()
    return unsub
  }, [load, navigation])

  const goAddPlate = async () => {
    // MVP: for now just push a placeholder plate to let user test.
    const nextPlate = 'ABC123'
    const next = Array.from(new Set([...(plates || []), nextPlate]))
    const identity = { type: 'personal', name: 'Cliente', plates: next }
    await AsyncStorage.setItem(CLIENT_IDENTITY_KEY, JSON.stringify(identity))
    await load()
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis vehículos</Text>
        <Text style={styles.subtitle}>Solo ves vehículos asociados a tus placas.</Text>
      </View>

      {!plates.length ? (
        <View style={styles.emptyCard}>
          <Icon name="car-sport" size={22} color={COLORS.accent} />
          <Text style={styles.emptyTitle}>Aún no tienes placas asociadas</Text>
          <Text style={styles.emptyText}>
            En este MVP, agrega una placa para comenzar a ver tu historial.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={goAddPlate} activeOpacity={0.9}>
            <Text style={styles.primaryText}>Agregar placa de prueba (ABC123)</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={{ marginTop: 14 }}>
        {entries.map((e) => (
          <TouchableOpacity
            key={String(e.id || e.placa)}
            style={styles.item}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('VehiculoDetalle', { vehicle: e })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{normalizePlate(e.placa)}</Text>
              <Text style={styles.itemSub}>{e.vehiculo || e.cliente || 'Vehículo'}</Text>
              <Text style={styles.itemMeta}>{e.paso || 'En proceso'}</Text>
            </View>
            <Icon name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        ))}

        {plates.length && !entries.length ? (
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>
              No encontramos registros para tus placas todavía.
            </Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        style={styles.ghostBtn}
        onPress={() => navigation.replace('Login', { forceSelect: true })}
        activeOpacity={0.85}
      >
        <Text style={styles.ghostText}>Cambiar perfil</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 16, paddingBottom: 28 },
  header: { marginBottom: 10 },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '800' },
  subtitle: { marginTop: 6, color: COLORS.muted, fontSize: 13 },

  emptyCard: {
    marginTop: 10,
    padding: 16,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  emptyTitle: { color: COLORS.text, fontSize: 14, fontWeight: '800' },
  emptyText: { color: COLORS.muted, fontSize: 12, lineHeight: 18 },

  primaryBtn: {
    marginTop: 4,
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  primaryText: { color: '#0B0F17', fontSize: 13, fontWeight: '900' },

  item: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  itemTitle: { color: COLORS.text, fontSize: 14, fontWeight: '900' },
  itemSub: { marginTop: 4, color: COLORS.muted, fontSize: 12 },
  itemMeta: { marginTop: 6, color: 'rgba(234,240,255,0.50)', fontSize: 11 },

  noteCard: {
    marginTop: 8,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  noteText: { color: COLORS.muted, fontSize: 12 },

  ghostBtn: {
    marginTop: 18,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceAlt,
  },
  ghostText: { color: COLORS.text, fontSize: 12, fontWeight: '800' },
})
