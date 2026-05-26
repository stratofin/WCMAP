/**
 * Firebase configuration for WC Map ratings & comments.
 *
 * Setup:
 * 1. Go to https://console.firebase.google.com → Add project → "wcmap"
 * 2. Add a Web app → copy the firebaseConfig snippet → paste below
 * 3. Firestore Database → Create → Start in test mode (or production + rules)
 * 4. Add NEXT_PUBLIC_* env vars to .env.local and Vercel dashboard
 *
 * Firestore data model:
 *   ratings/{restroomId}/reviews/{userId}
 *     { score: 1-5, comment: string, createdAt: Timestamp }
 *
 *   ratings/{restroomId}          (aggregate doc)
 *     { avgRating: number, ratingCount: number }
 */

import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

// ── Replace with your own Firebase project config ──────────────
// Copy from Firebase Console → Project settings → Your apps → SDK setup
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            ?? "",
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? "",
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         ?? "",
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             ?? "",
};

// Initialise once (Next.js hot-reload guard)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

// ── Types ──────────────────────────────────────────────────────
export interface Review {
  userId: string;
  score: number;       // 1–5
  comment: string;
  createdAt: Date;
}

export interface RatingAggregate {
  avgRating: number;
  ratingCount: number;
}

// ── Submit / update a review ───────────────────────────────────
/**
 * Submit or update a user's review for a restroom.
 * Uses a transaction to atomically update the aggregate document.
 * @param restroomId  restroom.id
 * @param userId      anonymous fingerprint or Firebase UID
 * @param score       1–5 stars
 * @param comment     optional text
 */
export async function submitReview(
  restroomId: string,
  userId: string,
  score: number,
  comment = ""
): Promise<void> {
  const aggRef   = doc(db, "ratings", restroomId);
  const revRef   = doc(db, "ratings", restroomId, "reviews", userId);

  await runTransaction(db, async (tx) => {
    const prevSnap = await tx.get(revRef);
    const aggSnap  = await tx.get(aggRef);

    const agg: RatingAggregate = aggSnap.exists()
      ? (aggSnap.data() as RatingAggregate)
      : { avgRating: 0, ratingCount: 0 };

    let { avgRating, ratingCount } = agg;

    if (prevSnap.exists()) {
      // Update: subtract old score, add new
      const oldScore = (prevSnap.data() as Review).score;
      const total = avgRating * ratingCount - oldScore + score;
      avgRating = total / ratingCount;
    } else {
      // New review
      const total = avgRating * ratingCount + score;
      ratingCount += 1;
      avgRating = total / ratingCount;
    }

    tx.set(aggRef, { avgRating: parseFloat(avgRating.toFixed(2)), ratingCount });
    tx.set(revRef, {
      userId,
      score,
      comment,
      createdAt: serverTimestamp(),
    });
  });
}

// ── Fetch aggregate ────────────────────────────────────────────
export async function fetchRatingAggregate(
  restroomId: string
): Promise<RatingAggregate | null> {
  const snap = await getDoc(doc(db, "ratings", restroomId));
  return snap.exists() ? (snap.data() as RatingAggregate) : null;
}

// ── Fetch recent reviews ───────────────────────────────────────
export async function fetchRecentReviews(
  restroomId: string,
  n = 5
): Promise<Review[]> {
  const q = query(
    collection(db, "ratings", restroomId, "reviews"),
    orderBy("createdAt", "desc"),
    limit(n)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      userId:    data.userId as string,
      score:     data.score  as number,
      comment:   data.comment as string,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    };
  });
}

// ── Simple anonymous user ID (localStorage) ───────────────────
export function getAnonymousUserId(): string {
  if (typeof window === "undefined") return "server";
  const key = "wcmap_uid";
  let uid = localStorage.getItem(key);
  if (!uid) {
    uid = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(key, uid);
  }
  return uid;
}
