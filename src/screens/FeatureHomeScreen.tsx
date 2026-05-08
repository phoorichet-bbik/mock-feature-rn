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

interface Post {
  id: number;
  title: string;
  body: string;
}

// ─── POC: Q3 — remote makes its own API call ───────────────────────────────
async function fetchMockPosts(): Promise<Post[]> {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<Post[]>;
}

export default function FeatureHomeScreen() {
  const { theme, config, navigation } = useHostBridge();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMockPosts()
      .then(setPosts)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Unknown error'))
      .finally(() => setLoading(false));
  }, []);

  const s = makeStyles(theme.primaryColor, theme.backgroundColor, theme.surfaceColor, theme.textColor, theme.textSecondaryColor);

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>

      {/* ── POC: Q4 — UI built from host theme + config ── */}
      <View style={s.hostInfoCard}>
        <Text style={s.hostInfoTitle}>Q4 · Theme & Config from Host</Text>
        <Row label="App" value={config.appName} color={theme.textSecondaryColor} />
        <Row label="User" value={config.userDisplayName ?? '—'} color={theme.textSecondaryColor} />
        <Row label="API base" value={config.apiBaseUrl} color={theme.textSecondaryColor} />
        <Row label="Dark mode" value={theme.isDark ? 'yes' : 'no'} color={theme.textSecondaryColor} />
        <View style={[s.colorSwatch, { backgroundColor: theme.primaryColor }]}>
          <Text style={s.swatchLabel}>primaryColor from host</Text>
        </View>
      </View>

      {/* ── POC: Q3 — data fetched by the remote itself ── */}
      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: theme.textColor }]}>
          Q3 · API call from remote
        </Text>
        <Text style={[s.sectionSub, { color: theme.textSecondaryColor }]}>
          Posts fetched by this feature package independently
        </Text>

        {loading && <ActivityIndicator color={theme.primaryColor} style={s.loader} />}
        {!!error && <Text style={s.errorText}>Error: {error}</Text>}

        {posts.map(post => (
          /* ── POC: Q2 — tap pushes to detail screen ── */
          <TouchableOpacity
            key={post.id}
            style={[s.postCard, { backgroundColor: theme.surfaceColor }]}
            onPress={() => navigation.push('detail', { itemId: String(post.id), itemTitle: post.title })}
            accessibilityRole="button"
            accessibilityLabel={post.title}
          >
            <Text style={[s.postTitle, { color: theme.textColor }]} numberOfLines={2}>
              {post.title}
            </Text>
            <Text style={[s.postBody, { color: theme.textSecondaryColor }]} numberOfLines={2}>
              {post.body}
            </Text>
            <Text style={[s.tapHint, { color: theme.primaryColor }]}>
              Tap → Q2 push to detail ›
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── POC: Native modules — save image/video from remote package ── */}
      <TouchableOpacity
        style={[s.saveMediaBtn, { backgroundColor: theme.primaryColor }]}
        onPress={() => navigation.push('save-media')}
        accessibilityRole="button"
        accessibilityLabel="Try save image and video"
      >
        <Text style={s.saveMediaBtnText}>🖼  Save Image / Video (native)</Text>
      </TouchableOpacity>

      {/* ── POC: Q2 — exit back to main app ── */}
      <TouchableOpacity
        style={[s.exitBtn, { borderColor: theme.primaryColor }]}
        onPress={navigation.backToMainApp}
        accessibilityRole="button"
        accessibilityLabel="Back to main app"
      >
        <Text style={[s.exitBtnText, { color: theme.primaryColor }]}>
          ↩  Back to Main App (pop all)
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={[rowStyles.label, { color }]}>{label}:</Text>
      <Text style={[rowStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  label: { fontSize: 12, fontWeight: '600', opacity: 0.7 },
  value: { fontSize: 12, flex: 1 },
});

function makeStyles(
  primary: string,
  bg: string,
  surface: string,
  text: string,
  textSub: string,
) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: bg },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    hostInfoCard: {
      backgroundColor: surface,
      borderRadius: 12,
      padding: 14,
      gap: 4,
      borderLeftWidth: 3,
      borderLeftColor: primary,
    },
    hostInfoTitle: { fontSize: 13, fontWeight: '700', color: primary, marginBottom: 6 },
    colorSwatch: {
      marginTop: 10,
      height: 36,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    swatchLabel: { color: '#fff', fontSize: 11, fontWeight: '600' },
    section: { gap: 8 },
    sectionTitle: { fontSize: 15, fontWeight: '700' },
    sectionSub: { fontSize: 12, marginBottom: 4 },
    loader: { marginVertical: 12 },
    errorText: { color: '#ef4444', fontSize: 13 },
    postCard: {
      borderRadius: 10,
      padding: 12,
      gap: 4,
    },
    postTitle: { fontSize: 13, fontWeight: '600' },
    postBody: { fontSize: 12 },
    tapHint: { fontSize: 11, fontWeight: '600', marginTop: 4 },
    saveMediaBtn: {
      borderRadius: 10,
      padding: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    saveMediaBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    exitBtn: {
      borderWidth: 1,
      borderRadius: 10,
      padding: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    exitBtnText: { fontSize: 14, fontWeight: '600' },
  });
}
