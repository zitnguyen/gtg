import { motion } from "framer-motion";
import React from "react";
import ScrollReveal from "../common/ScrollReveal";
import { StarIcon } from "@heroicons/react/24/solid";
import testimonialService from "../../services/testimonialService";
import { usePublicCms } from "../../context/PublicCmsContext";

const testimonials = [
  {
    id: 1,
    name: "Chị Nguyễn Thị Hoa",
    role: "Phụ huynh bé Minh Anh",
    content:
      "Con tôi đã học ở Z Chess được 1 năm. Tôi thấy con tiến bộ rõ rệt không chỉ trong cờ vua mà còn trong học tập ở trường. Con tập trung hơn và tư duy tốt hơn nhiều.",
    image:
      "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop&crop=face",
    rating: 5,
  },
  {
    id: 2,
    name: "Anh Trần Văn Đức",
    role: "Phụ huynh bé Gia Bảo",
    content:
      "Giáo viên rất tận tâm và yêu trẻ. Con tôi rất thích đến lớp và háo hức mỗi khi có buổi học. Môi trường học tập rất chuyên nghiệp.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    rating: 5,
  },
  {
    id: 3,
    name: "Chị Lê Thu Trang",
    role: "Phụ huynh bé Hải Đăng",
    content:
      "Con trai tôi từng rất hiếu động và khó tập trung. Sau khi học cờ vua ở Z Chess, con đã kiên nhẫn hơn rất nhiều. Cảm ơn các thầy cô!",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    rating: 5,
  },
];

const TestimonialSection = () => {
  const [items, setItems] = React.useState(testimonials);
  const { cms } = usePublicCms();
  const section = cms?.home?.testimonials || {};

  React.useEffect(() => {
    let mounted = true;
    const fetchItems = async () => {
      try {
        const data = await testimonialService.getPublic();
        if (!mounted) return;
        setItems(Array.isArray(data) && data.length > 0 ? data : testimonials);
      } catch {
        if (mounted) setItems(testimonials);
      }
    };
    fetchItems();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="py-12 md:py-14 bg-white">
      <div className="container mx-auto px-4">
        <ScrollReveal className="text-center mb-7 md:mb-9">
          <h2
            className="font-display text-[28px] md:text-3xl font-bold text-foreground mb-1.5"
          >
            {section?.title || "Phụ huynh nói gì về chúng tôi"}
          </h2>
          <div className="flex justify-center items-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
            ))}
          </div>
          <p
            className="text-muted-foreground max-w-2xl mx-auto text-sm"
          >
            {section?.description ||
              "Sự tin tưởng và hài lòng của phụ huynh là động lực để chúng tôi không ngừng hoàn thiện."}
          </p>
        </ScrollReveal>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {items.map((testimonial, index) => (
            <ScrollReveal key={testimonial._id || testimonial.id} delay={index * 0.1}>
              <motion.div
                whileHover={{ y: -5 }}
                className="bg-[#fafafa] p-4 rounded-xl border border-[#ececec] shadow-sm"
              >
                {/* Rating */}
                <div className="flex gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-foreground mb-4 leading-relaxed text-sm">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=100&h=100&fit=crop&crop=face";
                    }}
                  />
                  <div>
                    <div className="font-semibold text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
