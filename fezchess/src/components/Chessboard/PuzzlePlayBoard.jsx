import React, { useMemo } from "react";
import { Chessboard } from "react-chessboard";

const PuzzlePlayBoard = ({ game, onPieceDrop, orientation = "white" }) => {
  const options = useMemo(
    () => ({
      id: "student-puzzle-board",
      position: game.fen(),
      onPieceDrop,
      boardOrientation: orientation,
      animationDurationInMs: 180,
      boardStyle: { width: "100%", maxWidth: "560px" },
    }),
    [game, onPieceDrop, orientation],
  );

  return <Chessboard options={options} />;
};

export default PuzzlePlayBoard;
