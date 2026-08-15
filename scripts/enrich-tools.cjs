const fs = require('fs');

const tools = JSON.parse(fs.readFileSync('src/data/tools.json', 'utf8'));
const xml = fs.readFileSync('feed.xml', 'utf8');
const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

// Build lookup maps from feed items
const feedByGuid = new Map();
const feedByTitle = new Map();

for (const item of items) {
  const title = (item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || item.match(/<title>([\s\S]*?)<\/title>/) || ['',''])[1].trim();
  const link = (item.match(/<link>([\s\S]*?)<\/link>/) || ['',''])[1].trim();
  const enclosure = (item.match(/<enclosure\s+url="([^"]+)"/) || ['',''])[1].trim();
  const desc = (item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || item.match(/<description>([\s\S]*?)<\/description>/) || ['',''])[1].trim();
  const guid = (item.match(/<guid>([\s\S]*?)<\/guid>/) || ['',''])[1].trim();
  
  // Look for any image url inside description or enclosure
  let image = '';
  if (/\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(enclosure) || (enclosure.includes('padlet-uploads') && !enclosure.endsWith('.txt') && !enclosure.endsWith('.pdf'))) {
    image = enclosure;
  } else {
    const descImg = desc.match(/https?:\/\/[^\s"'<>]+\.(jpe?g|png|gif|webp|bmp|svg)/i);
    if (descImg) image = descImg[0];
  }

  // Wish ID extracted from link or guid (e.g., wish/3270610875)
  const wishIdMatch = (link || guid).match(/wish\/(\d+)/);
  const wishId = wishIdMatch ? wishIdMatch[1] : '';

  const obj = { title, link, enclosure, desc, image, wishId };
  if (wishId) feedByGuid.set(wishId, obj);
  feedByTitle.set(title, obj);
}

let matchedImageCount = 0;
let totalTools = tools.length;

const enrichedTools = tools.map(t => {
  // Try match by ID (e.g. c3270610875 -> 3270610875)
  const numericId = (t.id || '').replace(/^c/, '');
  let feedItem = feedByGuid.get(numericId) || feedByTitle.get(t.title);
  
  let image = feedItem ? feedItem.image : '';
  if (image) matchedImageCount++;

  return {
    ...t,
    image: image || ''
  };
});

console.log(`Matched images: ${matchedImageCount} / ${totalTools} tools in tools.json`);
console.log('Sample enriched 5 tools:', JSON.stringify(enrichedTools.slice(0, 5), null, 2));

fs.writeFileSync('src/data/tools.json', JSON.stringify(enrichedTools, null, 2));
console.log('Successfully updated src/data/tools.json!');
