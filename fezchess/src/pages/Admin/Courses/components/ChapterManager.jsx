import React, { useState, useEffect } from 'react';
import courseService from '../../../../services/courseService';
import { Plus, GripVertical, Edit2, Trash, ChevronDown, ChevronRight, Video, FileText } from 'lucide-react';
import LessonManager from './LessonManager';

const ChapterManager = ({ courseId }) => {
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const [expandedChapter, setExpandedChapter] = useState(null);
    const [error, setError] = useState('');
    const [editingChapterId, setEditingChapterId] = useState(null);
    const [editingChapterTitle, setEditingChapterTitle] = useState('');

    useEffect(() => {
        fetchCurriculum();
    }, [courseId]);

    const fetchCurriculum = async () => {
        if (!courseId) return;
        try {
            setLoading(true);
            setError('');
            const response = await courseService.getChaptersByCourse(courseId);
            setChapters(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error("Error fetching curriculum:", error);
            setError(error?.apiMessage || error?.response?.data?.message || "Không thể tải chương trình học.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddChapter = async () => {
        if (!newChapterTitle.trim()) return;
        try {
            setError('');
            await courseService.addChapter({
                title: newChapterTitle,
                courseId: courseId
            });
            
            setNewChapterTitle('');
            setIsAdding(false);
            fetchCurriculum(); // Refresh
        } catch (error) {
            console.error("Error adding chapter:", error);
            const msg = error?.apiMessage || error?.response?.data?.message || "Lỗi thêm chương mới";
            setError(msg);
            alert(msg);
        }
    };

    const deleteChapter = async (chapterId) => {
        if (!window.confirm("Xóa chương này sẽ xóa toàn bộ bài học bên trong?")) return;
        try {
            await courseService.deleteChapter(chapterId);
            fetchCurriculum();
        } catch (error) {
            console.error(error);
            const msg = error?.apiMessage || error?.response?.data?.message || "Lỗi xóa chương";
            setError(msg);
            alert(msg);
        }
    };

    const startEditChapter = (chapter) => {
        setEditingChapterId(chapter._id);
        setEditingChapterTitle(chapter.title || '');
        setError('');
    };

    const cancelEditChapter = () => {
        setEditingChapterId(null);
        setEditingChapterTitle('');
    };

    const saveEditChapter = async () => {
        if (!editingChapterId) return;
        if (!editingChapterTitle.trim()) {
            setError('Tên chương là bắt buộc');
            return;
        }
        try {
            setError('');
            await courseService.updateChapter(editingChapterId, {
                title: editingChapterTitle.trim(),
            });
            cancelEditChapter();
            fetchCurriculum();
        } catch (error) {
            console.error(error);
            const msg = error?.apiMessage || error?.response?.data?.message || "Lỗi cập nhật tên chương";
            setError(msg);
            alert(msg);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Cấu trúc khóa học</h3>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Thêm Chương Mới
                </button>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {isAdding && (
                <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm flex gap-3 animate-in fade-in slide-in-from-top-2">
                    <input 
                        type="text" 
                        autoFocus
                        placeholder="Nhập tên chương (VD: Chương 1 - Khai cuộc)..."
                        className="flex-1 p-2 border border-gray-300 rounded focus:border-primary focus:outline-none"
                        value={newChapterTitle}
                        onChange={(e) => setNewChapterTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddChapter()}
                    />
                    <button 
                        onClick={handleAddChapter}
                        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                    >
                        Lưu
                    </button>
                    <button 
                        onClick={() => setIsAdding(false)}
                        className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded"
                    >
                        Hủy
                    </button>
                </div>
            )}

            <div className="space-y-4">
                {chapters.map((chapter, index) => (
                    <div key={chapter._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        {/* Chapter Header */}
                        <div className="bg-gray-50 p-4 flex items-center justify-between group">
                            <div className="flex items-center gap-3 flex-1">
                                <div
                                    className="flex items-center gap-3 cursor-pointer select-none"
                                    onClick={() => setExpandedChapter(expandedChapter === chapter._id ? null : chapter._id)}
                                >
                                    <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                                    {expandedChapter === chapter._id ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                                </div>
                                {editingChapterId === chapter._id ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <input
                                            autoFocus
                                            type="text"
                                            className="flex-1 p-2 border border-gray-300 rounded focus:border-primary focus:outline-none text-sm"
                                            value={editingChapterTitle}
                                            onChange={(e) => setEditingChapterTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveEditChapter();
                                                if (e.key === 'Escape') cancelEditChapter();
                                            }}
                                        />
                                        <button
                                            onClick={saveEditChapter}
                                            className="px-3 py-1.5 bg-primary text-white rounded text-sm hover:bg-primary/90"
                                        >
                                            Lưu
                                        </button>
                                        <button
                                            onClick={cancelEditChapter}
                                            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                ) : (
                                    <h4
                                        className="font-bold text-gray-800 text-lg cursor-pointer"
                                        onClick={() => setExpandedChapter(expandedChapter === chapter._id ? null : chapter._id)}
                                    >
                                        {chapter.title}
                                        <span className="text-xs text-gray-400 font-normal ml-3">({chapter.lessons?.length || 0} bài học)</span>
                                    </h4>
                                )}
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => startEditChapter(chapter)}
                                    className="p-2 text-gray-500 hover:text-blue-600 rounded hover:bg-blue-50"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => deleteChapter(chapter._id)}
                                    className="p-2 text-gray-500 hover:text-red-600 rounded hover:bg-red-50"
                                >
                                    <Trash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Lessons List (Expanded) */}
                        {expandedChapter === chapter._id && (
                            <div className="p-4 border-t border-gray-100 bg-white">
                                <LessonManager 
                                    chapterId={chapter._id} 
                                    courseId={courseId}
                                    lessons={chapter.lessons || []}
                                    onUpdate={fetchCurriculum}
                                />
                            </div>
                        )}
                    </div>
                ))}

                {chapters.length === 0 && !loading && !isAdding && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-500">
                        Chưa có chương nào. Hãy thêm chương mới để bắt đầu.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChapterManager;
