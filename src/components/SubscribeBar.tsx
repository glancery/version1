import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const SubscribeBar = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast({
        title: "Subscribed!",
        description: "Thank you for subscribing to our newsletter.",
      });
      setEmail("");
    }
  };

  return (
    <div className="subscribe-bar py-3 sm:py-4">
      <div className="container max-w-4xl mx-auto px-4 sm:px-6">
        <p className="text-xs sm:text-sm text-muted-foreground mb-2 text-center md:text-left">
          Subscribe to get the latest updates
        </p>
        <form onSubmit={handleSubscribe} className="flex gap-3">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-secondary border-border focus-visible:ring-primary h-10 text-sm"
            required
          />
          <Button type="submit" className="btn-primary whitespace-nowrap h-10 px-4 sm:px-5 text-sm">
            Subscribe
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SubscribeBar;
