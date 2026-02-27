import React from 'react'
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import { COLORS, RADIUS, SHADOW } from '../theme'

const Button = ({
  title,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  loading,
  style,
}) => {
  const v = variants[variant] || variants.primary
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.base, v.base, variant === 'primary' && SHADOW.glow, isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color} />
      ) : (
        <>
          <Text style={[styles.text, v.text]}>{title}</Text>
          {icon ? <Icon name={icon} size={16} color={v.text.color} /> : null}
        </>
      )}
    </TouchableOpacity>
  )
}

export default Button

const variants = {
  primary: {
    base: { backgroundColor: COLORS.blueLight },
    text: { color: COLORS.surface },
  },
  surface: {
    base: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
    text: { color: COLORS.text },
  },
  danger: {
    base: { backgroundColor: 'rgba(212,58,58,0.16)', borderWidth: 1, borderColor: 'rgba(212,58,58,0.28)' },
    text: { color: COLORS.text },
  },
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  text: {
    fontWeight: '900',
    fontSize: 14,
  },
  disabled: {
    opacity: 0.6,
  },
})
