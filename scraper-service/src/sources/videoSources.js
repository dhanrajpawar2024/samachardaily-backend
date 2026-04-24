/**
 * YouTube channel sources for video scraping.
 * Feed URL format: https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
 *
 * To add more channels, find the channel ID from:
 *   youtube.com/channel/CHANNEL_ID  (shown in the channel URL)
 *   or use: https://commentpicker.com/youtube-channel-id.php
 */
module.exports = [
  // ── English ────────────────────────────────────────────────────
  { name: 'NDTV',        channelId: 'UCZFMm1mMw0F81Z37aaEzTUA', language: 'en', category: 'top-stories' },
  { name: 'India Today', channelId: 'UCYPvAwZP8pZhSMW8qs7cVCw', language: 'en', category: 'top-stories' },
  { name: 'Republic TV', channelId: 'UCrBSmorKB3b_86pBomSe1kg', language: 'en', category: 'top-stories' },
  { name: 'Times Now',   channelId: 'UCpF4kRQTu2NIDo7zyR2PGNQ', language: 'en', category: 'top-stories' },
  { name: 'WION',        channelId: 'UCjpR9jS7yjfMHPMjLTVAqzA', language: 'en', category: 'world' },

  // ── Hindi ──────────────────────────────────────────────────────
  { name: 'Aaj Tak',       channelId: 'UCt4t-jeY85JegMlZ-E5UWtA', language: 'hi', category: 'top-stories' },
  { name: 'ABP News',      channelId: 'UC_sVmxLqnMFABF28x-5Z5BA', language: 'hi', category: 'top-stories' },
  { name: 'Zee News',      channelId: 'UCmvW62-AVlmMhIpMrGFxWdA', language: 'hi', category: 'top-stories' },
  { name: 'News18 India',  channelId: 'UCkM6xwCAAq4oSHds2gy1X1Q', language: 'hi', category: 'top-stories' },
  { name: 'NDTV India',    channelId: 'UCuNHMWCwYFj1G_lRTnE1Hmg', language: 'hi', category: 'top-stories' },
  { name: 'TV9 Bharatvarsh', channelId: 'UCiTBLmILOhB9UXrZVsHfIWA', language: 'hi', category: 'top-stories' },

  // ── Marathi ───────────────────────────────────────────────────
  { name: 'ABP Majha',     channelId: 'UCIXsvGGGAUSVbVvXBpQJ3Eg', language: 'mr', category: 'top-stories' },
  { name: 'TV9 Marathi',   channelId: 'UCfYPFpFbKRJaQ0hKHM9TDCQ', language: 'mr', category: 'top-stories' },

  // ── Tamil ─────────────────────────────────────────────────────
  { name: 'Puthiya Thalaimurai', channelId: 'UCpG7MrEv_a43M5MelS2Sctg', language: 'ta', category: 'top-stories' },

  // ── Telugu ────────────────────────────────────────────────────
  { name: 'TV9 Telugu',    channelId: 'UCKfmv7J3NzNlIJLJdVW7yCA', language: 'te', category: 'top-stories' },

  // ── Kannada ───────────────────────────────────────────────────
  { name: 'TV9 Kannada',   channelId: 'UCjZBzOjN-1bFoaXE3Z_RvSw', language: 'kn', category: 'top-stories' },
];
