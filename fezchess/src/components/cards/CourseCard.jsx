import { motion } from "framer-motion";
import { ClockIcon, UserGroupIcon, StarIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../../context/ThemeContext";

const CourseCard = ({
  title,
  description,
  image,
  level,
  duration,
  students,
  rating,
  price,
  buttonText = "Xem chi tiết",
  buttonBgColor,
  buttonTextColor,
  buttonBorderColor,
}) => {
  const { isDark } = useTheme();
  const monoBadgeStyle = {
    backgroundColor: isDark ? "#FFFFFF" : "#000000",
    color: isDark ? "#000000" : "#FFFFFF",
  };
  const monoButtonStyle = {
    backgroundColor: isDark ? "#FFFFFF" : "#000000",
    color: isDark ? "#000000" : "#FFFFFF",
    border: `1px solid ${isDark ? "#FFFFFF" : "#000000"}`,
  };

  return (
    <motion.div
      transition={{ duration: 0.3 }}
      className="bg-card w-full cursor-pointer rounded-xl border border-border overflow-hidden shadow-sm"
    >
      {/* Image */}
      <div className="relative overflow-hidden h-44">
        <motion.img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <span
            className="px-2.5 py-1 text-[11px] font-medium rounded-full"
            style={monoBadgeStyle}
          >
            {level}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display text-base font-semibold mb-1.5 text-foreground line-clamp-2">
          {title}
        </h3>
        <p className="text-muted-foreground text-xs mb-3 line-clamp-2">
          {description}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <ClockIcon className="w-4 h-4" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <UserGroupIcon className="w-4 h-4" />
            <span>{students} học viên</span>
          </div>
          <div className="flex items-center gap-1">
            <StarIcon className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span>{rating}</span>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <span className="text-lg font-bold text-foreground">{price}</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded-lg font-medium"
            style={{
              ...monoButtonStyle,
              ...(buttonBgColor ? { backgroundColor: buttonBgColor } : {}),
              ...(buttonTextColor ? { color: buttonTextColor } : {}),
              ...(buttonBorderColor
                ? { border: `1px solid ${buttonBorderColor}` }
                : {}),
            }}
          >
            {buttonText}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;
