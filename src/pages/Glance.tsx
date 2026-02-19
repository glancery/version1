// react imports not required here
import { useLocation, useParams } from "react-router-dom";
import useGlance from "@/hooks/useGlance";
import Header from "@/components/Header";
import PostCard from "@/components/PostCard";
import FAQSection from "@/components/FAQSection";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import useSubscriber from "@/hooks/useSubscriber";

const Glance = () => {
  // Read all route params (supports routes like /:publication/:gcode/:email/:faqId)
  const routeParams = useParams() as {
    publication?: string;
    publisher?: string;
    username?: string;
    gcode?: string;
    email?: string;
    faqId?: string;
  };

  const faqId = routeParams.faqId;
  const expandedFaqIndex = faqId ? parseInt(faqId, 10) - 1 : undefined;

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  // publication: prefer route param '/:publication/:gcode', fall back to ?publication=
  const publication =
    routeParams.publication || params.get("publication") || null;
  const publisher = routeParams.publisher || params.get("publisher") || null;
  // gcode: prefer route param, fall back to ?gcode=
  const qGcode = routeParams.gcode || params.get("gcode") || undefined;

  const { sendStats } = useSubscriber();

  // Helper: set a cookie (name, value, days)
  const setCookie = (name: string, value: string, days = 365) => {
    try {
      const expires = new Date(
        Date.now() + days * 24 * 60 * 60 * 1000
      ).toUTCString();
      document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
        value
      )}; expires=${expires}; path=/`;
    } catch (e) {
      // ignore in non-browser envs
    }
  };

  // Helper: read a cookie by name
  const getCookie = (name: string) => {
    try {
      const cookies = document.cookie ? document.cookie.split(";") : [];
      for (let i = 0; i < cookies.length; i++) {
        const [k, ...rest] = cookies[i].split("=");
        const key = decodeURIComponent(k?.trim());
        if (key === name) return decodeURIComponent(rest.join("=") || "");
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    // If email supplied in the route, store it in cookies immediately
    if (routeParams.email) {
      // decode route email when possible
      let decoded = routeParams.email as string;
      try {
        decoded = decodeURIComponent(routeParams.email as string);
      } catch (e) {
        // leave as-is
      }

      // If this email is new (not the same as cookie), send stats to backend to register subscriber
      try {
        const existing = getCookie("glancery.email");
        // use qGcode (from route/query) as the gcode to send
        const gcodeToSend =
          qGcode || (routeParams.gcode as string) || undefined;
        if (gcodeToSend && decoded && (!existing || existing !== decoded)) {
          // send subscriber update in background; don't await blocking the UI
          sendStats({ gcode: gcodeToSend, emailid: decoded }).catch(() => {
            // ignore errors here; optional: log to console
          });
        }
      } catch (e) {
        // ignore
      }

      // always persist cookie so subsequent visits are recognized as existing
      setCookie("glancery.email", decoded, 365);

      // Persist publisher values seen in params into a cookie as a unique array.
      try {
        const pubValue = publisher || null;
        if (pubValue) {
          const raw = getCookie("glancery.publishers");
          let arr: string[] = [];
          try {
            arr = raw ? JSON.parse(raw) : [];
          } catch (e) {
            arr = [];
          }
          if (!Array.isArray(arr)) arr = [];
          // only add if not already present
          if (!arr.includes(pubValue)) {
            arr.push(pubValue);
            setCookie("glancery.publishers", JSON.stringify(arr), 365);
          }
        }
      } catch (e) {
        // ignore cookie write errors
      }
    }

    // If faqId present, show unlocked toast and scroll into view
    if (faqId && expandedFaqIndex !== undefined && expandedFaqIndex >= 0) {
      toast({
        title: "Unlocked",
        description: "The answer has been unlocked for you.",
      });
      setTimeout(() => {
        const element = document.getElementById(`faq-item-${expandedFaqIndex}`);
        if (element)
          element.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
    // only run on mount / when route params change
  }, [routeParams.email, faqId, expandedFaqIndex, qGcode, sendStats]);
  const { glance, loading, error } = useGlance(qGcode);

  // Keep the browser URL in the preferred share form: /:publication/:gcode
  // This makes sharing/copying behave consistently even if the page was opened
  // via a different route (query params or legacy link). We only replace the
  // history entry (no reload) so back button works as expected.
  useEffect(() => {
    try {
      if (!glance || !glance.gcode) return;
      const pub = publication || "glancery";
      const desiredPath = `/${encodeURIComponent(pub)}/${encodeURIComponent(
        String(glance.gcode)
      )}`;
      // preserve search and hash when updating location
      const search = window.location.search || "";
      const hash = window.location.hash || "";
      const current = window.location.pathname + search + hash;
      const desiredFull = desiredPath + search + hash;
      if (typeof window !== "undefined" && current !== desiredFull) {
        window.history.replaceState(null, "", desiredFull);
      }
    } catch (e) {
      // ignore in non-browser environments
    }
  }, [glance?.gcode, publication]);

  // When glance loads, increment its view count by 1.
  // The user requested not to persist any cookies; increment on every load.
  useEffect(() => {
    if (!glance || !glance.gcode) return;
    (async () => {
      try {
        // non-blocking: don't await in render path
        await sendStats({ gcode: glance.gcode, views: 1 });
      } catch (e) {
        // ignore network errors — views are best-effort
      }
    })();
    // only run when glance.gcode changes (i.e., new glance loaded)
  }, [glance?.gcode, sendStats]);

  const faqs = [] as any[];
  if (glance) {
    if (glance.q1)
      faqs.push({
        question: glance.q1.text || "",
        answer: glance.q1.a || glance.q1.answer || "",
        isHot: !!glance.q1.ishot,
      });
    if (glance.q2)
      faqs.push({
        question: glance.q2.text || "",
        answer: glance.q2.a || glance.q2.answer || "",
        isHot: !!glance.q2.ishot,
      });
    if (glance.q3)
      faqs.push({
        question: glance.q3.text || "",
        answer: glance.q3.a || glance.q3.answer || "",
        isHot: !!glance.q3.ishot,
      });
  }


  return (
    <div className="min-h-screen bg-background pb-8 sm:pb-12">
      {/* If publication exists and is not the default 'Glancery', show it specially */}
      {publication &&
      String(publication).trim() &&
      String(publication).trim().toLowerCase() !== "glancery" ? (
        <div className="w-full text-center py-6">
          <span className="font-serif italic font-bold text-2xl sm:text-4xl text-purple-600">
            {publication}
          </span>
        </div>
      ) : (
        <Header />
      )}

      <main className="container max-w-6xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-5 sm:pb-6">
        {loading && (
          <div className="py-12 text-center text-muted-foreground">
            Loading glance…
          </div>
        )}

        {!loading && error && (
          <div className="py-12 text-center text-destructive">{error}</div>
        )}

        {!loading && !error && glance && (
          <div className="mb-6 sm:mb-8">
            <div className="animate-fade-in lg:grid lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_384px] lg:gap-6 lg:items-center">
              <div>
                <PostCard
                  image={glance.image || ""}
                  title={glance.headline || ""}
                  description={glance.snippet || ""}
                    gcode={glance.gcode}
                  cta={glance.cta}
                  link={glance.link}
                    publication={publication || undefined}
                    shareUrl={
                      typeof window !== "undefined" && glance && glance.gcode
                        ? `${encodeURIComponent(
                            publication || "glancery"
                          )}.glancery.com/p/${encodeURIComponent(String(glance.gcode))}`
                        : undefined
                    }
                />
              </div>
              <div className="mt-4 lg:mt-0 lg:max-h-full lg:overflow-y-auto scrollbar-thin">
                <FAQSection
                  faqs={faqs}
                  defaultExpandedIndex={expandedFaqIndex}
                  unlockFirst={expandedFaqIndex === 0}
                  gcode={glance.gcode}
                  publication={publication || undefined}
                />{" "}
              </div>
            </div>
          </div>
        )}

        {!loading && !error && !glance && (
          <div className="py-12 text-center text-muted-foreground">
            No glance to show.
          </div>
        )}
      </main>
    </div>
  );
};

export default Glance;
