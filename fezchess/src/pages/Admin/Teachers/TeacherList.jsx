import React, { useState, useEffect, useRef } from 'react';
import { Plus, Download, Search, ChevronDown, ChevronLeft, ChevronRight, Edit, Trash2, RotateCw, User, Mail, Phone, Award, Briefcase, GraduationCap, CheckCircle2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import teacherService from '../../../services/teacherService';
import TableSkeleton from '../../../components/ui/TableSkeleton';
import useUndoDelete from '../../../hooks/useUndoDelete';
import { useTheme } from '../../../context/ThemeContext';

const TeacherList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [teachers, setTeachers] = useState([]);
    const [filteredTeachers, setFilteredTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [highlightedRowId, setHighlightedRowId] = useState(null);
    const { scheduleUndoDelete } = useUndoDelete();
    const { isDark } = useTheme();
    const lastToastKeyRef = useRef('');

    // Fetch teachers when component mounts or when returning to this page
    useEffect(() => {
        fetchTeachers();
    }, [location.pathname]);

    // Apply filters whenever search or filter values change
    useEffect(() => {
        applyFilters();
    }, [teachers, searchTerm, filterRole]);

    useEffect(() => {
        const updatedId = location.state?.updatedTeacher?._id || location.state?.updatedTeacherId;
        if (!updatedId) return;
        const toastKey = `teacher-updated-${updatedId}-${location.state?.updatedAt || ''}`;
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
    }, [location.state?.updatedTeacher?._id, location.state?.updatedTeacherId, location.state?.updatedAt, location.pathname, navigate]);

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const data = await teacherService.getAll();
            const userList = Array.isArray(data) ? data : (data.users || []);
            setTeachers(userList);
        } catch (err) {
            console.error("Failed to fetch teachers", err);
            setError("Có lỗi xảy ra khi tải danh sách giáo viên.");
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = teachers.filter(teacher => {
            const matchSearch = searchTerm === '' || 
                (teacher.username?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (teacher.phone?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (teacher.fullName?.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchRole = filterRole === 'all' || teacher.role === filterRole;
            
            return matchSearch && matchRole;
        });

        setFilteredTeachers(filtered);
        setCurrentPage(1);
    };

    const handleDelete = async (teacherId) => {
        const deletingTeacher = teachers.find((t) => t._id === teacherId);
        if (!deletingTeacher) return;
        setDeleteConfirm(null);
        scheduleUndoDelete({
            id: teacherId,
            item: deletingTeacher,
            removeOptimistic: () => setTeachers((prev) => prev.filter((t) => t._id !== teacherId)),
            restoreOptimistic: (teacher) => setTeachers((prev) => [teacher, ...prev]),
            commitDelete: () => teacherService.delete(teacherId),
            pendingMessage: "Đã xóa giáo viên — Hoàn tác?",
            successMessage: "✔ Xóa giáo viên thành công",
            errorMessage: "Lỗi khi xóa giáo viên",
        });
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchTeachers();
        setIsRefreshing(false);
    };

    const handleExportExcel = async () => {
        try {
            const csvContent = generateCSV(filteredTeachers);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `teachers_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Error exporting data:', err);
            setError('Lỗi khi xuất dữ liệu');
        }
    };

    const generateCSV = (data) => {
        const headers = ['Username', 'Họ tên', 'Email', 'Điện thoại', 'Chuyên môn', 'Năm kinh nghiệm', 'Chứng chỉ', 'Vai trò'];
        const rows = data.map(teacher => [
            teacher.username || 'N/A',
            teacher.fullName || 'N/A',
            teacher.email || 'N/A',
            teacher.phone || 'N/A',
            teacher.specialization || 'N/A',
            teacher.experienceYears || 'N/A',
            teacher.certification || 'N/A',
            teacher.role === 'Teacher' ? 'Giáo viên' : 'Quản trị viên'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csvContent;
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTeachers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Danh Sách Giáo Viên</h1>
            <p className="text-sm text-gray-500 mt-1">Quản lý thông tin và chuyên môn của đội ngũ giáo viên</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <RotateCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                <span>Cập nhật</span>
            </button>
            <button 
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <Download size={18} />
                <span>Xuất Excel</span>
            </button>
            <button 
                onClick={() => navigate('/admin/teachers/new')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
            >
                <Plus size={18} />
                <span>Thêm Giáo Viên</span>
            </button>
        </div>
      </div>

      {/* Stats & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                 <div className="text-sm font-medium text-gray-500">Tổng số giáo viên</div>
                 <div className="text-2xl font-bold text-gray-900 mt-1">{teachers.length}</div>
                 <div className="text-xs text-green-600 mt-1 font-medium">↗ Đang hoạt động</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Briefcase size={24} />
            </div>
        </div>

        <div className="md:col-span-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center">
            <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm theo tên, mã số, số điện thoại..." 
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
            ) : filteredTeachers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    {teachers.length === 0 ? 'Chưa có giáo viên nào.' : 'Không tìm thấy giáo viên phù hợp.'}
                </div>
            ) : (
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Giáo Viên</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Chuyên Môn</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lớp Đang Dạy</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Liên Hệ</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng Thái</th>
                        <th scope="col" className="relative px-6 py-4"><span className="sr-only">Hành động</span></th>
                    </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                    {currentItems.map((teacher, index) => (
                        <motion.tr
                            key={teacher._id || teacher.id}
                            initial={{ opacity: 0.5, scale: 0.98 }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                backgroundColor:
                                    highlightedRowId === teacher._id
                                        ? (isDark ? "rgb(6 46 26)" : "rgb(240 253 244)")
                                        : (isDark ? "rgb(0 0 0)" : "rgb(255 255 255)"),
                            }}
                            transition={{ duration: 0.28, ease: "easeOut" }}
                            className="hover:bg-gray-50 transition-colors group"
                        >
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                    {teacher.avatarUrl ? (
                                        <img
                                            src={teacher.avatarUrl}
                                            alt={teacher.fullName || teacher.username}
                                            className="w-10 h-10 rounded-full object-cover border border-gray-100"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                            {(teacher.fullName || teacher.username || 'T').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-medium text-gray-900">{teacher.fullName || teacher.username}</div>
                                        <div className="text-xs text-gray-500">ID: {teacher._id?.substring(0,6) || index + 1}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5 font-medium text-gray-700">
                                        <Award size={14} className="text-amber-500" />
                                        <span>{teacher.specialization || 'Giáo viên'}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1.5 ml-0.5">
                                        <Briefcase size={12} />
                                        <span>{teacher.experienceYears ? `${teacher.experienceYears} năm kinh nghiệm` : 'GV Mới'}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                    {teacher.assignedClasses?.length || 0} lớp
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-1 text-sm">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Phone size={14} className="text-gray-400"/> {teacher.phone || '---'}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Mail size={14} className="text-gray-400"/> {teacher.email || '---'}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    teacher.role === 'Teacher' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-purple-100 text-purple-800'
                                }`}>
                                    {teacher.role === 'Teacher' ? '● Giáo viên' : '● Quản trị viên'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => navigate(`/admin/teachers/${teacher._id}/edit`)}
                                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        title="Chỉnh sửa"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <div className="relative">
                                        <button 
                                            onClick={() => setDeleteConfirm(teacher._id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Xóa"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        {deleteConfirm === teacher._id && (
                                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50">
                                                <p className="text-xs text-gray-700 mb-3 font-medium text-center">Xác nhận xóa?</p>
                                                <div className="flex gap-2 justify-center">
                                                    <button 
                                                        onClick={() => handleDelete(teacher._id)}
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
            
            {!loading && filteredTeachers.length > itemsPerPage && (
                 <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến <span className="font-medium">{Math.min(indexOfLastItem, filteredTeachers.length)}</span> trong <span className="font-medium">{filteredTeachers.length}</span> giáo viên
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

export default TeacherList;
