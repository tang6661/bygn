---
title: 音乐播放器
description: 毕业感恩诗歌
head:
  - - meta
    - name: theme-color
      content: "#ffffff"
---

# 毕业感恩诗歌

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
    title: '我愿爱祢更深',
    url: '/bygn/sg/第72首.mp3', 
    lyricsUrl: '/bygn/lyrics/第72首.lrc' 
  },
{
    title: '福哉，爱的捆绑',
    url: '/bygn/sg/第260首.mp3', 
    lyricsUrl: '/bygn/lyrics/第260首.lrc' 
  },
{
    title: '有一地比正午更光明',
    url: '/bygn/sg/第265首.mp3', 
    lyricsUrl: '/bygn/lyrics/第265首.lrc' 
  },
{
    title: '维亚多勒罗沙',
    url: '/bygn/sg/维亚多勒罗沙(1).mp3', 
    lyricsUrl: '/bygn/lyrics/维亚多勒罗沙(1).lrc' 
  },
]);
</script>

<style>
.VPDoc {
  background-color: #ffffff;
}

.VPDoc h1 {
  text-align: center;
  margin-bottom: 2rem;
  font-size: 1.8rem;
  color: #333;
}

@media (max-width: 640px) {
  .VPDoc h1 {
    font-size: 1.5rem;
  }
}
</style>