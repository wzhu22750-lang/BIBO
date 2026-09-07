# Pixelarticons 来源与使用边界

使用 npm 安装的 `pixelarticons@2.4.1`，保留本目录的 MIT LICENSE（Copyright Gerrit Halfmann）。

项目按路径静态导入以下 SVG，不导入包入口、不加载整套 icon font、不做运行时远程请求，也不通过 innerHTML 插入 SVG。

- `pixelarticons/svg/backpack.svg`
- `pixelarticons/svg/balloon.svg`
- `pixelarticons/svg/book-open.svg`
- `pixelarticons/svg/briefcase.svg`
- `pixelarticons/svg/camera.svg`
- `pixelarticons/svg/code.svg`
- `pixelarticons/svg/coffee.svg`
- `pixelarticons/svg/compass.svg`
- `pixelarticons/svg/flag.svg`
- `pixelarticons/svg/gamepad.svg`
- `pixelarticons/svg/gift.svg`
- `pixelarticons/svg/headphone.svg`
- `pixelarticons/svg/map.svg`
- `pixelarticons/svg/moon.svg`
- `pixelarticons/svg/more-horizontal.svg`
- `pixelarticons/svg/music.svg`
- `pixelarticons/svg/shopping-bag.svg`
- `pixelarticons/svg/star.svg`
- `pixelarticons/svg/sun.svg`
- `pixelarticons/svg/tent.svg`
- `pixelarticons/svg/trophy.svg`
- `pixelarticons/svg/video.svg`

当前直接导入 22 枚 SVG，文件源码共 5,911 字节。这是文件体积，不是运行内存测量。

`EventArt.tsx` 与 `PixelFriends.tsx` 中的多色动物和其他主题图形是自绘 SVG；部分动物复用原有 `PixelArt.tsx`。40 个可选图标中有 20 个自绘选项、20 个按需导入选项；地图与更多按钮另外使用两枚导入图标。

现有事件的 emoji 字段保留以兼容数据库；新事件写入 `icon:penguin` 等白名单标识。旧 Emoji 数据只在读取时映射为 SVG，不批量改写用户历史数据。真正的聊天内容及用户自己输入的 Emoji 不被删除或篡改。
