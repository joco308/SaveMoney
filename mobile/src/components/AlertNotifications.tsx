import { useEffect } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { api, auth } from '../services/api';
import type { Alerta } from '../types/db';

const KEY_PREFIX = 'savemoney.alertas.notificadas.v1.';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function compareIds(left: string, right: string) {
  const a = left.replace(/^0+/, '') || '0';
  const b = right.replace(/^0+/, '') || '0';
  return a.length === b.length ? a.localeCompare(b) : a.length - b.length;
}

function notificationTitle(alerta: Alerta) {
  switch (alerta.tipo_alerta?.codigo) {
    case 'PRESUPUESTO_UMBRAL': return 'Presupuesto alcanzado';
    case 'LIMITE_CATEGORIA_UMBRAL': return 'Límite de categoría alcanzado';
    case 'META_COMPLETADA': return '¡Meta de ahorro completada!';
    case 'COMPRA_ESPERA_FINALIZADA': return 'Terminó el tiempo de espera';
    default: return 'Nueva alerta de SaveMoney';
  }
}

/** Observa alertas nuevas de Supabase y las muestra como notificaciones locales del teléfono. */
export function AlertNotifications() {
  useEffect(() => {
    let vigente = true;
    let consultando = false;
    let permisoRevisado = false;
    let ultimaId = '';
    let ultimoChequeoCompra = 0;

    const consultarAlertas = async () => {
      if (!vigente || consultando || AppState.currentState !== 'active') return;
      consultando = true;
      try {
        const sesion = await auth.current();
        if (!sesion || !vigente) return;

        if (!permisoRevisado) {
          const actual = await Notifications.getPermissionsAsync();
          const permiso = actual.granted ? actual : await Notifications.requestPermissionsAsync();
          permisoRevisado = true;
          if (!permiso.granted) return;
        }

        // El listado de compras genera también las alertas cuyo período de espera ya terminó.
        if (Date.now() - ultimoChequeoCompra >= 60_000) {
          await api.revisarAlertasPorVencer();
          ultimoChequeoCompra = Date.now();
        }
        const alertas = (await api.getAlertas()).slice().sort((a, b) => compareIds(String(a.id_alerta), String(b.id_alerta)));
        if (!vigente) return;

        const storageKey = `${KEY_PREFIX}${sesion.user.id_usuario}`;
        const guardada = await AsyncStorage.getItem(storageKey);
        if (guardada === null) {
          ultimaId = alertas.length ? String(alertas[alertas.length - 1].id_alerta) : '';
          await AsyncStorage.setItem(storageKey, ultimaId);
          return;
        }

        ultimaId = guardada;
        for (const alerta of alertas) {
          const id = String(alerta.id_alerta);
          if (compareIds(id, ultimaId) <= 0) continue;
          await Notifications.scheduleNotificationAsync({
            content: {
              title: notificationTitle(alerta),
              body: alerta.mensaje,
              data: { id_alerta: id, codigo: alerta.tipo_alerta?.codigo ?? '' },
            },
            // Sin canal explícito: Expo Android SDK 58 tiene un fallo de canales en Expo Go.
            trigger: null,
          });
          ultimaId = id;
          await AsyncStorage.setItem(storageKey, ultimaId);
        }
      } catch {
        // La consulta se reintentará en la siguiente comprobación mientras la app siga abierta.
      } finally {
        consultando = false;
      }
    };

    void consultarAlertas();
    const interval = setInterval(() => { void consultarAlertas(); }, 15_000);
    const foreground = AppState.addEventListener('change', (state) => {
      if (state === 'active') void consultarAlertas();
    });

    return () => {
      vigente = false;
      clearInterval(interval);
      foreground.remove();
    };
  }, []);

  return null;
}
