import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang:"zh-CN",
  title: "SmallHouse",
  description: "小家之好，大抵如此。不在于方寸之大小，而在于居者之心境",
  i18nRouting:false,
  themeConfig: {
    siteTitle: '小家',
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '📑首页', link: '/' },
      { text: '🍚干饭', link: '/markdown-examples' },
      { text: '🎽运动', link: '/markdown-examples' },
      { text: '🌇日常', link: '/markdown-examples' },
      {
        text: '📓笔记',
        items: [
          { text: '📚️学习', link: '/markdown-examples' },
          { text: '💓心得', link: '/markdown-examples' },
          { text: '📅计划', link: '/markdown-examples' }
        ]
      }
    ],
    logo:'home.svg',
    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档'
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换'
                }
              }
            }
          }
        }
      }
    },

    sidebar: [
      {
        text: '项目',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' },
          { text: '毕业感恩', link: '/graduation-gratitude' },
          { text: '诗歌集', link: '/music-demo' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'gitee', link: 'https://gitee.com/Aa520042/vite-press' }
    ],
    footer: {
      copyright: 'Copyright © 2025-present Evan You'
    },
    lastUpdated: {
      text: '文档更新于',
      formatOptions: {
        dateStyle: 'medium',
      }
    },
    docFooter: {
      prev: '上一页',
      next: '下一页'
    }
  },
  markdown: {
    image: {
      // 默认禁用；设置为 true 可为所有图片启用懒加载。
      lazyLoading: true
    }
  }
})
