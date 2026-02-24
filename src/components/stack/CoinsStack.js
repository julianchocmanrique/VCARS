import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import Splash from '../splash/Splash'
import Login from '../auth/Login'
import NuevoIngreso from '../home/NuevoIngreso'
import Home from '../home/Home'
import OrdenServicioWizard from '../home/OrdenServicioWizard'
import IngresoActivo from '../home/IngresoActivo'
import VehiculoDetalle from '../home/VehiculoDetalle'

const Stack = createNativeStackNavigator()

const CoinsStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="NuevoIngreso" component={NuevoIngreso} />
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="OrdenServicio" component={OrdenServicioWizard} />
      <Stack.Screen name="IngresoActivo" component={IngresoActivo} />
      <Stack.Screen name="VehiculoDetalle" component={VehiculoDetalle} />
    </Stack.Navigator>
  )
}

export default CoinsStack
