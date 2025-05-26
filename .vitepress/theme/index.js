// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import DefaultTheme from 'vitepress/theme';
import MusicPlayer from './components/MusicPlayer.vue';
import ImageViewer from './components/ImageViewer.vue';
import './style.css'

/** @type {import('vitepress').Theme} */
export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'layout-bottom': () => h(ImageViewer)
    })
  },
  enhanceApp({ app }) {
    app.component('MusicPlayer', MusicPlayer);
    app.component('ImageViewer', ImageViewer);
  }
}
