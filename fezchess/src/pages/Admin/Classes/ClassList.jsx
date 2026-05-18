import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Calendar, Clock, Users, Edit, Trash2, BookOpen, User, RotateCw, Filter, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import classService from '../../../services/classService';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import useUndoDelete from '../../../hooks/useUndoDelete';
import { useTheme } from '../../../context/ThemeContext';

const ClassList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [filteredClasses, setFilteredClasses] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [highlightedRowId, setHighlightedRowId] = useState(null);
    const { scheduleUndoDelete } = useUndoDelete();
    const { isDark } = useTheme();
    const lastToastKeyRef = useRef('');

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [classes, searchTerm]);

    useEffect(() => {
        const updatedId = location.state?.updatedClassId;
        if (!updatedId) return;
        const toastKey = `class-updated-${updatedId}-${location.state?.updatedAt || ''}`;
        if (lastToastKeyRef.current === toastKey) return;
        lastToastKeyRef.current = toastKey;
        setHighlightedRowId(updatedId);
        toast.success('✔ Cập nhật thành công', {
            id: toastKey,
            icon: <CheckCircle2 size={16} />,
        });
        navigate(location.pathname, { replace: true, state: {} });
        const timeout = setTimeout(() => setHighlightedRowId(null), 2500);
        return () => clearTimeout(timeout);
    }, [location.state?.updatedClassId, location.state?.updatedAt, location.pathname, navigate]);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const data = await classService.getAll();
            const classList = Array.isArray(data) ? data : (data.classes || []);
            setClasses(classList);
        } catch (err) {
            console.error("Failed to fetch classes", err);
            setError("Có lỗi xảy ra khi tải danh sách lớp học.");
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        const filtered = classes.filter(cls => 
            cls.className?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cls.teacherId?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cls.classId?.toString().includes(searchTerm)
        );
        setFilteredClasses(filtered);
    };

    const handleDelete = async (id) => {
        const deletingClass = classes.find((c) => c._id === id);
        if (!deletingClass) return;
        setDeleteConfirm(null);
        scheduleUndoDelete({
            id,
            item: deletingClass,
            removeOptimistic: () => setClasses((prev) => prev.filter((c) => c._id !== id)),
            restoreOptimistic: (classItem) => setClasses((prev) => [classItem, ...prev]),
            commitDelete: () => classService.delete(id),
            pendingMessage: "Đã xóa lớp học — Hoàn tác?",
            successMessage: "✔ Xóa lớp học thành công",
            errorMessage: "Lỗi khi xóa lớp học",
        });
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchClasses();
        setIsRefreshing(false);
    };

    const handleEdit = (id) => {
        navigate(`/classes/${id}/edit`);
    };

    const handleAdd = () => {
        navigate('/classes/new');
    };

    const getStatusInfo = (status) => {
        switch(status) {
            case 'Active': 
                return { label: 'Đang diễn ra', className: 'bg-green-100 text-green-800' };
            case 'Pending': 
                return { label: 'Sắp khai giảng', className: 'bg-yellow-100 text-yellow-800' };
            case 'Finished': 
                return { label: 'Đã kết thúc', className: 'bg-gray-100 text-gray-800' };
            default: 
                return { label: status, className: 'bg-gray-100 text-gray-800' };
        }
    };

    const getProgressColor = (current, max) => {
        if (!max) return 'bg-green-500';
        const percentage = (current / max) * 100;
        if (percentage >= 100) return 'bg-red-500'; 
        if (percentage >= 80) return 'bg-amber-500'; 
        return 'bg-green-500'; 
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredClasses.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Lớp học</h1>
            <p className="text-sm text-gray-500 mt-1">Danh sách các lớp học hiện tại, lịch dạy và thông tin giáo viên</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <RotateCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                <span>Cập nhật</span>
            </button>
            <button 
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
            >
                <Plus size={18} />
                <span>Thêm lớp học</span>
            </button>
        </div>
      </div>

      {/* Stats & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                 <div className="text-sm font-medium text-gray-500">Tổng số lớp</div>
                 <div className="text-2xl font-bold text-gray-900 mt-1">{classes.length}</div>
                 <div className="text-xs text-green-600 mt-1 font-medium">↗ Đang hoạt động</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <BookOpen size={24} />
            </div>
        </div>

        <div className="md:col-span-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center">
            <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm tên lớp, giáo viên, mã lớp..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3 bg-transparent border-none focus:ring-0 text-sm outline-none"
                />
            </div>
        </div>
      </div>

        {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">{error}</div>
        )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
             {loading ? (
                <table className="min-w-full divide-y divide-gray-200">
                    <tbody>
                        <TableSkeleton rows={6} cols={6} />
                    </tbody>
                </table>
            ) : filteredClasses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    {classes.length === 0 ? 'Chưa có lớp học nào.' : 'Không tìm thấy lớp học phù hợp.'}
                </div>
            ) : (
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên Lớp & Khóa</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Giáo Viên</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lịch Học</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sĩ Số</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng Thái</th>
                        <th scope="col" className="relative px-6 py-4"><span className="sr-only">Hành động</span></th>
                    </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                    {currentItems.map((cls, index) => (
                        <motion.tr
                            key={cls._id || cls.id}
                            initial={{ opacity: 0.5, scale: 0.98 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                backgroundColor:
                                    highlightedRowId === cls._id
                                        ? isDark
                                            ? "rgb(6 46 26)"
                                            : "rgb(240 253 244)"
                                        : isDark
                                            ? "rgb(0 0 0)"
                                            : "rgb(255 255 255)",
                            }}
                            transition={{ duration: 0.28, ease: "easeOut" }}
                            className="hover:bg-gray-50 transition-colors group"
                        >
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                    <div className="font-semibold text-gray-900">{cls.className}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 mr-2">#{cls.level || '---'}</span>
                                        ID: {cls.classId}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                        {(cls.teacherId?.username || 'T').charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{cls.teacherId?.username || 'Chưa phân công'}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1 text-sm">
                                    <div className="flex items-center gap-2 text-gray-700 font-medium">
                                        <Calendar size={14} className="text-gray-400"/>
                                        <span>{cls.startDate ? new Date(cls.startDate).toLocaleDateString('vi-VN') : '---'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                                        <Clock size={14} className="text-gray-400"/>
                                        <span>{cls.schedule || 'Chưa có lịch'}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="w-32">
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="font-semibold text-gray-700">{cls.currentStudents || 0} <span className="font-normal text-gray-400">/ {cls.maxStudents || 20}</span></span>
                                        <Users size={14} className="text-gray-400"/>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${getProgressColor(cls.currentStudents || 0, cls.maxStudents || 20)}`}
                                            style={{ width: `${Math.min(((cls.currentStudents || 0) / (cls.maxStudents || 20)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusInfo(cls.status).className}`}>
                                    ● {getStatusInfo(cls.status).label}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleEdit(cls._id)}
                                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        title="Chỉnh sửa"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <div className="relative">
                                        <button 
                                            onClick={() => setDeleteConfirm(cls._id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Xóa"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        {deleteConfirm === cls._id && (
                                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50">
                                                <p className="text-xs text-gray-700 mb-3 font-medium text-center">Xác nhận xóa?</p>
                                                <div className="flex gap-2 justify-center">
                                                    <button 
                                                        onClick={() => handleDelete(cls._id)}
                                                        className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-md hover:bg-red-700"
                                                    >
                                                        Xóa
                                                    </button>
                                                    <button 
                                                        onClick={() => setDeleteConfirm(null)}
                                                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-md hover:bg-gray-200"
                                                    >
                                                        Hủy
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
            )}
            
            {!loading && filteredClasses.length > itemsPerPage && (
                 <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến <span className="font-medium">{Math.min(indexOfLastItem, filteredClasses.length)}</span> trong <span className="font-medium">{filteredClasses.length}</span> lớp học
                    </div>
                    <div className="flex gap-2">
                        <button 
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button 
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ClassList;
