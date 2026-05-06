import { createDownloadResumable, deleteAsync, documentDirectory, downloadAsync, getInfoAsync } from 'expo-file-system/legacy';
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

function docFilePath(name: string): string {
  const base = documentDirectory ?? '';
  return `${base.endsWith('/') ? base : `${base}/`}${name}`;
}

async function requestPermission(): Promise<boolean> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  return status === 'granted';
}

export default function SaveMediaScreen() {
  const { theme, navigation } = useHostBridge();

  const [imageStatus, setImageStatus] = useState<MediaStatus>('idle');
  const [imageError, setImageError] = useState('');
  const [videoStatus, setVideoStatus] = useState<MediaStatus>('idle');
  const [videoError, setVideoError] = useState('');
  const [videoProgress, setVideoProgress] = useState(0);

  console.log('videoError', videoError);

  const s = makeStyles(theme.primaryColor, theme.backgroundColor, theme.surfaceColor, theme.textColor, theme.textSecondaryColor);

  async function handleSaveImage() {
    setImageStatus('requesting');
    setImageError('');
    if (!(await requestPermission())) {
      setImageStatus('denied');
      return;
    }
    const dest = docFilePath(`poc_image_${Date.now()}.jpg`);
    try {
      setImageStatus('downloading');
      const result = await downloadAsync(SAMPLE_IMAGE_URL, dest);
      if (result.status !== 200) {
        throw new Error(`Download failed: HTTP ${result.status}`);
      }
      const info = await getInfoAsync(dest);
      if (!info.exists || info.size === 0) {
        throw new Error('Downloaded file is empty or missing');
      }
      setImageStatus('saving');
      await MediaLibrary.saveToLibraryAsync(dest);
      setImageStatus('done');
    }
    catch (e) {
      setImageStatus('error');
      setImageError(e instanceof Error ? e.message : String(e));
    }
    finally {
      await deleteAsync(dest, { idempotent: true });
    }
  }

  async function handleSaveVideo() {
    setVideoStatus('requesting');
    setVideoError('');
    if (!(await requestPermission())) {
      setVideoStatus('denied');
      return;
    }
    const dest = docFilePath(`poc_video_${Date.now()}.mp4`);
    try {
      setVideoProgress(0);
      setVideoStatus('downloading');
      const task = createDownloadResumable(
        SAMPLE_VIDEO_URL,
        dest,
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          if (totalBytesExpectedToWrite > 0) {
            setVideoProgress(Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 100));
          }
        },
      );
      const result = await task.downloadAsync();
      if (!result || result.status !== 200) {
        throw new Error(`Download failed: HTTP ${result?.status ?? 'unknown'}`);
      }
      const info = await getInfoAsync(dest);
      if (!info.exists || info.size === 0) {
        throw new Error('Downloaded file is empty or missing');
      }
      setVideoStatus('saving');
      await MediaLibrary.saveToLibraryAsync(dest);
      setVideoStatus('done');
    }
    catch (e) {
      setVideoStatus('error');
      setVideoError(e instanceof Error ? e.message : String(e));
    }
    finally {
      await deleteAsync(dest, { idempotent: true });
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

        <StatusBadge status={imageStatus} progress={null} errorMessage={imageError} colors={theme} />

        <TouchableOpacity
          style={[s.btn, { backgroundColor: theme.primaryColor }, imageStatus === 'downloading' || imageStatus === 'saving' || imageStatus === 'requesting' ? s.btnDisabled : undefined]}
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

        <StatusBadge status={videoStatus} progress={videoProgress} errorMessage={videoError} colors={theme} />

        {videoStatus === 'downloading' && (
          <View style={s.progressBarTrack}>
            <View style={[s.progressBarFill, { width: `${videoProgress}%` as any, backgroundColor: theme.primaryColor }]} />
          </View>
        )}

        <TouchableOpacity
          style={[s.btn, { backgroundColor: theme.primaryColor }, videoStatus === 'downloading' || videoStatus === 'saving' || videoStatus === 'requesting' ? s.btnDisabled : undefined]}
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
  progress,
  errorMessage,
  colors,
}: {
  status: MediaStatus;
  progress: number | null;
  errorMessage?: string;
  colors: { primaryColor: string; textSecondaryColor: string };
}) {
  if (status === 'idle') return null;
  const label = status === 'downloading' && progress !== null
    ? `Downloading… ${progress}%`
    : STATUS_LABEL[status];
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
    progressBarTrack: {
      height: 6,
      backgroundColor: '#e5e7eb',
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: 6,
      borderRadius: 3,
    },
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
