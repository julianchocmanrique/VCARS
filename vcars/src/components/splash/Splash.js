import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Image,
  Easing,
  TouchableOpacity,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const COLORS = {
  bg: '#05070B',
  surface: '#0E1117',
  text: '#F5F7FA',
  textMuted: '#9AA4B2',
  blueLight: '#86B9E6',
  grid: '#0C1B2B',
}

const FULL_TITLE = 'V-CARS'

const PROFILE_KEY = '@vcars_profile'

const Splash = ({ navigation }) => {
  const logoScale = useRef(new Animated.Value(0.86)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const orbit = useRef(new Animated.Value(0)).current
  const titleReveal = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const orbitAnim = Animated.loop(
      Animated.timing(orbit, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    )

    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(titleReveal, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()

    orbitAnim.start()

    return () => {
      orbitAnim.stop()
    }
  }, [])

  const goNext = async () => {
    try {
      const profile = await AsyncStorage.getItem(PROFILE_KEY)
      navigation.replace(profile ? 'Home' : 'Login')
    } catch {
      navigation.replace('Login')
    }
  }

  const onPress = () => {
    goNext()
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.diagonalLines}>
        {[...Array(8)].map((_, i) => (
          <View key={i} style={[styles.diagonalLine, { top: 40 + i * 70 }]} />
        ))}
      </View>

      <TouchableOpacity style={styles.center} activeOpacity={0.9} onPress={onPress}>
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }}
        >
          <View style={styles.logoRing}>
            <Animated.View
              style={[
                styles.orbitDot,
                {
                  transform: [
                    {
                      rotate: orbit.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                    { translateY: -85 },
                  ],
                },
              ]}
            />
            <Image
              source={require('../../assets/vcars-logo.jpeg')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        <View style={styles.titleWrap}>
          <Animated.View
            style={[
              styles.titleRow,
              {
                opacity: titleReveal,
                transform: [
                  {
                    translateY: titleReveal.interpolate({
                      inputRange: [0, 1],
                      outputRange: [18, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image
              source={require('../../assets/vcars-v.png')}
              style={styles.vImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>-CARS</Text>
          </Animated.View>
          <Text style={styles.subtitle}>TALLER AUTOMOTRIZ</Text>
        </View>

        <View style={styles.cta}>
          <Text style={styles.ctaText}>Toca para continuar</Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}

export default Splash

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    overflow: 'hidden',
  },
  diagonalLines: {
    position: 'absolute',
    left: -40,
    right: -40,
    top: 0,
    bottom: 0,
    transform: [{ rotate: '-12deg' }],
  },
  diagonalLine: {
    height: 1,
    backgroundColor: COLORS.grid,
    opacity: 0.6,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoRing: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: COLORS.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.blueLight,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    backgroundColor: COLORS.surface,
  },


  orbitDot: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    marginTop: -6,
    backgroundColor: COLORS.blueLight,
  },




  logo: {
    width: 92,
    height: 92,
  },
  titleWrap: {
    marginTop: 28,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vImage: {
    width: 34,
    height: 34,
    marginRight: 4,
  },
  title: {
    color: COLORS.text,
    fontSize: 30,
    letterSpacing: 6,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    letterSpacing: 1.6,
    marginTop: 10,
  },
  cta: {
    marginTop: 28,
    borderWidth: 1,
    borderColor: COLORS.blueLight,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  ctaText: {
    color: COLORS.text,
    fontSize: 12,
    letterSpacing: 1,
  },
})
