export const draftsData: any[] = [];

/**
 * Replace the exported postsData array in-place with a simple mapping of glances.
 * This keeps existing UI code that imports `postsData` working without changing
 * its references.
 */
export function fillPostsFromDrafts(drafts: any[]) {
  if (!Array.isArray(drafts)) return;

  const mapped = drafts.map((g: any, idx: number) => {
    const faqs = [] as any[];
    if (g.q1)
      faqs.push({
        question: g.q1.text || "",
        answer: g.q1.a || "",
        isHot: !!g.q1.ishot,
      });
    if (g.q2)
      faqs.push({
        question: g.q2.text || "",
        answer: g.q2.a || "",
        isHot: !!g.q2.ishot,
      });
    if (g.q3)
      faqs.push({
        question: g.q3.text || "",
        answer: g.q3.a || "",
        isHot: !!g.q3.ishot,
      });

    const created = g.createdAt || g.updatedAt || Date.now();
    const dateStr = new Date(created).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return {
      id: idx + 1,
      gcode: g.dcode || g._id || g.id || String(idx + 1),
      image: g.image || "",
      title: g.headline || g.title || "",
      description: g.snippet || "",
      author: g.author || "",
      authorInitials: String((g.author || "").slice(0, 2)).toUpperCase(),
      date: dateStr,
      faqs,
    };
  });

  // mutate postsData array in-place for consumers that import it
  draftsData.length = 0;
  mapped.forEach((m) => draftsData.push(m));
}
