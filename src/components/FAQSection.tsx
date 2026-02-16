import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Flame, HelpCircle } from "lucide-react";
import useSendMail from '@/hooks/useSendMail';
import useSubscriber from '@/hooks/useSubscriber';

interface FAQItem {
  question: string;
  answer: string;
  isHot?: boolean;
}

interface FAQSectionProps {
  faqs: FAQItem[];
  defaultExpandedIndex?: number;
  unlockFirst?: boolean;
  gcode?: string;
  publication?: string;
}

const useIsLaptop = () => {
  const [isLaptop, setIsLaptop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false
  );

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setIsLaptop(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isLaptop;
};

const FAQSection = ({ faqs, defaultExpandedIndex, unlockFirst, gcode, publication }: FAQSectionProps) => {
  const [isFollowing, setIsFollowing] = useState(unlockFirst || false);
  const [showUnlockMessage, setShowUnlockMessage] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const isLaptop = useIsLaptop();
  const [email, setEmail] = useState("");
  // filter out faqs that don't have a question (hide question+answer if question missing)
  const visibleFaqs = faqs.filter((f) => f && String(f.question || "").trim() !== "");

  // find the first hot faq index among visible faqs so we can open it by default on laptop
  const hotIndex = visibleFaqs.findIndex((f) => f.isHot);

  // Determine default accordion value. Behavior:
  // - If defaultExpandedIndex is provided and valid (relative to visibleFaqs), use it.
  // - Otherwise, on laptop prefer opening the first hot FAQ; if none, open the first visible FAQ (item-0).
  // - On non-laptop, leave collapsed by default.
  const getDefaultValue = () => {
    if (
      defaultExpandedIndex !== undefined &&
      defaultExpandedIndex >= 0 &&
      defaultExpandedIndex < visibleFaqs.length
    ) {
      return `item-${defaultExpandedIndex}`;
    }
    if (isLaptop) {
      if (hotIndex !== -1) return `item-${hotIndex}`;
      return visibleFaqs.length > 0 ? `item-0` : undefined;
    }
    return undefined;
  };

  const { sendMail, loading } = useSendMail();
  const { sendStats } = useSubscriber();
  const [clickedGcode, setClickedGcode] = useState<string | null>(null);

  // When clickedGcode changes, increment clicks metric for that glance.
  useEffect(() => {
    if (!clickedGcode) return;
    const parts = clickedGcode.split("::");
    const code = parts[0];
    if (!code) return;
    (async () => {
      try {
        await sendStats({ gcode: code, clicks: 1 });
      } catch (e) {
        // best-effort
      }
    })();
  }, [clickedGcode, sendStats]);

  // Read cookie helper
  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const pairs = document.cookie.split(";").map((s) => s.trim());
    for (const p of pairs) {
      if (!p) continue;
      const [k, v] = p.split("=");
      if (!k) continue;
      if (decodeURIComponent(k) === name) return decodeURIComponent(v || "");
    }
    return null;
  };

  const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === "undefined") return;
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
  };

  // If the user already has an email cookie, pre-fill and unlock answers immediately
  useEffect(() => {
    try {
      const cookieEmail = getCookie("glancery.email");
      if (cookieEmail && String(cookieEmail).trim()) {
        setEmail(cookieEmail);
        setSubmittedEmail(cookieEmail);
        // setIsFollowing(true);
        // Show the unlocked toast only once ever (per browser) — track with a cookie
        const alreadyShown = getCookie("glancery.unlockedShown");
        if (!alreadyShown) {
          toast({ title: "Unlocked", description: "The answers have been unlocked for you." });
          try {
            setCookie("glancery.unlockedShown", "1", 3650); // keep for ~10 years
          } catch (e) {
            /* ignore */
          }
        }
      }
      // If a publication/publisher is present and we've previously recorded
      // that publisher in the `glancery.publishers` cookie, treat the user as
      // already following this page.
      try {
        if (publication) {
          const raw = getCookie("glancery.publishers");
          if (raw) {
            let arr: string[] = [];
            try {
              arr = JSON.parse(raw);
            } catch (e) {
              arr = [];
            }
            if (Array.isArray(arr) && arr.length > 0) {
              const normPub = String(publication).trim().toLowerCase();
              const found = arr.some((p) => String(p || "").trim().toLowerCase() === normPub);
              if (found) {
                setIsFollowing(true);
              }
            }
          }
        }
      } catch (e) {
        // ignore cookie parse errors
      }
    } catch (e) {
      // ignore in non-browser environments
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFollow = async (faqIndex: number) => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email to follow.",
        variant: "destructive",
      });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // prepare payload for unlock email API
    const payload: any = {
      emailid: String(email).trim(),
    };
    if (gcode) payload.gcode = gcode;
    // send numeric qkey (1-based)
    payload.qkey = faqIndex + 1;
    // include question text as qtext as well
    const qtext = visibleFaqs[faqIndex]?.question || "";
    if (qtext) payload.qtext = qtext;

    setSubmittedEmail(email);
    setShowUnlockMessage(true);

    try {
      const result = await sendMail(payload);
      if (!result.success) {
        toast({ title: 'Failed to send', description: result.message || 'Could not send unlock email', variant: 'destructive' });
        setShowUnlockMessage(false);
        return;
      }

      // // On success, simulate unlock after short delay
      // setTimeout(() => {
      //   setShowUnlockMessage(false);
      //   setIsFollowing(true);
      //   toast({ title: 'Unlocked!', description: 'The answer has been unlocked.' });
      // }, 1200);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Network error', variant: 'destructive' });
      setShowUnlockMessage(false);
    }
  };

  const getFirstLine = (text: string) => {
    const words = text.split(' ').slice(0, 12).join(' ');
    return words + '...';
  };

  return (
    <section className="card-post p-4 sm:p-5 pt-2 sm:pt-3">
   <Accordion type="single" collapsible className="w-full" defaultValue={getDefaultValue()}>
        {visibleFaqs.map((faq, index) => (
           <AccordionItem key={index} value={`item-${index}`} className="border-border" id={`faq-item-${index}`}>
            <AccordionTrigger
              className="text-left font-medium text-foreground hover:text-primary hover:no-underline py-3 sm:py-4 text-base sm:text-lg"
              onClick={() => {
                try {
                  if (gcode) setClickedGcode(`${gcode}::${index}::${Date.now()}`);
                } catch (e) {
                  /* ignore */
                }
              }}
            >
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center flex-shrink-0">
                  {faq.isHot ? (
                    <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 fill-orange-500" />
                  ) : (
                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  )}
                </span>
                {faq.question}
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-5 sm:leading-relaxed pb-3 sm:pb-4 text-sm sm:text-base">
              {faq.isHot && !isFollowing ? (
                <div>
                  <p className="text-muted-foreground mb-2 leading-5 sm:leading-relaxed">{faq.answer.split(' ').slice(0, 10).join(' ')}...</p>
                  <div className="relative">
                    <div className="blur-sm select-none pointer-events-none">
                      <p className="text-muted-foreground leading-5 sm:leading-relaxed">{faq.answer.split(' ').slice(10).join(' ')}</p>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60">
                      {showUnlockMessage ? (
                        <div className="text-center px-4">
                          <p className="text-xs sm:text-sm text-foreground font-medium">
                            Unlock this answer with the link sent to <span className="text-primary">{submittedEmail}</span>
                          </p>
                          <button
                            onClick={() => {
                              setShowUnlockMessage(false);
                              setEmail(submittedEmail);
                            }}
                            className="mt-2 text-xs text-primary hover:underline"
                          >
                            Change email
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs sm:text-sm text-foreground font-medium mb-2">Continue following this page</p>
                          <div className="flex gap-2 w-full max-w-xs">
                            <Input
                              type="email"
                              placeholder="Enter email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="flex-1 bg-secondary border-border focus-visible:ring-primary h-8 sm:h-9 text-xs sm:text-sm"
                            />
                            <Button 
                              onClick={() => handleFollow(index)}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9"
                              disabled={loading}
                            >
                              Follow
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-3 leading-5 sm:leading-relaxed">{faq.answer}</p>
                  {/* <button className="btn-read-more text-sm">
                    Read more →
                  </button> */}
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="mt-4 flex justify-center">
        <a 
          href="/" 
          className="text-xs text-muted-foreground border border-border rounded px-2 py-1 hover:bg-muted transition-colors"
        >
          Powered by Glancery
        </a>
      </div>
    </section>
  );
};

export default FAQSection;
