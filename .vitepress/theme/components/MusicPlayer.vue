<template>
  <div class="music-player">
    <!-- 歌曲列表视图 -->
    <div v-if="!showPlayer" class="music-list">
      <h2>歌曲列表</h2>
      <div class="song-list">
        <div 
          v-for="(track, index) in tracks" 
          :key="index" 
          class="song-item"
          @click="selectTrack(index)"
          :data-index="index + 1"
        >
          <div class="song-title">{{ track.title }}</div>
          <div class="song-duration">{{ getTrackDuration(track) }}</div>
        </div>
      </div>
    </div>

    <!-- 播放器视图 -->
    <div v-else class="player-view">
      <div class="player-header">
        <button class="back-button" @click="returnToList">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="#333" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <h3>{{ currentTrack.title }}</h3>
        <div class="options-button">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
            <path fill="#333" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </div>
      </div>

      <audio ref="audioPlayer" :src="currentTrack.url" @timeupdate="updateProgress" @ended="nextTrack"></audio>
      
      <div class="lyrics-container">
        <div class="lyrics" ref="lyricsContainer">
          <p 
            v-for="(line, index) in currentLyrics" 
            :key="index" 
            :class="{ active: isCurrentLine(line) }"
            ref="lyricLines"
          >
            {{ line.text }}
          </p>
        </div>
      </div>

      <div class="player-controls">
        <div class="progress-bar">
          <input type="range" min="0" :max="duration" v-model="currentTime" @input="seek" step="0.1">
          <div class="time-display">
            <span>{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
          </div>
        </div>

        <div class="control-buttons">
          <button class="control-btn" @click="prevTrack" :disabled="currentTrackIndex === 0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
              <path fill="#333" d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          <button class="control-btn play-btn" @click="togglePlayPause">
            <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
              <path fill="#333" d="M8 5v14l11-7z"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
              <path fill="#333" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>
          <button class="control-btn" @click="nextTrack" :disabled="currentTrackIndex === tracks.length - 1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
              <path fill="#333" d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue';

const props = defineProps({
  tracks: {
    type: Array,
    required: true
  }
});

const audioPlayer = ref(null);
const tempAudio = ref(null);
const isPlaying = ref(false);
const currentTrackIndex = ref(0);
const currentTime = ref(0);
const duration = ref(0);
const lyrics = ref([]);
const showPlayer = ref(false);
const lyricsContainer = ref(null);
const lyricLines = ref([]);
const trackDurations = ref({});

const currentTrack = computed(() => props.tracks[currentTrackIndex.value]);

const currentLyrics = computed(() => {
  if (!lyrics.value || lyrics.value.length === 0) return [];
  
  // 解析LRC格式歌词
  return lyrics.value.map(line => {
    // 匹配标准LRC格式 [mm:ss.xx] 或 [mm:ss.xxx]
    const standardMatch = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    
    // 匹配增强的LRC格式，支持[h:mm:ss.xx]
    const enhancedMatch = line.match(/\[(\d+):(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
    
    if (enhancedMatch) {
      // 小时:分钟:秒.毫秒 格式
      const hours = parseInt(enhancedMatch[1]);
      const minutes = parseInt(enhancedMatch[2]);
      const seconds = parseInt(enhancedMatch[3]);
      const milliseconds = parseInt(enhancedMatch[4].padEnd(3, '0'));
      const time = ((hours * 60 + minutes) * 60 + seconds) * 1000 + milliseconds;
      const text = enhancedMatch[5].trim();
      return { time, text };
    } else if (standardMatch) {
      // 标准的分钟:秒.毫秒 格式
      const minutes = parseInt(standardMatch[1]);
      const seconds = parseInt(standardMatch[2]);
      const milliseconds = parseInt(standardMatch[3].padEnd(3, '0'));
      const time = (minutes * 60 + seconds) * 1000 + milliseconds;
      const text = standardMatch[4].trim();
      return { time, text };
    } else {
      // 没有时间戳的行
      return { time: 0, text: line };
    }
  }).sort((a, b) => a.time - b.time);
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
  if (currentLineIndex !== -1) {
    scrollToActiveLyric(currentLineIndex);
    return line === currentLyrics.value[currentLineIndex];
  }
  return false;
};

const scrollToActiveLyric = (index) => {
  nextTick(() => {
    if (lyricsContainer.value && lyricLines.value && lyricLines.value[index]) {
      const container = lyricsContainer.value;
      const element = lyricLines.value[index];
      
      // 计算滚动位置，使活动行居中
      const containerHeight = container.clientHeight;
      const elementTop = element.offsetTop;
      const elementHeight = element.clientHeight;
      
      const scrollPosition = elementTop - (containerHeight / 2) + (elementHeight / 2);
      
      // 平滑滚动到活动行
      container.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  });
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
  if (!audioPlayer.value) return;
  
  if (isPlaying.value) {
    audioPlayer.value.pause();
  } else {
    audioPlayer.value.play();
  }
  isPlaying.value = !isPlaying.value;
};

const updateProgress = () => {
  if (audioPlayer.value) {
    currentTime.value = audioPlayer.value.currentTime;
    duration.value = audioPlayer.value.duration;
  }
};

const seek = () => {
  if (audioPlayer.value) {
    audioPlayer.value.currentTime = currentTime.value;
  }
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

const selectTrack = (index) => {
  currentTrackIndex.value = index;
  showPlayer.value = true;
  nextTick(() => {
    if (audioPlayer.value) {
      audioPlayer.value.load();
      audioPlayer.value.play();
      isPlaying.value = true;
    }
  });
};

const formatTime = (time) => {
  if (isNaN(time) || time === 0) return '0:00';
  
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  } else {
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }
};

watch(currentTrackIndex, (newIndex) => {
  if (audioPlayer.value) {
    isPlaying.value = false; // Pause before changing track
    audioPlayer.value.load(); // Load new track
    fetchLyrics(props.tracks[newIndex].lyricsUrl); // Fetch new lyrics
  }
});

// 获取歌曲真实时长
const loadTrackDurations = async () => {
  for (let i = 0; i < props.tracks.length; i++) {
    const track = props.tracks[i];
    if (!trackDurations.value[track.url]) {
      await getAudioDuration(track.url, i);
    }
  }
};

const getAudioDuration = (url, index) => {
  return new Promise((resolve) => {
    if (!tempAudio.value) {
      tempAudio.value = new Audio();
    }
    
    const audio = tempAudio.value;
    audio.src = url;
    
    const handleMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        // 确保时长格式一致
        trackDurations.value[url] = formatTime(audio.duration);
        audio.removeEventListener('loadedmetadata', handleMetadata);
        resolve();
      }
    };
    
    audio.addEventListener('loadedmetadata', handleMetadata);
    
    // 缩短超时时间，改善用户体验
    setTimeout(() => {
      if (!trackDurations.value[url]) {
        trackDurations.value[url] = '--:--';
        audio.removeEventListener('loadedmetadata', handleMetadata);
        resolve();
      }
    }, 2000);
  });
};

// 获取指定歌曲的时长
const getTrackDuration = (track) => {
  if (trackDurations.value[track.url]) {
    return trackDurations.value[track.url];
  } else {
    // 显示一个更符合设计的占位符
    return '--:--';
  }
};

// 返回列表视图的函数
const returnToList = () => {
  if (audioPlayer.value && isPlaying.value) {
    audioPlayer.value.pause();
    isPlaying.value = false;
  }
  showPlayer.value = false;
};

onMounted(() => {
  if (currentTrack.value) {
    fetchLyrics(currentTrack.value.lyricsUrl);
    loadTrackDurations();
  }
});
</script>

<style scoped>
.music-player {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  border-radius: 12px;
  background-color: #fff;
  color: #333;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 歌曲列表样式 */
.music-list {
  padding: 20px;
}

.music-list h2 {
  margin-bottom: 20px;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  color: #333;
  position: relative;
  padding-bottom: 12px;
}

.music-list h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background-color: #4a90e2;
  border-radius: 3px;
}

.song-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.song-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-radius: 8px;
  background-color: #f5f5f5;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.song-item:hover {
  background-color: #eaeaea;
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.song-item::before {
  content: attr(data-index);
  position: absolute;
  left: 16px;
  color: #999;
  font-size: 0.9rem;
  width: 20px;
  text-align: center;
}

.song-title {
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  margin-left: 30px;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-duration {
  font-size: 0.9rem;
  color: #666;
  padding-left: 10px;
  font-family: monospace;
}

/* 播放器视图样式 */
.player-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 700px;
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eaeaea;
}

.player-header h3 {
  font-size: 1.2rem;
  font-weight: 500;
  flex: 1;
  text-align: center;
  margin: 0;
  color: #333;
}

.back-button, .options-button {
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
}

/* 歌词容器 */
.lyrics-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  padding: 20px 0;
}

.lyrics {
  height: 100%;
  overflow-y: auto;
  text-align: center;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  scrollbar-width: none; /* Firefox */
}

.lyrics::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

.lyrics p {
  margin: 16px 0;
  color: #777;
  font-size: 1rem;
  transition: all 0.3s ease;
  opacity: 0.7;
}

.lyrics p.active {
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
  opacity: 1;
}

/* 播放控制区域 */
.player-controls {
  padding: 20px;
  background-color: #f9f9f9;
  border-top: 1px solid #eaeaea;
}

.progress-bar {
  margin-bottom: 16px;
  position: relative;
}

.progress-bar input[type="range"] {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #ddd;
  border-radius: 2px;
  outline: none;
  margin-bottom: 4px;
  cursor: pointer;
}

.progress-bar input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #4a90e2;
  cursor: pointer;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
}

.progress-bar input[type="range"]::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #4a90e2;
  cursor: pointer;
  border: none;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
}

.time-display {
  display: flex;
  justify-content: center;
  font-size: 0.9rem;
  color: #666;
  margin-top: 8px;
  font-family: monospace;
  letter-spacing: 0.5px;
}

.control-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

.control-btn {
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.control-btn:hover {
  opacity: 1;
}

.control-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.play-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #f0f0f0;
}
</style>