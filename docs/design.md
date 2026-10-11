# 时雨 · 设计说明：极光与节气的实现拆解

> 本文记录两个核心实现的来龙去脉：暗色极光视觉体系，与二十四节气的
> C 值法计算及其校准过程。视觉令牌的完整定义见 `src/styles/tokens.css`，
> 令牌依据来自工作区 `docs/visual-guide.md`「三项目视觉规格速查表」时雨列。

## 1. 极光视觉体系

### 1.1 层次结构

页面共有三层背景，全部 `position: fixed`、不参与交互：

1. `.page-bg`（z-index −2）：底部 dusk 余晖，radial 暗紫 → 暗玫红
   （visual-guide §10 的 `--dusk` 意象），浅色主题下整体透明；
2. `.aurora::before`（z-index −1）：顶缘三团 radial 光晕
   （`#5E6AD2` / `#24c6dc` / `#ff0099`，Linear 手法），`blur(48px)`，
   72s `ease-in-out` 漂移（位移 + 缩放 + 透明度，只动 transform/opacity/filter）；
3. `.aurora::after`：conic-gradient 光幕，96s 极慢摆动（rotate 0→9deg），
   像高处有云在走。

两段动画均远超 60s 要求；`will-change` 只声明 transform/opacity。

### 1.2 玻璃卡片

`.card`：`rgba` 半透明底 + `backdrop-filter: blur(10px) saturate(140%)`
（butterfly/shoka/aurora 三主题参数实录）+ aurora 暗色阴影；上缘 1px
渐变亮线用伪元素 mask 法（`mask-composite: exclude`），随主题切换换色。

节气卡叠加「光晕卡」：外层 `.term-glow::before` 以当前节气主色做
radial 光斑，`translateY(26px) scale(.88) blur(22px)` 垫在卡片后
（aurora `.highlighted` 手法），hover 时亮起。光斑放在外层元素上、
卡片本体作内层 `.card`，避免负 z-index 与 stacking context 的兼容问题。

### 1.3 节气强调色

全站强调色不是固定值：`App.vue` 每次时钟滴答时用 `getTermSpan(now)`
取当前节气主色，写到 `.page` 的 `--jieqi-accent` 上。于是今日圆环、
焦点环、今日日期圈、番茄钟环、hero 节气徽标……全部随季节换色。
当前节气主色的实心圆点在节气卡上有 2s 呼吸动画（visual-guide §6 原值）。

浅色纸感主题通过 `[data-theme='light']` 覆写令牌：宣纸底、墨色文字、
玻璃变白瓷；极光两层降低不透明度，成为「水彩痕」。

### 1.4 动效降级

`base.css` 保留 visual-guide §6 的全局降级：`prefers-reduced-motion: reduce`
下所有元素 `animation-duration: .01ms; animation-iteration-count: 1;
transition-duration: .01ms`。playwright 实测：降级后 `.aurora::before` 与
呼吸点的计算样式 `animation-duration` 均为 `1e-05s`。

## 2. 二十四节气：C 值法与校准

### 2.1 公式

```
day = int(Y × 0.2422 + C) − L
```

- `Y`：公历年份后两位；`C`：21 世纪各节气世纪常数（`C21` 表）；
- `L`：闰年数修正，**按节气所在月份区分**：
  - 1、2 月节气（小寒 / 大寒 / 立春 / 雨水）：`L = int((Y−1) / 4)`；
  - 3—12 月节气：`L = int(Y / 4)`。

这条区分不是照抄记忆，而是用天文历表回推验证的结果：若一律 `int(Y/4)`，
立春 2024 会算成 2 月 3 日（权威值 2 月 4 日）；若一律 `int((Y−1)/4)`，
春分 2024 会算成 3 月 21 日（权威值 3 月 20 日）。原因是 2 月 29 日的
「闰日漂移」只影响发生在它之后的节气。统一规则后，2024 / 2025 / 2026
三年全部 72 个节气与权威历表逐日吻合（`tests/solar-terms.spec.ts`）。

### 2.2 例外校准

C 值法是公开的近似公式，个别年份与真实历法差 ±1 天。例外表
`EXCEPTIONS_21` 只收录能与权威记忆值核对的三条：

| 节气 | 年份 | 修正 | 校准后 |
| --- | --- | --- | --- |
| 雨水 | 2026 | −1 | 2026-02-18 |
| 冬至 | 2021 | −1 | 2021-12-21 |
| 立秋 | 2002 | +1 | 2002-08-08 |

网上流传的例外表还有大寒 2082、春分 2084、霜降 / 立冬 2089 等条目，
因无法用权威记忆值核对，一律不收录。未收录例外的年份可能出现 ±1 天
偏差，属 C 值法固有精度，对「看季节氛围」的场景可接受。

### 2.3 支持范围与降级

C21 表覆盖 2001—2100。越界年份所有节气函数返回 `null`，节气卡显示
「当前年份不在可计算范围」的降级文案，其余模块不受影响。跨年处理：
1 月初的当前节气可能属于上年 12 月（大雪 / 冬至），12 月末的下一节气
可能属于下年 1 月（小寒），`getTermSpan` 用相邻三年 72 个节气的日期池排序求解。

## 3. 农历：站在 Intl 肩上

不用任何农历库，直接解析 ICU 中国农历：

- `new Intl.DateTimeFormat('en-u-ca-chinese', { year: 'numeric', month: 'numeric', day: 'numeric' })`
  的 `formatToParts` 给出：`month`（数字 1—12，闰月带 `bis` 后缀，如
  2025 年闰六月 → `6bis`）、`day`（1—30）、`relatedYear`（农历年对应公历年）；
- 干支 / 生肖由 relatedYear 推算：1984 年为甲子，`(year − 1984)` 对 10 / 12 取模；
- 中文月名（正月…腊月）与日名（初一…三十）自建映射表；
- 初始化时用 2026-02-17（春节）探测内核输出格式，不符合预期则整体降级
  为「无农历」，界面隐藏相关徽标但不报错。

除夕不固定在腊月廿九或三十，用「明天恰为正月初一」反推，对大小月天然正确。

时区语义：日期一律以本地时区的「当天」参与换算（`new Date(y, m, d)` 本地
午夜构造）。农历日界与北京午夜对齐，UTC 与 UTC+8 环境对本地午夜日期的
换算结果一致，因此 CI（UTC）与本地（Asia/Shanghai）测试结论相同。

## 4. 实时性

- `useNow`：200ms 间隔刷新共享的 `Date` ref（圆环走动 + 时钟秒位）；
- 圆环 `stroke-dashoffset` 用 0.25–0.3s 线性过渡插值，视觉上连续滑动；
- 番茄钟用绝对时间（`endsAt`）计时，标签页休眠后回来不漂移；
- 完成音：Web Audio 两枚正弦（A5 基音 + 倍频轻泛音，0.35s 后 E5 追音），
  指数衰减包络，AudioContext 在「开始」按钮的手势里创建。

## 5. 性能预算

主 bundle gzip ≈ 39.5 KB（JS 34.6 + CSS 4.6 + HTML 0.5），预算 200 KB；
首屏唯一的脚本是 `type="module"`（默认 defer），无阻塞脚本、无外部请求。
位图仅 logo 与 og 图三张 WebP（合计 30 KB），其余全部 SVG / CSS。
