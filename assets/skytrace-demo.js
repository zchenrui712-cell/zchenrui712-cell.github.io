import { matchPhotoReferences, PHOTO_PROFILES } from './skytrace-photo-references.js';

const photoUrl = new URL('./airbus-a320-sharklets.jpg', import.meta.url);
const result = document.querySelector('#demo-result');
const flight = document.querySelector('#flight-demo');
const photo = document.querySelector('#photo-demo');
const upload = document.querySelector('#aircraft-photo');
let request = 0;

async function differenceHash(file) {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 17;
    canvas.height = 8;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(bitmap, 0, 0, 17, 8);
    const pixels = context.getImageData(0, 0, 17, 8).data;
    const brightness = (offset) =>
      0.299 * pixels[offset] + 0.587 * pixels[offset + 1] + 0.114 * pixels[offset + 2];
    let hash = '';
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 16; x += 4) {
        let nibble = 0;
        for (let bit = 0; bit < 4; bit += 1) {
          const left = (y * 17 + x + bit) * 4;
          nibble = (nibble << 1) | Number(brightness(left) > brightness(left + 4));
        }
        hash += nibble.toString(16);
      }
    }
    return hash;
  } finally {
    bitmap.close();
  }
}

async function inspectPhoto(getFile) {
  const active = ++request;
  result.textContent = 'Comparing photo fingerprints…';
  try {
    const file = await getFile();
    const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer()));
    const digest = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
    const match = matchPhotoReferences(digest, []) ??
      matchPhotoReferences(digest, [await differenceHash(file)]);
    if (active !== request) return;
    if (match) {
      const profile = PHOTO_PROFILES[match.profile];
      const evidence = match.exact ? 'Exact reference match' : 'Similar reference image';
      result.textContent = `${evidence} · ${profile.manufacturer} ${profile.model} · ${profile.tailNumber}`;
    } else {
      result.textContent = 'No match in the reference catalogue.';
    }
  } catch {
    if (active === request) result.textContent = 'Unable to read the image. Try a JPEG or PNG file.';
  }
}

flight.addEventListener('click', () => {
  request += 1;
  result.textContent = 'Sample flight · QFA7 · Boeing 787-9 Dreamliner · VH-ZNJ · 8,425 ft · 291 kt';
});

photo.addEventListener('click', () => inspectPhoto(async () => {
  const response = await fetch(photoUrl);
  if (!response.ok) throw new Error('Reference unavailable');
  return response.blob();
}));

upload.addEventListener('change', () => {
  const [file] = upload.files;
  if (file) inspectPhoto(() => file);
});
