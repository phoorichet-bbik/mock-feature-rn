import { File, Paths } from 'expo-file-system/next';
import * as MediaLibrary from 'expo-media-library';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useHostBridge } from '../host-bridge';

const SAMPLE_IMAGE_URL = 'https://picsum.photos/800/600';
const SAMPLE_VIDEO_URL = 'https://samplelib.com/mp4/sample-5s.mp4';

type MediaStatus = 'idle' | 'requesting' | 'downloading' | 'saving' | 'done' | 'denied' | 'error';

async function requestPermission(): Promise<boolean> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  return status === 'granted';
}

async function downloadToFile(url: string, file: File): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();
  file.write(new Uint8Array(buffer));
}

export default function SaveMediaScreen() {
  const { theme, navigation } = useHostBridge();

  const [imageStatus, setImageStatus] = useState<MediaStatus>('idle');
  const [imageError, setImageError] = useState('');
  const [videoStatus, setVideoStatus] = useState<MediaStatus>('idle');
  const [videoError, setVideoError] = useState('');

  const s = makeStyles(theme.primaryColor, theme.backgroundColor, theme.surfaceColor, theme.textColor, theme.textSecondaryColor);

  async function handleSaveImage() {
    setImageStatus('requesting');
    setImageError('');
    if (!(await requestPermission())) {
      setImageStatus('denied');
      return;
    }
    const file = new File(Paths.document, `poc_image_${Date.now()}.jpg`);
    try {
      setImageStatus('downloading');
      await downloadToFile(SAMPLE_IMAGE_URL, file);
      if (!file.exists || file.size === 0) {
        throw new Error('Downloaded file is empty or missing');
      }
      setImageStatus('saving');
      await MediaLibrary.saveToLibraryAsync(file.uri);
      setImageStatus('done');
    } catch (e) {
      setImageStatus('error');
      setImageError(e instanceof Error ? e.message : String(e));
    } finally {
      if (file.exists) file.delete();
    }
  }

  async function handleSaveVideo() {
    setVideoStatus('requesting');
    setVideoError('');
    if (!(await requestPermission())) {
      setVideoStatus('denied');
      return;
    }
    const file = new File(Paths.document, `poc_video_${Date.now()}.mp4`);
    try {
      setVideoStatus('downloading');
      await downloadToFile(SAMPLE_VIDEO_URL, file);
      if (!file.exists || file.size === 0) {
        throw new Error('Downloaded file is empty or missing');
      }
      setVideoStatus('saving');
      await MediaLibrary.saveToLibraryAsync(file.uri);
      setVideoStatus('done');
    } catch (e) {
      setVideoStatus('error');
      setVideoError(e instanceof Error ? e.message : String(e));
    } finally {
      if (file.exists) file.delete();
    }
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>

      <View style={[s.infoCard, { borderLeftColor: theme.primaryColor }]}>
        <Text style={[s.infoTitle, { color: theme.primaryColor }]}>
          Native module from remote package
        </Text>
        <Text style={[s.infoBody, { color: theme.textSecondaryColor }]}>
          This screen uses{' '}
          <Text style={{ fontWeight: '700' }}>expo-media-library</Text> and{' '}
          <Text style={{ fontWeight: '700' }}>expo-file-system</Text> — native
          modules compiled into the host binary, called from the remote package
          via peerDependencies.
        </Text>
      </View>

      {/* ── Save Image ─────────────────────────────────────── */}
      <View style={[s.card, { backgroundColor: theme.surfaceColor }]}>
        <Text style={[s.cardTitle, { color: theme.textColor }]}>Save Image</Text>

        <Image
          source={{ uri: SAMPLE_IMAGE_URL }}
          style={s.preview}
          resizeMode="cover"
        />
        <Text style={[s.urlText, { color: theme.textSecondaryColor }]} numberOfLines={1}>
          {SAMPLE_IMAGE_URL}
        </Text>

        <StatusBadge status={imageStatus} errorMessage={imageError} colors={theme} />

        <TouchableOpacity
          style={[
            s.btn,
            { backgroundColor: theme.primaryColor },
            ['requesting', 'downloading', 'saving'].includes(imageStatus) ? s.btnDisabled : undefined,
          ]}
          onPress={handleSaveImage}
          disabled={['requesting', 'downloading', 'saving'].includes(imageStatus)}
          accessibilityRole="button"
          accessibilityLabel="Save image to gallery"
        >
          {['requesting', 'downloading', 'saving'].includes(imageStatus)
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.btnText}>⬇  Save Image to Gallery</Text>}
        </TouchableOpacity>
      </View>

      {/* ── Save Video ─────────────────────────────────────── */}
      <View style={[s.card, { backgroundColor: theme.surfaceColor }]}>
        <Text style={[s.cardTitle, { color: theme.textColor }]}>Save Video</Text>

        <View style={s.videoThumb}>
          <Text style={s.videoIcon}>🎬</Text>
          <Text style={[s.urlText, { color: theme.textSecondaryColor }]} numberOfLines={2}>
            {SAMPLE_VIDEO_URL}
          </Text>
        </View>

        <StatusBadge status={videoStatus} errorMessage={videoError} colors={theme} />

        <TouchableOpacity
          style={[
            s.btn,
            { backgroundColor: theme.primaryColor },
            ['requesting', 'downloading', 'saving'].includes(videoStatus) ? s.btnDisabled : undefined,
          ]}
          onPress={handleSaveVideo}
          disabled={['requesting', 'downloading', 'saving'].includes(videoStatus)}
          accessibilityRole="button"
          accessibilityLabel="Save video to gallery"
        >
          {['requesting', 'downloading', 'saving'].includes(videoStatus)
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={s.btnText}>⬇  Save Video to Gallery</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[s.backBtn, { borderColor: theme.primaryColor }]}
        onPress={navigation.goBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={[s.backBtnText, { color: theme.primaryColor }]}>← Back</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

// ── Status badge ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<MediaStatus, string> = {
  idle: '',
  requesting: 'Requesting permission…',
  downloading: 'Downloading…',
  saving: 'Saving to library…',
  done: '✅ Saved to gallery',
  denied: '❌ Permission denied',
  error: '❌ Something went wrong',
};

function StatusBadge({
  status,
  errorMessage,
  colors,
}: {
  status: MediaStatus;
  errorMessage?: string;
  colors: { primaryColor: string; textSecondaryColor: string };
}) {
  if (status === 'idle') return null;
  const label = STATUS_LABEL[status];
  const detail = status === 'error' && errorMessage ? `\n${errorMessage}` : '';

  return (
    <Text style={[badgeStyles.text, {
      color: status === 'done' ? '#22c55e' : status === 'denied' || status === 'error' ? '#ef4444' : colors.primaryColor,
    }]}>
      {label}{detail}
    </Text>
  );
}

const badgeStyles = StyleSheet.create({
  text: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
});

// ── Styles ───────────────────────────────────────────────────────────────────

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
    infoCard: {
      borderLeftWidth: 3,
      paddingLeft: 12,
      gap: 6,
    },
    infoTitle: { fontSize: 13, fontWeight: '700' },
    infoBody: { fontSize: 12, lineHeight: 18 },
    card: {
      borderRadius: 12,
      padding: 14,
      gap: 10,
    },
    cardTitle: { fontSize: 16, fontWeight: '700' },
    preview: {
      width: '100%',
      height: 160,
      borderRadius: 8,
      backgroundColor: '#e5e7eb',
    },
    videoThumb: {
      height: 100,
      borderRadius: 8,
      backgroundColor: '#1c1c1e',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      padding: 12,
    },
    videoIcon: { fontSize: 32 },
    urlText: { fontSize: 11 },
    btn: {
      borderRadius: 10,
      padding: 14,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    btnDisabled: { opacity: 0.6 },
    btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    backBtn: {
      borderWidth: 1,
      borderRadius: 10,
      padding: 14,
      alignItems: 'center',
    },
    backBtnText: { fontSize: 14, fontWeight: '600' },
  });
}
