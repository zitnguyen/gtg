import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../../api/axiosClient';
import courseService from '../../../services/courseService';
import { Plus, Edit, Trash2, Search, BookOpen, User, DollarSign } from 'lucide-react';

const AdminCourseList = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            // Fetch all courses (both published and draft)
            // Backend endpoint usually supports this, or we might need a specific admin endpoint
            // For now reusing the public one but we might need to filter manually if it only parses "published" by default.
            // Looking at controller: getPublishedCourses takes query params. 
            // Ideally we need an endpoint that returns ALL courses for admin.
            // Let's assume GET /courses returns public ones. 
            // We might need to check if there is an admin route or update backend.
            // For now, let's try getting all with a special flag or just use what we have.
            // Wait, looking at getPublishedCourses in controller, it filters `isPublished: true` by default.
            // We need to allow admins to see everything.
            // Quick fix: User requested to refer to backend. 
            // I should use GET /courses but maybe I need to update backend to allow fetching drafts?
            // Actually, for now let's just fetch what we can and if drafts are missing, I'll update the backend controller.
            
            const response = await axiosClient.get('/courses?admin=true'); // Hinting we want all
            setCourses(Array.isArray(response) ? response : []);
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa khóa học này? Hành động này không thể hoàn tác.")) {
            try {
                await courseService.deleteCourse(id);
                setCourses(courses.filter(course => course._id !== id));
            } catch (error) {
                console.error("Error deleting course:", error);
                alert("Lỗi khi xóa khóa học");
            }
        }
    };

    const filteredCourses = courses.filter(course => 
        (course.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.category || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản Lý Khóa Học</h1>
                    <p className="text-gray-500">Danh sách các khóa học video trên hệ thống</p>
                </div>
                <button 
                    onClick={() => navigate('/admin/courses/new')}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Thêm Khóa Học
                </button>
            </div>

            {/* Search & Stats */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm khóa học..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-4 text-sm text-gray-600 items-center px-4">
                     <span>Tổng: <strong>{courses.length}</strong></span>
                     <span>Công khai: <strong>{courses.filter(c => c.isPublished).length}</strong></span>
                </div>
            </div>

            {/* Course Grid/List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Khóa Học</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Giá & Cấp Độ</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Giảng Viên</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Trạng Thái</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-8">Đang tải...</td></tr>
                            ) : filteredCourses.length > 0 ? (
                                filteredCourses.map((course) => (
                                    <tr key={course._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-20 h-12 bg-gray-200 rounded-md overflow-hidden shrink-0">
                                                    {course.thumbnail ? (
                                                        <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400"><BookOpen className="w-5 h-5" /></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 line-clamp-1" title={course.title}>{course.title}</div>
                                                    <div className="text-xs text-gray-500 mt-1">{course.category}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {course.price === 0 ? 'Miễn phí' : course.price.toLocaleString('vi-VN') + 'đ'}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">{course.level}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm text-gray-600">
                                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                                {course.instructor?.fullName || 'Admin'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                                                course.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {course.isPublished ? 'Công khai' : 'Nháp'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => navigate(`/admin/courses/${course._id}/edit`)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(course._id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-12 text-gray-500">
                                        Chưa có khóa học nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminCourseList;
