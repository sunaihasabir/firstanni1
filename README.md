# 365 Days, A Million Memories ❤️

A one-year anniversary surprise website for **Sharoz — My Hubby G**, made with love by **Sunaiha**.
14 November 2025 → 14 November 2026.

> **Jaldi guide (Roman Urdu)**
> 1. Apni pics `assets/photos/` mein daalein (naam neeche list mein hain), family pics `assets/photos/family/` mein.
> 2. Apna gaana `assets/music/our-song.mp3` naam se rakhein.
> 3. Romantic pics ke liye `tools/lock-photos.html` kholein → pics chunein → password rakhein → `vault.enc` download hogi → usay `assets/private/` mein rakh dein.
> 4. Online karne ke liye section 4 dekhein (message wall ke liye GitHub ya Netlify CLI wala tareeqa).


> **Locked folder:** it already holds our 5 romantic videos (the password is NOT written anywhere in these files — keep it that way, this folder goes online).
> To change the password or add more, open `tools/lock-photos.html`, choose ALL the romantic photos/videos again, set the new password and replace `assets/private/vault.enc`.

---

## 1. Add your real photos, videos & music (the only thing you need to do)

Put your files in these folders using **exactly these names**. Anything missing simply shows a pretty
placeholder that tells you its file name, so you can add pictures little by little.

```
assets/
├── music/
│   └── our-song.mp3            ← your romantic instrumental (plays after "Open Your Surprise")
├── photos/
│   ├── couple-main.jpg         ← the big glowing photo at the top
│   ├── couple-final.jpg        ← the round photo in "One Last Surprise"
│   ├── memory-01.jpg … memory-13.jpg   ← one photo per memory box in "Our Story" (order listed in js/config.js:
│   │                                      05 = my birthday, 09 = his birthday ⭐, 12 = our beautiful families)
│   ├── fav-01.jpg … fav-04.jpg         ← "Our Favorite Pictures"
│   ├── moment-01.jpg … moment-04.jpg   ← "Little Moments, Big Memories"
│   ├── hero-01.jpg … hero-03.jpg       ← "My Hubby G ❤️"
│   ├── video-01-poster.jpg …           ← (optional) cover image for each video
│   └── family/
│       └── family-01.jpg … family-06.jpg  ← 📁 "Our Beautiful Families" folder
├── private/
│   └── vault.enc               ← 🔒 the LOCKED romantic folder (made with tools/lock-photos.html, see below)
└── videos/
    └── video-01.mp4 … video-03.mp4     ← "Videos I'll Watch Forever"
```

**Want more photos, different names, or new captions?** Open `js/config.js`. Every photo, video,
caption and the secret message is listed there with comments. Copy a line, change the file name
and caption — done. (Your photos are shown exactly as they are. Nothing changes faces.)

**Want to change any wording?** All the story text, funny cards, quotes, verses and the letter
are in `js/content.js`.

### Tips for fast loading
- Photos: JPG, around 1600 px on the long side, under ~500 KB each is perfect.
  (Free: <https://squoosh.app> — drop a photo in, choose MozJPEG, quality 75.)
- Videos: MP4 (H.264), 720p, ideally under 25 MB each. With ffmpeg:
  `ffmpeg -i input.mov -vf scale=-2:720 -c:v libx264 -crf 26 -preset slow -c:a aac -b:a 128k -movflags +faststart video-01.mp4`
- Music: an MP3 around 128–192 kbps. If `our-song.mp3` is missing, a soft built-in piano melody plays instead.
  (Your song has a different name or is .m4a? Change the `music:` line in `js/config.js`.)

---

## 2. The locked romantic folder 🔒

Romantic photos are **never** put on the website as normal pictures. They are packed into one
encrypted file (AES-256) that only opens with your password. Even someone who downloads the file
from the website just sees scrambled bytes.

1. Start the local preview (section 3) and open <http://localhost:8080/tools/lock-photos.html>
   (or, once the site is online, `your-site.netlify.app/tools/lock-photos.html`).
2. Choose your photos (short videos work too), add captions if you like.
3. Type a password twice → **Lock my photos**. A file called `vault.enc` downloads.
4. Put it in `assets/private/vault.enc` and publish again.
5. Tell Sharoz the password 😉. On the site: **Our Folders → Only For Us 🔒** → type it → unlocked.

- The password is not saved anywhere, so if it's forgotten, lock the photos again with a new one.
- To add more photos later, lock **all** of them again (old + new) and replace `vault.enc`.
- Change the little hint under the password box in `js/config.js` → `lockedFolder.hint` (set it to `""` to hide it).
- Keep your original photos on your phone/computer, **not** inside the website folder.

## 📁 The family folder

Put family pictures in `assets/photos/family/` and edit the list + captions in `js/config.js` → `familyFolder`
(add as many lines as you like). This folder is open for everyone.

## 🏮 The message wall ("Send Us Your Love")

At the end of the beach, anyone who opens the website can write a message, and **everyone** who visits
sees all the messages. They are saved by a small Netlify Function (`netlify/functions/messages.mjs`)
using Netlify's free built-in storage.

- It only works when the site is online through **Option B or C** in section 4 (drag-and-drop sites
  can't run functions; the wall then shows a friendly "comes alive once online" note).
- **Deleting unwanted messages:** in Netlify go to *Site configuration → Environment variables*, add
  `GUESTBOOK_ADMIN_KEY` = any secret word, redeploy, then open
  `your-site.netlify.app/?admin=YOUR_SECRET_WORD`. Each message gets a 🗑 button (only for you).
- Built-in spam protection: max 500 characters, one message per person every 20 seconds, and a hidden bot trap.

---

## 3. Open it on your computer

**Quick look:** double-click `index.html`. (The locked folder and the message wall need the preview server below.)

**Full preview (recommended):** install [Node.js](https://nodejs.org) once, then in this folder run:

```bash
node dev-server.mjs
```

Open <http://localhost:8080>. Everything works, including the locked folder and a *practice* message wall
(practice messages disappear when you stop the server).

---

## 4. Put it online with Netlify (free)

First add your photos, music and `vault.enc` to the `assets` folders.

**Option A: drag and drop (1 minute, but no message wall)**
Go to <https://app.netlify.com/drop>, sign in and drag this whole folder onto the page.
Everything works except the message wall.

**Option B: GitHub (recommended, message wall included, no commands)**
1. Create a free GitHub account → *New repository* (set it to **Private**) → *uploading an existing file* → drag in everything from this folder.
2. In Netlify: *Add new site → Import an existing project → GitHub* → choose the repository → **Deploy**.
   (No build command needed; Netlify reads `netlify.toml` and sets up the message wall automatically.)
3. Every time you change something on GitHub, Netlify updates the site by itself.

**Option C: Netlify CLI (if you have Node.js)**
```bash
npm install
npx netlify-cli login
npx netlify-cli deploy --prod
```

Then rename the site in *Site configuration → Change site name* (e.g. `our-first-year-sharoz.netlify.app`)
and send the link to your Hubby G ❤️

---

## What's inside

| Section | What happens |
|---|---|
| Loading screen | Beating heart while memories load |
| Opening surprise | 3D starfield, golden particles, rotating 3D heart, 3D gift box with glowing ribbons, falling rose petals → the box opens, sparkles burst, hundreds of hearts float up, music fades in |
| Hero | Golden title, glowing photo frame, 3D floating heart, live counter (days · hours · minutes · seconds since 14.11.2025) + countdown to the anniversary |
| Our Story | 13 animated memories on a glowing timeline: night sky for Layyah, sunrise, my birthday with balloons (5), the first "I love you" heart, the talking car, a golden **special** box for his birthday with confetti and a crown (9), our beautiful families (12), the storm turning into a rainbow… |
| Drama King 😂👑 | 8 bouncy flip cards with meters and sound effects + "Things My Hero Says" speech bubbles |
| Gallery | Polaroid scrapbook with 3D tilt, 4 categories, lightbox with swipe/arrow keys, real playable videos, cinematic slideshow |
| Our Folders 📁 | "Our Beautiful Families" (open) and "Only For Us 🔒" (encrypted, password needed) |
| Love Letter | 3D envelope opens; the letter appears word by word on cream paper with falling petals |
| Love Quotes | Auto-playing glowing carousel (swipe on phones) |
| God's Beautiful Gift | Heavenly light rays, clouds, open Bible, 8 verse cards and the prayer |
| Mama | Glowing flowers and soft golden lights |
| Our Next Chapter | Scroll-driven 3D ocean: golden sunset → lanterns rise → moon, stars, fireflies, shooting stars and glowing waves appear → a heart constellation draws itself in the sky; the promise writes itself |
| Send Us Your Love 🏮 | Lantern message wall: visitors write a message and everyone sees it |
| Final Surprise | 3D glowing heart → "Open My Heart" → cinematic message, fireworks, hearts and a photo slideshow |

**Extras:** scroll progress bar · heart cursor trail (desktop) · floating buttons for music, sound effects, fireworks and replaying the opening · mobile menu · works without WebGL (graceful fallbacks) · respects "reduce motion".

**Hidden secret 🤫:** click the tiny glowing heart in the bottom-left corner of the first screen — or type the word `hubby` on the keyboard. (Edit the message in `js/config.js`.)

---

## Files

```
index.html          – page structure
css/style.css       – all styles
js/config.js        – YOUR photos, videos, music, captions, secret message
js/content.js       – all the words (story, cards, quotes, verses, letter)
js/main.js          – interactions & animations
js/scenes.js        – Three.js 3D scenes (opening, hearts, beach)
js/effects.js       – sparkles, fireworks, hearts, petals, cursor
js/audio.js         – music + sound effects
js/vault.js         – encryption for the locked folder
js/vendor/          – Three.js r128, GSAP 3.12 + ScrollTrigger (bundled)
tools/lock-photos.html          – locks your romantic photos into vault.enc
netlify/functions/messages.mjs  – the message wall (online)
dev-server.mjs      – local preview server (node dev-server.mjs)
package.json        – lists the one library the message wall needs
netlify.toml        – Netlify settings
```

Made with endless love by Sunaiha ❤️
