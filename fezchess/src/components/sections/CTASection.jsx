import { motion } from "framer-motion";
import ScrollReveal from "../common/ScrollReveal";
import { Link } from "react-router-dom";
import { usePublicCms } from "../../context/PublicCmsContext";

const CTASection = () => {
  const { cms } = usePublicCms();
  const section = cms?.home?.cta || {};
  const isHexColor = (value) =>
    typeof value === "string" &&
    /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
  const secondaryButtonLabel = isHexColor(section?.secondaryButtonText)
    ? "Tìm hiểu thêm"
    : section?.secondaryButtonText || "Tìm hiểu thêm";

  return (
    <section className="py-12 md:py-14 bg-white">
      <div className="container mx-auto px-4">
        <ScrollReveal>
          <div
            className="relative overflow-hidden rounded-2xl p-6 md:p-9"
            style={{
              backgroundColor: "#dbeafe",
            }}
          >
            {/* Background decorations */}
            <div className="absolute top-0 right-0 text-[200px] opacity-5 select-none leading-none">
              ♔
            </div>
            <div className="absolute bottom-0 left-0 text-[150px] opacity-5 select-none leading-none">
              ♟
            </div>

            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-display text-[30px] md:text-4xl font-bold text-black mb-3"
              >
                {section?.title || "Sẵn sàng để con tỏa sáng?"}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-sm text-black/75 mb-6"
              >
                {section?.description ||
                  "Đăng ký tư vấn miễn phí để lựa chọn lộ trình phù hợp nhất cho bé."}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row gap-2.5 justify-center"
              >
                <Link to="/contact">
                  <motion.button
                    animate={{
                      boxShadow: [
                        "0 4px 14px rgba(37,99,235,0.22)",
                        "0 6px 18px rgba(37,99,235,0.3)",
                        "0 4px 14px rgba(37,99,235,0.22)",
                      ],
                    }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm md:text-base px-6 py-3 rounded-lg font-semibold transition-all shadow-sm hover:shadow-md hover:from-blue-700 hover:to-indigo-700"
                    style={{
                      backgroundColor: section?.primaryButtonBgColor || "#000000",
                      color: section?.primaryButtonTextColor || "#ffffff",
                    }}
                  >
                    {section?.primaryButtonText || "Đăng ký học thử"}
                  </motion.button>
                </Link>
                <Link to="/courses">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-white border border-indigo-200 text-indigo-700 rounded-lg font-medium transition-colors duration-300 hover:bg-indigo-50"
                    style={{
                      color: section?.secondaryButtonTextColor || "#111111",
                      borderColor: section?.secondaryButtonBorderColor || "#e5e7eb",
                    }}
                  >
                    {secondaryButtonLabel}
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default CTASection;
