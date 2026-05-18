import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import postService from "../../services/postService";
import { ArrowRight, Clock3 } from "lucide-react";
import { usePublicCms } from "../../context/PublicCmsContext";
import ScrollReveal from "../../components/common/ScrollReveal";

const NewsPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { cms } = usePublicCms();
  const page = cms?.newsPage || {};
  const PAGE_SIZE = 6;

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await postService.getPublishedPosts({ limit: 20 });
        const data = Array.isArray(response) ? response : response.posts || [];
        setPosts(data.filter((p) => p.isPublished));
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const categories = [
    { key: "all", label: "Tất cả" },
    { key: "tournaments", label: "Giải đấu" },
    { key: "tips", label: "Mẹo cờ vua" },
    { key: "school", label: "Chương trình học" },
    { key: "interviews", label: "Phỏng vấn" },
  ];

  const featuredPost = posts[0] || null;
  const listPosts = posts.slice(1);

  const filteredPosts = useMemo(() => {
    if (activeTab === "all") return listPosts;
    const keywords = {
      tournaments: ["giải", "tournament", "cup", "champion"],
      tips: ["mẹo", "tips", "chiến thuật", "tactics"],
      school: ["lớp", "khóa", "school", "chương trình"],
      interviews: ["phỏng vấn", "interview", "chia sẻ"],
    };
    const needle = keywords[activeTab] || [];
    return listPosts.filter((post) => {
      const hay =
        `${post.title || ""} ${post.summary || ""} ${post.category || ""}`.toLowerCase();
      return needle.some((key) => hay.includes(key));
    });
  }, [listPosts, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, posts.length]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPosts.slice(start, start + PAGE_SIZE);
  }, [filteredPosts, currentPage]);

  return (
    <div
      className="min-h-screen bg-[#f5f5f5] pb-16"
      style={{
        fontFamily:
          page?.fontFamily && page.fontFamily !== "inherit"
            ? page.fontFamily
            : undefined,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 md:pt-10">
        <ScrollReveal>
          <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-blue-600 text-white mb-4">
            Tin tức mới
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-black leading-tight mb-3">
            {page?.title || "Tin tức cờ vua"}
          </h1>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mb-6">
            {page?.description ||
              "Cập nhật giải đấu, kiến thức thực chiến và hoạt động mới nhất từ cộng đồng Z Chess."}
          </p>
        </ScrollReveal>

        {loading ? (
          <div className="text-center py-16 text-gray-500">
            Đang tải tin tức...
          </div>
        ) : featuredPost ? (
          <>
            <Link
              to={`/news/${featuredPost.slug || featuredPost._id}`}
              className="group block rounded-xl overflow-hidden border border-gray-200 bg-black relative mb-6 hover:shadow-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10 z-10" />
              <img
                src={
                  featuredPost.thumbnail ||
                  (Array.isArray(featuredPost.images)
                    ? featuredPost.images[0]
                    : "") ||
                  "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=1200&q=80"
                }
                alt={featuredPost.title}
                className="w-full h-[320px] md:h-[380px] object-cover group-hover:scale-[1.015] transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 z-20 p-5 md:p-7 text-white">
                <div className="text-[11px] uppercase tracking-wide font-semibold mb-2">
                  {featuredPost.category || "Nổi bật"} •{" "}
                  {new Date(featuredPost.createdAt).toLocaleDateString("vi-VN")}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 line-clamp-2">
                  {featuredPost.title}
                </h2>
                <p className="text-sm text-white/85 max-w-2xl line-clamp-2 mb-4">
                  {featuredPost.summary || "Nhấn để đọc toàn bộ bài viết."}
                </p>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-amber-300 to-yellow-300 text-black text-sm font-semibold">
                  Đọc bài viết
                  <ArrowRight size={15} />
                </span>
              </div>
            </Link>

            <ScrollReveal className="flex flex-wrap gap-2.5 mb-6">
              {categories.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-300 active:scale-[0.98] ${
                    activeTab === tab.key
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </ScrollReveal>

            {paginatedPosts.length > 0 ? (
              <ScrollReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {paginatedPosts.map((post) => (
                  <Link
                    key={post._id}
                    to={`/news/${post.slug || post._id}`}
                    className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 transition-all duration-300"
                  >
                    <div className="h-40 bg-gray-200">
                      <img
                        src={
                          post.thumbnail ||
                          (Array.isArray(post.images) ? post.images[0] : "") ||
                          "https://images.unsplash.com/photo-1560174038-da43ac74f01b?w=800&q=80"
                        }
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-2">
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2 leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3 min-h-[32px]">
                        {post.summary ||
                          "Nhấn để xem chi tiết nội dung bài viết."}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 size={13} /> 4 phút đọc
                        </span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </Link>
                ))}
              </ScrollReveal>
            ) : (
              <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-200">
                Không có bài viết phù hợp với danh mục này.
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                      pageNum === currentPage
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:border-blue-400"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500 text-lg">
              Chưa có tin tức nào được đăng tải.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;
