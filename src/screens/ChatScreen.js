import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { timeAgo } from '../utils/timeAgo';

export default function ChatScreen({ route, navigation }) {
  const { roomId, user: otherUser } = route.params;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [myId, setMyId] = useState(null);
  
  useEffect(() => {
    supabase.auth.getUser().then(({data}) => setMyId(data.user?.id));
    fetchMessages();

    // CANAL DE REALTIME
    const channel = supabase
      .channel('room-' + roomId)
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `room_id=eq.${roomId}` 
      }, 
      (payload) => {
        setMessages(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });
    setMessages(data || []);
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    const msg = text;
    setText(''); 
    
    // Envio Otimista (aparece na hora)
    // Mas como tem Realtime, vamos deixar o banco devolver pra não duplicar
    
    await supabase.from('messages').insert({
        room_id: roomId,
        sender_id: myId,
        content: msg
    });
  };

  const renderItem = ({ item }) => {
    const isMe = item.sender_id === myId;
    return (
        <View style={[styles.bubble, isMe ? styles.me : styles.them]}>
            <Text style={styles.msgText}>{item.content}</Text>
            <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
        </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>{otherUser?.username}</Text>
        <View style={{width:24}}/>
      </View>

      <FlatList
        data={messages}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        inverted // Mensagens começam de baixo
        contentContainerStyle={{ padding: 15 }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.inputArea}>
        <TextInput 
            style={styles.input} 
            placeholder="Mensagem..." 
            placeholderTextColor="#666" 
            value={text} 
            onChangeText={setText} 
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
            <Ionicons name="send" size={20} color="#000" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  title: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 12, marginBottom: 10 },
  me: { alignSelf: 'flex-end', backgroundColor: '#6200ee', borderBottomRightRadius: 2 },
  them: { alignSelf: 'flex-start', backgroundColor: '#222', borderBottomLeftRadius: 2 },
  msgText: { color: '#fff', fontSize: 15 },
  time: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  inputArea: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#222', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00ff9d', alignItems: 'center', justifyContent: 'center' }
});
