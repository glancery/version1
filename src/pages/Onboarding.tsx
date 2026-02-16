import { useState } from "react";
import useOnboard from "@/hooks/useOnboard";
import { useNavigate } from "react-router-dom";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [publicationName, setPublicationName] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setPublication, loading: isLoading, error } = useOnboard();

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
  };

  const handleContinue = () => {
    if (!publicationName.trim()) {
      toast({
        title: "Publication name required",
        description: "Please enter your publication name to continue",
        variant: "destructive",
      });
      return;
    }
    // Call the hook to persist publication (hook will update store)
    (async () => {
      try {
        const result = await setPublication(publicationName.trim());
        if (result.success) {
          if (logoPreview) {
            localStorage.setItem("publicationLogo", logoPreview);
          }
          toast({
            title: "Welcome!",
            description: "Your publication has been set up",
          });
          navigate("/");
        } else {
          toast({
            title: "Could not set publication",
            description: result.message || "Please try again",
            variant: "destructive",
          });
        }
      } catch (err) {
        toast({
          title: "Unexpected error",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    })();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <span className="font-serif text-3xl font-bold italic text-primary">glancery</span>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Set up your publication
          </h1>
          <p className="text-muted-foreground text-sm">
            Tell us about your newsletter
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Publication Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Publication Name <span className="text-destructive">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g., The Daily Digest"
              value={publicationName}
              onChange={(e) => setPublicationName(e.target.value)}
              className="h-12"
            />
          </div>

          {/* Logo Upload */}
          {/* <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Publication Logo <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            
            {logoPreview ? (
              <div className="relative w-24 h-24 rounded-lg border border-border overflow-hidden">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={removeLogo}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 5MB
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            )}
          </div> */}

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={isLoading || !publicationName.trim()}
            className="w-full h-12 text-base font-medium"
          >
            {isLoading ? "Setting up..." : "Continue"}
          </Button>

          {/* Skip Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
