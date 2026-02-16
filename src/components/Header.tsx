import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Settings, X, Camera } from "lucide-react";
// using public/glancery.png via absolute path
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import store from "@/redux/store";
import useOnboard from "@/hooks/useOnboard";
import { useToast } from "@/hooks/use-toast";
import { setAuthUser, setEmail, setPublication, setExist, setUsername } from "@/redux/authSlice";

import { useState as useLocalState } from "react";

interface HeaderProps {
  showProfile?: boolean;
}

const Header = ({ showProfile = false }: HeaderProps) => {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [publicationName, setPublicationName] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [email, setLocalEmail] = useState("");
  const { toast } = useToast();
  const [editing, setEditing] = useLocalState(false);

  useEffect(() => {
    // Load profile data from Redux store when available, fallback to localStorage
    const loadFromStore = () => {
      // `auth` shape comes from the Redux slice; cast to any to satisfy TS here
      const auth = (store?.getState?.()?.auth as any) || {};
      const savedName = auth.publication || localStorage.getItem("publicationName") || "";
      const savedLogo = localStorage.getItem("publicationLogo") || null;
  const savedEmail = auth.email || localStorage.getItem("userEmail") || "";
  setPublicationName(savedName);
  setLogoPreview(savedLogo);
  setLocalEmail(savedEmail);
    };

    loadFromStore();
    const unsubscribe = store.subscribe(loadFromStore);
    return () => unsubscribe();
  }, [profileOpen]);

  const handleLogout = () => {
    try {
      // Clear redux auth state
      store.dispatch(setAuthUser(null));
      store.dispatch(setEmail(null));
      store.dispatch(setPublication(null));
      store.dispatch(setExist(false));
      store.dispatch(setUsername(null));

      // NOTE: do not clear cookies here (preserve user's cookies per request)
    } catch (err) {
      // best-effort; continue to navigate to auth
    }

    navigate("/auth");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
  };

  const { setPublication: onboardSetPublication, loading: isSaving } = useOnboard();

  const handleToggleEdit = async () => {
    if (!editing) {
      // enter edit mode
      setEditing(true);
      return;
    }

    // leaving edit mode: persist changes
    if (!publicationName.trim()) {
      toast({ title: "Publication name required", description: "Please enter a publication name.", variant: "destructive" });
      return;
    }

    try {
      // persist locally
      localStorage.setItem("publicationName", publicationName.trim());
      if (logoPreview) {
        localStorage.setItem("publicationLogo", logoPreview);
      } else {
        localStorage.removeItem("publicationLogo");
      }

  const res = await onboardSetPublication(publicationName.trim());
      if (res.success) {
        toast({ title: "Saved", description: "Profile updated" });
        setEditing(false);
        setProfileOpen(false);
      } else {
        toast({ title: "Unable to save", description: res.message || "Please try again", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Could not save profile", variant: "destructive" });
    }
  };

  return (
    <>
      <header className={`w-full ${showProfile ? 'px-4 pt-4' : ''}`}>
        <div className={`${showProfile ? 'bg-white shadow-sm border border-border rounded-2xl max-w-6xl mx-auto px-4 sm:px-6 py-3' : 'container max-w-4xl mx-auto px-3 sm:px-4 pt-3 pb-2 sm:pt-4 sm:pb-3'} flex items-center justify-between`}>
          {showProfile ? (
            <img
              src="/glancery.png"
              alt="Glancery"
              className="h-8 sm:h-10 md:h-12 object-contain"
            />
          ) : (
            <>
              <div className="w-10" />
              <img
                src="/glancery.png"
                alt="Glancery"
                className="h-10 sm:h-12 md:h-14 object-contain"
              />
            </>
          )}
          {showProfile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <User className="w-5 h-5 text-primary" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-white z-50">
                <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="w-10" /> 
          )}
        </div>
      </header>

      {/* Profile Edit Sheet */}
      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit Profile</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {/* Email (uneditable) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>

            {/* Publication Name */}
            <div className="space-y-2">
              <Label htmlFor="publicationName" className="text-sm font-medium text-foreground">
                Publication Name
              </Label>
              <Input
                id="publicationName"
                type="text"
                value={publicationName}
                onChange={(e) => setPublicationName(e.target.value)}
                placeholder="Enter your publication name"
                disabled={!editing}
              />
            </div>

            {/* Logo Upload */}
            {/* <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Logo <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              
              {logoPreview ? (
                <div className="relative w-24 h-24">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/90 transition-colors"
                    aria-label="Remove logo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
                  <Camera className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div> */}

            {/* Save Button */}
            <Button
              onClick={handleToggleEdit}
              className="w-full"
              disabled={editing ? (!publicationName.trim() || isSaving) : false}
            >
              {editing ? (isSaving ? "Saving..." : "Done") : "Edit"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Header;
