import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import useCreate from "@/hooks/useCreate";
import useEdit from "@/hooks/useEdit";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { postsData } from "@/data/postsData";
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

const Edit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCreateMode = location.pathname === "/create";
  const post = postsData[0];

  // Editable state - use placeholders for create mode
  // Use safe fallbacks in case `postsData[0]` is undefined (e.g. when
  // initial data hasn't been loaded yet). This prevents reading
  // properties of undefined (runtime crash).
  const [title, setTitle] = useState<string>(
    isCreateMode ? "" : post?.title || ""
  );
  const [description, setDescription] = useState<string>(
    isCreateMode ? "" : post?.description || ""
  );
  const [faqs, setFaqs] = useState<FAQItem[]>(
    isCreateMode
      ? defaultPlaceholders.faqs.map((faq) => ({ ...faq }))
      : (post?.faqs || defaultPlaceholders.faqs).map((faq) => ({ ...faq, isHot: !!faq.isHot }))
  );
  const [image, setImage] = useState<string>(
    isCreateMode ? defaultPlaceholders.image : post?.image || defaultPlaceholders.image
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { createGlance, loading: creating, error: createError } = useCreate();
  const {
    updateGlance,
    deleteGlance,
    loading: updating,
    error: updateError,
  } = useEdit();
  const params = useParams();
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

  const handleCreate = async () => {
    // Build q objects from faqs
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

    const payload: any = {
      headline: title,
      snippet: description,
      cta: readMoreText || "",
      link: readMoreUrl || "",
      q1,
      q2,
      q3,
      file: selectedFile || undefined,
    };

    const res = await createGlance(payload);
    if (res.success) {
      toast({ title: "Glance created", description: "Your glance was added." });
      navigate("/");
    } else {
      toast({
        title: "Create failed",
        description: res.message || createError || "Could not create glance.",
        variant: "destructive",
      });
    }
  };

  // Edit mode: load existing glance by gcode and populate fields
  useEffect(() => {
    const load = async () => {
      if (isCreateMode) return;
      const gcode = params.gcode as string | undefined;
      if (!gcode) {
        navigate("/");
        return;
      }
      try {
        const API_BASE =
          (import.meta.env as any).VITE_API_URL || "https://backend.glancery.com";
        const res = await fetch(`${API_BASE}/api/v1/glance/get`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gcode }),
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok) {
          toast({
            title: "Not found",
            description: json?.message || "Glance not found",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        const glance = json?.glance;
        if (glance) {
          setTitle(glance.headline || "");
          setDescription(glance.snippet || "");
          setImage(glance.image || defaultPlaceholders.image);
          setReadMoreText(glance.cta || "");
          setReadMoreUrl(glance.link || "");
          // map q1/q2/q3 to faqs
          const mappedFaqs = [glance.q1, glance.q2, glance.q3].map(
            (q: any) => ({
              question: q?.text || "",
              answer: q?.a || "",
              isHot: !!q?.ishot,
            })
          );
          setFaqs(mappedFaqs as any);
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load glance",
          variant: "destructive",
        });
        navigate("/");
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateMode, params.gcode]);

  const handleUpdate = async () => {
    const gcode = params.gcode as string | undefined;
    if (!gcode) {
      toast({
        title: "Error",
        description: "Missing gcode",
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

    const payload: any = {
      gcode,
      headline: title,
      snippet: description,
      cta: readMoreText || "",
      link: readMoreUrl || "",
      q1,
      q2,
      q3,
      image: selectedFile || undefined,
    };

    const res = await updateGlance(payload);
    if (res.success) {
      toast({
        title: "Glance updated",
        description: "Your changes were saved.",
      });
      navigate("/");
    } else {
      toast({
        title: "Update failed",
        description: res.message || updateError || "Could not update glance.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-semibold text-foreground text-center mb-4 sm:mb-6">
        {isCreateMode ? "Create your Glance" : "Edit your Glance"}
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
            onClick={() => (isCreateMode ? handleCreate() : handleUpdate())}
            disabled={isCreateMode ? creating : updating}
          >
            {isCreateMode
              ? creating
                ? "Creating..."
                : "Create"
              : updating
              ? "Saving..."
              : "Save"}
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

export default Edit;
