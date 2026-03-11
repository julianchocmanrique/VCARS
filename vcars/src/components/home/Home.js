import React from 'react';
import {
  Alert,
  BackHandler,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import BottomNav from './BottomNav';
import {signOut} from '../../lib/vcarsAuth';
import {color} from '../../theme/colors';
import {radius, shadow, space} from '../../theme/layout';

const CURRENT_ENTRY_KEY = '@vcars_current_entry';
const PROFILE_KEY = '@vcars_profile';
const ENTRIES_KEY = '@vcars_entries';

const PROFILE_LABEL = {
  administrativo: 'Administrativo',
  tecnico: 'Tecnico',
  cliente: 'Cliente',
};

const STATUS_LABEL = {
  active: 'Activo',
  done: 'Finalizado',
  cancelled: 'Cancelado',
};

function toTimestamp(value) {
  if (!value) {
    return 0;
  }
  const date = new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function sortEntries(list) {
  return [...list].sort((a, b) => {
    const left = toTimestamp(a?.updatedAt || a?.fecha);
    const right = toTimestamp(b?.updatedAt || b?.fecha);
    return right - left;
  });
}

function summarizeEntries(list) {
  const active = list.filter(
    item => (item?.status || 'active') === 'active',
  ).length;
  const done = list.filter(item => item?.status === 'done').length;
  const cancelled = list.filter(item => item?.status === 'cancelled').length;

  return {
    total: list.length,
    active,
    done,
    cancelled,
  };
}

function normalizeEntry(entry) {
  if (!entry) {
    return null;
  }

  return {
    id: entry.id || entry.placa || entry.fecha || `${Date.now()}`,
    placa: entry.placa || '-',
    cliente: entry.cliente || '-',
    telefono: entry.telefono || '-',
    vehiculo: entry.vehiculo || 'Vehiculo',
    empresa: entry.empresa || entry.tipoCliente || '',
    stepIndex: typeof entry.stepIndex === 'number' ? entry.stepIndex : 0,
    paso: entry.paso || 'Recepcion',
    status: entry.status || 'active',
    updatedAt: entry.updatedAt || entry.fecha || new Date().toISOString(),
  };
}

const Home = ({navigation, route}) => {
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = React.useState(null);
  const [currentEntry, setCurrentEntry] = React.useState(
    route?.params?.entry || null,
  );
  const [recentEntries, setRecentEntries] = React.useState([]);
  const [summary, setSummary] = React.useState({
    total: 0,
    active: 0,
    done: 0,
    cancelled: 0,
  });

  const loadHomeState = React.useCallback(async () => {
    const savedProfile = await AsyncStorage.getItem(PROFILE_KEY);
    const role = savedProfile || 'administrativo';
    setProfile(role);

    if (route?.params?.entry) {
      await AsyncStorage.setItem(
        CURRENT_ENTRY_KEY,
        JSON.stringify(route.params.entry),
      );
    }

    const entriesRaw = await AsyncStorage.getItem(ENTRIES_KEY);
    const entries = (() => {
      try {
        const parsed = JSON.parse(entriesRaw || '[]');
        return Array.isArray(parsed)
          ? sortEntries(parsed).map(normalizeEntry).filter(Boolean)
          : [];
      } catch {
        return [];
      }
    })();

    setSummary(summarizeEntries(entries));
    setRecentEntries(entries.slice(0, 3));

    const currentRaw = await AsyncStorage.getItem(CURRENT_ENTRY_KEY);
    let current = route?.params?.entry
      ? normalizeEntry(route.params.entry)
      : null;

    if (!current && currentRaw) {
      try {
        current = normalizeEntry(JSON.parse(currentRaw));
      } catch {
        current = null;
      }
    }

    if (!current && entries.length) {
      current = entries[0];
      await AsyncStorage.setItem(CURRENT_ENTRY_KEY, JSON.stringify(current));
    }

    setCurrentEntry(current);
  }, [route?.params?.entry]);

  React.useEffect(() => {
    loadHomeState();
  }, [loadHomeState]);

  useFocusEffect(
    React.useCallback(() => {
      const ensureLogin = async () => {
        const storedProfile = await AsyncStorage.getItem(PROFILE_KEY);
        if (!storedProfile) {
          navigation.reset({
            index: 0,
            routes: [{name: 'Login'}],
          });
          return;
        }

        setProfile(storedProfile);
        loadHomeState();
      };

      ensureLogin();

      const onBackPress = () => true;
      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => sub.remove();
    }, [loadHomeState, navigation]),
  );

  const activeRole = profile || 'administrativo';

  const goNuevoIngreso = () =>
    navigation.navigate('NuevoIngreso', {mode: 'new', entry: null});

  const goProceso = () => {
    if (activeRole === 'cliente') {
      navigation.navigate('MisVehiculos');
      return;
    }
    navigation.navigate('IngresoActivo');
  };

  const goVehiculoDetalle = entry => {
    if (!entry) {
      return;
    }
    navigation.navigate('VehiculoDetalle', {vehicle: entry});
  };

  const goCambiarPerfil = () =>
    navigation.navigate('Login', {forceSelect: true});

  const handleSignOut = () => {
    Alert.alert('Cerrar sesion', 'Se cerrara la sesion actual.', [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          navigation.reset({
            index: 0,
            routes: [{name: 'Login'}],
          });
        },
      },
    ]);
  };

  const primaryActions =
    activeRole === 'cliente'
      ? [
          {
            key: 'mis-vehiculos',
            title: 'Mis vehiculos',
            subtitle: 'Consultar placas asignadas',
            icon: 'car-sport-outline',
            onPress: () => navigation.navigate('MisVehiculos'),
            variant: 'primary',
          },
          {
            key: 'estado-actual',
            title: 'Vehiculo activo',
            subtitle: currentEntry ? currentEntry.placa : 'Sin ingreso activo',
            icon: 'pulse-outline',
            onPress: () => goVehiculoDetalle(currentEntry),
            disabled: !currentEntry,
          },
        ]
      : activeRole === 'tecnico'
      ? [
          {
            key: 'proceso',
            title: 'Proceso activo',
            subtitle: currentEntry ? currentEntry.placa : 'Sin ingreso activo',
            icon: 'build-outline',
            onPress: () =>
              currentEntry ? goVehiculoDetalle(currentEntry) : goProceso(),
            variant: 'primary',
          },
          {
            key: 'cola',
            title: 'Ingresos activos',
            subtitle: `${summary.active} en taller`,
            icon: 'list-outline',
            onPress: goProceso,
          },
        ]
      : [
          {
            key: 'nuevo',
            title: 'Nuevo ingreso',
            subtitle: 'Registrar recepcion',
            icon: 'add-circle-outline',
            onPress: goNuevoIngreso,
            variant: 'primary',
          },
          {
            key: 'proceso',
            title: 'Proceso activo',
            subtitle: currentEntry ? currentEntry.placa : 'Sin ingreso activo',
            icon: 'file-tray-full-outline',
            onPress: () =>
              currentEntry ? goVehiculoDetalle(currentEntry) : goProceso(),
          },
          {
            key: 'historial',
            title: 'Historial',
            subtitle: `${summary.done} cerrados`,
            icon: 'archive-outline',
            onPress: goProceso,
          },
        ];

  const secondaryActions = [
    {
      key: 'logout',
      title: 'Cerrar sesion',
      icon: 'log-out-outline',
      onPress: handleSignOut,
      destructive: true,
    },
  ];

  const topPadding = (insets?.top || 0) + space.lg;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={color.bg} />

      <View style={styles.bgOrbLeft} />
      <View style={styles.bgOrbRight} />

      <View style={[styles.header, {paddingTop: topPadding}]}>
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Image
              source={require('../../assets/vcars-v.png')}
              style={styles.brandImage}
            />
            <Text style={styles.brandText}>VCARS</Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={goCambiarPerfil}
            activeOpacity={0.9}>
            <Icon name="person-outline" size={16} color={color.primary} />
            <Text style={styles.profileButtonText}>
              {PROFILE_LABEL[activeRole] || 'Sin perfil'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.pageTitle}>Inicio operativo</Text>
        <Text style={styles.pageSubtitle}>
          Gestiona ingresos, proceso actual y accesos por rol sin mezclar
          herramientas.
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen</Text>

          <View style={styles.summaryHero}>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryLabel}>Ingreso activo</Text>
              <Text style={styles.summaryTitle}>
                {currentEntry
                  ? `${currentEntry.vehiculo} · ${currentEntry.placa}`
                  : 'Sin ingreso activo'}
              </Text>
              <Text style={styles.summaryText}>
                {currentEntry
                  ? `${currentEntry.cliente} · ${
                      STATUS_LABEL[currentEntry.status] || 'Activo'
                    }`
                  : 'Crea un ingreso o entra al proceso para continuar el flujo del taller.'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.summaryAction,
                !currentEntry &&
                  activeRole === 'cliente' &&
                  styles.actionDisabled,
              ]}
              onPress={() => {
                if (currentEntry) {
                  goVehiculoDetalle(currentEntry);
                  return;
                }

                if (activeRole === 'cliente') {
                  return;
                }
                goNuevoIngreso();
              }}
              disabled={!currentEntry && activeRole === 'cliente'}
              activeOpacity={0.9}>
              <Text style={styles.summaryActionText}>
                {currentEntry ? 'Abrir ingreso' : 'Crear ingreso'}
              </Text>
              <Icon name="arrow-forward" size={16} color={color.darkText} />
            </TouchableOpacity>
          </View>

          <View style={styles.kpiRow}>
            <SummaryStat label="Activos" value={summary.active} />
            <SummaryStat label="Cerrados" value={summary.done} />
            <SummaryStat label="Total" value={summary.total} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones principales</Text>
          <View style={styles.cardGrid}>
            {primaryActions.map(action => (
              <ActionCard
                key={action.key}
                title={action.title}
                subtitle={action.subtitle}
                icon={action.icon}
                onPress={action.onPress}
                variant={action.variant}
                disabled={action.disabled}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accesos secundarios</Text>

          <View style={styles.secondaryCard}>
            {secondaryActions.map((action, index) => (
              <TouchableOpacity
                key={action.key}
                style={[
                  styles.secondaryRow,
                  index !== secondaryActions.length - 1 &&
                    styles.secondaryRowBorder,
                ]}
                onPress={action.onPress}
                activeOpacity={0.9}>
                <View
                  style={[
                    styles.secondaryIconWrap,
                    action.destructive && styles.secondaryIconWrapDanger,
                  ]}>
                  <Icon
                    name={action.icon}
                    size={18}
                    color={action.destructive ? color.danger : color.primary}
                  />
                </View>

                <View style={styles.secondaryTextWrap}>
                  <Text
                    style={[
                      styles.secondaryTitle,
                      action.destructive && styles.secondaryTitleDanger,
                    ]}>
                    {action.title}
                  </Text>
                </View>

                <Icon
                  name="chevron-forward"
                  size={18}
                  color={color.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.secondaryCard}>
            <Text style={styles.sectionMiniTitle}>Ultimos movimientos</Text>
            {recentEntries.length ? (
              recentEntries.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.recentRow}
                  onPress={() => goVehiculoDetalle(item)}
                  activeOpacity={0.9}>
                  <View style={styles.recentIconWrap}>
                    <Icon
                      name="car-outline"
                      size={16}
                      color={color.blueLight}
                    />
                  </View>
                  <View style={styles.recentTextWrap}>
                    <Text style={styles.recentTitle}>
                      {item.vehiculo} · {item.placa}
                    </Text>
                    <Text style={styles.recentSubtitle}>
                      {item.cliente} · {item.paso || 'Recepcion'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>
                Aun no hay movimientos recientes para mostrar.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomNav active="home" navigation={navigation} />
    </SafeAreaView>
  );
};

const SummaryStat = ({label, value}) => (
  <View style={styles.kpiCard}>
    <Text style={styles.kpiValue}>{value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
  </View>
);

const ActionCard = ({title, subtitle, icon, onPress, variant, disabled}) => {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[
        styles.actionCard,
        isPrimary && styles.actionCardPrimary,
        disabled && styles.actionDisabled,
      ]}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={!!disabled}>
      <View
        style={[
          styles.actionIconWrap,
          isPrimary && styles.actionIconWrapPrimary,
        ]}>
        <Icon
          name={icon}
          size={18}
          color={isPrimary ? color.darkText : color.primary}
        />
      </View>
      <Text
        style={[styles.actionTitle, isPrimary && styles.actionTitlePrimary]}>
        {title}
      </Text>
      <Text
        style={[
          styles.actionSubtitle,
          isPrimary && styles.actionSubtitlePrimary,
        ]}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.bg,
  },
  bgOrbLeft: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: color.primaryBrand,
    opacity: 0.34,
    top: -110,
    left: -120,
  },
  bgOrbRight: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: color.blueLight,
    opacity: 0.16,
    top: 10,
    right: -120,
  },
  header: {
    paddingHorizontal: space.screen,
    paddingBottom: space.xxl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xxl,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.xxl,
    paddingVertical: space.lg,
    borderRadius: radius.round,
    backgroundColor: color.panel,
    borderWidth: 1,
    borderColor: color.border,
  },
  brandImage: {
    width: 18,
    height: 18,
    marginRight: space.sm,
  },
  brandText: {
    color: color.text,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.xxl,
    paddingVertical: space.lg,
    borderRadius: radius.round,
    backgroundColor: color.panel,
    borderWidth: 1,
    borderColor: color.border,
  },
  profileButtonText: {
    marginLeft: space.sm,
    color: color.text,
    fontSize: 12,
    fontWeight: '800',
  },
  pageTitle: {
    color: color.text,
    fontSize: 28,
    fontWeight: '900',
  },
  pageSubtitle: {
    marginTop: space.sm,
    color: color.textMuted,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 520,
  },
  scrollContent: {
    paddingBottom: 132,
  },
  section: {
    paddingHorizontal: space.screen,
    marginBottom: space.section,
  },
  sectionTitle: {
    color: color.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: space.xxl,
  },
  sectionMiniTitle: {
    color: color.text,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: space.lg,
  },
  summaryHero: {
    backgroundColor: color.panel,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.hero,
    padding: space.section,
    ...shadow.elevated,
  },
  summaryCopy: {
    marginBottom: space.xxl,
  },
  summaryLabel: {
    color: color.blueLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  summaryTitle: {
    marginTop: space.sm,
    color: color.text,
    fontSize: 24,
    fontWeight: '900',
  },
  summaryText: {
    marginTop: space.sm,
    color: color.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  summaryAction: {
    alignSelf: 'flex-start',
    backgroundColor: color.yellow,
    borderRadius: radius.xl,
    minHeight: 48,
    paddingHorizontal: space.section,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryActionText: {
    color: color.darkText,
    fontSize: 13,
    fontWeight: '900',
    marginRight: space.sm,
  },
  kpiRow: {
    marginTop: space.xxl,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kpiCard: {
    width: '31%',
    minHeight: 86,
    borderRadius: radius.card,
    backgroundColor: color.panel,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  kpiValue: {
    color: color.text,
    fontSize: 24,
    fontWeight: '900',
  },
  kpiLabel: {
    marginTop: space.xs,
    color: color.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48.3%',
    minHeight: 164,
    marginBottom: space.lg,
    borderRadius: radius.card,
    backgroundColor: color.panel,
    borderWidth: 1,
    borderColor: color.border,
    padding: space.section,
  },
  actionCardPrimary: {
    backgroundColor: color.blueLight,
    borderColor: color.blueLight,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.xl,
    backgroundColor: color.panelSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconWrapPrimary: {
    backgroundColor: 'rgba(18,22,28,0.14)',
  },
  actionTitle: {
    marginTop: space.xxl,
    color: color.text,
    fontSize: 15,
    fontWeight: '900',
  },
  actionTitlePrimary: {
    color: color.darkText,
  },
  actionSubtitle: {
    marginTop: space.sm,
    color: color.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  actionSubtitlePrimary: {
    color: color.darkTextSoft,
  },
  secondaryCard: {
    backgroundColor: color.panel,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.card,
    paddingHorizontal: space.xxl,
    paddingVertical: space.lg,
    marginBottom: space.lg,
  },
  secondaryRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  secondaryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.lg,
    backgroundColor: color.panelSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryIconWrapDanger: {
    backgroundColor: 'rgba(200,90,90,0.12)',
  },
  secondaryTextWrap: {
    flex: 1,
    marginLeft: space.lg,
  },
  secondaryTitle: {
    color: color.text,
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryTitleDanger: {
    color: color.danger,
  },
  recentRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.sm,
  },
  recentIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.panelSoft,
  },
  recentTextWrap: {
    flex: 1,
    marginLeft: space.lg,
  },
  recentTitle: {
    color: color.text,
    fontSize: 13,
    fontWeight: '800',
  },
  recentSubtitle: {
    marginTop: 2,
    color: color.textMuted,
    fontSize: 11,
  },
  emptyText: {
    color: color.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  actionDisabled: {
    opacity: 0.45,
  },
  bottomSpacer: {
    height: 120,
  },
});
