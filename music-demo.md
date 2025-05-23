<ClientOnly>
  <MusicPlayer :tracks="musicTracks" />
</ClientOnly>

<script setup>
import { ref } from 'vue';

const musicTracks = ref([
  {
    title: '恩典之路',
    url: 'http://121.199.21.194:3000/music_files/恩典之路.mp3', // 替换为您的音乐文件 API 地址
    lyricsUrl: '/lyrics/恩典之路.lrc' // 指向本地歌词文件
  },
  {
    title: '同路人',
    url: 'http://121.199.21.194:3000/music_files/同路人.mp3', // 替换为您的音乐文件 API 地址
    lyricsUrl: '/lyrics/同路人.lrc' // 指向本地歌词文件
  }
]);
</script>

<style>
/* 您可以在这里添加一些页面特定的样式 */
</style>