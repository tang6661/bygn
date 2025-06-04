<template>
  <div class="music-player" ref="musicPlayerContainer">
    <transition name="fade" mode="out-in">
      <!-- 歌曲列表视图 -->
      <div v-if="!showPlayer" class="music-list" key="list">
        <h2>歌曲列表</h2>
        <div class="song-list">
          <div 
            v-for="(track, index) in tracks" 
            :key="index" 
            class="song-item"
            @click="selectTrack(index)"
            :data-index="index + 1"
            :style="{animationDelay: index * 0.05 + 's'}"
          >
            <div class="song-title">{{ track.title }}</div>
          </div>
        </div>
      </div>

      <!-- 播放器视图 -->
      <div v-else class="player-view" key="player">
        <div class="player-header">
          <button class="back-button" @click="returnToList">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path fill="#555" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
          </button>
          <h3>{{ currentTrack.title }}</h3>
          <div class="options-menu">
            <button class="options-button" @click="toggleOptionsMenu">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="#555" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
            <div class="menu-dropdown" v-if="showOptionsMenu">
              <div class="menu-item" @click="toggleFullscreen">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="#555" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" v-if="!isFullscreen"/>
                  <path fill="#555" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" v-else/>
                </svg>
                <span>{{ isFullscreen ? '退出全屏' : '全屏' }}</span>
              </div>
            </div>
          </div>
        </div>

        <audio ref="audioPlayer" :src="currentTrack.url" @timeupdate="updateProgress" @ended="nextTrack"></audio>
        
        <div class="lyrics-container">
          <!-- 装饰性音符 -->
          <div class="music-notes" v-if="isPlaying">
            <span class="note note-1">♪</span>
            <span class="note note-2">♫</span>
            <span class="note note-3">♩</span>
            <span class="note note-4">♬</span>
          </div>

          <div class="lyrics" ref="lyricsContainer">
            <div v-if="isLyricsLoading" class="lyrics-loading">
              加载歌词中...
            </div>
            <p 
              v-else-if="currentLyrics.length > 0"
              v-for="(line, index) in currentLyrics" 
              :key="index" 
              :class="{ active: isCurrentLine(line) }"
              ref="lyricLines"
            >
              {{ line.text }}
            </p>
            <p v-else class="no-lyrics">暂无歌词</p>
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
                <path fill="currentColor" d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            <button class="control-btn play-btn" @click="togglePlayPause">
              <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
                <path fill="white" d="M8 5v14l11-7z"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
                <path fill="white" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            </button>
            <button class="control-btn" @click="nextTrack" :disabled="currentTrackIndex === tracks.length - 1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
                <path fill="currentColor" d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick, onUnmounted } from 'vue';

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
const isLyricsLoading = ref(false);
const musicPlayerContainer = ref(null);
const showOptionsMenu = ref(false);
const isFullscreen = ref(false);

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
      
      // 获取容器和元素的位置信息
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
      // 检查当前行是否在可视区域内
      const isVisible = 
        elementRect.top >= containerRect.top &&
        elementRect.bottom <= containerRect.bottom;
      
      // 如果当前行不在可视区域内，则滚动到该行
      if (!isVisible) {
        let scrollPosition;
        
        // 检查是否接近歌词末尾（最后5行）
        const isNearEnd = index >= currentLyrics.value.length - 5;
        
        if (isNearEnd) {
          // 如果接近末尾，确保能看到最后几行
          const lastElement = lyricLines.value[currentLyrics.value.length - 1];
          if (lastElement) {
            scrollPosition = lastElement.offsetTop - containerRect.height + 150;
          } else {
            scrollPosition = element.offsetTop - containerRect.height / 4;
          }
        } else {
          // 正常滚动
          scrollPosition = element.offsetTop - containerRect.height / 4;
        }
        
        container.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
    }
  });
};

const fetchLyrics = async (url) => {
  try {
    isLyricsLoading.value = true;
    lyrics.value = []; // 清空之前的歌词
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text(); // Read as text
    lyrics.value = text.split('\n').filter(line => line.trim() !== ''); // Split by newline
    
    // 确保歌词容器滚动到顶部
    nextTick(() => {
      if (lyricsContainer.value) {
        lyricsContainer.value.scrollTop = 0;
      }
    });
  } catch (error) {
    console.error('Error fetching or parsing lyrics:', error);
    lyrics.value = [];
  } finally {
    isLyricsLoading.value = false;
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
  
  // 先获取歌词，确保歌词请求被发送
  fetchLyrics(props.tracks[index].lyricsUrl).then(() => {
    // 歌词加载完成后再显示播放器
    showPlayer.value = true;
    
    nextTick(() => {
      if (audioPlayer.value) {
        audioPlayer.value.load();
        audioPlayer.value.play().catch(err => {
          console.error('播放失败:', err);
        });
        isPlaying.value = true;
      }
    });
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

watch(currentTrackIndex, async (newIndex) => {
  if (audioPlayer.value) {
    isPlaying.value = false; // Pause before changing track
    audioPlayer.value.load(); // Load new track
    
    // 确保歌词加载完成
    await fetchLyrics(props.tracks[newIndex].lyricsUrl);
    
    // 重置歌词滚动位置
    if (lyricsContainer.value) {
      lyricsContainer.value.scrollTop = 0;
    }
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

const adjustLyricsContainer = () => {
  nextTick(() => {
    if (lyricsContainer.value) {
      // 确保歌词容器有足够的高度
      const containerHeight = lyricsContainer.value.clientHeight;
      const parentHeight = lyricsContainer.value.parentElement.clientHeight;
      
      // 设置最小高度，确保滚动正常工作
      if (containerHeight < parentHeight) {
        lyricsContainer.value.style.minHeight = `${parentHeight}px`;
      }
    }
  });
};

const toggleOptionsMenu = () => {
  showOptionsMenu.value = !showOptionsMenu.value;
};

const toggleFullscreen = () => {
  if (!isFullscreen.value) {
    // 进入全屏
    if (musicPlayerContainer.value.requestFullscreen) {
      musicPlayerContainer.value.requestFullscreen();
    } else if (musicPlayerContainer.value.webkitRequestFullscreen) { /* Safari */
      musicPlayerContainer.value.webkitRequestFullscreen();
    } else if (musicPlayerContainer.value.msRequestFullscreen) { /* IE11 */
      musicPlayerContainer.value.msRequestFullscreen();
    }
  } else {
    // 退出全屏
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
      document.msExitFullscreen();
    }
  }
  toggleOptionsMenu(); // 关闭菜单
};

// 监听全屏变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement || 
                       !!document.webkitFullscreenElement || 
                       !!document.msFullscreenElement;
};

// 点击外部关闭菜单
const handleClickOutside = (event) => {
  const optionsMenu = document.querySelector('.options-menu');
  if (showOptionsMenu.value && optionsMenu && !optionsMenu.contains(event.target)) {
    showOptionsMenu.value = false;
  }
};

onMounted(() => {
  if (currentTrack.value) {
    fetchLyrics(currentTrack.value.lyricsUrl);
    loadTrackDurations();
    adjustLyricsContainer();
  }
  
  // 添加全屏变化事件监听
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.addEventListener('msfullscreenchange', handleFullscreenChange);
  
  // 添加点击外部关闭菜单的事件监听
  document.addEventListener('click', handleClickOutside);
});

// 监听歌词变化，调整容器
watch(lyrics, () => {
  adjustLyricsContainer();
});

// 监听播放状态变化，调整容器
watch(showPlayer, () => {
  if (showPlayer.value) {
    nextTick(() => {
      adjustLyricsContainer();
    });
  }
});

onUnmounted(() => {
  // 移除事件监听
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
  document.removeEventListener('msfullscreenchange', handleFullscreenChange);
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.music-player {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  border-radius: 16px;
  background-color: #fff;
  color: #333;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

/* 歌曲列表样式 */
.music-list {
  padding: 24px;
}

.music-list h2 {
  margin-bottom: 24px;
  font-size: 1.6rem;
  font-weight: 600;
  text-align: center;
  color: #333;
  position: relative;
  padding-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.music-list h2::before {
  content: '';
  display: inline-block;
  width: 24px;
  height: 24px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%234a90e2' d='M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z'/%3E%3C/svg%3E");
  background-size: contain;
  margin-right: 8px;
}

.music-list h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #4a90e2, #63b3ed);
  border-radius: 3px;
}

.song-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 20px;
}

.song-item {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  background-color: #f8f9fa;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.03);
  animation: fadeIn 0.5s ease forwards;
  opacity: 0;
  transform: translateY(10px);
}

.song-item:hover {
  background-color: #f0f4f8;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.song-item::before {
  content: attr(data-index);
  position: absolute;
  left: 16px;
  color: #aaa;
  font-size: 0.9rem;
  width: 20px;
  text-align: center;
}

.song-title {
  font-size: 1.05rem;
  font-weight: 500;
  color: #333;
  margin-left: 30px;
  margin-right: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
  flex: 1;
}

/* 播放器视图样式 */
.player-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 700px;
  background: linear-gradient(180deg, #fff 0%, #f8f9fa 100%);
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
}

.player-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, #4a90e2, #63b3ed);
  border-radius: 3px 3px 0 0;
}

.player-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  flex: 1;
  text-align: center;
  margin: 0;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
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
  transition: opacity 0.2s;
  border-radius: 50%;
}

.back-button:hover, .options-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* 歌词容器 */
.lyrics-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  padding: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(248,249,250,0.5) 100%);
}

.music-notes {
  position: absolute;
  top: 10px;
  left: 0;
  width: 100%;
  height: 50px;
  overflow: hidden;
  opacity: 0.5;
  pointer-events: none;
}

.note {
  position: absolute;
  font-size: 24px;
  color: #4a90e2;
  animation-name: float;
  animation-duration: 3s;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

.note-1 {
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.note-2 {
  top: 20%;
  left: 85%;
  animation-delay: 0.5s;
}

.note-3 {
  top: 5%;
  left: 30%;
  animation-delay: 1s;
}

.note-4 {
  top: 15%;
  left: 70%;
  animation-delay: 1.5s;
}

@keyframes float {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-50px) rotate(20deg);
    opacity: 0;
  }
}

.lyrics {
  height: 100%;
  overflow-y: auto;
  text-align: center;
  padding: 20px 20px 120px 20px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  scrollbar-width: none; /* Firefox */
}

.lyrics::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

.lyrics p:first-child {
  margin-top: 0;
}

.lyrics p:last-child {
  margin-bottom: 80px;
}

.lyrics p {
  margin: 16px 0;
  color: #888;
  font-size: 1rem;
  transition: all 0.3s ease;
  opacity: 0.6;
  padding: 0 20px;
  line-height: 1.5;
}

.lyrics p.active {
  color: #333;
  font-size: 1.15rem;
  font-weight: 600;
  opacity: 1;
  transform: scale(1.05);
}

/* 播放控制区域 */
.player-controls {
  padding: 24px;
  background-color: #fff;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.03);
}

.progress-bar {
  margin-bottom: 20px;
  position: relative;
}

.progress-bar input[type="range"] {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #eee;
  border-radius: 3px;
  outline: none;
  margin-bottom: 6px;
  cursor: pointer;
}

.progress-bar input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #4a90e2;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.progress-bar input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.progress-bar input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #4a90e2;
  cursor: pointer;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.progress-bar input[type="range"]::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.time-display {
  display: flex;
  justify-content: center;
  font-size: 0.9rem;
  color: #777;
  margin-top: 10px;
  font-family: monospace;
  letter-spacing: 0.5px;
}

.control-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  margin-top: 5px;
}

.control-btn {
  background: none;
  border: none;
  color: #555;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.85;
  transition: all 0.2s ease;
  padding: 8px;
  border-radius: 50%;
}

.control-btn:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.03);
  transform: scale(1.05);
}

.control-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
  background: none;
}

.play-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #4a90e2;
  color: white;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.25);
}

.play-btn svg {
  fill: white;
}

.play-btn:hover {
  background-color: #3a80d2;
  box-shadow: 0 6px 16px rgba(74, 144, 226, 0.35);
}

@media (max-width: 480px) {
  .music-list {
    padding: 16px;
  }
  
  .song-item {
    padding: 14px;
  }
  
  .player-controls {
    padding: 16px;
  }
  
  .lyrics p {
    font-size: 0.95rem;
  }
  
  .lyrics p.active {
    font-size: 1.1rem;
  }
}

/* 添加淡入淡出过渡效果 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 为歌曲列表项添加渐入动画 */
@keyframes fadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.lyrics-loading, .no-lyrics {
  color: #888;
  font-size: 1rem;
  padding: 20px;
  text-align: center;
  width: 100%;
}

.lyrics-loading {
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.options-menu {
  position: relative;
}

.menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  padding: 8px 0;
  min-width: 120px;
  z-index: 100;
  margin-top: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

.menu-item svg {
  margin-right: 8px;
}

.menu-item span {
  font-size: 0.9rem;
  color: #333;
}

/* 全屏时的样式 */
.music-player:fullscreen,
.music-player:-webkit-full-screen,
.music-player:-ms-fullscreen {
  width: 100%;
  height: 100%;
  max-width: none;
  border-radius: 0;
}

.music-player:fullscreen .player-view,
.music-player:-webkit-full-screen .player-view,
.music-player:-ms-fullscreen .player-view {
  height: 100vh;
  max-height: none;
}
</style>