"use client";

import { useState, useEffect } from "react";
import {
  submitReview,
  fetchRatingAggregate,
  fetchRecentReviews,
  getAnonymousUserId,
  type Review,
  type RatingAggregate,
} from "@/lib/firebase";

interface RatingWidgetProps {
  restroomId: string;
  /** Optional: pre-loaded aggregate so we don't need an extra fetch on open */
  initialAggregate?: RatingAggregate | null;
}

export default function RatingWidget({ restroomId, initialAggregate }: RatingWidgetProps) {
  const [agg, setAgg] = useState<RatingAggregate | null>(initialAggregate ?? null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Check if Firebase is configured (non-empty projectId)
  const firebaseEnabled = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  useEffect(() => {
    if (!firebaseEnabled) return;
    // Load aggregate if not pre-loaded
    if (!initialAggregate) {
      fetchRatingAggregate(restroomId).then(setAgg).catch(() => {});
    }
  }, [restroomId, initialAggregate, firebaseEnabled]);

  const loadReviews = async () => {
    if (!firebaseEnabled) return;
    try {
      const r = await fetchRecentReviews(restroomId, 3);
      setReviews(r);
    } catch { /* ignore */ }
  };

  const handleExpand = () => {
    setExpanded((e) => !e);
    if (!expanded) loadReviews();
  };

  const handleSubmit = async () => {
    if (!selectedStar || submitting) return;
    setSubmitting(true);
    try {
      const uid = getAnonymousUserId();
      await submitReview(restroomId, uid, selectedStar, comment);
      const updated = await fetchRatingAggregate(restroomId);
      setAgg(updated);
      setSubmitted(true);
      setShowForm(false);
      setSelectedStar(0);
      setComment("");
    } catch (e) {
      console.error("Rating submit error", e);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render without Firebase ──
  if (!firebaseEnabled) {
    return (
      <p style={{ fontSize: 11, color: "#9ca3af", margin: "6px 0 0", fontStyle: "italic" }}>
        評分功能需設定 Firebase（見 lib/firebase.ts）
      </p>
    );
  }

  return (
    <div style={{ marginTop: 8, borderTop: "1px solid #f3f4f6", paddingTop: 8 }}>

      {/* ── Summary row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <StarDisplay score={agg?.avgRating ?? 0} />
        {agg && agg.ratingCount > 0 ? (
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            {agg.avgRating.toFixed(1)} ({agg.ratingCount} 則評價)
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#9ca3af" }}>尚無評分</span>
        )}
        <button
          onClick={handleExpand}
          style={{ marginLeft: "auto", fontSize: 11, color: "#0D9488", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          {expanded ? "▲ 收起" : "▼ 查看評論"}
        </button>
      </div>

      {/* ── Expanded: recent reviews ── */}
      {expanded && (
        <div style={{ marginBottom: 8 }}>
          {reviews.length === 0 ? (
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "4px 0" }}>還沒有評論，成為第一個！</p>
          ) : (
            reviews.map((rev, i) => (
              <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #f9fafb" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <StarDisplay score={rev.score} />
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>{formatDate(rev.createdAt)}</span>
                </div>
                {rev.comment && (
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "#374151" }}>{rev.comment}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Submit button / form ── */}
      {submitted ? (
        <p style={{ fontSize: 12, color: "#0D9488", fontWeight: 600, margin: 0 }}>✅ 感謝你的評分！</p>
      ) : !showForm ? (
        <button
          onClick={() => setShowForm(true)}
          style={{
            fontSize: 12, fontWeight: 700,
            background: "#f0fdf4", color: "#065f46",
            border: "1px solid #bbf7d0",
            borderRadius: 8, padding: "5px 12px",
            cursor: "pointer",
          }}
        >
          ✍ 留下評分
        </button>
      ) : (
        <div style={{ marginTop: 6 }}>
          {/* Star picker */}
          <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onMouseEnter={() => setHoverStar(s)}
                onMouseLeave={() => setHoverStar(0)}
                onClick={() => setSelectedStar(s)}
                style={{
                  fontSize: 22,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  lineHeight: 1,
                  opacity: (hoverStar || selectedStar) >= s ? 1 : 0.3,
                  transition: "opacity 0.1s",
                }}
              >
                ⭐
              </button>
            ))}
          </div>

          {/* Comment */}
          <textarea
            placeholder="留下評語（選填）..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            style={{
              width: "100%",
              border: "1.5px solid #d1d5db",
              borderRadius: 8,
              padding: "6px 10px",
              fontSize: 12,
              resize: "none",
              boxSizing: "border-box",
              outline: "none",
            }}
          />

          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button
              onClick={handleSubmit}
              disabled={!selectedStar || submitting}
              style={{
                flex: 1,
                background: selectedStar ? "#0D9488" : "#d1d5db",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "7px 0",
                fontSize: 13,
                fontWeight: 700,
                cursor: selectedStar ? "pointer" : "not-allowed",
              }}
            >
              {submitting ? "送出中..." : "送出"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={{
                background: "#f3f4f6", color: "#374151",
                border: "none", borderRadius: 8,
                padding: "7px 14px", fontSize: 13,
                cursor: "pointer",
              }}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper sub-components ──────────────────────────────────────

function StarDisplay({ score }: { score: number }) {
  const full = Math.round(score);
  return (
    <span style={{ fontSize: 13, lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ opacity: s <= full ? 1 : 0.2 }}>⭐</span>
      ))}
    </span>
  );
}

function formatDate(d: Date): string {
  try {
    return d.toLocaleDateString("zh-TW", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}
