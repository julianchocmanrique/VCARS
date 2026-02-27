import React from 'react'
import { View, StatusBar, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '../theme'

/**
 * Screen wrapper:
 * - Dark background
 * - Safe area top
 * - StatusBar configured
 */
const Screen = ({ children, edges = ['top'], style }) => {
  return (
    <SafeAreaView style={[styles.root, style]} edges={edges}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} translucent={false} />
      <View style={styles.fill}>{children}</View>
    </SafeAreaView>
  )
}

export default Screen

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  fill: {
    flex: 1,
  },
})
