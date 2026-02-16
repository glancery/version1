import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { postsData, fillPostsFromGlances } from "@/data/postsData";
import { draftsData, fillPostsFromDrafts } from "@/data/draftsData";
import useList from "@/hooks/useList";
import useListDraft from "@/hooks/useListDraft";
import useFollowers from "@/hooks/useFollowers";
import store from "@/redux/store";
import useEdit from "@/hooks/useEdit";
import useSubscriber from "@/hooks/useSubscriber";
import {
  Eye,
  HelpCircle,
  Users,
  Share2,
  Pencil,
  Mail,
  Download,
  Plus,
  Link,
  Check,
  MoreHorizontal,
  FileText,
  Home,
  PlusCircle,
  UsersRound,
  FilePen,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

interface PostMetrics {
  views: number;
  qcr: number;
  followers: any;
  shares: number;
}

// Mock metrics data for each post
const postMetrics: Record<number, PostMetrics> = {
  1: { views: 12450, qcr: 34.5, followers: 892, shares: 156 },
  2: { views: 8920, qcr: 28.3, followers: 654, shares: 98 },
  3: { views: 15680, qcr: 41.2, followers: 1203, shares: 234 },
};

// Mock subscriber data with dates
const subscribersByDate: Record<string, string[]> = {
  Today: [
    "john.doe@example.com",
    "sarah.smith@gmail.com",
    "mike.johnson@company.co",
  ],
  Yesterday: [
    "emma.wilson@startup.io",
    "alex.brown@tech.com",
    "lisa.davis@design.org",
    "james.miller@agency.net",
  ],
  "Jan 12, 2026": [
    "anna.taylor@creative.co",
    "david.anderson@dev.io",
    "sophie.thomas@marketing.com",
  ],
  "Jan 11, 2026": ["chris.jackson@sales.net", "rachel.white@hr.org"],
  "Jan 10, 2026": [
    "kevin.harris@finance.co",
    "megan.martin@ops.io",
    "ryan.garcia@support.com",
  ],
};

const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
};

const DashboardPostCard = ({
  id,
  gcode,
  image,
  title,
  metrics,
  navigate,
  onShare,
  onDelete,
}: {
  id: string;
  gcode: string;
  image: string;
  title: string;
  metrics?: Partial<PostMetrics>;
  navigate: (path: string) => void;
  onShare: (title: string, gcode?: string) => void;
  onDelete: (id: string, title: string) => void;
}) => {
  const effectiveMetrics: PostMetrics = {
    views: metrics?.views || 0,
    qcr: metrics?.qcr || 0,
    followers:
      typeof (metrics as any)?.followers === "number"
        ? (metrics as any).followers
        : Array.isArray((metrics as any)?.followers)
        ? (metrics as any).followers.length
        : typeof (metrics as any)?.followers === "number"
        ? (metrics as any).followers
        : Array.isArray((metrics as any)?.followers)
        ? (metrics as any).followers.length
        : 0,
    shares: metrics?.shares || 0,
  };
  console.log(metrics);
  return (
    <article className="card-post overflow-hidden">
      {/* Image with title overlay */}
      <div className="relative aspect-[1200/630] w-full overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        {/* Title at bottom of image */}
        <h2 className="absolute bottom-3 left-4 right-12 text-white font-heading font-semibold text-lg sm:text-xl leading-tight">
          {title}
        </h2>
        {/* More options menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors">
              <MoreHorizontal className="w-4 h-4 text-white" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onDelete(gcode || id, title)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Metrics */}
      <div className="p-4 grid grid-cols-4 gap-2">
        {/* Views */}
        <div className="flex flex-col items-center text-center">
          <Eye className="w-5 h-5 text-primary mb-1" />
          <span className="text-xs text-muted-foreground font-medium">
            Views
          </span>
          <span className="text-sm sm:text-base font-semibold text-foreground">
            {formatNumber(effectiveMetrics.views)}
          </span>
        </div>

        {/* QCR */}
        <div className="flex flex-col items-center text-center">
          <HelpCircle className="w-5 h-5 text-orange-500 mb-1" />
          <span className="text-xs text-muted-foreground font-medium">Clicks</span>
          <span className="text-sm sm:text-base font-semibold text-foreground">
            {effectiveMetrics.qcr}
          </span>
        </div>

        {/* Subscribers */}
        <div className="flex flex-col items-center text-center">
          <Users className="w-5 h-5 text-green-500 mb-1" />
          <span className="text-xs text-muted-foreground font-medium">
            Subscribers
          </span>
          <span className="text-sm sm:text-base font-semibold text-foreground">
            {formatNumber(effectiveMetrics.followers)}
          </span>
        </div>

        {/* Shares */}
        <div className="flex flex-col items-center text-center">
          <Share2 className="w-5 h-5 text-blue-500 mb-1" />
          <span className="text-xs text-muted-foreground font-medium">
            Shares
          </span>
          <span className="text-sm sm:text-base font-semibold text-foreground">
            {formatNumber(effectiveMetrics.shares)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4 flex gap-3">
        <button
          onClick={() => navigate(`/edit/${gcode || id}`)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          <Pencil className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={() => onShare(title, gcode)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-muted text-foreground rounded-lg font-medium text-sm hover:bg-muted/80 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>
    </article>
  );
};

const SubscribersView = () => {
  const { followers, loading, error, fetchFollowers } = useFollowers();
  const [groups, setGroups] = useState<
    {
      key: number;
      label: string;
      items: { email: string; followedAt: string | null }[];
    }[]
  >([]);

  const formatLabel = (d: Date | null) => {
    if (!d) return "Unknown";
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const targetStart = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate()
    ).getTime();
    if (targetStart === startOfToday) return "Today";
    if (targetStart === startOfYesterday) return "Yesterday";
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  useEffect(() => {
    if (!followers) return;
    const map = new Map<
      number,
      { label: string; items: { email: string; followedAt: string | null }[] }
    >();
    followers.forEach((f) => {
      const date = f.followedAt ? new Date(f.followedAt) : null;
      const key = date
        ? new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
          ).getTime()
        : 0;
      const label = formatLabel(date);
      if (!map.has(key)) map.set(key, { label, items: [] });
      map.get(key)!.items.push({ email: f.email, followedAt: f.followedAt });
    });
    const arr = Array.from(map.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([key, v]) => ({ key, label: v.label, items: v.items }));
    setGroups(arr);
  }, [followers]);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    const tryFetch = async (icode?: string) => {
      try {
        if (icode) {
          const result = await fetchFollowers(icode);
        }
      } catch (e) {
        // ignore
      }
    };
    const icodeNow = store.getState()?.auth?.icode;
    if (icodeNow) {
      tryFetch(icodeNow);
    } else {
      unsub = store.subscribe(() => {
        const icode = store.getState()?.auth?.icode;
        if (icode) {
          tryFetch(icode);
          if (unsub) {
            unsub();
            unsub = null;
          }
        }
      });
    }
    return () => {
      if (unsub) unsub();
    };
  }, [fetchFollowers]);

  const total = followers ? followers.length : 0;

  const handleDownload = () => {
    const rows: string[] = ["Date,Email,FollowedAt"];
    groups.forEach((g) => {
      g.items.forEach((it) => {
        rows.push(
          `${JSON.stringify(g.label)},${JSON.stringify(
            it.email
          )},${JSON.stringify(it.followedAt || "")}`
        );
      });
    });
    const csvContent = "data:text/csv;charset=utf-8," + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "followers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header showProfile />

      <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-semibold text-foreground text-center mb-3 mt-4 sm:mt-6 px-4">
        {total} Subscribers
      </h1>

      <div className="flex justify-center mb-6 px-4">
        <button
          onClick={handleDownload}
          disabled={total === 0}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          Download Subscribers
        </button>
      </div>

      <main className="container max-w-2xl mx-auto px-4 sm:px-6 space-y-4">
        {loading && (
          <div className="py-12 text-center text-muted-foreground">
            Loading followers…
          </div>
        )}
        {!loading && error && (
          <div className="py-12 text-center text-destructive">{error}</div>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No subscribers yet.
          </div>
        )}

        {groups.map((group) => (
          <div
            key={String(group.key)}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="px-4 py-2.5 bg-muted/50 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">
                {group.label}
              </span>
            </div>
            {group.items.map((item, idx) => (
              <div
                key={`${group.key}-${item.email}`}
                className={`flex items-center gap-3 px-4 py-3 ${
                  idx !== group.items.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm sm:text-base text-foreground truncate">
                    {item.email}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        <p className="text-center text-muted-foreground text-sm mt-4">
          Showing {total} subscribers
        </p>
      </main>
    </div>
  );
};

const DraftPostCard = ({
  id,
  gcode,
  image,
  title,
  navigate,
}: {
  id: string;
  gcode?: string;
  image: string;
  title: string;
  navigate: (path: string) => void;
}) => {
  return (
    <article className="card-post overflow-hidden">
      {/* Image with title overlay */}
      <div className="relative aspect-[1200/630] w-full overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        {/* Title at bottom of image */}
        <h2 className="absolute bottom-3 left-4 right-4 text-white font-heading font-semibold text-lg sm:text-xl leading-tight">
          {title}
        </h2>
      </div>

      {/* Action Button - Only Edit */}
      <div className="p-4">
        <button
          onClick={() => navigate(`/draft/${gcode || id}`)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          <Pencil className="w-4 h-4" />
          Edit
        </button>
      </div>
    </article>
  );
};

const GlancesView = ({
  navigate,
  onShare,
  onDelete,
  isEmpty,
}: {
  navigate: (path: string) => void;
  onShare: (title: string) => void;
  onDelete: (id: string, title: string) => void;
  isEmpty: boolean;
}) => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header showProfile />

      <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-semibold text-foreground text-center mb-2 sm:mb-3 mt-4 sm:mt-6">
        Your Glances
      </h1>

      {isEmpty ? (
        <main className="container max-w-md mx-auto px-4 sm:px-6 mt-16">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Plus className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-heading font-semibold text-foreground mb-2">
              No glances yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Create your first glance to start engaging with your readers and
              growing your audience.
            </p>
            <button
              onClick={() => navigate("/create")}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Glance
            </button>
          </div>
        </main>
      ) : (
        <>
          <div className="flex justify-center mb-4 px-4 sm:px-0">
            <p className="text-sm sm:text-base font-semibold text-primary bg-primary/10 py-2 px-4 rounded-full text-center">
              ✨ Share your glances to reach high intent readers
            </p>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground text-center mb-6 sm:mb-8 px-4 sm:px-0">
            <span className="font-medium text-foreground">Clicks</span> = Clicks — number of clicks made by visitors to expand questions
          </p>

          <main className="container max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {postsData.map((post) => (
                <DashboardPostCard
                  key={post.id}
                  id={post.id}
                  gcode={post.gcode}
                  image={post.image}
                  title={post.title}
                  metrics={{
                    ...post.metrics,
                    followers:
                      typeof post.metrics?.followers === "number"
                        ? post.metrics.followers
                        : Array.isArray(post.metrics?.followers)
                        ? post.metrics.followers.length
                        : Array.isArray((post as any).followers)
                        ? (post as any).followers.length
                        : 0,
                  }}
                  navigate={navigate}
                  onShare={onShare}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </main>
        </>
      )}
    </div>
  );
};

const DraftsView = ({
  navigate,
  isEmpty,
}: {
  navigate: (path: string) => void;
  isEmpty: boolean;
}) => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Header showProfile />

      <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-semibold text-foreground text-center mb-2 sm:mb-3 mt-4 sm:mt-6">
        Your Drafts
      </h1>

      {isEmpty ? (
        <main className="container max-w-md mx-auto px-4 sm:px-6 mt-16">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-heading font-semibold text-foreground mb-2">
              No drafts yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Start creating and your unpublished glances will appear here.
            </p>
            <button
              onClick={() => navigate("/create")}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Glance
            </button>
          </div>
        </main>
      ) : (
        <>
          <div className="flex justify-center mb-4 px-4 sm:px-0">
            <p className="text-sm sm:text-base font-semibold text-primary bg-primary/10 py-2 px-4 rounded-full text-center">
              🚀 Publish your drafts to start reaching readers
            </p>
          </div>

          <main className="container max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {draftsData.map((post) => (
                <DraftPostCard
                  key={post.id}
                  id={post.id}
                  gcode={post.gcode}
                  image={post.image}
                  title={post.title}
                  navigate={navigate}
                />
              ))}
            </div>
          </main>
        </>
      )}
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  // If there is no icode in the store, redirect to /auth so user can sign in
  useEffect(() => {
    try {
      const icodeNow = store.getState()?.auth?.icode;
      if (!icodeNow) {
        navigate("/auth");
      }
    } catch (e) {
      // ignore in non-browser environments
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { sendStats } = useSubscriber();
  const [sharedGcode, setSharedGcode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "glances" | "drafts" | "subscribers"
  >(() => {
    try {
      const stored = localStorage.getItem("glancery.dashboard.activeTab");
      if (
        stored === "glances" ||
        stored === "drafts" ||
        stored === "subscribers"
      ) {
        return stored;
      }
    } catch (e) {
      // ignore: localStorage may be unavailable in some environments
    }
    return "glances";
  });

  // Persist active tab so selection survives refresh
  useEffect(() => {
    try {
      localStorage.setItem("glancery.dashboard.activeTab", activeTab);
    } catch (e) {
      // ignore write errors
    }
  }, [activeTab]);
  // local tick to force a re-render after we mutate the shared `postsData`
  const [, setTick] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareTitle, setShareTitle] = useState("");
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const { toast } = useToast();

  // Edit/delete hook
  const { deleteGlance, loading: editLoading, error: editError } = useEdit();

  // Hook to fetch glances
  const {
    glances,
    fetchList,
    loading: listLoading,
    error: listError,
  } = useList();

  // Hook to fetch drafts
  const {
    drafts,
    fetchList: fetchDrafts,
    loading: draftsLoading,
    error: draftsError,
  } = useListDraft();

  // Fetch glances when dashboard mounts or when icode becomes available in the store
  useEffect(() => {
    let unsub: (() => void) | null = null;

    const tryFetch = async (icode?: string) => {
      try {
        // Debug: log when we try to fetch so we can see if this effect runs
        // even when toasts are disabled. Check browser console for this.
        // (Remove these logs once debugging is complete.)
        // eslint-disable-next-line no-console
        // If an icode is provided, use it; otherwise use store value inside fetchList
        if (icode) {
          await fetchList(icode);
        } else {
          await fetchList();
        }
      } catch (e) {
        // fetchList handles errors and sets its own error state
      }
    };

    const icodeNow = store.getState()?.auth?.icode;
    if (icodeNow) {
      tryFetch(icodeNow);
    } else {
      // Wait for icode to appear in the store (e.g., after verify/magic flow)
      unsub = store.subscribe(() => {
        const icode = store.getState()?.auth?.icode;
        if (icode) {
          tryFetch(icode);
          // unsubscribe after first successful fetch
          if (unsub) {
            unsub();
            unsub = null;
          }
        }
      });
    }

    return () => {
      if (unsub) unsub();
    };
  }, [fetchList]);

  // Fetch drafts when dashboard mounts or when icode becomes available in the store
  useEffect(() => {
    let unsub: (() => void) | null = null;

    const tryFetchDrafts = async (icode?: string) => {
      try {
        // eslint-disable-next-line no-console
        if (icode) {
          await fetchDrafts(icode);
        } else {
          await fetchDrafts();
        }
      } catch (e) {
        // fetchDrafts handles errors
      }
    };

    const icodeNow = store.getState()?.auth?.icode;
    if (icodeNow) {
      tryFetchDrafts(icodeNow);
    } else {
      unsub = store.subscribe(() => {
        const icode = store.getState()?.auth?.icode;
        if (icode) {
          tryFetchDrafts(icode);
          if (unsub) {
            unsub();
            unsub = null;
          }
        }
      });
    }

    return () => {
      if (unsub) unsub();
    };
  }, [fetchDrafts]);

  // When glances arrive, map them into postsData so existing UI reads live content
  useEffect(() => {
    // Always map when glances is an array — this ensures an empty result
    // from the server clears `postsData` and shows the empty state for
    // the specific `icode` (strict per-icode behavior).
    if (Array.isArray(glances)) {
      try {
        // Log arrival and size so we can debug silent failures
        // eslint-disable-next-line no-console
        fillPostsFromGlances(glances);
        // we mutate the module-level postsData array in-place; React won't
        // automatically re-render for that mutation, so bump a local state
        // counter to force a render and ensure the UI picks up the change.
        setTick((t) => t + 1);
      } catch (e) {
        // Surface mapping errors in the console — this is safer than
        // relying on toast UI when toasts are disabled.
        // eslint-disable-next-line no-console
      }
    }
  }, [glances]);

  // When drafts arrive, map them into draftsData so DraftsView reads live content
  useEffect(() => {
    if (Array.isArray(drafts)) {
      try {
        // eslint-disable-next-line no-console
       
        fillPostsFromDrafts(drafts);
        setTick((t) => t + 1);
      } catch (e) {
        // eslint-disable-next-line no-console
      }
    }
  }, [drafts]);

  // Show toast when list fetch errors occur so the UI indicates fetch problems
  useEffect(() => {
    if (listError) {
      toast({
        title: "Failed to load glances",
        description: listError,
        variant: "destructive",
      });
    }
  }, [listError, toast]);

  // Helpful feedback while debugging: show a small toast when glances load
  // useEffect(() => {
  //   if (Array.isArray(glances)) {
  //     const count = glances.length;
  //     toast({
  //       title: "Glances loaded",
  //       description: `${count} item${count === 1 ? "" : "s"} for this icode`,
  //       duration: 3000,
  //     });
  //   }
  // }, [glances, toast]);

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Build share URL using the authenticated user's publication and the selected gcode.
  // Falls back to a generic /glance path when values are missing.
  const publicationName = store.getState()?.auth?.publication || "glancery";
  const shareUrl = sharedGcode
    ? `${window.location.origin}/${encodeURIComponent(publicationName)}/${encodeURIComponent(
        sharedGcode
      )}`
    : `${window.location.origin}/glance`;

  const handleGlancesTabClick = () => {
    // Single-click always activates the Glances tab. Disable the
    // previous double-tap dev shortcut that toggled the empty state.
    setActiveTab("glances");
  };

  const handleShare = (title: string, gcode?: string) => {
    setShareTitle(title);
    setShareOpen(true);
    // Only update sharedGcode if it changed — the effect below will call sendStats
    try {
      if (gcode && gcode !== sharedGcode) {
        setSharedGcode(gcode);
      }
    } catch (e) {
      // ignore
    }
  };

  // Call sendStats to increment shares only when the selected gcode changes.
  useEffect(() => {
    if (!sharedGcode) return;
    (async () => {
      try {
        await sendStats({ gcode: sharedGcode, shares: 1 });
      } catch (e) {
        // ignore errors; best-effort
      }
    })();
    // only run when sharedGcode changes
  }, [sharedGcode, sendStats]);

  const handleDeleteClick = (id: string, title: string) => {
    setDeleteTarget({ id, title });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    const gcode = deleteTarget.id;
    const icode = store.getState()?.auth?.icode;

    // Inform user deletion started
    toast({
      title: "Deleting...",
      description: `Deleting "${deleteTarget.title}"`,
    });

    try {
      const res = await deleteGlance({ gcode, icode });
      if (res.success) {
        toast({
          title: "Glance deleted",
          description: `"${deleteTarget.title}" has been deleted.`,
        });
        setDeleteDialogOpen(false);
        setDeleteTarget(null);

        // Refresh the list for current icode so UI reflects deletion
        try {
          if (icode) await fetchList(icode);
          else await fetchList();
        } catch (e) {
          // fetchList will set its own error; ensure UI re-renders anyway
          // eslint-disable-next-line no-console
          console.error("Error refetching glances after delete:", e);
        }
      } else {
        toast({
          title: "Delete failed",
          description: res.message || "Failed to delete glance",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err?.message || "Network error",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied!",
      description: "The link has been copied to your clipboard.",
    });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          url: shareUrl,
        });
        setShareOpen(false);
      } catch (err) {
        // User cancelled or share failed
      }
    }
  };

  const socialLinks = [
    {
      name: "WhatsApp",
      icon: "whatsapp",
      url: `https://wa.me/?text=${encodeURIComponent(
        shareTitle + " " + shareUrl
      )}`,
      color: "bg-[#25D366]",
    },
    {
      name: "X",
      icon: "x",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareTitle
      )}&url=${encodeURIComponent(shareUrl)}`,
      color: "bg-black",
    },
    {
      name: "Facebook",
      icon: "facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}`,
      color: "bg-[#1877F2]",
    },
    {
      name: "LinkedIn",
      icon: "linkedin",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        shareUrl
      )}`,
      color: "bg-[#0A66C2]",
    },
    {
      name: "Email",
      icon: "email",
      url: `mailto:?subject=${encodeURIComponent(
        shareTitle
      )}&body=${encodeURIComponent(shareUrl)}`,
      color: "bg-muted",
    },
  ];

  return (
    <div className="relative">
      {activeTab === "glances" && (
        <GlancesView
          navigate={navigate}
          onShare={handleShare}
          onDelete={handleDeleteClick}
          // showEmptyState can be toggled by dev double-click; also treat postsData empty as empty
          isEmpty={showEmptyState || postsData.length === 0}
        />
      )}
      {activeTab === "drafts" && (
        <DraftsView
          navigate={navigate}
          // showEmptyState can be toggled by dev double-click; treat draftsData empty as empty
          isEmpty={showEmptyState || draftsData.length === 0}
        />
      )}
      {activeTab === "subscribers" && <SubscribersView />}

      {/* Bottom Tab Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around">
          <button
            onClick={handleGlancesTabClick}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === "glances"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home
              className={`w-6 h-6 ${
                activeTab === "glances" ? "stroke-[2.5]" : "stroke-[1.5]"
              }`}
            />
            <span className="text-xs font-medium">Home</span>
          </button>

          <button
            onClick={() => setActiveTab("drafts")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === "drafts"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FilePen
              className={`w-6 h-6 ${
                activeTab === "drafts" ? "stroke-[2.5]" : "stroke-[1.5]"
              }`}
            />
            <span className="text-xs font-medium">Drafts</span>
          </button>

          <button
            onClick={() => navigate("/create")}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-muted-foreground hover:text-primary transition-colors"
          >
            <PlusCircle className="w-6 h-6 stroke-[1.5]" />
            <span className="text-xs font-medium">Create</span>
          </button>

          <button
            onClick={() => setActiveTab("subscribers")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === "subscribers"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UsersRound
              className={`w-6 h-6 ${
                activeTab === "subscribers" ? "stroke-[2.5]" : "stroke-[1.5]"
              }`}
            />
            <span className="text-xs font-medium">Subscribers</span>
          </button>
        </div>
      </div>

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
                <p className="text-sm text-muted-foreground truncate max-w-full">
                  {shareUrl}
                </p>
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
                  className={`w-12 h-12 rounded-full ${social.color} flex items-center justify-center hover:opacity-80 transition-opacity`}
                  title={social.name}
                >
                  {social.icon === "whatsapp" && (
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  )}
                  {social.icon === "x" && (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  )}
                  {social.icon === "facebook" && (
                    <svg
                      className="w-6 h-6 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )}
                  {social.icon === "linkedin" && (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this glance?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.title}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
