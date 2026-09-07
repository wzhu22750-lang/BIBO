# Pixelarticons 来源与使用边界

使用 npm 安装的 `pixelarticons@2.4.1`，保留本目录的 MIT LICENSE（Copyright Gerrit Halfmann）。

项目按路径静态导入五个 SVG：

- `pixelarticons/svg/trophy.svg`
- `pixelarticons/svg/gift.svg`
- `pixelarticons/svg/coffee.svg`
- `pixelarticons/svg/map.svg`
- `pixelarticons/svg/more-horizontal.svg`

不导入包入口、不加载整套 icon font、不做运行时远程请求，也不通过 innerHTML 插入 SVG。

送信小兔、出游小狗、蛋糕、海浪、列车、飞机和节日小树是 `src/components/EventArt.tsx` 中自绘的多色 SVG，不属于 Pixelarticons。

现有事件的 emoji 字段保留以兼容数据库；新事件写入 `icon:dog` 等白名单标识。旧 Emoji 数据只在读取时映射为 SVG，不批量改写用户历史数据。真正的聊天内容及用户自己输入的 Emoji 不被删除或篡改。
