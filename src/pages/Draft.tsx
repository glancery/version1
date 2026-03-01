import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
// no edit/create hooks needed on this page; publish happens via draft API
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import store from "@/redux/store";
// no module-level postsData used on this page
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Link,
  Flame,
  ChevronDown,
  Home,
  FilePen,
  PlusCircle,
  UsersRound,
} from "lucide-react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";
import {
  setAuthUser,
  setEmail,
  setPublication,
  setUsername,
} from "@/redux/authSlice";

interface FAQItem {
  question: string;
  answer: string;
  isHot?: boolean;
}

// Default placeholder content for create mode
const defaultPlaceholders = {
  title: "Enter your glance title here...",
  description:
    "Add a brief description that captures your readers' attention...",
  image: "/placeholder.svg",
  readMoreText: "Read more →",
  readMoreUrl: "https://",
  faqs: [
    { question: "", answer: "", isHot: false },
    { question: "", answer: "", isHot: false },
    { question: "", answer: "", isHot: false },
  ] as FAQItem[],
};

// Auto-resize textarea component
const AutoResizeTextarea = ({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      placeholder={placeholder}
    />
  );
};

// Custom Accordion components for Edit page - only arrow toggles
const Accordion = AccordionPrimitive.Root;

const AccordionItem = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>) => (
  <AccordionPrimitive.Item className={cn("border-b", className)} {...props} />
);

const AccordionContent = ({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>) => (
  <AccordionPrimitive.Content
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-0 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
);

const Draft = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // This page handles publishing an existing draft (no create mode).
  const isCreateMode = false;
  const params = useParams();
  const dcodeParam = params.dcode as string | undefined;
  const publication = params.publication as string | undefined;
  const email = params.email as string | undefined;
  const icode = params.icode as string | undefined;

  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [faqs, setFaqs] = useState<FAQItem[]>(
    defaultPlaceholders.faqs.map((faq) => ({ ...faq }))
  );
  const [image, setImage] = useState<string>(defaultPlaceholders.image);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // publish/delete states
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { toast } = useToast();
  const [readMoreText, setReadMoreText] = useState(
    isCreateMode ? "" : "Read more →"
  );
  const [readMoreUrl, setReadMoreUrl] = useState(
    isCreateMode ? "" : "https://example.com/article"
  );
  const [showImageOverlay, setShowImageOverlay] = useState(false);
  const [openItems, setOpenItems] = useState<string[]>(
    faqs.map((_, i) => `item-${i}`)
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateFaqQuestion = (index: number, question: string) => {
    setFaqs((prev) =>
      prev.map((faq, i) => (i === index ? { ...faq, question } : faq))
    );
  };

  const updateFaqAnswer = (index: number, answer: string) => {
    setFaqs((prev) =>
      prev.map((faq, i) => (i === index ? { ...faq, answer } : faq))
    );
  };

  const toggleFaqHot = (index: number) => {
    setFaqs((prev) =>
      prev.map((faq, i) => (i === index ? { ...faq, isHot: !faq.isHot } : faq))
    );
  };

  const toggleAccordionItem = (itemValue: string) => {
    setOpenItems((prev) =>
      prev.includes(itemValue)
        ? prev.filter((v) => v !== itemValue)
        : [...prev, itemValue]
    );
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      setSelectedFile(file);
    }
    setShowImageOverlay(false);
  };

  // Publishing will be handled by handlePublish below

  // Load existing draft by dcode and populate fields
  useEffect(() => {
    const loadDraft = async () => {
      const dcode = dcodeParam;
      if (!dcode) {
        toast({
          title: "Error",
          description: "Missing draft id",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // If the route provides publication/email/icode, populate the redux
      // auth slice so the page and other components can rely on it.
      if (publication) store.dispatch(setPublication(publication));
      if (email) store.dispatch(setEmail(email));
      if (icode) store.dispatch(setAuthUser(icode));

      const API_BASE =
        (import.meta.env as any).VITE_API_URL || "https://open.glancery.com";
      // Prefer the currently-authenticated icode from the store, but fall
      // back to the route-provided icode when available (useful when
      // previewing a draft link sent by email).
      const authIcode = store.getState()?.auth?.icode || icode;
      if (!authIcode) {
        toast({
          title: "Not authenticated",
          description: "Missing icode",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/v1/draft/get`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dcode, icode: authIcode }),
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok) {
          toast({
            title: "Not found",
            description: json?.message || "Draft not found",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        const draft = json?.draft;
        if (draft) {
          setTitle(draft.headline || "");
          setDescription(draft.snippet || "");
          setImage(draft.image || defaultPlaceholders.image);
          setReadMoreText(draft.cta || "");
          setReadMoreUrl(draft.link || "");
          const mappedFaqs = [draft.q1, draft.q2, draft.q3].map((q: any) => ({
            question: q?.text || "",
            answer: q?.a || q?.answer || "",
            isHot: !!q?.ishot,
          }));
          setFaqs(mappedFaqs as any);
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load draft",
          variant: "destructive",
        });
        navigate("/");
      }
    };
    loadDraft();
    // include params so if the route changes the effect re-runs
  }, [dcodeParam, publication, email, icode]);


  const handlePublish = async () => {
    const dcode = dcodeParam;
    if (!dcode) {
      toast({
        title: "Error",
        description: "Missing draft id",
        variant: "destructive",
      });
      return;
    }
    const icode = store.getState()?.auth?.icode;
    if (!icode) {
      toast({
        title: "Error",
        description: "Missing icode",
        variant: "destructive",
      });
      return;
    }

    const q1 = faqs[0]
      ? {
          text: faqs[0].question || "",
          a: faqs[0].answer || "",
          ishot: !!faqs[0].isHot,
        }
      : undefined;
    const q2 = faqs[1]
      ? {
          text: faqs[1].question || "",
          a: faqs[1].answer || "",
          ishot: !!faqs[1].isHot,
        }
      : undefined;
    const q3 = faqs[2]
      ? {
          text: faqs[2].question || "",
          a: faqs[2].answer || "",
          ishot: !!faqs[2].isHot,
        }
      : undefined;

    const API_BASE =
      (import.meta.env as any).VITE_API_URL || "https://open.glancery.com";

    const form = new FormData();
    form.append("icode", String(icode));
    form.append("dcode", String(dcode));
    if (title) form.append("headline", String(title));
    if (description) form.append("snippet", String(description));
    if (readMoreText) form.append("cta", String(readMoreText));
    if (readMoreUrl) form.append("link", String(readMoreUrl));
    if (q1) form.append("q1", JSON.stringify(q1));
    if (q2) form.append("q2", JSON.stringify(q2));
    if (q3) form.append("q3", JSON.stringify(q3));
    if (selectedFile)
      form.append("image", selectedFile, selectedFile.name || "image.jpg");

    try {
      setPublishing(true);
      setPublishError(null);
      const res = await fetch(`${API_BASE}/api/v1/draft/publish`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = json?.message || "Failed to publish draft";
        setPublishError(msg);
        toast({
          title: "Publish failed",
          description: msg,
          variant: "destructive",
        });
        setPublishing(false);
        return;
      }
      toast({
        title: "Draft published",
        description: json?.message || "Draft published",
      });
      setPublishing(false);
      try {
        localStorage.setItem("glancery.dashboard.activeTab", "glances");
      } catch (e) {
        /* ignore */
      }
      navigate("/");
    } catch (err: any) {
      setPublishing(false);
      setPublishError(err?.message || "Network error");
      toast({
        title: "Publish failed",
        description: err?.message || "Network error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-semibold text-foreground text-center mb-4 sm:mb-6">
        Publish Draft
      </h1>

      <main className="container max-w-6xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-5 sm:pb-6">
        <div className="mb-6 sm:mb-8 max-w-2xl mx-auto">
          {/* Editable Post Card */}
          <article className="card-post animate-fade-in">
            <div className="relative aspect-[1200/630] w-full overflow-hidden">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover"
              />

              {/* Image Edit Overlay */}
              {showImageOverlay && (
                <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center gap-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button onClick={handleUploadClick} className="px-6">
                    Upload image
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowImageOverlay(false)}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {/* Pencil Edit Button */}
              {!showImageOverlay && (
                <button
                  onClick={() => setShowImageOverlay(true)}
                  className="absolute bottom-2 sm:bottom-3 right-3 sm:right-4 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-muted text-foreground flex items-center justify-center hover:bg-muted/80 transition-colors shadow-md"
                  aria-label="Edit image"
                >
                  <Pencil className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>

            <div className="p-4 sm:p-5 pt-6 sm:pt-7">
              <AutoResizeTextarea
                value={title}
                onChange={setTitle}
                placeholder={defaultPlaceholders.title}
                className="w-full text-lg sm:text-xl md:text-2xl font-heading font-semibold text-foreground leading-tight mb-0.5 bg-transparent border-none focus:outline-none resize-none overflow-hidden placeholder:text-muted-foreground/50"
              />
              <AutoResizeTextarea
                value={description}
                onChange={setDescription}
                placeholder={defaultPlaceholders.description}
                className="w-full text-sm sm:text-base text-muted-foreground leading-relaxed bg-transparent border-none focus:outline-none resize-none overflow-hidden placeholder:text-muted-foreground/50"
              />
              <input
                type="text"
                value={readMoreText}
                onChange={(e) => setReadMoreText(e.target.value)}
                placeholder={defaultPlaceholders.readMoreText}
                className="text-sm sm:text-base text-primary mt-2 inline-block bg-transparent border-none focus:outline-none placeholder:text-primary/50"
              />
              <div className="flex items-center gap-2 mt-2">
                <Link className="w-4 h-4 text-muted-foreground" />
                <input
                  type="url"
                  value={readMoreUrl}
                  onChange={(e) => setReadMoreUrl(e.target.value)}
                  placeholder={defaultPlaceholders.readMoreUrl}
                  className="flex-1 text-sm text-muted-foreground bg-muted/50 border border-border rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </article>

          {/* Heading between post and FAQ */}
          <h2 className="text-base sm:text-lg font-medium text-foreground mt-6 mb-4 text-center flex items-center justify-center gap-1 flex-wrap">
            <span>Frame questions around curiosity and apply</span>
            <span className="inline-flex items-center gap-0.5">
              hot effect
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 fill-orange-500 inline" />
            </span>
            <span>on the key questions to encourage readers participation</span>
          </h2>

          {/* Editable FAQ Section - Below post */}
          <div>
            <section className="card-post p-4 sm:p-5 pt-2 sm:pt-3">
              <Accordion
                type="multiple"
                className="w-full"
                value={openItems}
                onValueChange={setOpenItems}
              >
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border-border"
                  >
                    <AccordionPrimitive.Header className="flex">
                      <div className="flex flex-1 items-start justify-between py-1.5 sm:py-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFaqHot(index);
                            }}
                            className={`flex-shrink-0 p-1 mt-0.5 rounded transition-colors ${
                              faq.isHot
                                ? "text-orange-500"
                                : "text-muted-foreground hover:text-orange-400"
                            }`}
                            aria-label={
                              faq.isHot ? "Mark as not hot" : "Mark as hot"
                            }
                          >
                            <Flame
                              className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                faq.isHot ? "fill-orange-500" : ""
                              }`}
                            />
                          </button>
                          <AutoResizeTextarea
                            value={faq.question}
                            onChange={(value) =>
                              updateFaqQuestion(index, value)
                            }
                            placeholder="What question would readers ask?"
                            className="w-full bg-transparent border-none focus:outline-none resize-none overflow-hidden text-base sm:text-lg font-medium text-foreground leading-snug placeholder:text-muted-foreground/50"
                          />
                        </div>
                        <button
                          onClick={() => toggleAccordionItem(`item-${index}`)}
                          className="flex-shrink-0 p-2 mt-0.5 hover:bg-muted rounded transition-colors"
                          aria-label={
                            openItems.includes(`item-${index}`)
                              ? "Collapse"
                              : "Expand"
                          }
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 shrink-0 transition-transform duration-200",
                              openItems.includes(`item-${index}`) &&
                                "rotate-180"
                            )}
                          />
                        </button>
                      </div>
                    </AccordionPrimitive.Header>
                    <AccordionContent className="text-muted-foreground leading-5 sm:leading-relaxed pb-2 sm:pb-2.5 text-sm sm:text-base">
                      {faq.isHot ? (
                        <div>
                          <p className="text-muted-foreground mb-2 leading-5 sm:leading-relaxed">
                            {faq.answer.split(" ").slice(0, 10).join(" ")}...
                          </p>
                          <div className="relative min-h-[100px]">
                            <div className="blur-sm select-none pointer-events-none min-h-[60px]">
                              <p className="text-muted-foreground leading-5 sm:leading-relaxed">
                                {faq.answer.split(" ").slice(10).join(" ") ||
                                  "\u00A0"}
                              </p>
                            </div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60">
                              <p className="text-xs sm:text-sm text-foreground font-medium mb-2">
                                Continue following this page
                              </p>
                              <div className="flex gap-2 w-full max-w-xs">
                                <input
                                  type="email"
                                  placeholder="Enter email"
                                  className="flex-1 bg-secondary border border-border rounded px-3 h-8 sm:h-9 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                  disabled
                                />
                                <Button
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9"
                                  disabled
                                >
                                  Follow
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <AutoResizeTextarea
                          value={faq.answer}
                          onChange={(value) => updateFaqAnswer(index, value)}
                          placeholder="Provide a helpful answer here..."
                          className="w-full bg-transparent border-none focus:outline-none resize-none overflow-hidden placeholder:text-muted-foreground/50"
                        />
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <div className="mt-4 flex justify-center">
                <a
                  href="/edit"
                  className="text-xs text-muted-foreground border border-border rounded px-2 py-1 hover:bg-muted transition-colors"
                >
                  Powered by Glancery
                </a>
              </div>
            </section>
          </div>
        </div>

        {/* Done Button */}
        <div className="flex justify-center mt-6">
          <Button
            className="px-8 py-2 text-base font-medium"
            onClick={() => handlePublish()}
            disabled={publishing}
          >
            {publishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </main>

      {/* Bottom Tab Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around">
          <button
            onClick={() => navigate("/")}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-6 h-6 stroke-[1.5]" />
            <span className="text-xs font-medium">Home</span>
          </button>

          <button
            onClick={() => navigate("/")}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <FilePen className="w-6 h-6 stroke-[1.5]" />
            <span className="text-xs font-medium">Drafts</span>
          </button>

          <button
            onClick={() => navigate("/create")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              isCreateMode
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            <PlusCircle
              className={`w-6 h-6 ${
                isCreateMode ? "stroke-[2.5]" : "stroke-[1.5]"
              }`}
            />
            <span className="text-xs font-medium">Create</span>
          </button>

          <button
            onClick={() => navigate("/")}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <UsersRound className="w-6 h-6 stroke-[1.5]" />
            <span className="text-xs font-medium">Subscribers</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Draft;
