<ClientOnly>
  <MusicPlayer :tracks="musicTracks" />
</ClientOnly>

<script setup>
import { ref } from 'vue';

const musicTracks = ref([
  {
    title: '恩典之路',
    url: '/bygn/sg/恩典之路.mp3', 
    lyricsUrl: '/bygn/lyrics/恩典之路.lrc' 
  },
  {
    title: '同路人',
    url: '/bygn/sg/同路人.mp3', 
    lyricsUrl: '/bygn/lyrics/同路人.lrc' 
  }
]);
</script>

<style>
/* 您可以在这里添加一些页面特定的样式 */
</style>