import thumbnail from 'image-thumbnail';
import fs from 'fs';

(async () => {
  const thumb = await thumbnail(data, { width: 250 });
  fs.writeFileSync('image_250', thumb);
})();
