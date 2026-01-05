import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../services/supabase';
import CustomAlert from '../components/CustomAlert';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

export default function SettingsScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ visible: false, title: '', msg: '', type: 'info', onConfirm: null });

  useEffect(() => {
    supabase.auth.getUser().then(({data}) => setUser(data.user));
  }, []);

  const showAlert = (title, msg, type = 'info', onConfirm = null) => {
    setAlert({ visible: true, title, msg, type, onConfirm });
  };

  const copyUID = async () => {
    if(user?.id) {
        await Clipboard.setStringAsync(user.id);
        showAlert("Copiado", "UHID completo copiado!");
    }
  };

  const handleLogout = () => {
    showAlert("Sair da Conta", "Tem certeza?", 'info', async () => await supabase.auth.signOut());
  };

  const handleDelete = () => {
    showAlert("ZONA DE PERIGO", "Apagar conta?", 'error', async () => {
        setLoading(true);
        const { error } = await supabase.rpc('delete_own_user');
        setLoading(false);
        if(error) showAlert("Erro", error.message, 'error');
        else await supabase.auth.signOut();
    });
  };

  const SettingItem = ({ icon, label, sub, color='#fff', onPress, arrow=true }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
        <View style={styles.cardLeft}>
            {icon && <View style={[styles.iconBox, {backgroundColor: '#1a1a1a'}]}><Ionicons name={icon} size={20} color={color} /></View>}
            <View>
                <Text style={[styles.cardLabel, {color}]}>{label}</Text>
                {sub && <Text style={styles.cardSub}>{sub}</Text>}
            </View>
        </View>
        {arrow && <Ionicons name="chevron-forward" size={20} color="#333" />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Configurações</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>IDENTIDADE</Text>
        <View style={styles.idCard}>
            <View>
                <Text style={styles.idLabel}>CHAVE DE ACESSO</Text>
                <Text style={styles.idValue}>{user?.id?.substring(0, 6).toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.copyBtn} onPress={copyUID}><Text style={styles.copyText}>COPIAR</Text></TouchableOpacity>
        </View>

        <SettingItem icon="person-outline" label="Meu Perfil" sub="Alterar nome, bio e exibição" color="#00ff9d" onPress={() => navigation.navigate('EditProfile')} />
        <Text style={styles.sectionTitle}>CONTA</Text>
        <SettingItem icon="log-out-outline" label="Sair do App" onPress={handleLogout} />
        <Text style={[styles.sectionTitle, {color:'#ff4444'}]}>ZONA DE RISCO</Text>
        <TouchableOpacity style={styles.dangerCard} onPress={handleDelete}>
            <View style={{flexDirection:'row', alignItems:'center', gap:15}}>
                <View style={{backgroundColor:'#3a0000', padding:8, borderRadius:8}}><Ionicons name="person-remove-outline" size={20} color="#ff4444" /></View>
                <Text style={{color:'#ff4444', fontWeight:'bold', fontSize:16}}>Apagar minha conta</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#500" />
        </TouchableOpacity>
      </ScrollView>
      
      {loading && <View style={styles.loadingOverlay}><ActivityIndicator color="red" size="large"/></View>}
      <CustomAlert visible={alert.visible} title={alert.title} message={alert.msg} type={alert.type} onConfirm={alert.onConfirm} onClose={() => setAlert({...alert, visible: false})} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  closeBtn: { backgroundColor: '#1a1a1a', padding: 8, borderRadius: 20 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  scroll: { paddingBottom: 50 },
  sectionTitle: { color: '#00ff9d', fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginTop: 20 },
  idCard: { backgroundColor: '#111', padding: 20, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#222' },
  idLabel: { color: '#444', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  idValue: { color: '#fff', fontSize: 24, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: 2 },
  copyBtn: { backgroundColor: '#1a4030', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  copyText: { color: '#00ff9d', fontSize: 10, fontWeight: 'bold' },
  card: { backgroundColor: '#111', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 16, fontWeight: 'bold' },
  cardSub: { color: '#444', fontSize: 12 },
  dangerCard: { backgroundColor: '#1a0505', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#300' },
  loadingOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' }
});
