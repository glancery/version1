import { useEffect } from "react";
import { useParams } from "react-router-dom";
import useSubscriber from "@/hooks/useSubscriber";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Subscribed = () => {
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
  const { gcode, email, publisher } = useParams<{
    gcode: string;
    email: string;
    publisher?: string;
  }>();
  const { sendStats, success, error } = useSubscriber();

  useEffect(() => {
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
  }, [publisher]);

  useEffect(() => {
    if (gcode && email) {
      sendStats({ gcode, emailid: email });
    }
  }, [gcode, email, sendStats]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-3">
          {success ? "You're Subscribed!" : "Subscription Failed"}
        </h1>

        <p className="text-muted-foreground text-sm sm:text-base mb-6">
          {success
            ? `Thank you for subscribing to ${publisher || "our publication"}. You'll now receive the latest glances directly in your inbox.`
            : error || "An error occurred while processing your subscription."}
        </p>

        <Link to={`/${publisher}/${gcode}`}>
          <Button className="w-full sm:w-auto">View Glance</Button>
        </Link>
      </div>
    </div>
  );
};

export default Subscribed;
