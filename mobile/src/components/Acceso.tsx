import React, { useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform, ScrollView, TextInput, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { Button, Loading, Txt } from './ui';
import { getSupabase, supabase } from '../services/supabase';
import { perfilActual } from '../services/api';
import { colors } from '../theme';

function mensaje(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo completar la solicitud.';
}

export function Acceso({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Session | null>();
  useEffect(() => {
    if (!supabase) return;
    const db = supabase;
    const { data } = db.auth.onAuthStateChange((_evento, session) => setSesion(session));
    if (Platform.OS !== 'web' && AppState.currentState === 'active') void db.auth.startAutoRefresh();
    const refresh = Platform.OS === 'web' ? null : AppState.addEventListener('change', (state) => {
      if (state === 'active') void db.auth.startAutoRefresh();
      else void db.auth.stopAutoRefresh();
    });
    return () => {
      data.subscription.unsubscribe();
      refresh?.remove();
      if (Platform.OS !== 'web') void db.auth.stopAutoRefresh();
    };
  }, []);

  if (!supabase) {
    return <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Txt>Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY en mobile/.env.local.</Txt>
    </View>;
  }
  if (sesion === undefined) return <Loading />;
  if (!sesion) return <FormularioAcceso />;
  return <PerfilAutenticado key={sesion.user.id}>{children}</PerfilAutenticado>;
}

function PerfilAutenticado({ children }: { children: ReactNode }) {
  const [intento, setIntento] = useState(0);
  const [resultado, setResultado] = useState<{ intento: number; error: string }>();

  useEffect(() => {
    let vigente = true;
    perfilActual().then(
      () => { if (vigente) setResultado({ intento, error: '' }); },
      (e) => { if (vigente) setResultado({ intento, error: mensaje(e) }); },
    );
    return () => { vigente = false; };
  }, [intento]);

  if (resultado?.intento !== intento) return <Loading />;
  const { error } = resultado;

  if (error) {
    return <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16 }}>
      <Txt>{error}</Txt>
      <Button label="Reintentar" onPress={() => setIntento((n) => n + 1)} />
      <Button label="Cerrar sesión" onPress={async () => {
        const result = await getSupabase().auth.signOut();
        if (result.error) setResultado({ intento, error: result.error.message });
      }} />
    </View>;
  }
  return <>{children}</>;
}

function FormularioAcceso() {
  const [registro, setRegistro] = useState(false);
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [estado, setEstado] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const inputStyle = { borderWidth: 1, borderColor: colors.gray, borderRadius: 12, padding: 12, color: colors.text };

  async function enviar() {
    if (ocupado) return;
    if (!email.trim() || !clave || (registro && (!nombres.trim() || !apellidos.trim() || clave.length < 8))) {
      setEstado('Completa los campos. Para registrarte usa una contraseña de al menos 8 caracteres.');
      return;
    }
    setOcupado(true);
    setEstado('');
    try {
      const auth = getSupabase().auth;
      const credenciales = { email: email.trim(), password: clave };
      const respuesta = registro
        ? await auth.signUp({ ...credenciales, options: { data: { nombres: nombres.trim(), apellidos: apellidos.trim() } } })
        : await auth.signInWithPassword(credenciales);
      if (respuesta.error) throw respuesta.error;
      if (registro && !respuesta.data.session) {
        setRegistro(false);
        setClave('');
        setEstado('Confirma el enlace en tu correo y luego inicia sesión.');
      }
    } catch (e) {
      setEstado(mensaje(e));
    } finally {
      setOcupado(false);
    }
  }

  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, gap: 14, backgroundColor: colors.bg }}>
    <Txt w="xb" size={26}>{registro ? 'Crea tu cuenta de SaveMoney' : 'Entra a SaveMoney'}</Txt>
    {registro && <>
      <TextInput placeholder="Nombres" accessibilityLabel="Nombres" value={nombres} onChangeText={setNombres} maxLength={80} style={inputStyle} />
      <TextInput placeholder="Apellidos" accessibilityLabel="Apellidos" value={apellidos} onChangeText={setApellidos} maxLength={80} style={inputStyle} />
    </>}
    <TextInput placeholder="Correo electrónico" accessibilityLabel="Correo electrónico" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} style={inputStyle} />
    <TextInput placeholder="Contraseña" accessibilityLabel="Contraseña" autoCapitalize="none" secureTextEntry value={clave} onChangeText={setClave} style={inputStyle} />
    {!!estado && <Txt>{estado}</Txt>}
    <Button label={ocupado ? 'Cargando…' : registro ? 'Registrarme' : 'Iniciar sesión'} onPress={enviar} />
    <Button label={registro ? 'Ya tengo cuenta' : 'Crear cuenta'} onPress={() => {
      if (!ocupado) { setRegistro(!registro); setEstado(''); }
    }} />
  </ScrollView>;
}
