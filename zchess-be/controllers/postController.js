const Post = require("../models/Post");
const asyncHandler = require("../middleware/asyncHandler");

const normalizeImages = (images, thumbnail) => {
  const list = Array.isArray(images)
    ? images
    : typeof images === "string"
      ? images.split(",")
      : [];
  const normalized = list
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  const cleanThumbnail = String(thumbnail || "").trim();
  if (cleanThumbnail && !normalized.includes(cleanThumbnail)) {
    normalized.unshift(cleanThumbnail);
  }
  return normalized;
};

exports.getPosts = asyncHandler(async (req, res) => {
  const { category, tag, page = 1, limit = 10, status } = req.query;
  const query = {};

  // Admin/Teacher có thể truyền status=all|draft|published; mặc định public chỉ thấy published.
  const role = String(req.user?.role || "").toLowerCase();
  const canSeeDrafts = role === "admin" || role === "teacher";
  if (canSeeDrafts && status === "all") {
    // không lọc theo trạng thái
  } else if (canSeeDrafts && status === "draft") {
    query.isPublished = false;
  } else {
    query.isPublished = true;
  }

  if (category) query.category = category;
  if (tag) query.tags = tag;

  const posts = await Post.find(query)
    .populate("author", "fullName")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Post.countDocuments(query);

  res.json({
    posts,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
  });
});

exports.getPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let post;

  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    post = await Post.findById(id).populate("author", "fullName");
  } else {
    post = await Post.findOne({ slug: id }).populate("author", "fullName");
  }

  if (!post) return res.status(404).json({ message: "Post not found" });

  post.views += 1;
  await post.save();

  res.json(post);
});

exports.createPost = asyncHandler(async (req, res) => {
  const {
    title,
    slug,
    content,
    summary,
    thumbnail,
    images,
    category,
    tags,
    isPublished,
  } = req.body;

  const normalizedImages = normalizeImages(images, thumbnail);

  const post = new Post({
    title,
    slug,
    content,
    summary,
    thumbnail: String(thumbnail || normalizedImages[0] || "").trim(),
    images: normalizedImages,
    author: req.user._id,
    category,
    tags,
    isPublished: isPublished || false,
  });

  await post.save();
  res.status(201).json(post);
});

exports.updatePost = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if ("images" in payload || "thumbnail" in payload) {
    payload.images = normalizeImages(payload.images, payload.thumbnail);
    payload.thumbnail = String(payload.thumbnail || payload.images[0] || "").trim();
  }

  const post = await Post.findByIdAndUpdate(req.params.id, payload, {
    new: true,
  });
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  res.json(post);
});

exports.deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findByIdAndDelete(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }
  res.json({ message: "Post deleted" });
});
