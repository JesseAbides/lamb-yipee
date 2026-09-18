/* ============================================================
   LAMB YIPEE — Scripture Word for Word
   Verse library — New International Version (NIV)
   ============================================================ */

const VERSES = [
  { ref: "John 3:16", stars: 1, text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." },
  { ref: "Psalm 23:1", stars: 1, text: "The LORD is my shepherd, I lack nothing." },
  { ref: "Psalm 23:2", stars: 1, text: "He makes me lie down in green pastures, he leads me beside quiet waters," },
  { ref: "Psalm 23:3", stars: 1, text: "he refreshes my soul. He guides me along the right paths for his name's sake." },
  { ref: "Psalm 23:4", stars: 2, text: "Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me." },
  { ref: "Psalm 23:5", stars: 2, text: "You prepare a table before me in the presence of my enemies. You anoint my head with oil; my cup overflows." },
  { ref: "Psalm 23:6", stars: 1, text: "Surely your goodness and love will follow me all the days of my life, and I will dwell in the house of the LORD forever." },
  { ref: "Philippians 4:13", stars: 1, text: "I can do all this through him who gives me strength." },
  { ref: "Proverbs 3:5", stars: 1, text: "Trust in the LORD with all your heart and lean not on your own understanding;" },
  { ref: "Proverbs 3:6", stars: 1, text: "in all your ways submit to him, and he will make your paths straight." },
  { ref: "Isaiah 40:31", stars: 1, text: "but those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, and they will walk and not be faint." },
  { ref: "Romans 8:28", stars: 2, text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose." },
  { ref: "Genesis 1:1", stars: 1, text: "In the beginning God created the heavens and the earth." },
  { ref: "Jeremiah 29:11", stars: 2, text: "\"For I know the plans I have for you,\" declares the LORD, \"plans to prosper you and not to harm you, plans to give you hope and a future.\"" },
  { ref: "Matthew 6:33", stars: 1, text: "But seek first his kingdom and his righteousness, and all these things will be given to you as well." },
  { ref: "Psalm 119:105", stars: 1, text: "Your word is a lamp for my feet, a light on my path." },
  { ref: "Joshua 1:9", stars: 2, text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go." },
  { ref: "Ephesians 2:8", stars: 1, text: "For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God—" },
  { ref: "Ephesians 2:9", stars: 1, text: "not by works, so that no one can boast." },
  { ref: "1 Corinthians 13:4", stars: 1, text: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud." },
  { ref: "Galatians 5:22", stars: 1, text: "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness," },
  { ref: "Hebrews 11:1", stars: 1, text: "Now faith is confidence in what we hope for and assurance about what we do not see." },
  { ref: "Matthew 5:16", stars: 2, text: "In the same way, let your light shine before others, that they may see your good deeds and glorify your Father in heaven." },
  { ref: "Psalm 46:1", stars: 1, text: "God is our refuge and strength, an ever-present help in trouble." },
  { ref: "Isaiah 41:10", stars: 2, text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand." },
  { ref: "Romans 12:2", stars: 2, text: "Do not conform to the pattern of this world, but be transformed by the renewing of your mind. Then you will be able to test and approve what God's will is—his good, pleasing and perfect will." },
  { ref: "Philippians 4:6", stars: 1, text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God." },
  { ref: "Psalm 56:3", stars: 1, text: "When I am afraid, I put my trust in you." },
  { ref: "Matthew 11:28", stars: 1, text: "Come to me, all you who are weary and burdened, and I will give you rest." },
  { ref: "Nahum 1:7", stars: 1, text: "The LORD is good, a refuge in times of trouble. He cares for those who take refuge in him." },
  { ref: "2 Timothy 1:7", stars: 1, text: "For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline." },
  { ref: "Lamentations 3:22", stars: 1, text: "Because of the LORD's great love we are not consumed, for his compassions never fail." },
  { ref: "Lamentations 3:23", stars: 1, text: "They are new every morning; great is your faithfulness." },
  { ref: "Colossians 3:23", stars: 1, text: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters," },
  { ref: "James 1:5", stars: 1, text: "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you." },
  { ref: "1 John 4:19", stars: 1, text: "We love because he first loved us." },
  { ref: "Psalm 121:1", stars: 1, text: "I lift up my eyes to the mountains—where does my help come from?" },
  { ref: "Psalm 121:2", stars: 1, text: "My help comes from the LORD, the Maker of heaven and earth." },
  { ref: "Zephaniah 3:17", stars: 2, text: "The LORD your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing." },
  { ref: "Micah 6:8", stars: 2, text: "He has shown you, O mortal, what is good. And what does the LORD require of you? To act justly and to love mercy and to walk humbly with your God." }
];

/* -------- Rival players for Single-mode comparison --------
   Each rival has a name, a sheep avatar color and a base
   speed (seconds per word). A randomized ±jitter is applied
   at race time so every race feels alive.                   */
const RIVALS = [
  { name: "Mia 🐑",    spw: 2.20, hue: "#ffd6e8" },
  { name: "Elias 🐏",  spw: 2.35, hue: "#d6eaff" },
  { name: "Pastor Ben", spw: 2.05, hue: "#fff3c4" },
  { name: "Gracy",     spw: 2.55, hue: "#e2ffd6" },
  { name: "Little Sam", spw: 2.85, hue: "#ffe0cc" },
  { name: "Deacon Roi", spw: 2.15, hue: "#e8dcff" }
];

/* Difficulty tuning for Duo CPU opponent — words per second at
   normal pace, scaled by verse length so long verses stay fair */
const DUO_CPU = { easy: 2.9, normal: 2.2, hard: 1.8 };
