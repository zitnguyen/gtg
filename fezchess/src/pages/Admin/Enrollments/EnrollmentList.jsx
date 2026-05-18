import React, { useState, useEffect, useRef } from 'react';
import { Plus, Download, Search, ChevronLeft, ChevronRight, Edit, Trash2, RotateCw, DollarSign, Calendar, BookOpen, User, MoreVertical, CheckCircle, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import enrollmentService from '../../../services/enrollmentService';
import financeService from '../../../services/financeService';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import useUndoDelete from '../../../hooks/useUndoDelete';
import { useTheme } from '../../../context/ThemeContext';

const EnrollmentList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [enrollments, setEnrollments] = useState([]);
    const [filteredEnrollments, setFilteredEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [highlightedRowId, setHighlightedRowId] = useState(null);
    const { scheduleUndoDelete } = useUndoDelete();
    const { isDark } = useTheme();
    const lastToastKeyRef = useRef('');
    
    // State for delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const getStudentDisplayName = (student) => {
        if (!student) return "Deleted Student";
        if (student.isDeleted) return "Deleted Student";
        return student.fullName || "Deleted Student";
    };

    // Fetch enrollments
    useEffect(() => {
        fetchEnrollments();
    }, []);

    // Apply filters
    useEffect(() => {
        applyFilters();
    }, [enrollments, searchTerm]);

    useEffect(() => {
        const updatedId = location.state?.updatedEnrollmentId;
        if (!updatedId) return;
        const toastKey = `enrollment-updated-${updatedId}-${location.state?.updatedAt || ''}`;
        if (lastToastKeyRef.current === toastKey) return;
        lastToastKeyRef.current = toastKey;
        setHighlightedRowId(updatedId);
        toast.success("✔ Cập nhật thành công", {
            id: toastKey,
            icon: <CheckCircle2 size={16} />,
        });
        navigate(location.pathname, { replace: true, state: {} });
        const timeout = setTimeout(() => setHighlightedRowId(null), 2500);
        return () => clearTimeout(timeout);
    }, [location.state?.updatedEnrollmentId, location.state?.updatedAt, location.pathname, navigate]);

    const fetchEnrollments = async () => {
        try {
            setLoading(true);
            const response = await enrollmentService.getAll();
            setEnrollments(response || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchEnrollments();
        setIsRefreshing(false);
    };

    const applyFilters = () => {
        let filtered = enrollments.filter(item => {
            const term = searchTerm.toLowerCase();
            const studentName = getStudentDisplayName(item.studentId).toLowerCase();
            const className = item.classId?.className?.toLowerCase() || '';
            return studentName.includes(term) || className.includes(term);
        });
        setFilteredEnrollments(filtered);
        setCurrentPage(1);
    };

    const handleDelete = async (id) => {
        const deletingEnrollment = enrollments.find((e) => e._id === id);
        if (!deletingEnrollment) return;
        setDeleteConfirm(null);
        scheduleUndoDelete({
            id,
            item: deletingEnrollment,
            removeOptimistic: () => setEnrollments((prev) => prev.filter((e) => e._id !== id)),
            restoreOptimistic: (enrollment) => setEnrollments((prev) => [enrollment, ...prev]),
            commitDelete: () => enrollmentService.delete(id),
            pendingMessage: "Đã xóa ghi danh — Hoàn tác?",
            successMessage: "✔ Xóa ghi danh thành công",
            errorMessage: "Lỗi khi xóa bản ghi",
        });
    };

    const handlePayment = async (enrollmentId) => {
        try {
            await financeService.payTuition(enrollmentId);
            // Refresh list
            fetchEnrollments();
            setHighlightedRowId(enrollmentId);
            toast.success("✔ Đã thanh toán thành công", { icon: <CheckCircle2 size={16} /> });
            setTimeout(() => setHighlightedRowId(null), 2500);
        } catch (err) {
            console.error("Error paying tuition", err);
            toast.error("Lỗi khi thanh toán: " + (err?.response?.data?.message || err.message));
        }
    };

    const handleEdit = (id) => {
        navigate(`/enrollments/${id}/edit`);
    };

    const handleExportExcel = () => {
        // Simple CSV export
        const headers = ['Học viên', 'Lớp', 'Ngày đăng ký', 'Học phí', 'Trạng thái'];
        const rows = filteredEnrollments.map(e => [
            getStudentDisplayName(e.studentId),
            e.classId?.className || 'N/A',
            e.enrollmentDate ? new Date(e.enrollmentDate).toLocaleDateString('vi-VN') : 'N/A',
            e.feeAmount || 0,
            e.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'
        ]);
        
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `enrollments_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredEnrollments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredEnrollments.length / itemsPerPage);

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                     <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="text-primary" size={28} />
                        Danh Sách Ghi Danh
                    </h1>
                     <p className="text-sm text-gray-500 mt-1">Quản lý việc đăng ký lớp học và đóng học phí của học viên.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                     <button 
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all text-sm font-medium shadow-sm"
                    >
                        <RotateCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Cập nhật</span>
                    </button>
                    <button 
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all text-sm font-medium shadow-sm"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">Xuất Excel</span>
                    </button>
                    <button 
                        onClick={() => navigate('/enrollments/new')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all text-sm font-medium" 
                    >
                        <Plus size={18} />
                        <span>Ghi danh mới</span>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                 <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input 
                    type="text" 
                    placeholder="Tìm kiếm theo tên học viên, tên lớp..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none shadow-sm transition-all"
                 />
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <tbody>
                                <TableSkeleton rows={7} cols={6} />
                            </tbody>
                        </table>
                    </div>
                ) : filteredEnrollments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-gray-50/50">
                        <BookOpen size={48} className="text-gray-300 mb-4" />
                        <span className="font-medium text-gray-600">Chưa có bản ghi nào</span>
                        <span className="text-sm mt-1">Bấm "Ghi danh mới" để tạo bản ghi đầu tiên.</span>
                    </div>
                ) : (
                    <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Học Viên</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lớp Đăng Ký</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày Ghi Danh</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Học Phí</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng Thái</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Hành Động</th>
                                </tr>
                            </thead>
                            <tbody className="bg-background divide-y divide-border">
                                {currentItems.map((item) => (
                                    <motion.tr
                                        key={item._id}
                                        initial={{ opacity: 0.5, scale: 0.98 }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1,
                                            backgroundColor:
                                                highlightedRowId === item._id
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
                                            <div className="flex items-center gap-3">
                                                 <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-semibold text-sm">
                                                    {(getStudentDisplayName(item.studentId) || "D").charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {getStudentDisplayName(item.studentId)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        ID: {item.studentId?.studentId || item.studentId?._id?.slice(-6)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                <BookOpen size={16} className="text-gray-400" />
                                                <span className="font-medium">{item.classId?.className || "N/A"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Calendar size={16} className="text-gray-400" />
                                                {item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString('vi-VN') : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.feeAmount || 0)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                item.paymentStatus === 'paid' 
                                                    ? 'bg-green-100 text-green-800 border-green-200' 
                                                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                            }`}>
                                                {item.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {item.paymentStatus !== 'paid' && (
                                                    <button 
                                                        onClick={() => handlePayment(item.enrollmentId || item._id)}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Thanh toán ngay"
                                                    >
                                                        <DollarSign size={18} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleEdit(item._id)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Sửa"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <div className="relative">
                                                    <button 
                                                        onClick={() => setDeleteConfirm(deleteConfirm === item._id ? null : item._id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>

                                                    {/* Delete Confirmation Popup */}
                                                    {deleteConfirm === item._id && (
                                                        <div className="absolute right-0 bottom-full mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 w-48 text-left">
                                                            <div className="text-xs font-medium text-gray-700 mb-2">Xóa ghi danh này?</div>
                                                            <div className="flex gap-2 justify-end">
                                                                <button 
                                                                    onClick={() => setDeleteConfirm(null)}
                                                                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                                                                >
                                                                    Hủy
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDelete(item._id)}
                                                                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                                                >
                                                                    Xóa
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
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 bg-gray-50">
                            <div className="text-sm text-gray-500">
                                Trang <span className="font-medium text-gray-900">{currentPage}</span> / {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    className="p-2 border border-gray-300 rounded-lg bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button 
                                    className="p-2 border border-gray-300 rounded-lg bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                    </>
                )}
            </div>
        </div>
    );
};

export default EnrollmentList;
