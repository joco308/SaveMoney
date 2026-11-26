import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ic } from '../components/ui';
import { colors, font } from '../theme';
import DashboardScreen from '../screens/DashboardScreen';
import MovimientosScreen from '../screens/MovimientosScreen';
import PresupuestoScreen from '../screens/PresupuestoScreen';
import MetasScreen from '../screens/MetasScreen';
import PerfilScreen from '../screens/PerfilScreen';
import RegistrarScreen from '../screens/RegistrarScreen';
import RegistroRapidoScreen from '../screens/RegistroRapidoScreen';
import AlertasScreen from '../screens/AlertasScreen';
import ImpulsivosScreen from '../screens/ImpulsivosScreen';
import ResumenScreen from '../screens/ResumenScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const tabs: { name: string; label: string; icon: string; comp: React.ComponentType<any> }[] = [
  { name: 'Inicio', label: 'Inicio', icon: 'home-outline', comp: DashboardScreen },
  { name: 'Movimientos', label: 'Movimientos', icon: 'swap-horizontal', comp: MovimientosScreen },
  { name: 'Presupuesto', label: 'Presupuesto', icon: 'chart-pie', comp: PresupuestoScreen },
  { name: 'Ahorro', label: 'Ahorro', icon: 'piggy-bank-outline', comp: MetasScreen },
  { name: 'Perfil', label: 'Perfil', icon: 'account-outline', comp: PerfilScreen },
];

function Tabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarLabelStyle: { fontFamily: font.b, fontSize: 10 },
        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 0, height: 62 + insets.bottom, paddingTop: 6 },
      }}
    >
      {tabs.map((t) => (
        <Tab.Screen
          key={t.name}
          name={t.name}
          component={t.comp}
          options={{ tabBarLabel: t.label, tabBarIcon: ({ color }) => <Ic name={t.icon} size={24} color={color} /> }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg } }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Registrar" component={RegistrarScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="RegistroRapido" component={RegistroRapidoScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Alertas" component={AlertasScreen} />
        <Stack.Screen name="Impulsivos" component={ImpulsivosScreen} />
        <Stack.Screen name="Resumen" component={ResumenScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
