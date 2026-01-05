import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RoleBadge from '../components/RoleBadge';
import { timeAgo } from '../utils/timeAgo';
import CustomAlert from '../components/CustomAlert';

const { width, height } = Dimensions.get('window');

export default function PostDetailScreen({ route, navigation }) {
  const { post } = route.params;
  const insets = useSafeAreaInsets();
  
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ visible: false, title: '', msg: '', type: 'info' });
  
  const inputRef = useRef(null);

  const showAlert = (title, msg, type = 'info') => {
    setAlert({ visible: true, title, msg, type });
  };

  useEffect(() => {
    fetchData();
    const sub = supabase.channel('post-comments')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${post.id}` }, 
        () => fetchData())
        .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const fetchData = async () => {
    const { data: cData } = await supabase
        .from('comments')
        .select('*, profiles(username, avatar_url, role)')
        .eq('post_id', post.id)
        .order('created_at', {ascending: true});
    if (cData) setComments(cData);

    const { data: { user } } = await supabase.auth.getUser();
    if(user) {
        const { data: l } = await supabase.from('likes').select('*').eq('post_id', post.id).eq('user_id', user.id).single();
        setIsLiked(!!l);
    }
    setLoading(false);
  };

  const handleLike = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return showAlert("Ops", "Faça login para curtir.", 'error');

    setIsLiked(!isLiked);
    setLikesCount(p => isLiked ? p - 1 : p + 1);

    if (isLiked) await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    else await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
  };

  const handleSend = async () => {
    if (!commentText.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return showAlert("Ops", "Faça login para comentar.", 'error');

    const payload = {
        content: commentText,
        post_id: post.id,
        user_id: user.id,
        parent_id: replyingTo ? replyingTo.id : null
    };

    const { error } = await supabase.from('comments').insert(payload);
    if (!error) {
        setCommentText('');
        setReplyingTo(null);
        Keyboard.dismiss();
    } else {
        showAlert("Erro", error.message, 'error');
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
        <View style={styles.imageContainer}>
            <Image source={{ uri: post.image_url }} style={styles.image} resizeMode="cover" />
            <View style={{...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.3)'}} />
        </View>
        <View style={styles.metaBox}>
            <Text style={styles.title}>{post.title}</Text>
            <TouchableOpacity style={styles.userRow} onPress={() => navigation.navigate('Profile', { userId: post.user_id })}>
                <Image source={{ uri: post.profiles?.avatar_url }} style={styles.avatar} />
                <Text style={styles.username}>@{post.profiles?.username}</Text>
                <RoleBadge role={post.profiles?.role} size={14} />
            </TouchableOpacity>
            <Text style={styles.body}>{post.content}</Text>
            <Text style={styles.date}>{new Date(post.created_at).toLocaleDateString()}</Text>
            <View style={styles.actionBar}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
                    <Ionicons name={isLiked ? "heart" : "heart-outline"} size={26} color={isLiked ? "#ff4444" : "#fff"} />
                    <Text style={[styles.actionText, isLiked && {color:'#ff4444'}]}>{likesCount}</Text>
                </TouchableOpacity>
                <View style={styles.actionBtn}>
                    <Ionicons name="chatbubble-outline" size={24} color="#fff" />
                    <Text style={styles.actionText}>{comments.length}</Text>
                </View>
                <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="share-social-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Comentários</Text>
    </View>
  );

  const renderComment = ({ item }) => {
    const isReply = !!item.parent_id;
    return (
        <View style={[styles.commentRow, isReply && styles.replyRow]}>
            <Image source={{ uri: item.profiles?.avatar_url }} style={styles.commentAvatar} />
            <View style={styles.commentBubble}>
                <View style={styles.commentHeader}>
                    <Text style={styles.commentUser}>{item.profiles?.username}</Text>
                    <RoleBadge role={item.profiles?.role} size={10} />
                    <Text style={styles.timeAgo}>• {timeAgo(item.created_at)}</Text>
                </View>
                <Text style={styles.commentText}>{item.content}</Text>
                {!isReply && (
                    <TouchableOpacity onPress={() => { setReplyingTo(item); inputRef.current?.focus(); }}>
                        <Text style={styles.replyBtn}>Responder</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.navBar, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Publicação</Text>
        <View style={{width: 40}} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
            data={comments}
            keyExtractor={item => item.id.toString()}
            renderItem={renderComment}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
        />
        <View style={styles.inputWrapper}>
            {replyingTo && (
                <View style={styles.replyBar}>
                    <Text style={styles.replyText}>Respondendo a <Text style={{fontWeight:'bold'}}>{replyingTo.profiles?.username}</Text></Text>
                    <TouchableOpacity onPress={() => setReplyingTo(null)}><Ionicons name="close" size={16} color="#ccc"/></TouchableOpacity>
                </View>
            )}
            <View style={styles.inputContainer}>
                <TextInput 
                    ref={inputRef}
                    style={styles.input}
                    placeholder="Adicione um comentário..."
                    placeholderTextColor="#666"
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                />
                <TouchableOpacity onPress={handleSend} style={styles.sendBtn} disabled={!commentText.trim()}>
                    <Ionicons name="arrow-up" size={20} color="#000" />
                </TouchableOpacity>
            </View>
        </View>
      </KeyboardAvoidingView>

      <CustomAlert visible={alert.visible} title={alert.title} message={alert.msg} type={alert.type} onClose={() => setAlert({...alert, visible: false})} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  navBar: { position: 'absolute', top: 0, width: '100%', zIndex: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 10, backgroundColor: 'rgba(0,0,0,0.8)' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: '#222' },
  navTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  imageContainer: { width: width, height: width, backgroundColor: '#1a1a1a', marginTop: 60 },
  image: { width: '100%', height: '100%' },
  metaBox: { padding: 15 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },
  username: { color: '#00ff9d', fontWeight: 'bold', fontSize: 14, marginRight: 4 },
  body: { color: '#ddd', fontSize: 15, lineHeight: 22 },
  date: { color: '#555', fontSize: 11, marginTop: 8, textTransform: 'uppercase' },
  actionBar: { flexDirection: 'row', marginTop: 15, gap: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#222', marginVertical: 15 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 15, marginBottom: 10 },
  commentRow: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 15 },
  replyRow: { paddingLeft: 50 },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  commentBubble: { flex: 1, backgroundColor: '#111', padding: 10, borderRadius: 12, borderTopLeftRadius: 2 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  commentUser: { color: '#fff', fontWeight: 'bold', fontSize: 13, marginRight: 4 },
  timeAgo: { color: '#666', fontSize: 10 },
  commentText: { color: '#ccc', fontSize: 14 },
  replyBtn: { color: '#666', fontSize: 11, fontWeight: 'bold', marginTop: 5 },
  inputWrapper: { backgroundColor: '#000', borderTopWidth: 1, borderTopColor: '#222' },
  replyBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 8, backgroundColor: '#111' },
  replyText: { color: '#ccc', fontSize: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  input: { flex: 1, backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00ff9d', alignItems: 'center', justifyContent: 'center' }
});
