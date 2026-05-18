import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import postService from "../../services/postService";
import { Calendar, ArrowRight } from "lucide-react";
import { usePublicCms } from "../../context/PublicCmsContext";

const NewsSection = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { cms } = usePublicCms();
  const section = cms?.home?.news || {};
  const monoBadgeStyle = {
    backgroundColor: "#000000",
    color: "#FFFFFF",
    borderColor: "#000000",
  };
  const monoLinkStyle = {
    color: "#000000",
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await postService.getPublishedPosts({ limit: 3 });
        const data = Array.isArray(response) ? response : response.posts || [];
        setPosts(data.filter((p) => p.isPublished));
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-heading"
              style={{ color: section?.titleColor || undefined }}
            >
              {section?.title || "Tin Tức & Hoạt Động"}
            </h2>
            <p
              className="text-gray-600 max-w-2xl"
              style={{ color: section?.descriptionColor || undefined }}
            >
              {section?.description ||
                "Cập nhật những thông tin mới nhất từ câu lạc bộ."}
            </p>
          </div>
          <Link
            to="/news"
            className="hidden md:flex items-center font-bold hover:text-primary/80 transition-colors"
            style={{ color: section?.buttonTextColor || undefined }}
          >
            {section?.buttonText || "Xem tất cả"}{" "}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link
              to={`/news/${post.slug || post._id}`}
              key={post._id}
              className="group block bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
            >
              <div className="relative h-48 overflow-hidden bg-gray-100">
                {post.thumbnail ? (
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-50">
                    No Image
                  </div>
                )}
                <div
                  className="absolute top-4 left-4 backdrop-blur px-3 py-1 rounded-full text-xs font-bold shadow-sm border"
                  style={monoBadgeStyle}
                >
                  {post.category}
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center text-xs text-gray-500 mb-3">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                  {post.summary || "Xem chi tiết..."}
                </p>
                <span
                  className="inline-flex items-center text-sm font-semibold text-primary"
                  style={monoLinkStyle}
                >
                  {section?.cardButtonText || "Đọc thêm"}{" "}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link
            to="/news"
            className="inline-block px-6 py-3 font-bold rounded-lg hover:bg-gray-200 transition-colors"
            style={{
              backgroundColor: section?.buttonBgColor || undefined,
              color: section?.buttonTextColor || undefined,
            }}
          >
            {section?.mobileButtonText || "Xem tất cả tin tức"}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
