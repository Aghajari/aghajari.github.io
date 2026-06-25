/**
 * Reading — a curated personal library.
 *
 * This is intentionally NOT a tracker. Every book here earned its place,
 * so the data model focuses on *my* relationship with the book (rating,
 * review, the line that stayed with me) rather than catalogue metadata.
 *
 * Covers are official artwork stored locally under `public/books/`.
 */

export interface Book {
  slug: string;
  title: string;
  author: string;
  /** Country the author is from, or the novel belongs to. */
  country: string;
  /** Original publication year. */
  year: number;
  genre: string;
  categories: string[];
  pages?: number;
  /** Official cover artwork — local path under `public/books/`. */
  cover: string;
  /**
   * Binding colour for the 3D spine + edges, sampled from the cover art.
   * Regenerate with `node scripts/extract-spine-colors.mjs`. Spine lettering
   * auto-switches to dark ink on light bindings.
   */
  spine: string;
  /** Personal rating, 1–5. Halves allowed (e.g. 4.5). */
  rating: number;
  /** Free-form, uncertain dates welcome: "June 2025", "Currently Reading". */
  readingDate: string;
  /** Long-form personal review. Optional — written like a journal entry. */
  review?: string;
  /**
   * Favourite quotation. Wrap the actual quote in **double asterisks**;
   * everything else is treated as context and rendered faintly.
   * Multiple bold spans are supported.
   */
  quote?: string;
  /** What stayed with me / who might enjoy it. */
  takeaways?: string;
  featured?: boolean;
}

export const books: Book[] = [
  {
    slug: "eat-him-if-you-wish",
    title: "Eat Him If You Wish",
    author: "Jean Teulé",
    country: "France",
    year: 2009,
    genre: "Historical Fiction",
    categories: ["Classic Literature", "History"],
    pages: 144,
    cover: "/books/eat-him-if-you-wish.jpg",
    spine: "#667458",
    rating: 4,
    readingDate: "Apr 2022",
  },
  {
    slug: "the-fall",
    title: "The Fall",
    author: "Albert Camus",
    country: "France",
    year: 1956,
    genre: "Philosophical Fiction",
    categories: ["Classic Literature", "Philosophy"],
    pages: 160,
    cover: "/books/the-fall.jpg",
    spine: "#737370",
    rating: 5,
    readingDate: "Apr 2022",
  },
  {
    slug: "the-suicide-shop",
    title: "The Suicide Shop",
    author: "Jean Teulé",
    country: "France",
    year: 2006,
    genre: "Dark Comedy",
    categories: ["Classic Literature", "Science Fiction"],
    pages: 169,
    cover: "/books/the-suicide-shop.jpg",
    spine: "#488789",
    rating: 4,
    readingDate: "May 2022",
  },
  {
    slug: "1984",
    title: "1984",
    author: "George Orwell",
    country: "United Kingdom",
    year: 1949,
    genre: "Dystopian Fiction",
    categories: ["Classic Literature", "Science Fiction"],
    pages: 328,
    cover: "/books/1984.jpg",
    spine: "#b6babe",
    rating: 5,
    readingDate: "May 2022",
    review:
      "Reading 1984 made me realize that we must protect our freedom at all costs, because when a government controls everything, they can use pain to break our spirit until \u201Cthere are no heroes.\u201D",
    quote:
      "The guard was laughing at his contortions. One question at any rate was answered. Never, for any reason on earth, could you wish for an increase of pain. Of pain you could wish only one thing: that it should stop. Nothing in the world was so bad as physical pain. **In the face of pain there are no heroes, no heroes**, he thought over and over as he writhed on the floor, clutching uselessly at his disabled left arm.",
    featured: true,
  },
  {
    slug: "the-girl-from-brooklyn",
    title: "The Girl from Brooklyn",
    author: "Guillaume Musso",
    country: "France",
    year: 2016,
    genre: "Psychological Thriller",
    categories: ["Classic Literature"],
    pages: 473,
    cover: "/books/the-girl-from-brooklyn.jpg",
    spine: "#a89389",
    rating: 4.5,
    readingDate: "Aug 2022",
    review:
      "A great read in this genre! It kept me hooked and made me want to read straight through to the very end. Sometimes you can guess what\u2019s next, but other times you honestly can\u2019t even imagine what\u2019s coming.",
    quote:
      "A long silence. May sighed and came back to sit down opposite me. Seeing her drawn face, I guessed that the most painful part was yet to come. **Some memories are like cancer: a remission is not always a cure.**",
  },
  {
    slug: "the-gambler",
    title: "The Gambler",
    author: "Fyodor Dostoevsky",
    country: "Russia",
    year: 1867,
    genre: "Psychological Fiction",
    categories: ["Classic Literature", "Philosophy", "Psychology"],
    pages: 188,
    cover: "/books/the-gambler.jpg",
    spine: "#462926",
    rating: 4,
    readingDate: "Sep 2022",
    review:
      "Although many told me they didn\u2019t like this particular book by Dostoyevsky, I really enjoyed it. It\u2019s a relatively simple story, yet it has its own brilliant moments. Take the scene where the narrator realizes that \u2018by a single turn of a roulette wheel everything\u2026 has become changed.\u2019 It brilliantly shows how quickly a life can pivot on a single bet, and how hypocritical society is about success and failure.",
    quote:
      "What could you say to me that I do not already know? Well, wherein lies my difficulty? It lies in the fact that **by a single turn of a roulette wheel everything for me, has become changed.** Yet, had things befallen otherwise, these moralists would have been among the first (yes, I feel persuaded of it) to approach me with friendly jests and congratulations. Yes, they would never have turned from me as they are doing now! **No; tomorrow all shall be ended!**",
  },
  {
    slug: "the-picture-of-dorian-gray",
    title: "The Picture of Dorian Gray",
    author: "Oscar Wilde",
    country: "Ireland",
    year: 1890,
    genre: "Gothic Fiction",
    categories: ["Classic Literature", "Philosophy"],
    pages: 254,
    cover: "/books/the-picture-of-dorian-gray.jpg",
    spine: "#5b4d46",
    rating: 3.5,
    readingDate: "Sep 2022",
    review:
      "There is a lot to love here, particularly the philosophical insights. The scene where Lord Henry tells Dorian that \u2018the tragedy of old age is not that one is old, but that one is young\u2019 is a beautiful, tragic flash of sincerity that stuck with me long after finishing. A very good book, even if some chapters felt a little slow.",
    quote:
      "I have sorrows, Dorian, of my own, that even you know nothing of. **The tragedy of old age is not that one is old, but that one is young.** I am amazed sometimes at my own sincerity. Ah, Dorian, how happy you are! What an exquisite life you have had. You have drunk deeply of everything. You have crushed the grapes against your palate. Nothing has been hidden from you. And it has all been to you no more than the sound of music.",
  },
  {
    slug: "crime-and-punishment",
    title: "Crime and Punishment",
    author: "Fyodor Dostoevsky",
    country: "Russia",
    year: 1866,
    genre: "Psychological Fiction",
    categories: ["Classic Literature", "Philosophy", "Psychology"],
    pages: 671,
    cover: "/books/crime-and-punishment.jpg",
    spine: "#4e4949",
    rating: 4.5,
    readingDate: "I don\u2019t remember exactly",
    quote:
      "And I had dreams all the time, strange dreams of all sorts, no need to describe! Only then I began to fancy that\u2026 No, that\u2019s not it! Again I am telling you wrong! **You see I kept asking myself then: why am I so stupid that if others are stupid\u2014and I know they are\u2014yet I won\u2019t be wiser?** Then I saw, Sonia, that **if one waits for everyone to get wiser it will take too long**\u2026. Afterwards I understood that that would never come to pass.",
    featured: true,
  },
  {
    slug: "the-tenant",
    title: "The Tenant",
    author: "Roland Topor",
    country: "France",
    year: 1964,
    genre: "Psychological Horror",
    categories: ["Classic Literature", "Psychology"],
    pages: 180,
    cover: "/books/the-tenant.jpg",
    spine: "#1a597c",
    rating: 3.5,
    readingDate: "May 2023",
    review:
      "The Tenant can be slow and repetitive at times, but its psychological peaks are incredible. A perfect example is when Trelkovsky contemplates losing his limbs and organs, trying to figure out exactly where the \u201Cmyself\u201D resides. His dark realization about how fragile our sense of self really is anchored the entire book for me. It\u2019s a beautifully weird, thought-provoking horror novel, even if it drags a bit in the middle.",
    quote:
      "**At what precise moment,** Trelkovsky asked himself, **does an individual cease to be the person he\u2014and everyone else\u2014believes himself to be?** Let\u2019s say I have to have an arm amputated. I say: myself and my arm. If both of them are gone, I say: myself and my two arms. If it were my legs it would be the same thing: myself and my legs. If they had to take out my stomach, my liver, my kidneys\u2014if that were possible\u2014I could still say: myself and my organs. **But if they cut off my head, what could I say then? Myself and my body, or myself and my head? By what right does the head, which isn\u2019t even a member like an arm or a leg, claim the title of myself?** Because it contains the brain? But there are larva and worms, and probably all sorts of other things, that don\u2019t possess a brain. What about creatures like those? **Are there brains that exist somewhere, and say: myself and my worms?**",
  },
  {
    slug: "the-death-of-ivan-ilyich",
    title: "The Death of Ivan Ilyich",
    author: "Leo Tolstoy",
    country: "Russia",
    year: 1886,
    genre: "Philosophical Fiction",
    categories: ["Classic Literature", "Philosophy"],
    pages: 128,
    cover: "/books/the-death-of-ivan-ilyich.jpg",
    spine: "#1f1312",
    rating: 3,
    readingDate: "May 2023",
  },
  {
    slug: "animal-farm",
    title: "Animal Farm",
    author: "George Orwell",
    country: "United Kingdom",
    year: 1945,
    genre: "Political Allegory",
    categories: ["Classic Literature", "History"],
    pages: 141,
    cover: "/books/animal-farm.jpg",
    spine: "#c7c2c3",
    rating: 4,
    readingDate: "Jul 2023",
    review:
      "A powerful, timeless political allegory that still hits incredibly hard. The ending is absolute perfection\u2014especially that final, haunting image where the animals look \u2018from pig to man, and from man to pig, and from pig to man again; but already it was impossible to say which was which.\u2019 Seeing the pigs become the exact oppressors they originally fought to overthrow is a brilliant, devastating stroke of genius. A near-flawless classic that everyone should read at least once.",
    quote:
      "But they had not gone twenty yards when they stopped short. An uproar of voices was coming from the farmhouse. They rushed back and looked through the window again. Yes, a violent quarrel was in progress. There were shoutings, bangings on the table, sharp suspicious glances, furious denials. The source of the trouble appeared to be that Napoleon and Mr. Pilkington had each played an ace of spades simultaneously. **Twelve voices were shouting in anger, and they were all alike.** No question, now, what had happened to the faces of the pigs. **The creatures outside looked from pig to man, and from man to pig, and from pig to man again; but already it was impossible to say which was which.**",
  },
  {
    slug: "the-metamorphosis",
    title: "The Metamorphosis",
    author: "Franz Kafka",
    country: "Austria-Hungary",
    year: 1915,
    genre: "Absurdist Fiction",
    categories: ["Classic Literature", "Philosophy", "Psychology"],
    pages: 96,
    cover: "/books/the-metamorphosis.jpg",
    spine: "#4a522f",
    rating: 4,
    readingDate: "Aug 2023",
    review:
      "Kafka does an incredible job of making you feel a profound sense of claustrophobia and sadness. The absolute peak of the book is when the family\u2019s sympathy finally expires, and the sister decisively declares, \u201CIt must be gotten rid of.\u201D Watching her transition from his protector to the one who completely denies his identity is chilling. A masterclass in absurdism that leaves a heavy, lasting impression.",
    quote:
      "**We must try to get rid of it,** the sister now said decisively to the father, for the mother, in her coughing fit, was not listening to anything. **It is killing you both. I see it coming. When people have to work as hard as we all do, they cannot also tolerate this endless torment at home. I just can\u2019t go on any more.** And she broke out into such a crying fit that her tears flowed out down onto her mother\u2019s face. She wiped them off her mother with mechanical motions of her hands. **It must be gotten rid of,** cried the sister. **That is the only way, father. You must try to get rid of the idea that this is Gregor. The fact that we have believed for so long, that is truly our real misfortune.** But how can it be Gregor? **If it were Gregor, he would have long ago realized that a communal life among human beings is not possible** with such an animal **and would have gone away voluntarily.** Then we would not have a brother, but **we could go on living and honour his memory. But this animal plagues us. It drives away the lodgers, will obviously take over the entire apartment, and leave us to spend the night in the alley.** Just look, father, **But Gregor did not have any notion of wishing to create problems for anyone and certainly not for his sister.** He had just started to turn himself around in order to creep back into his room.",
  },
  {
    slug: "the-midnight-library",
    title: "The Midnight Library",
    author: "Matt Haig",
    country: "United Kingdom",
    year: 2020,
    genre: "Philosophical Fiction",
    categories: ["Classic Literature", "Philosophy"],
    pages: 304,
    cover: "/books/the-midnight-library.jpg",
    spine: "#23293a",
    rating: 3.5,
    readingDate: "Aug 2023",
    review:
      "A comforting and deeply relatable book about regrets and the choices that define us. My absolute favorite part was the chess metaphor, where Mrs. Elm reminds Nora that \u2018a pawn is never just a pawn. A pawn is a queen-in-waiting. All you need to do is find a way to keep moving forward.\u2019 It\u2019s an incredibly beautiful reminder that even when we feel small and ordinary, we still have the power to change our lives if we just keep taking one step at a time. While the plot felt a little predictable toward the end, the emotional core and these moving philosophical insights made it a very worthwhile read.",
    quote:
      "\u2018You need to realise something if you are ever to succeed at chess,\u2019 she said, as if Nora had nothing bigger to think about. \u2018And the thing you need to realise is this: **the game is never over until it is over. It isn\u2019t over if there is a single pawn still on the board. If one side is down to a pawn and a king, and the other side has every player, there is still a game. And even if you were a pawn \u2013 maybe we all are \u2013 then you should remember that a pawn is the most magical piece of all. It might look small and ordinary but it isn\u2019t. Because a pawn is never just a pawn. A pawn is a queen-in-waiting. All you need to do is find a way to keep moving forward. One square after another. And you can get to the other side and unlock all kinds of power.**\u2019 Nora stared at the books around her. \u2018So, are you saying I only have pawns to play with?\u2019 \u2018I am saying that **the thing that looks the most ordinary might end up being the thing that leads you to victory. You have to keep going.** Like that day in the river. Do you remember?\u2019",
  },
  {
    slug: "the-stranger",
    title: "The Stranger",
    author: "Albert Camus",
    country: "France",
    year: 1942,
    genre: "Philosophical Fiction",
    categories: ["Classic Literature", "Philosophy"],
    pages: 123,
    cover: "/books/the-stranger.jpg",
    spine: "#9c9a9a",
    rating: 5,
    readingDate: "Jul 2022",
    review:
      "Hands down my favorite book of all time by my favorite author. Camus\u2019s writing is pure genius. The standout moment for me is Meursault\u2019s quiet indifference to the drama around him, choosing to just shut up, smoke a cigarette, and look at the sea. It perfectly encapsulates his character and the philosophy of the book in one simple sentence. A 5-star masterpiece that everyone needs to experience.",
    quote:
      "Madame Masson was crying and Marie was very pale. **I didn\u2019t like having to explain to them, so I just shut up, smoked a cigarette, and looked at the sea.** Raymond came back with Masson around one-thirty.",
  },
  {
    slug: "veronika-decides-to-die",
    title: "Veronika Decides to Die",
    author: "Paulo Coelho",
    country: "Brazil",
    year: 1998,
    genre: "Psychological Fiction",
    categories: ["Psychology", "Philosophy"],
    pages: 210,
    cover: "/books/veronika-decides-to-die.jpg",
    spine: "#096484",
    rating: 4.5,
    readingDate: "Aug 2023",
    review:
      "The psychological insights are incredible, especially the dialogue about what truly makes someone \u2018sick.\u2019 The doctor\u2019s reminder that suppressing your uniqueness is a \u2018distortion of nature\u2019 is such a powerful and comforting message. It perfectly captures Coelho\u2019s gift for finding deep spiritual truths in simple conversations. Highly recommended!",
    quote:
      "\u201cSo to go back to your question. What was it again?\u201d **\u201cAm I cured?\u201d \u201cNo. You\u2019re someone who is different, but who wants to be the same as everyone else. And that, in my view, is a serious illness.\u201d** \u201cIs wanting to be different a serious illness?\u201d **\u201cIt is if you force yourself to be the same as everyone else: it causes neuroses, psychoses and paranoia. It\u2019s a distortion of nature, it goes against God\u2019s laws, for in all the world\u2019s woods and forests, He did not create a single leaf the same as another.** But you think it\u2019s mad to be different and **that\u2019s why you chose to live in Villete,\u201d**",
  },
  {
    slug: "notes-from-underground",
    title: "Notes from Underground",
    author: "Fyodor Dostoevsky",
    country: "Russia",
    year: 1864,
    genre: "Philosophical Fiction",
    categories: ["Classic Literature", "Philosophy", "Psychology"],
    pages: 136,
    cover: "/books/notes-from-underground.jpg",
    spine: "#3d2a34",
    rating: 5,
    readingDate: "Feb 2025",
    review:
      "Easily one of the most powerful books I\u2019ve ever read. The Underground Man\u2019s monologue about why humanity will never renounce suffering because it is the root of our consciousness is pure genius. Dostoyevsky safely captures the terrifying beauty of being human\u2014arguing that living with suffering is better than a predictable life where \u2018once you have mathematical certainty there is nothing left to do.\u2019 A flawless 5 stars.",
    quote:
      "And yet I think man will never renounce real suffering, that is, destruction and chaos. Why, **suffering is the sole origin of consciousness. Though I did lay it down at the beginning that consciousness is the greatest misfortune for man, yet I know man prizes it and would not give it up for any satisfaction. Consciousness**, for instance, **is infinitely superior to twice two makes four. Once you have mathematical certainty there is nothing left to do or to understand.** There will be nothing left but to bottle up your five senses and plunge into contemplation.",
  },
  {
    slug: "the-sound-and-the-fury",
    title: "The Sound and the Fury",
    author: "William Faulkner",
    country: "United States",
    year: 1929,
    genre: "Modernist Fiction",
    categories: ["Classic Literature"],
    pages: 384,
    cover: "/books/the-sound-and-the-fury.jpg",
    spine: "#685a60",
    rating: 5,
    readingDate: "Mar 2025",
    review:
      "This book is a challenging read, but it is deeply rewarding and a perfect masterpiece. Seeing the world through Benjy\u2019s eyes is a hauntingly beautiful experience. His reliance on smell to understand his sister\u2014noticing when \u2018Caddy smelled like trees\u2019 and panicking when that smell disappears\u2014tells you everything you need to know about his grief and confusion. Faulkner is an absolute master of the human heart, and this book deserves every bit of its legendary status.",
    quote:
      "He went on and we stopped in the hall and Caddy knelt and put her arms around me and her cold bright face against mine. **Caddy smelled like trees.**\n...\n\u201cHush now.\u201d she said. \u201cI\u2019m not going to run away.\u201d So I hushed. **Caddy smelled like trees in the rain.**\n...\nCaddy put her arms around me, and her shining veil, **and I couldn\u2019t smell trees anymore and I began to cry.** Benji, Caddy said, Benji. She put her arms around me again, but I went away. **\u201cWhat is it Benjy.\u201d she said.** \u201cIs it this hat.\u201d She took her hat off and came again, and I went away. \u201cBenji.\u201d she said. **\u201cWhat is it, Benji. What has Caddy done.\u201d**",
  },
  {
    slug: "master-and-man",
    title: "Master and Man",
    author: "Leo Tolstoy",
    country: "Russia",
    year: 1895,
    genre: "Novella",
    categories: ["Classic Literature", "Philosophy"],
    pages: 128,
    cover: "/books/master-and-man.jpg",
    spine: "#748293",
    rating: 2,
    readingDate: "Mar 2026",
    review:
      "I usually appreciate Tolstoy\u2019s psychological insights, but this one missed the mark for me. A short book that somehow manages to feel very long. Tolstoy\u2019s Master and Man is a straightforward parable about greed and survival, but the pacing is just too slow to keep things interesting. The characters spend most of the book just getting lost over and over again in a snowstorm. It has a powerful ending, but the slow journey to get there wasn\u2019t really worth it for me.",
  },
  {
    slug: "the-orange-girl",
    title: "The Orange Girl",
    author: "Jostein Gaarder",
    country: "Norway",
    year: 2004,
    genre: "Magical Realism",
    categories: ["Classic Literature", "Philosophy"],
    pages: 160,
    cover: "/books/the-orange-girl.jpg",
    spine: "#7e9c8d",
    rating: 4.5,
    readingDate: "Mar 2026",
  },
  {
    slug: "down-and-out-in-paris-and-london",
    title: "Down and Out in Paris and London",
    author: "George Orwell",
    country: "United Kingdom",
    year: 1933,
    genre: "Memoir",
    categories: ["Classic Literature", "History"],
    pages: 224,
    cover: "/books/down-and-out-in-paris-and-london.jpg",
    spine: "#575758",
    rating: 4,
    readingDate: "Mar 2026",
  },
  {
    slug: "anna-karenina",
    title: "Anna Karenina",
    author: "Leo Tolstoy",
    country: "Russia",
    year: 1877,
    genre: "Literary Fiction",
    categories: ["Classic Literature"],
    pages: 864,
    cover: "/books/anna-karenina.jpg",
    spine: "#4d4f49",
    rating: 5,
    readingDate: "Oct 2023",
    review:
      "An absolute masterpiece! Many people are scared by how long this book is, but the story completely hooked me from the very first page. It is a huge novel, but I was so invested in the drama that I finished it in less than a week. Tolstoy understands human nature and romance perfectly. Don\u2019t let the length scare you\u2014it is a fast, unforgettable page-turner!",
  },
  {
    slug: "diary-of-a-murderer",
    title: "Diary of a Murderer",
    author: "Kim Young-ha",
    country: "South Korea",
    year: 2019,
    genre: "Thriller",
    categories: ["Thriller", "Literary fiction"],
    pages: 208,
    cover: "/books/diary-of-a-murderer.jpg",
    spine: "#7b6455",
    rating: 3.8,
    readingDate: "Jan 2024",
  },
  {
    slug: "the-plague",
    title: "The Plague",
    author: "Albert Camus",
    country: "France",
    year: 1947,
    genre: "Philosophical Fiction",
    categories: ["Classic Literature", "Philosophy"],
    pages: 320,
    cover: "/books/the-plague.jpg",
    spine: "#3d3a3b",
    rating: 5,
    readingDate: "Aug 2025",
  },
];

export type LibrarySort = "reading" | "title" | "author" | "rating" | "published";

const MONTH_INDEX: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** Turn "May 2022" into 202205 for sorting; uncertain dates become 0. */
export function readingDateSortKey(date: string): number {
  const m = date.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (!m) return 0;
  const month = MONTH_INDEX[m[1].slice(0, 3).toLowerCase()];
  if (!month) return 0;
  return parseInt(m[2], 10) * 100 + month;
}

export function sortBooks(list: Book[], mode: LibrarySort = "reading"): Book[] {
  return [...list].sort((a, b) => {
    switch (mode) {
      case "title":
        return a.title.localeCompare(b.title);
      case "author":
        return a.author.localeCompare(b.author) || a.title.localeCompare(b.title);
      case "rating":
        return b.rating - a.rating || a.title.localeCompare(b.title);
      case "published":
        return b.year - a.year || a.title.localeCompare(b.title);
      case "reading":
      default: {
        const diff = readingDateSortKey(b.readingDate) - readingDateSortKey(a.readingDate);
        return diff || a.title.localeCompare(b.title);
      }
    }
  });
}

export function getBook(slug: string): Book | undefined {
  return books.find((b) => b.slug === slug);
}

/** Five-star picks for home page — most recently read first. */
export function topRatedBooks(limit = 5, minRating = 5): Book[] {
  return sortBooks(
    books.filter((b) => b.rating >= minRating),
    "reading",
  ).slice(0, limit);
}

/** Distinct categories across the library, in first-seen order. */
export function allCategories(): string[] {
  const seen: string[] = [];
  for (const b of books) {
    for (const c of b.categories) {
      if (!seen.includes(c)) seen.push(c);
    }
  }
  return seen;
}

export type QuoteSegment = { text: string; quote: boolean };

/**
 * Split a raw quote into context vs. quoted segments.
 * `**bold**` (or `*bold*`) marks the actual quotation; the rest is context.
 */
export function parseQuote(raw: string): QuoteSegment[] {
  const segments: QuoteSegment[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) {
      segments.push({ text: raw.slice(last, m.index), quote: false });
    }
    segments.push({ text: m[1] ?? m[2] ?? "", quote: true });
    last = re.lastIndex;
  }
  if (last < raw.length) {
    segments.push({ text: raw.slice(last), quote: false });
  }
  return segments;
}

export type Star = "full" | "half" | "empty";

/** Turn a 1–5 rating (halves ok) into five star states. */
export function ratingStars(rating: number): Star[] {
  const stars: Star[] = [];
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push("full");
    else if (rating >= i - 0.5) stars.push("half");
    else stars.push("empty");
  }
  return stars;
}

/** Books that share at least one category, for "more from the library". */
export function relatedBooks(book: Book, limit = 3): Book[] {
  return books
    .filter((b) => b.slug !== book.slug)
    .map((b) => ({
      b,
      score: b.categories.filter((c) => book.categories.includes(c)).length,
    }))
    .sort((a, z) => z.score - a.score)
    .slice(0, limit)
    .map((x) => x.b);
}
