import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '../components/CustomAlert';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [alert, setAlert] = useState({ visible: false, title: '', msg: '', type: 'info' });

  const showAlert = (title, msg, type = 'info') => {
    setAlert({ visible: true, title, msg, type });
  };

  async function handleAuth() {
    if (!email || !password) return showAlert("Erro", "Preencha email e senha.", 'error');
    setLoading(true);
    
    try {
      if (isLogin) {
        // 1. Tenta logar
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // 2. VERIFICA SE ESTÁ BANIDO
        const { data: profile } = await supabase
            .from('profiles')
            .select('banned_until')
            .eq('id', data.user.id)
            .single();

        if (profile?.banned_until) {
            const banDate = new Date(profile.banned_until);
            if (banDate > new Date()) {
                await supabase.auth.signOut(); // Desloga na hora
                return showAlert("BANIDO", `Sua conta está suspensa até ${banDate.toLocaleString()}.`, 'error');
            }
        }

      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data?.user) {
            await supabase.from('profiles').update({ username: username }).eq('id', data.user.id);
        }
        showAlert('Bem-vindo!', 'Conta criada com sucesso.', 'info');
      }
    } catch (error) {
      showAlert('Erro', error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{isLogin ? 'Bem-vindo de volta' : 'Criar Conta'}</Text>
        {!isLogin && (
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.icon} />
            <TextInput style={styles.input} placeholder="Nome de Usuário" placeholderTextColor="#666" value={username} onChangeText={setUsername} autoCapitalize="none" />
          </View>
        )}
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#666" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        </View>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
          <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#666" value={password} onChangeText={setPassword} secureTextEntry />
        </View>
        <TouchableOpacity style={styles.btn} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>{isLogin ? 'ENTRAR' : 'CRIAR CONTA'}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{marginTop: 20}}>
          <Text style={styles.link}>
            {isLogin ? 'Não tem conta? ' : 'Já tem conta? '}
            <Text style={{color:'#00ff9d', fontWeight:'bold'}}>{isLogin ? 'Cadastre-se' : 'Entre'}</Text>
          </Text>
        </TouchableOpacity>
      </View>
      <CustomAlert visible={alert.visible} title={alert.title} message={alert.msg} type={alert.type} onClose={() => setAlert({ ...alert, visible: false })} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#111', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: '#222' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 30 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 10, marginBottom: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: '#333' },
  icon: { marginRight: 10 },
  input: { flex: 1, color: '#fff', paddingVertical: 15, fontSize: 16 },
  btn: { backgroundColor: '#00ff9d', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#888', textAlign: 'center' }
});
