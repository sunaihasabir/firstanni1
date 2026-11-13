/* =====================================================================
   💌  CONFIG — THE ONLY FILE YOU NEED TO EDIT FOR YOUR PHOTOS & MUSIC
   ---------------------------------------------------------------------
   HOW IT WORKS
   • Put your files inside the  assets/  folder using the names below
     (or change the names here to match your files).
   • If a file is missing, the website shows a pretty placeholder that
     tells you exactly which file name it is waiting for. Nothing breaks.
   • Your real photos are shown exactly as they are — no filters that
     change faces, no AI, no replacements.

   FOLDERS
     assets/photos/   → .jpg / .jpeg / .png / .webp pictures
     assets/videos/   → .mp4 videos (H.264, ideally under ~25 MB each)
     assets/music/    → our-song.mp3  (the romantic background music)
   ===================================================================== */

window.ANNIVERSARY_CONFIG = {
  /* ---------- Names & dates ---------- */
  herName: "Sunaiha",
  hisName: "Sharoz",
  nickname: "My Hubby G",
  // The day our story began (year, month 1-12, day). Used by the counters.
  startDate: { year: 2025, month: 11, day: 14 },

  /* ---------- Music ---------- */
  // Put your song at assets/music/our-song.mp3
  // If the file is missing, a soft built-in piano melody plays instead.
  music: "assets/music/our-song.mp3",
  musicVolume: 0.55, // 0.0 – 1.0

  /* ---------- Background video (behind the top section & the final surprise) ----------
     A short, silent loop. Put any .mp4 in assets/videos/ and write its name here,
     or set it to "" to switch the background video off.                          */
  backgroundVideo: "assets/videos/background.mp4",

  /* ---------- Hero & final couple photos ---------- */
  heroPhoto: { src: "assets/photos/couple-main.jpg", caption: "Us ❤️" },
  finalPhoto: { src: "assets/photos/couple-final.jpg", caption: "Forever us" },

  /* ---------- Timeline photos (one per memory, optional) ---------- */
  // memory-01.jpg … memory-13.jpg — one photo per memory box, in this order:
  memoryPhotos: [
    null,                            // 01 The Facebook comment
    { src: "assets/photos/memory-02.jpg", pos: "50% 50%" },    // 02 Layyah journey ("Bachche paas hain na?")
    "assets/photos/memory-03.jpg",   // 03 Good morning / that smile
    "assets/photos/memory-04.jpg",   // 04 Mehndi in Layyah
    "assets/photos/memory-05.jpg",   // 05 MY birthday
    { src: "assets/photos/memory-06.jpg", pos: "50% 55%" },   // 06 First I love you  (the glowing-heart selfie)
    { src: "assets/photos/memory-07.jpg", pos: "50% 35%" },    // 07 Papa ko hug karna
    { src: "assets/photos/memory-08.jpg", pos: "50% 40%" },    // 08 Hours of talking (his car)
    "assets/photos/memory-09.jpg",   // 09 HIS birthday ⭐ (Happy Birthday balloons)
    { src: "assets/photos/memory-10.jpg", pos: "50% 15%" },    // 10 He loved me without seeing me
    null,                            // 11 The family chapter
    "assets/photos/memory-12.jpg",   // 12 Our beautiful families (birthday party)
    "assets/photos/memory-13.jpg"    // 13 Through every storm (sunset & the cross)
  ],

  /* ---------- Gallery ----------
     Add as many items as you like. Copy one line, change src & caption.
     type: "image" or "video".  For videos you may add a "poster" image.
     category must be one of the four category ids below.            */
  galleryCategories: [
    { id: "favorites", label: "Our Favorite Pictures" },
    { id: "moments",   label: "Little Moments, Big Memories" },
    { id: "videos",    label: "Videos I'll Watch Forever" },
    { id: "hero",      label: "My Hubby G ❤️" },
    { id: "future",    label: "Our Wedding Dream 💍" }
  ],
  gallery: [
    { type: "image", category: "favorites", src: "assets/photos/fav-01.jpg", caption: "Us, being us ❤️" },
    { type: "image", category: "favorites", src: "assets/photos/fav-02.jpg", caption: "Tere layi gulab 🌹" },
    { type: "image", category: "favorites", src: "assets/photos/fav-03.jpg", caption: "My favorite smile" },
    { type: "image", category: "favorites", src: "assets/photos/fav-04.jpg", caption: "Everything is better when we're together" },
    { type: "image", category: "favorites", src: "assets/photos/fav-05.jpg", caption: "Us, as a cartoon 😍" },
    { type: "image", category: "favorites", src: "assets/photos/fav-06.jpg", caption: "Our sunny day 🚗☀️" },
    { type: "image", category: "favorites", src: "assets/photos/fav-07.jpg", caption: "Today, tomorrow & always 💌" },
    { type: "image", category: "moments",   src: "assets/photos/moment-08.jpg", caption: "Half a heart… the other half is mine 🫶" },
    { type: "image", category: "moments",   src: "assets/photos/moment-09.jpg", caption: "Making hearts for me 💕" },
    { type: "image", category: "moments",   src: "assets/photos/moment-13.jpg", caption: "Video-call dance king 😂🕺" },
    { type: "image", category: "moments",   src: "assets/photos/moment-16.jpg", caption: "My birthday cake 🎂" },
    { type: "image", category: "moments",   src: "assets/photos/moment-14.jpg", caption: "Birthday girl 🎈" },
    { type: "image", category: "moments",   src: "assets/photos/moment-15.jpg", caption: "Birthday smile 😊" },
    { type: "image", category: "moments",   src: "assets/photos/moment-17.jpg", caption: "Another year, more blessings 🙏" },
    { type: "image", category: "moments",   src: "assets/photos/moment-10.jpg", caption: "Your Sunaiha 🌈" },
    { type: "image", category: "moments",   src: "assets/photos/moment-11.jpg", caption: "Smiling for you 😊" },
    { type: "image", category: "moments",   src: "assets/photos/moment-12.jpg", caption: "Sunglasses on 😎" },
    { type: "image", category: "future",    src: "assets/photos/future/wedding-02.jpg", caption: "One day… 💍" },
    { type: "image", category: "future",    src: "assets/photos/future/wedding-03.jpg", caption: "Our forever, God willing 🙏" },
    { type: "image", category: "future",    src: "assets/photos/future/wedding-01.jpg", caption: "The chapter we're praying for ❤️" },
    { type: "image", category: "moments",   src: "assets/photos/moment-07.jpg", caption: "Happy Birthday, my king 🎈👑" },
    { type: "image", category: "moments",   src: "assets/photos/moment-04.jpg", caption: "Pool day vibes ✌️💦" },
    { type: "image", category: "moments",   src: "assets/photos/moment-05.jpg", caption: "Too cool 😎" },
    { type: "image", category: "moments",   src: "assets/photos/moment-06.jpg", caption: "Happiest girl in the water 😄" },
    { type: "image", category: "moments",   src: "assets/photos/moment-01.jpg", caption: "Your birthday mug ☕🎂" },
    { type: "image", category: "moments",   src: "assets/photos/moment-02.jpg", caption: "A basket full of love 🎁" },
    { type: "image", category: "moments",   src: "assets/photos/moment-03.jpg", caption: "Your birthday smile & that shirt 😄🖤" },
    { type: "image", category: "moments",   src: "assets/photos/family/family-01.jpg", caption: "Birthday with the family 🎉" },
    { type: "video", category: "videos",    src: "assets/videos/video-01.mp4", poster: "assets/photos/video-01-poster.jpg", caption: "52 weeks of us 💕" },
    { type: "video", category: "videos",    src: "assets/videos/video-02.mp4", poster: "assets/photos/video-02-poster.jpg", caption: "Opening your birthday gifts 🎁" },
    { type: "video", category: "videos",    src: "assets/videos/video-04.mp4", poster: "assets/photos/video-04-poster.jpg", caption: "A heart, just for you 🫶" },
    { type: "video", category: "videos",    src: "assets/videos/video-05.mp4", poster: "assets/photos/video-05-poster.jpg", caption: "Glasses on, heart on 🤓💕" },
    { type: "video", category: "videos",    src: "assets/videos/video-03.mp4", poster: "assets/photos/video-03-poster.jpg", caption: "Your birthday party 🎉" },
    { type: "image", category: "hero",      src: "assets/photos/hero-02.jpg", caption: "Discipline · Focus · Success 👑" },
    { type: "image", category: "hero",      src: "assets/photos/hero-01.jpg", caption: "My sporty king 🏀" },
    { type: "image", category: "hero",      src: "assets/photos/hero-03.jpg", caption: "My light in the dark ✨" },
    { type: "image", category: "hero",      src: "assets/photos/hero-04.jpg", caption: "That heart is mine 💓" },
    { type: "image", category: "hero",      src: "assets/photos/hero-05.jpg", caption: "Sharoz Ifrahim 🖤" },
    { type: "image", category: "hero",      src: "assets/photos/hero-06.jpg", caption: "My handsome 😍" },
    { type: "image", category: "hero",      src: "assets/photos/hero-07.jpg", caption: "Mirror selfie king 🤳" },
    { type: "image", category: "hero",      src: "assets/photos/hero-08.jpg", caption: "Boss mode 😎" },
    { type: "image", category: "hero",      src: "assets/photos/hero-10.jpg", caption: "Mr. Serious 😂" },
    { type: "image", category: "hero",      src: "assets/photos/hero-09.jpg", caption: "Shining under the lights ✨" },
    { type: "image", category: "hero",      src: "assets/photos/hero-12.jpg", caption: "Professor Hubby G 🤓❤️" },
    { type: "image", category: "hero",      src: "assets/photos/hero-13.jpg", caption: "Snooker king 🎱👑" },
    { type: "image", category: "hero",      src: "assets/photos/hero-14.jpg", caption: "Thinking about me? 😏🚗" },
    { type: "image", category: "hero",      src: "assets/photos/hero-11.jpg", caption: "The original little hero 👶❤️" }
  ],

  /* ---------- 📁 Family folder (open for everyone) ----------
     Put family pictures in assets/photos/family/ and list them here. */
  familyFolder: [
    { type: "video", src: "assets/videos/video-03.mp4", caption: "Birthday celebration with everyone 🎉" },
    { type: "image", src: "assets/photos/family/family-01.jpg", caption: "Mama & Papa ❤️" },
    { type: "image", src: "assets/photos/family/family-03.jpg", caption: "Laughter & love 😄" },
    { type: "video", src: "assets/videos/video-07.mp4", caption: "Cake time with the family 🎂" },
    { type: "video", src: "assets/videos/video-06.mp4", caption: "Family video call with the little one 📱👶" },
    { type: "image", src: "assets/photos/family/family-05.jpg", caption: "Our newest little blessing 👶" },
    { type: "image", src: "assets/photos/family/family-04.jpg", caption: "Hope 🤍" },
    { type: "image", src: "assets/photos/family/family-06.jpg", caption: "So much love for the little one 💕" }
  ],

  /* ---------- 🔒 Locked romantic folder ----------
     Your romantic pictures are NOT put on the website as normal files.
     Use tools/lock-photos.html to lock them with your password; it gives
     you ONE file called vault.enc → put it at assets/private/vault.enc.
     Without the password nobody can open it (it is truly encrypted).   */
  lockedFolder: {
    file: "assets/private/vault.enc",
    hint: "Mera purana pyaar wala naam aap ke liye + 143 😉"   // shown under the password box; "" to hide
  },

  /* ---------- Final surprise slideshow ---------- */
  finalSlideshow: [
    "assets/photos/couple-final.jpg",
    "assets/photos/couple-main.jpg",
    "assets/photos/fav-03.jpg",
    "assets/photos/memory-13.jpg",
    "assets/photos/fav-01.jpg",
    "assets/photos/fav-05.jpg",
    "assets/photos/memory-09.jpg",
    "assets/photos/hero-03.jpg",
    "assets/photos/future/wedding-03.jpg"
  ],

  /* ---------- Hidden secret message ----------
     Found by clicking the tiny glowing heart in the hero corner,
     or by typing the word  hubby  (or hero) on the keyboard.                    */
  secretMessage:
    "Psst… you found my secret 🤫\n\nEven on the days we fight, my last prayer before I sleep is still for you.\n\nAnd yes — I know you won't sleep until I sleep. So tonight, let's both sleep early, okay? 😂❤️\n\n— Your Sunaiha"
};
