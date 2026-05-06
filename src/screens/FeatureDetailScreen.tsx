import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useHostBridge } from '../host-bridge';

interface PostDetail {
  id: number;
  title: string;
  body: string;
  userId: number;
}

export interface FeatureDetailScreenProps {
  itemId: string;
  itemTitle: string;
}

export default function FeatureDetailScreen({ itemId, itemTitle }: FeatureDetailScreenProps) {
  const { theme, navigation } = useHostBridge();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://jsonplaceholder.typicode.com/posts/${itemId}`)
      .then(r => r.json())
      .then(setPost)
      .finally(() => setLoading(false));
  }, [itemId]);

  const s = makeStyles(theme.primaryColor, theme.backgroundColor, theme.surfaceColor, theme.textColor, theme.textSecondaryColor);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>

      <View style={[s.headerCard, { borderLeftColor: theme.primaryColor }]}>
        <Text style={[s.label, { color: theme.textSecondaryColor }]}>Q2 · Navigation POC</Text>
        <Text style={[s.title, { color: theme.textColor }]}>{itemTitle}</Text>
        <Text style={[s.meta, { color: theme.textSecondaryColor }]}>Post ID: {itemId}</Text>
      </View>

      {loading
        ? <ActivityIndicator color={theme.primaryColor} />
        : post && (
            <View style={[s.bodyCard, { backgroundColor: theme.surfaceColor }]}>
              <Text style={[s.bodyText, { color: theme.textColor }]}>{post.body}</Text>
              <Text style={[s.meta, { color: theme.textSecondaryColor }]}>
                User ID: {post.userId}
              </Text>
            </View>
          )}

      {/* ── Q2a: go back one step (within the feature stack) ── */}
      <TouchableOpacity
        style={[s.btn, { backgroundColor: theme.primaryColor }]}
        onPress={navigation.goBack}
        accessibilityRole="button"
        accessibilityLabel="Back to feature home"
      >
        <Text style={s.btnText}>← Back within feature (pop 1)</Text>
      </TouchableOpacity>

      {/* ── Q2b: pop all the way out to the main app ── */}
      <TouchableOpacity
        style={[s.btnOutline, { borderColor: theme.primaryColor }]}
        onPress={navigation.backToMainApp}
        accessibilityRole="button"
        accessibilityLabel="Back to main app"
      >
        <Text style={[s.btnOutlineText, { color: theme.primaryColor }]}>
          ↩  Back to Main App (pop all)
        </Text>
      </TouchableOpacity>

      <View style={[s.noteCard, { backgroundColor: theme.surfaceColor }]}>
        <Text style={[s.noteTitle, { color: theme.primaryColor }]}>Navigation summary</Text>
        <Text style={[s.noteBody, { color: theme.textSecondaryColor }]}>
          • "← Back within feature" → calls{' '}
          <Text style={{ fontWeight: '700' }}>navigation.goBack()</Text> injected by host
          {'\n'}
          • "↩ Back to Main App" → calls{' '}
          <Text style={{ fontWeight: '700' }}>navigation.backToMainApp()</Text> injected by host
        </Text>
      </View>
    </ScrollView>
  );
}

function makeStyles(
  primary: string,
  bg: string,
  surface: string,
  text: string,
  textSub: string,
) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: bg },
    content: { padding: 16, gap: 14, paddingBottom: 40 },
    headerCard: {
      borderLeftWidth: 3,
      paddingLeft: 12,
      gap: 4,
    },
    label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    title: { fontSize: 18, fontWeight: '700' },
    meta: { fontSize: 12 },
    bodyCard: { borderRadius: 10, padding: 14, gap: 8 },
    bodyText: { fontSize: 14, lineHeight: 22 },
    btn: {
      borderRadius: 10,
      padding: 14,
      alignItems: 'center',
    },
    btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    btnOutline: {
      borderWidth: 1,
      borderRadius: 10,
      padding: 14,
      alignItems: 'center',
    },
    btnOutlineText: { fontSize: 14, fontWeight: '600' },
    noteCard: {
      borderRadius: 10,
      padding: 14,
      gap: 6,
    },
    noteTitle: { fontSize: 13, fontWeight: '700' },
    noteBody: { fontSize: 12, lineHeight: 20 },
  });
}
