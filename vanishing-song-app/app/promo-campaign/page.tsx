import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import PromoTabs from "@/components/PromoTabs";
import { getSocialPosts } from "@/lib/sheets";

export const revalidate = 300; // 5 min ISR — reflects sheet edits without a redeploy

export default async function PromoCampaignPage() {
  const posts = await getSocialPosts();

  return (
    <div className="page">
      <Masthead />

      <div className="page-head">
        <div>
          <h2>Promo Campaign</h2>
          <div className="page-caption">
            Multi-channel social strategy. Each tab pulls from the Social Media Campaign sheet,
            filtered to that channel.
          </div>
        </div>
      </div>

      <PromoTabs posts={posts} />

      <Footer />
    </div>
  );
}
