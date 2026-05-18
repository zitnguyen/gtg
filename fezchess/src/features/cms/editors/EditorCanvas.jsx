import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import BlockRenderer from "../blocks/BlockRenderer";
import { getBlock } from "../schema/publicCmsSchema";

// Renders the active tab's blocks in order. Adding a new block to a tab is
// purely a config change in publicCmsSchema.js — no JSX edits needed here.
const EditorCanvas = memo(function EditorCanvas({ tab }) {
  const blocks = useMemo(
    () => (tab?.blocks || []).map(getBlock).filter(Boolean),
    [tab],
  );

  if (!blocks.length) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Chưa có khối nào cho tab này.
      </div>
    );
  }

  return (
    <motion.div
      key={tab.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="space-y-4"
    >
      {blocks.map((block, index) => (
        <BlockRenderer key={block.id} block={block} defaultOpen={index < 2} />
      ))}
    </motion.div>
  );
});

export default EditorCanvas;
