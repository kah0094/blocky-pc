import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { timeAgo } from '../utils/timeAgo';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchNotifications();
    const sub = supabase.channel('public:notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, fetchNotifications)
        .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('notifications')
        .select('*, actor:profiles!actor_id(username, avatar_url)')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });
      
      setNotifications(data || []);
      
      // Marca como lidas
      await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', user.id);
    }
    setLoading(false);
  };

  const handlePress = async (item) => {
    if (item.type === 'comment' || item.type === 'reply') {
        const { data: post } = await supabase.from('posts').select('*, profiles(*)').eq('id', item.resource_id).single();
        if (post) navigation.navigate('PostDetail', { post });
    } else if (item.type === 'follow') {
        navigation.navigate('Profile', { userId: item.actor_id });
    }
  };

  const renderItem = ({ item }) => {
    let icon = 'notifications';
    let color = '#fff';
    let text = '';

    if (item.type === 'follow') { icon='person-add'; color='#00ff9d'; text='começou a seguir você.'; }
    if (item.type === 'comment') { icon='chatbubble'; color='#6200ee'; text=`comentou: "${item.content}..."`; }
    if (item.type === 'reply') { icon='return-down-forward'; color='#ff9900'; text='respondeu seu comentário.'; }

    return (
      <TouchableOpacity style={[styles.card, !item.is_read && styles.unread]} onPress={() => handlePress(item)}>
        <View style={styles.iconBox}><Ionicons name={icon} size={20} color={color} /></View>
        <Image source={{ uri: item.actor?.avatar_url }} style={styles.avatar} />
        <View style={styles.info}>
            <Text style={styles.desc}><Text style={styles.user}>{item.actor?.username}</Text> {text}</Text>
            <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Notificações</Text>
        <View style={{width:24}}/>
      </View>
      {loading ? <ActivityIndicator color="#00ff9d" style={{marginTop:20}}/> : (
        <FlatList data={notifications} keyExtractor={i=>i.id.toString()} renderItem={renderItem} ListEmptyComponent={<Text style={styles.empty}>Nada por aqui.</Text>}/>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  card: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#111', alignItems: 'center' },
  unread: { backgroundColor: '#111' },
  iconBox: { marginRight: 15 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  info: { flex: 1 },
  desc: { color: '#ccc', fontSize: 14 },
  user: { color: '#fff', fontWeight: 'bold' },
  time: { color: '#666', fontSize: 11, marginTop: 4 },
  empty: { color: '#666', textAlign: 'center', marginTop: 30 }
});
