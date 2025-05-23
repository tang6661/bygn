<template>
  <div class="music-player">
    <div v-if="currentTrack">
      <h3>{{ currentTrack.title }}</h3>
      <audio ref="audioPlayer" :src="currentTrack.url" @timeupdate="updateProgress" @ended="nextTrack"></audio>
      <div class="controls">
        <button @click="prevTrack" :disabled="currentTrackIndex === 0">上一首</button>
        <button @click="togglePlayPause">{{ isPlaying ? '暂停' : '播放' }}</button>
        <button @click="nextTrack" :disabled="currentTrackIndex === tracks.length - 1">下一首</button>
      </div>
      <div class="progress-bar">
        <input type="range" min="0" :max="duration" v-model="currentTime" @input="seek" step="0.1">
        <span>{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
      </div>
      <div class="lyrics">
        <p v-for="(line, index) in currentLyrics" :key="index" :class="{ active: isCurrentLine(line) }">
          {{ line.text }}
        </p>
      </div>
    </div>
    <div v-else>
      加载音乐中...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';

const props = defineProps({
  tracks: {
    type: Array,
    required: true
  }
});

const audioPlayer = ref(null);
const isPlaying = ref(false);
const currentTrackIndex = ref(0);
const currentTime = ref(0);
const duration = ref(0);
const lyrics = ref([]);

const currentTrack = computed(() => props.tracks[currentTrackIndex.value]);

const currentLyrics = computed(() => {
  if (!lyrics.value || lyrics.value.length === 0) return [];
  // Simple LCR parsing (timestamp[ms]||text)
  return lyrics.value.map(line => {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const milliseconds = parseInt(match[3].padEnd(3, '0')); // Handle both .xx and .xxx
      const time = (minutes * 60 + seconds) * 1000 + milliseconds;
      const text = match[4].trim();
      return { time, text };
    } else {
      return { time: 0, text: line }; // Handle lines without timestamp
    }
  }).sort((a, b) => a.time - b.time); // Sort lyrics by time
});

const isCurrentLine = (line) => {
  if (!currentLyrics.value || currentLyrics.value.length === 0) return false;
  // Find the last lyric line whose time is less than or equal to the current time
  let currentLineIndex = -1;
  for (let i = 0; i < currentLyrics.value.length; i++) {
    if (currentLyrics.value[i].time <= currentTime.value * 1000) {
      currentLineIndex = i;
    } else {
      break; // Lyrics are sorted by time, so we can stop early
    }
  }
  return line === currentLyrics.value[currentLineIndex];
};

const fetchLyrics = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text(); // Read as text
    lyrics.value = text.split('\n').filter(line => line.trim() !== ''); // Split by newline
  } catch (error) {
    console.error('Error fetching or parsing lyrics:', error);
    lyrics.value = [];
  }
};

const togglePlayPause = () => {
  if (isPlaying.value) {
    audioPlayer.value.pause();
  } else {
    audioPlayer.value.play();
  }
  isPlaying.value = !isPlaying.value;
};

const updateProgress = () => {
  currentTime.value = audioPlayer.value.currentTime;
  duration.value = audioPlayer.value.duration;
};

const seek = () => {
  audioPlayer.value.currentTime = currentTime.value;
};

const nextTrack = () => {
  if (currentTrackIndex.value < props.tracks.length - 1) {
    currentTrackIndex.value++;
  }
};

const prevTrack = () => {
  if (currentTrackIndex.value > 0) {
    currentTrackIndex.value--;
  }
};

const formatTime = (time) => {
  if (isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

watch(currentTrackIndex, (newIndex) => {
  if (audioPlayer.value) {
    isPlaying.value = false; // Pause before changing track
    audioPlayer.value.load(); // Load new track
    fetchLyrics(props.tracks[newIndex].lyricsUrl); // Fetch new lyrics
  }
});

onMounted(() => {
  if (currentTrack.value) {
    fetchLyrics(currentTrack.value.lyricsUrl);
  }
});

// Auto-play the first track on mount (optional)
// onMounted(() => {
//   if (audioPlayer.value) {
//     audioPlayer.value.play();
//     isPlaying.value = true;
//   }
// });
</script>

<style scoped>
.music-player {
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.controls button {
  margin-right: 10px;
  padding: 8px 15px;
  cursor: pointer;
}

.progress-bar input[type="range"] {
  width: calc(100% - 80px); /* Adjust width based on time display */
  vertical-align: middle;
}

.lyrics {
  margin-top: 20px;
  overflow-y: auto;
  text-align: center;
}

.lyrics p {
  margin: 5px 0;
  color: #555;
  transition: color 0.3s ease;
}

.lyrics p.active {
  color: #007bff; /* Highlight color for active lyric line */
  font-weight: bold;
}
</style>