import courseService from "../../../services/courseService";
import chessExerciseService from "../../../services/chessExerciseService";

const learningService = {
  getLesson: (lessonId) => courseService.getLessonById(lessonId),
  getNextLesson: (lessonId) => courseService.getNextLesson(lessonId),
  getPrevLesson: (lessonId) => courseService.getPrevLesson(lessonId),
  getChessProgress: (lessonId) =>
    courseService.getMyLessonChessProgress(lessonId),
  saveChessProgress: (lessonId, payload) =>
    courseService.saveMyLessonChessProgress(lessonId, payload),
  getLessonExercises: (lessonId) =>
    chessExerciseService.getLessonExercises(lessonId),
  submitExerciseAnswer: (exerciseId, payload) =>
    chessExerciseService.submitAnswer(exerciseId, payload),
  getExerciseHint: (exerciseId, level) =>
    chessExerciseService.getHint(exerciseId, level),
};

export default learningService;
