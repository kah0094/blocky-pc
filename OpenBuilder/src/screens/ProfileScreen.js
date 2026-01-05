import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, RefreshControl, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import RoleBadge from '../components/RoleBadge';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ route, navigation }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0 });
  const [isMe, setIsMe] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsMe, setFollowsMe] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState(0); 

  const targetUserId = route.params?.userId;
  const insets = useSafeAreaInsets();

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;
      const idToFetch = targetUserId || currentUserId;

      if (!idToFetch) return;
      setIsMe(currentUserId === idToFetch);

      let { data: userData } = await supabase.from('profiles').select('*').eq('id', idToFetch).single();
      setProfile(userData);

      const { data: userPosts } = await supabase.from('posts').select('*').eq('user_id', idToFetch).order('created_at', {ascending: false});
      setPosts(userPosts || []);
      
      const { count: followers } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', idToFetch);
      const { count: following } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', idToFetch);
      setStats({ followers: followers || 0, following: following || 0, posts: userPosts?.length || 0 });

      if (currentUserId && currentUserId !== idToFetch) {
        const { data: iFollow } = await supabase.from('follows').select('*').eq('follower_id', currentUserId).eq('following_id', idToFetch).single();
        setIsFollowing(!!iFollow);
        const { data: heFollows } = await supabase.from('follows').select('*').eq('follower_id', idToFetch).eq('following_id', currentUserId).single();
        setFollowsMe(!!heFollows);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchProfile(); }, [targetUserId]));

  const handleFollow = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profile.id);
      setIsFollowing(false);
      setStats(p => ({...p, followers: p.followers - 1}));
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: profile.id });
      setIsFollowing(true);
      setStats(p => ({...p, followers: p.followers + 1}));
    }
  };

  const handleChat = () => { Alert.alert("Chat", "Em breve!"); };

  const copyToClipboard = async () => {
    // COPIA O ID COMPLETO (Para garantir)
    if(profile?.id) await Clipboard.setStringAsync(profile.id);
    Alert.alert("Copiado", "ID copiado!");
  };

  // MOSTRA SÓ OS 6 PRIMEIROS
  const displayUID = profile?.id ? profile.id.substring(0, 6).toUpperCase() : '...';
  const isFriend = isFollowing && followsMe;

  return (
    <View style={styles.container}>
      {!isMe && navigation.canGoBack() && (
        <TouchableOpacity style={[styles.backBtn, { top: insets.top + 10 }]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchProfile();}} tintColor="#00ff9d"/>}>
        <LinearGradient colors={['#1a1a1a', '#000']} style={styles.banner} />

        <View style={styles.content}>
          <View style={styles.headerRow}>
              <Image source={{ uri: profile?.avatar_url || 'https://via.placeholder.com/150' }} style={styles.avatar} />
              <View style={styles.statsBox}>
                  <View style={styles.statItem}><Text style={styles.statNum}>{stats.posts}</Text><Text style={styles.statLabel}>Posts</Text></View>
                  <View style={styles.statItem}><Text style={styles.statNum}>{stats.followers}</Text><Text style={styles.statLabel}>Seguidores</Text></View>
                  <View style={styles.statItem}><Text style={styles.statNum}>{stats.following}</Text><Text style={styles.statLabel}>Seguindo</Text></View>
              </View>
          </View>

          <View style={styles.infoSection}>
              <View style={{flexDirection:'row', alignItems:'center'}}>
                  <Text style={styles.displayName}>{profile?.username || 'Usuário'}</Text>
                  <RoleBadge role={profile?.role} />
              </View>
              
              <TouchableOpacity onPress={copyToClipboard} style={{flexDirection:'row', alignItems:'center', marginTop:2}}>
                  <Text style={styles.handle}>@{profile?.username?.toLowerCase()}</Text>
                  <View style={styles.uidBadge}>
                    <Text style={styles.uid}>#{displayUID}</Text>
                    <Ionicons name="copy-outline" size={10} color="#666" style={{marginLeft:4}}/>
                  </View>
              </TouchableOpacity>

              <Text style={styles.bio}>{profile?.bio || 'Sem biografia definida.'}</Text>
          </View>

          <View style={styles.actionButtons}>
              {isMe ? (
                  <>
                      <TouchableOpacity style={[styles.btn, styles.btnEdit]} onPress={() => navigation.navigate('EditProfile')}>
                          <Text style={styles.btnTextDark}>Editar Perfil</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Settings')}>
                          <Ionicons name="settings-outline" size={20} color="#fff" />
                      </TouchableOpacity>
                  </>
              ) : (
                  <>
                      <TouchableOpacity style={[styles.btn, isFollowing ? styles.btnFollowing : styles.btnFollow]} onPress={handleFollow}>
                          <Text style={isFollowing ? styles.btnTextLight : styles.btnTextDark}>{isFollowing ? 'Seguindo' : 'Seguir'}</Text>
                      </TouchableOpacity>
                      {isFriend && (
                          <TouchableOpacity style={[styles.btn, styles.btnChat]} onPress={handleChat}>
                              <Ionicons name="chatbubble-ellipses" size={18} color="#fff" style={{marginRight:5}} />
                              <Text style={styles.btnTextLight}>Chat</Text>
                          </TouchableOpacity>
                      )}
                  </>
              )}
          </View>

          <View style={styles.tabs}>
              <TouchableOpacity onPress={()=>setTab(0)} style={[styles.tab, tab===0 && styles.activeTab]}><Ionicons name="grid" size={20} color={tab===0 ? "#00ff9d" : "#666"} /></TouchableOpacity>
              <TouchableOpacity onPress={()=>setTab(1)} style={[styles.tab, tab===1 && styles.activeTab]}><Ionicons name="pricetag" size={20} color={tab===1 ? "#00ff9d" : "#666"} /></TouchableOpacity>
          </View>

          {tab === 0 && (
              <View style={styles.grid}>
                  {posts.map(p => (
                      <TouchableOpacity key={p.id} style={styles.gridItem} onPress={() => navigation.navigate('PostDetail', {post: p})}>
                          {p.image_url ? <Image source={{uri: p.image_url}} style={styles.gridImg} /> : <View style={styles.noImage}><Ionicons name="document-text" size={24} color="#333"/></View>}
                      </TouchableOpacity>
                  ))}
              </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backBtn: { position: 'absolute', left: 15, zIndex: 100, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  banner: { height: 100, width: '100%' },
  content: { paddingHorizontal: 15 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: -40, justifyContent: 'space-between' },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#000', backgroundColor: '#222' },
  statsBox: { flexDirection: 'row', gap: 20, paddingBottom: 10, flex: 1, justifyContent: 'flex-end' },
  statItem: { alignItems: 'center' },
  statNum: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  statLabel: { color: '#888', fontSize: 11 },
  infoSection: { marginTop: 10 },
  displayName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  handle: { color: '#fff', fontWeight: 'bold', fontSize: 13, marginRight: 8 },
  uidBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 5 },
  uid: { color: '#666', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' },
  bio: { color: '#ccc', marginTop: 8, fontSize: 14, lineHeight: 20 },
  actionButtons: { flexDirection: 'row', gap: 10, marginTop: 15 },
  btn: { flex: 1, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  btnEdit: { backgroundColor: '#00ff9d' },
  btnFollow: { backgroundColor: '#00ff9d' },
  btnFollowing: { backgroundColor: '#333', borderWidth: 1, borderColor: '#555' },
  btnChat: { backgroundColor: '#6200ee', flex: 1 },
  iconBtn: { width: 36, height: 36, backgroundColor: '#333', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnTextDark: { color: '#000', fontWeight: 'bold', fontSize: 13 },
  btnTextLight: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  tabs: { flexDirection: 'row', marginTop: 20, borderTopWidth: 1, borderTopColor: '#222' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#00ff9d' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  gridItem: { width: (width-34)/3, height: (width-34)/3, backgroundColor: '#111', borderRadius: 4, overflow: 'hidden' },
  gridImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  noImage: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
