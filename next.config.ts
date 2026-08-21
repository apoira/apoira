import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Telegram only inspects metadata delivered in the document head. Treat its
  // link-preview crawler like the other HTML-limited social crawlers so Vinext
  // resolves metadata before streaming the page body.
  htmlLimitedBots:
    /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|TelegramBot|Yeti|googleweblight/i,
};

export default nextConfig;
