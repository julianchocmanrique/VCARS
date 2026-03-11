import React from 'react';
import {View, StyleSheet, TouchableOpacity, Text} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {color} from '../../theme/colors';
import {radius, shadow, space} from '../../theme/layout';

const BottomNav = ({active = 'home', navigation}) => {
  const items = [
    {
      key: 'home',
      label: 'INICIO',
      icon: 'home',
      inactiveIcon: 'home-outline',
      onPress: () => navigation.navigate('Home'),
    },
    {
      key: 'new',
      label: 'NUEVO',
      icon: 'add-circle',
      inactiveIcon: 'add-circle-outline',
      onPress: () =>
        navigation.navigate('NuevoIngreso', {mode: 'new', entry: null}),
    },
    {
      key: 'process',
      label: 'PROCESO',
      icon: 'layers',
      inactiveIcon: 'layers-outline',
      onPress: () => navigation.navigate('IngresoActivo'),
    },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map(item => {
        const isActive = active === item.key;

        return (
          <TouchableOpacity
            key={item.key}
            style={isActive ? styles.navActivePill : styles.navGhostButton}
            onPress={item.onPress}
            activeOpacity={0.9}>
            <Icon
              name={isActive ? item.icon : item.inactiveIcon}
              size={18}
              color={isActive ? color.darkText : color.textMuted}
            />
            <Text style={isActive ? styles.navActiveText : styles.navGhostText}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BottomNav;

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    left: space.screen,
    right: space.screen,
    bottom: space.xxl,
    height: 76,
    borderRadius: radius.shell,
    backgroundColor: color.panel,
    borderWidth: 1,
    borderColor: color.border,
    ...shadow.soft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
  },
  navActivePill: {
    minWidth: 118,
    height: 52,
    borderRadius: radius.card,
    backgroundColor: color.yellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xxl,
  },
  navActiveText: {
    marginLeft: 7,
    color: color.darkText,
    fontSize: 12,
    fontWeight: '800',
  },
  navGhostButton: {
    width: 84,
    height: 52,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navGhostText: {
    marginTop: 5,
    color: color.textMuted,
    fontSize: 10,
    fontWeight: '800',
  },
});
