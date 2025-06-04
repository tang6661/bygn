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
  },
{
    title: '祝福',
    url: '/bygn/sg/《祝福》.mp3', 
    lyricsUrl: '/bygn/lyrics/《祝福》.lrc' 
  },
{
    title: '同路人(1)',
    url: '/bygn/sg/同路人(1).mp3', 
    lyricsUrl: '/bygn/lyrics/同路人(1).lrc' 
  },
{
    title: '第72首',
    url: '/bygn/sg/第72首.mp3', 
    lyricsUrl: '/bygn/lyrics/第72首.lrc' 
  },
{
    title: '第260首',
    url: '/bygn/sg/第260首.mp3', 
    lyricsUrl: '/bygn/lyrics/第260首.lrc' 
  },
{
    title: '第265首',
    url: '/bygn/sg/第265首.mp3', 
    lyricsUrl: '/bygn/lyrics/第265首.lrc' 
  }
]);
</script>

<style>
/* 您可以在这里添加一些页面特定的样式 */
</style>