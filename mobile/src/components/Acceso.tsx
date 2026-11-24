import React, { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { api, auth } from '../services/api';
import { Button, Loading, Txt } from './ui';
import { colors } from '../theme';

function mensaje(error: unknown) { return error instanceof Error ? error.message : 'No se pudo completar la solicitud.'; }

export function Acceso({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Awaited<ReturnType<typeof auth.current>> | undefined>();
  const [perfilListo, setPerfilListo] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    const unsubscribe = auth.subscribe((value) => { setSesion(value); setPerfilListo(false); setError(''); });
    auth.current().then((value) => { if (vigente) setSesion(value); });
    return () => { vigente = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!sesion) return;
    let vigente = true;
    api.getPerfil().then(() => { if (vigente) setPerfilListo(true); }, (e: unknown) => { if (vigente) setError(mensaje(e)); });
    return () => { vigente = false; };
  }, [sesion]);

  if (sesion === undefined) return <Loading />;
  if (!sesion) return <FormularioAcceso />;
  if (error) return <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16, backgroundColor: colors.bg }}>
    <Txt>{error}</Txt>
    <Button label="Reintentar" onPress={() => { setError(''); setPerfilListo(false); api.getPerfil().then(() => setPerfilListo(true), (e: unknown) => setError(mensaje(e))); }} />
    <Button label="Cerrar sesión" onPress={() => auth.logout().catch((e: unknown) => setError(mensaje(e)))} />
  </View>;
  return perfilListo ? <>{children}</> : <Loading />;
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
    if (!email.trim() || !clave || (registro && (!nombres.trim() || !apellidos.trim() || clave.length < 8))) { setEstado('Completa los campos. Para registrarte usa una contraseña de al menos 8 caracteres.'); return; }
    setOcupado(true); setEstado('');
    try {
      if (registro) await auth.register({ nombres: nombres.trim(), apellidos: apellidos.trim(), email: email.trim(), password: clave });
      else await auth.login(email.trim(), clave);
    } catch (e) { setEstado(mensaje(e)); }
    finally { setOcupado(false); }
  }
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, gap: 14, backgroundColor: colors.bg }}>
    <Txt w="xb" size={26}>{registro ? 'Crea tu cuenta de SaveMoney' : 'Entra a SaveMoney'}</Txt>
    {registro && <>
      <TextInput placeholder="Nombres" accessibilityLabel="Nombres" value={nombres} onChangeText={setNombres} maxLength={80} style={inputStyle} />
      <TextInput placeholder="Apellidos" accessibilityLabel="Apellidos" value={apellidos} onChangeText={setApellidos} maxLength={80} style={inputStyle} />
    </>}
    <TextInput placeholder="Correo electrónico" accessibilityLabel="Correo electrónico" keyboardType="email-address" autoCapitalize="none" autoComplete="email" value={email} onChangeText={setEmail} style={inputStyle} />
    <TextInput placeholder="Contraseña" accessibilityLabel="Contraseña" autoCapitalize="none" autoComplete={registro ? 'new-password' : 'current-password'} secureTextEntry value={clave} onChangeText={setClave} style={inputStyle} />
    {!!estado && <Txt color={colors.red}>{estado}</Txt>}
    <Button label={ocupado ? 'Cargando…' : registro ? 'Registrarme' : 'Iniciar sesión'} onPress={enviar} />
    <Button label={registro ? 'Ya tengo cuenta' : 'Crear cuenta'} onPress={() => { if (!ocupado) { setRegistro(!registro); setEstado(''); } }} />
  </ScrollView>;
}
