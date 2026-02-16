import { useEffect, useState } from "react";
import Header from "@/components/Header";
import PostCard from "@/components/PostCard";
import FAQSection from "@/components/FAQSection";
import store from "@/redux/store";
import { postsData } from "@/data/postsData";

const Index = () => {
  const [publication, setPublication] = useState<string | null>(
    store?.getState?.()?.auth?.publication ?? null
  );

  useEffect(() => {
    const update = () => setPublication(store?.getState?.()?.auth?.publication ?? null);
    const unsub = store.subscribe(update);
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-8 sm:pb-12">
      {/* If publication exists and is not the default 'Glancery', show it specially */}
      {publication && String(publication).trim() && String(publication).trim().toLowerCase() !== "glancery" ? (
        <div className="w-full text-center py-6">
          <span className="font-serif italic font-bold text-2xl sm:text-4xl text-purple-600">{publication}</span>
        </div>
      ) : (
        <Header />
      )}
      
      <main className="container max-w-6xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-5 sm:pb-6">
        {postsData.map((post, index) => (
          <div key={post.id} className="mb-6 sm:mb-8">
            <div 
              className="animate-fade-in lg:grid lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_384px] lg:gap-6 lg:items-center" 
              style={{ animationDelay: `${index * 0.15}s`, opacity: 0 }}
            >
              {/* Main Post */}
              <div>
                <PostCard
                  image={post.image}
                  title={post.title}
                  description={post.description}
                />
              </div>

              {/* FAQ Section - Right side on desktop, vertically centered, height capped to post */}
              <div className="mt-4 lg:mt-0 lg:max-h-full lg:overflow-y-auto scrollbar-thin">
                <FAQSection faqs={post.faqs} />
              </div>
            </div>
          </div>
        ))}
      </main>

    </div>
  );
};

export default Index;
