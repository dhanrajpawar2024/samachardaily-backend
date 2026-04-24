const Parser = require("rss-parser");
const parser = new Parser({
  customFields: {
    item: [
      ["media:content",    "mediaContent"],
      ["media:thumbnail",  "mediaThumbnail"],
      ["enclosure",        "enclosure"],
      ["dc:creator",       "dcCreator"],
      ["content:encoded",  "contentEncoded"],
    ],
  },
});

const extractThumbnail = (item) => {
  if (item.mediaContent) {
    const mc = Array.isArray(item.mediaContent) ? item.mediaContent[0] : item.mediaContent;
    const url = mc?.["$"]?.url || mc?.url;
    if (url) return url;
  }
  if (item.mediaThumbnail) {
    const mt = Array.isArray(item.mediaThumbnail) ? item.mediaThumbnail[0] : item.mediaThumbnail;
    const url = mt?.["$"]?.url || mt?.url;
    if (url) return url;
  }
  if (item.enclosure?.url && /\.(jpe?g|png|webp|gif)/i.test(item.enclosure.url)) {
    return item.enclosure.url;
  }
  return null;
};

(async () => {
  try {
    const feed = await parser.parseURL("https://www.tv9marathi.com/rss");
    const item = feed.items.find(i => i.link.includes("1653522"));
    if (!item) {
      console.log("Item not found");
      return;
    }
    const result = {
      title: item.title,
      link: item.link,
      mediaContent: item.mediaContent,
      mediaThumbnail: item.mediaThumbnail,
      enclosure: item.enclosure,
      contentEncoded: item.contentEncoded,
      content: item.content,
      description: item.description,
      contentSnippet: item.contentSnippet,
      extractedThumbnail: extractThumbnail(item)
    };
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
  }
})();
