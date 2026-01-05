import React from 'react';
import { View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function RoleBadge({ role, size = 14 }) {
  if (!role || role === 'member') return null;

  const r = role.toLowerCase();

  return (
    <View style={{ marginLeft: 4, justifyContent: 'center' }}>
      {/* DONO: Coroa Dourada */}
      {r === 'dono' && <MaterialCommunityIcons name="crown" size={size} color="#FFD700" />}
      
      {/* ADMIN: Escudo Vermelho */}
      {r === 'admin' && <MaterialCommunityIcons name="shield-crown" size={size} color="#ff4444" />}
      
      {/* DEV: Código Verde Neon */}
      {r === 'dev' && <Ionicons name="code-slash" size={size} color="#00ff00" />}
      
      {/* VERIFICADO: Check Azul (Mantido) */}
      {r === 'verificado' && <MaterialCommunityIcons name="check-decagram" size={size} color="#00aaff" />}
      
      {/* PREMIUM: Diamante Rosa (Mantido) */}
      {r === 'premium' && <Ionicons name="diamond" size={size} color="#ff00ff" />}
      
      {/* BOT: Robô Roxo (Melhorado para Material) */}
      {r === 'bot' && <MaterialCommunityIcons name="robot" size={size} color="#aa00aa" />}
    </View>
  );
}
