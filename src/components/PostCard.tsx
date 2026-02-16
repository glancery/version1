import { useState, useEffect } from "react";
import { Share2, Bell, Link, Check, MoreHorizontal, Mail } from "lucide-react";
import useSubscriber from "@/hooks/useSubscriber";
import useSubscribe from "@/hooks/useSubscribe";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface PostCardProps {
  image: string;
  title: string;
  description: string;
  gcode?: string;
  publication?: string;
  cta?: string;
  link?: string;
  shareUrl?: string;
}

const PostCard = ({
  image,
  title,
  description,
  gcode,
  publication,
  cta,
  link,
  shareUrl,
}: PostCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);

  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { sendStats } = useSubscriber();
  const { sendSubscribeEmail, loading, error, success } = useSubscribe();
  const [sharedGcode, setSharedGcode] = useState<string | null>(null);
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
    const expires = new Date(
      Date.now() + days * 24 * 60 * 60 * 1000
    ).toUTCString();
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
      value
    )}; expires=${expires}; path=/`;
  };

  useEffect(() => {
    try {
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
              const found = arr.some(
                (p) =>
                  String(p || "")
                    .trim()
                    .toLowerCase() === normPub
              );
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

  useEffect(() => {
    if (!sharedGcode) return;
    (async () => {
      try {
        await sendStats({ gcode: sharedGcode, shares: 1 });
      } catch (e) {
        // ignore
      }
    })();
    // run only when sharedGcode changes
  }, [sharedGcode, sendStats]);

  useEffect(() => {
    if (success) {
      toast({
        title: "Email successfully sent",
        description: "Check inbox to subscribe",
        variant: "default",
      });
    }
  }, [success, toast]);

      const urlToShare = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
      const url = encodeURIComponent(urlToShare);
      const text = encodeURIComponent(document.title || title || "");

      const socialLinks = [
        { name: "WhatsApp", icon: "whatsapp", url: `https://wa.me/?text=${encodeURIComponent(title + " " + urlToShare)}`, color: "bg-[#25D366]" },
        { name: "X", icon: "x", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(urlToShare)}`, color: "bg-black" },
        { name: "Facebook", icon: "facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlToShare)}`, color: "bg-[#1877F2]" },
        { name: "LinkedIn", icon: "linkedin", url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(urlToShare)}`, color: "bg-[#0A66C2]" },
      ];

      const handleCopyLink = () => {
        try {
          navigator.clipboard.writeText(urlToShare || "");
          toast({
            title: "Link copied!",
            description: "The link has been copied to your clipboard.",
          });
        } catch (e) {
          // ignore clipboard errors
        }
        // mark shared gcode
        try {
          if (gcode && gcode !== sharedGcode) setSharedGcode(gcode);
        } catch (e) {
          // ignore
        }
      };

      const handleNativeShare = async () => {
        if (navigator.share) {
          try {
            await navigator.share({
              title: title,
              url: urlToShare,
            });
            setShareOpen(false);
          } catch (e) {
            // ignore share failure
          }
        }
        // Mark this gcode as shared so the effect can increment the share counter
        try {
          if (gcode && gcode !== sharedGcode) setSharedGcode(gcode);
        } catch (e) {
          // ignore
        }
      };

  const handleSubscribe = async () => {
    if (email.trim() && email.includes("@") && gcode) {
      await sendSubscribeEmail({ gcode, emailid: email });
      if (success) {
        setSubmittedEmail(email);
        setShowConfirmation(true);
      }
    }
  };

  const handleChangeEmail = () => {
    setShowConfirmation(false);
    setEmail(submittedEmail);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setShowConfirmation(false);
    setEmail("");
    setSubmittedEmail("");
  };

  return (
    <>
      <article className="card-post">
        {/* Post Image with Share Buttons */}
        <div className="relative aspect-[1200/630] w-full overflow-hidden">
          <img src={image} alt={title} className="w-full h-full object-cover" />

          {/* Subscribe and Share Buttons - Bottom right of image */}
          <div className="absolute bottom-2 sm:bottom-3 right-3 sm:right-4 flex items-center gap-2">
            {!isFollowing && (
              <button
                onClick={() => setIsDialogOpen(true)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md"
                aria-label="Subscribe"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
            <button
              onClick={() => setShareOpen(true)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-muted text-foreground flex items-center justify-center hover:bg-muted/80 transition-colors shadow-md"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Post Content */}
        <div className="p-4 sm:p-5 pt-6 sm:pt-7">
          <h2 className="text-lg sm:text-xl md:text-2xl font-heading font-semibold text-foreground leading-tight mb-2 sm:mb-3">
            {title}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {description}
          </p>
          <a
            href={link}
            className="text-sm sm:text-base text-primary hover:underline mt-2 inline-block"
            target="Redirecting..."
            rel="noopener noreferrer"
          >
            {cta}
          </a>
        </div>
      </article>

      {/* Subscribe Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="w-[90vw] max-w-sm rounded-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-heading">
              Stay Updated
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {showConfirmation ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-foreground">
                  A confirmation link has been sent to{" "}
                  <span className="text-primary font-medium">
                    {submittedEmail}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Please check your inbox and click the link to confirm your
                  subscription.
                </p>
                <button
                  onClick={handleChangeEmail}
                  className="text-sm text-primary hover:underline"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-center text-muted-foreground">
                  Get notified when new glances are published. Enter your email
                  below.
                </p>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                />
                <Button
                  onClick={handleSubscribe}
                  className="w-full"
                  disabled={!email.trim() || !email.includes("@") || loading}
                >
                  {loading ? "Subscribing..." : "Subscribe"}
                </Button>
                {error && (
                  <p className="text-sm text-red-500 text-center mt-2">
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
            {/* Share Sheet */}
      <Sheet open={shareOpen} onOpenChange={setShareOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-center">Share Glance</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4 pb-6">
            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-4 p-4 bg-muted rounded-xl hover:bg-muted/80 transition-colors overflow-hidden"
            >
              <div className="w-12 h-12 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                <Link className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-medium text-foreground">Copy Link</p>
                <p className="text-sm text-muted-foreground truncate max-w-full">{shareUrl}</p>
              </div>
              <Check className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
            </button>
            {/* Social Media Icons */}
            <div className="flex justify-center gap-4 flex-wrap">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    try {
                      if (gcode && gcode !== sharedGcode) setSharedGcode(gcode);
                    } catch (e) {
                      /* ignore */
                    }
                  }}
                  className={`w-12 h-12 rounded-full ${social.color} flex items-center justify-center hover:opacity-80 transition-opacity`}
                  title={social.name}
                >
                  {social.icon === "whatsapp" && (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  )}
                  {social.icon === "x" && (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  )}
                  {social.icon === "facebook" && (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )}
                  {social.icon === "linkedin" && (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  )}
                  {social.icon === "email" && (
                    <Mail className="w-5 h-5 text-foreground" />
                  )}
                </a>
              ))}

              {/* More - Native Share */}
              <button
                onClick={handleNativeShare}
                className="w-12 h-12 rounded-full bg-primary flex items-center justify-center hover:opacity-80 transition-opacity"
                title="More options"
              >
                <MoreHorizontal className="w-5 h-5 text-primary-foreground" />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default PostCard;
